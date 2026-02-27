import { v4 as uuidv4 } from "uuid";

import type { Message } from "@/types";

export const MOCK_MESSAGES: Message[] = [
  {
    id: uuidv4(),
    role: "assistant",
    content:
      "你好！我是你的 AI 助手。我可以帮你解答各种问题，从编程到创意写作，从数据分析到生活建议。请问有什么我可以帮助你的吗？",
  },
  {
    id: uuidv4(),
    role: "user",
    content:
      "我最近在学习 React，能帮我解释一下 useCallback 和 useMemo 的区别吗？以及它们各自的使用场景。",
  },
  {
    id: uuidv4(),
    role: "assistant",
    content:
      "当然！这是一个很棒的问题。\n\n**useCallback** 用于缓存函数引用本身。当你将回调函数作为 props 传递给被 React.memo 包裹的子组件时，useCallback 可以确保函数引用不变，从而避免子组件不必要的重新渲染。\n\n**useMemo** 用于缓存计算结果。当你有一个开销较大的计算操作时，useMemo 可以在依赖项不变时直接返回缓存的值，避免重复计算。\n\n简单来说：useCallback 缓存函数，useMemo 缓存值。它们都接受依赖数组作为第二个参数，只有当依赖发生变化时才会重新计算。",
  },
  {
    id: uuidv4(),
    role: "user",
    content:
      "明白了！那在实际项目中，是不是应该把所有函数都用 useCallback 包起来？",
  },
  {
    id: uuidv4(),
    role: "assistant",
    content:
      "不建议这样做！过度使用 useCallback 反而会带来性能问题。\n\n记住这个原则：只在以下情况使用 useCallback：\n\n1. **传递给 React.memo 子组件的回调** — 这是最重要的场景\n2. **作为 useEffect 的依赖** — 避免 effect 无限执行\n3. **在性能敏感的列表渲染中** — 大量列表项的事件处理器\n\n对于普通的事件处理函数，直接定义即可。JavaScript 创建函数的开销非常小，而 useCallback 本身也有维护闭包和依赖比较的开销。",
  },
];

export const MOCK_RESPONSES: Record<string, string> = {
  default:
    "这是一个很好的问题！让我来详细解释一下。在软件开发中，理解核心概念是非常重要的。每个技术决策都应该基于具体的需求和场景来做出。希望这个回答对你有所帮助！",
  branch:
    "关于你选中的这段内容，让我进一步展开说明。这个概念在实际应用中有很多有趣的延伸和细节值得探讨。在实践中，我们需要根据具体场景权衡利弊，找到最适合当前项目的解决方案。",
};
