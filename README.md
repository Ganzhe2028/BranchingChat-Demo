# BranchingChat

A mesh-interaction chat interface that lets you **highlight AI reply text → spawn persistent side-branch conversations → merge them back into the main flow**. Built as an MVP to explore cognitive divergence and convergence patterns in AI-assisted dialogue.

![Tech Stack](https://img.shields.io/badge/React-18-61dafb?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss) ![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite)

---

## ✨ Features

| Feature                      | Description                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Multi-Branch Persistence** | Multiple branches can coexist simultaneously — each is saved the moment it's created                          |
| **Dashed Highlight Anchors** | Selected text gets a dashed violet border after branching; clicking it reopens the branch drawer              |
| **Assistant-Only Branching** | Only AI assistant messages can be branched; user messages and merged messages are excluded                    |
| **Squeeze Layout**           | Side drawer slides in and compresses the main view — no overlays, no z-index stacking                         |
| **State Merge**              | Branch messages splice back into the main flow at the exact trigger point; scroll aligns to first new message |
| **Minimap Scroll**           | Right-side tick indicators highlight which messages are currently visible                                     |
| **Streaming UI**             | Typewriter-effect mock streaming with concurrency lock (no accidental double-sends)                           |

---

## 🏗️ Architecture

```
src/
├── App.tsx                  # Root: AppState, all useCallback handlers, appStateRef
├── types/
│   └── index.ts             # Message, BranchHighlight, SavedBranch, ActiveBranch, AppState
├── utils/
│   ├── stream.ts            # streamMockResponse — char-by-char with 30ms delay
│   ├── alignment.ts         # alignNodeToViewport — 350ms delayed scrollIntoView
│   └── mockData.ts          # Pre-seeded demo messages & mock AI responses
└── components/
    ├── MainChatFlow.tsx     # Main waterfall + assistant-only text selection (React.memo)
    ├── MessageBubble.tsx    # Renders highlights, merge indicators, branch text spans
    ├── SelectionTooltip.tsx # Floating "Create Branch" tooltip (onMouseDown)
    ├── BranchDrawer.tsx     # Side drawer — receives SavedBranch, has ← back & merge (React.memo)
    └── MinimapScroll.tsx    # Viewport-tracking scroll minimap (React.memo)
```

### State Shape

```typescript
interface AppState {
  mainFlow: Message[];
  savedBranches: Record<string, SavedBranch>; // branchId → SavedBranch
  activeBranch: ActiveBranch;
}

interface ActiveBranch {
  isActive: boolean;
  branchId: string | null; // references SavedBranch.id
}

interface SavedBranch {
  id: string;
  sourceNodeId: string;
  selectedText: string;
  historyContext: Message[]; // Deep-copied history up to trigger node
  branchMessages: Message[];
}

interface BranchHighlight {
  branchId: string;
  text: string; // The exact selected text — used for inline rendering
}

interface Message {
  // ... standard fields
  branchHighlights?: BranchHighlight[]; // Marks branched spans inside an assistant message
  isBranchMerged?: boolean; // True for messages merged from a branch
}
```

### Branch Lifecycle

```
User selects text in assistant message
          ↓
SavedBranch created + stored in savedBranches map
BranchHighlight added to source Message
Drawer opens (isActive: true, branchId set)
          ↓
User chats in branch (messages saved to SavedBranch.branchMessages)
User can ← close drawer → return to main chat
Highlight remains clickable to reopen the branch
          ↓
User clicks "合并到主线"
Branch messages spliced into mainFlow after sourceNodeId
Highlight removed from source message
Branch deleted from savedBranches
Viewport scrolls to first merged message
```

---

## 🚀 Quick Start

```bash
npm install
npm run dev   # → http://localhost:5173
```

---

## 🛠️ Development Commands

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start HMR dev server                 |
| `npm run build`   | TypeScript check + production bundle |
| `npm run lint`    | ESLint check                         |
| `npm run preview` | Preview the production build locally |

---

## ⚙️ Critical Implementation Rules

> These rules are enforced by [`AGENTS.md`](./AGENTS.md). Violating them causes subtle bugs.

### 1. Ghost Selection Interception

The **"Create Branch"** button in `<SelectionTooltip>` **must** be bound to `onMouseDown` with `e.preventDefault()`.  
**Never use `onClick`** — it fires after the browser clears the selection.

```tsx
// ✅ Correct
<button onMouseDown={(e) => { e.preventDefault(); createBranch(); }}>

// ❌ Fatal bug
<button onClick={() => createBranch()}>
```

### 2. Assistant-Only + Non-Merged Branching

Selection branching is guarded to reject:

- `role === "user"` messages
- `isBranchMerged === true` messages (already merged content)
- The "来自支线合并" indicator — rendered with `select-none pointer-events-none`

### 3. Re-render Defense Line

- `<MainChatFlow>` and `<BranchDrawer>` are wrapped in `React.memo`.
- Every function passed as a prop from `<App>` is wrapped in `useCallback`.
- **Never pass inline arrow functions** to memoized children.

### 4. Post-Merge Scroll Alignment

`alignNodeToViewport` waits 350ms for the drawer close animation, then uses `el.scrollIntoView({ behavior: 'smooth', block: 'center' })` targeting the **first newly merged message** (not the source).

> **Important:** `window.scrollTo` does NOT work here — the actual scroll container is the inner `flex-1 overflow-y-auto` div, not the window.

### 5. Auto-Scroll Guard

`MainChatFlow`'s scroll-to-bottom effect only fires when the **last message ID changes** (new message appended). This prevents merge splices (which insert in the middle) from overriding the viewport alignment.

### 6. Streaming Lock

`isStreaming` ref/state is set to `true` before streaming starts. While `true`, **all inputs and the branch button are disabled** — enforced at the component level.

---

## 🎨 Design Decisions

- **Flexbox Squeeze** (not modal/overlay): The side drawer pushes the main view by shrinking its width. No z-index gymnastics.
- **savedBranches map**: Branches are keyed by UUID, enabling O(1) lookup and true multi-branch support.
- **In-memory only**: No backend, no localStorage — intentional MVP scope.
- **Tailwind-only styling**: No custom `.css` files except global keyframe animations in `index.css`.
- **Strict TypeScript**: `any` is banned. All state conforms to the interfaces above.

---

## 📄 Related Docs

- [`AGENTS.md`](./AGENTS.md) — AI agent development rules and architecture constraints
- [`支线对话交互架构开发文档 (MVP版).md`](<./支线对话交互架构开发文档%20(MVP版).md>) — Full Chinese PRD with interaction flows
