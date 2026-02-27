# 支线对话交互架构开发文档 (MVP版)

## 一、 产品需求定义 (PRD)

颠覆传统单向瀑布流对话。构建支持认知发散与收敛的网状交互模型。

1. **节点分化**: 用户划选主线视图中特定文本触发支线。系统锁定当前节点，截断并深拷贝该节点及之前所有历史，组装为全新上下文发送至大模型。
2. **侧边探索**: 侧边栏抽屉滑出挤压主视图。用户在此独立空间内执行多轮追问。
3. **状态合流**: 点击合并按钮。支线内新增对话轮次平铺插入至主线触发节点下方。原触发节点的选中高亮框转化为常驻导航锚点。
4. **空间定位**: 合并动作完成瞬间，系统强制劫持滚动条，将导航锚点对齐至浏览器视窗顶部向下 25% 的精确位置。
5. **进度映射**: 监听屏幕滚动，当前视窗内的对话节点对应点亮右侧刻度列特定的短横线。

## 二、 编码级系统约束 (核心必读)

### 1. 组件拓扑与防重绘 (React.memo & useCallback)

强制拆分为以下独立组件。顶层 `<App>` 向下传递的**所有函数**必须使用 `useCallback` 包裹。严禁透传内联箭头函数击穿 `React.memo` 防线。

- `<App>`: 管理顶层 `AppState` 与布局容器。
- `<MainChatFlow>`: 渲染主线瀑布流，绑定滚动监听。必须包裹 `React.memo`。
- `<SelectionTooltip>`: 监听文本划选动作的悬浮操作框。
- `<BranchDrawer>`: 右侧滑出的独立聊天抽屉。必须包裹 `React.memo`。
- `<MinimapScroll>`: 基于状态数组驱动的微缩地图组件。

### 2. 状态树接口 (State Types)

必须使用此接口定义。严禁制造冗余状态节点。

```
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isBranchMerged?: boolean; 
  branchSourceId?: string; // 指向触发此支线的父节点ID
  selectedText?: string; // 记录划选触发支线时的关键文本
}

interface ActiveBranch {
  isActive: boolean;
  sourceNodeId: string | null;
  selectedTextContext: string | null;
  historyContext: Message[]; 
  branchMessages: Message[]; 
}

interface AppState {
  mainFlow: Message[];
  activeBranch: ActiveBranch;
}
```

### 3. 核心交互流转 (幽灵选区拦截机制)

**文本划选监听器 (Selection Hook):** 在 `<MainChatFlow>` 容器绑定 `onMouseUp` 与 `onTouchEnd`。

```
const handleSelection = () => {
  const selection = window.getSelection();
  if (!selection.rangeCount || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const text = selection.toString().trim();
  
  if (text.length > 0) {
    // 捕获最近的祖先消息节点ID
    setTooltip({ visible: true, x: rect.left, y: rect.top - 40, text, sourceNodeId });
  }
};
```

**致命警告**： `<SelectionTooltip>` 组件内的“新建支线”按钮，必须绑定 `onMouseDown` 事件并调用 `e.preventDefault()`。严禁绑定 `onClick`，这会诱发浏览器原生清空选区。

**状态合流逻辑:** 提取 `activeBranch.branchMessages`，追加 `isBranchMerged: true` 标记。将其 `splice` 插入至 `mainFlow` 中 `sourceNodeId` 所在索引之后。清空 `activeBranch` 状态。

### 4. DOM 动画对齐算法 (Alignment Math)

**挤压布局约束:** 外层容器设为 `display: flex` 且 `overflow: hidden`。主线区域默认 `flex: 1`, `min-width: 0`。支线区域默认宽度 `0px`，激活时设为 `400px` 且 `flex-shrink: 0`。绑定 `transition: flex-basis 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)`。必须使用 **Tailwind CSS** 构建所有类名。

**合并后视区对齐逻辑片段:** 必须在合并 DOM 渲染后执行，使用 `setTimeout` 等待 Flexbox 动画（0.3s）彻底结束。

```
const alignNodeToViewport = (nodeId) => {
  setTimeout(() => {
    const targetElement = document.getElementById(`msg-node-${nodeId}`);
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const absoluteElementTop = rect.top + window.scrollY;
    
    // 计算25%视区偏移量
    const targetScrollY = absoluteElementTop - (window.innerHeight * 0.25);

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  }, 350); 
};
```

### 5. 流式时序与锁机制 (Stream Concurrency Control)

MVP版本必须包含打字机效果模拟。

**致命警告**：调用 `streamMockResponse` 前，必须通过 `useRef` 或状态设置 `isStreaming = true`。流输出期间，禁用所有输入框与支线按钮。

```
const streamMockResponse = async (text, onToken) => {
  const chars = text.split('');
  for (let i = 0; i < chars.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 30)); 
    onToken(chars[i]);
  }
};
```