# BranchingChat

A mesh-interaction chat interface that lets you **highlight text → spawn side-branch conversations → merge them back into the main flow**. Built as an MVP to explore cognitive divergence and convergence patterns in AI-assisted dialogue.

![Tech Stack](https://img.shields.io/badge/React-18-61dafb?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss) ![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite)

---

## ✨ Features

| Feature             | Description                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **Node Branching**  | Select any text in the main chat to spawn a parallel side conversation with full history context |
| **Squeeze Layout**  | Side drawer slides in and compresses the main view — no overlays, no z-index stacking            |
| **State Merge**     | Branch messages splice back into the main flow at the exact trigger point                        |
| **Viewport Anchor** | After merge, the source node scrolls to exactly 25% from the top of the viewport                 |
| **Minimap Scroll**  | Right-side tick indicators highlight which messages are currently visible                        |
| **Streaming UI**    | Typewriter-effect mock streaming with concurrency lock (no accidental double-sends)              |

---

## 🏗️ Architecture

```
src/
├── App.tsx                  # Root: AppState, all useCallback handlers
├── types/
│   └── index.ts             # Message, ActiveBranch, AppState, TooltipState
├── utils/
│   ├── stream.ts            # streamMockResponse — char-by-char with 30ms delay
│   ├── alignment.ts         # alignNodeToViewport — 350ms delayed scroll to 25%
│   └── mockData.ts          # Pre-seeded demo messages & mock AI responses
└── components/
    ├── MainChatFlow.tsx     # Main waterfall + text selection hook (React.memo)
    ├── MessageBubble.tsx    # Message renderer with merge/anchor indicators
    ├── SelectionTooltip.tsx # Floating "Create Branch" tooltip (onMouseDown)
    ├── BranchDrawer.tsx     # Side drawer chat panel (React.memo)
    └── MinimapScroll.tsx    # Viewport-tracking scroll minimap (React.memo)
```

### State Shape

```typescript
interface AppState {
  mainFlow: Message[];
  activeBranch: ActiveBranch;
}

interface ActiveBranch {
  isActive: boolean;
  sourceNodeId: string | null;
  selectedTextContext: string | null;
  historyContext: Message[]; // Deep-copied history up to trigger node
  branchMessages: Message[];
}
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server (HMR enabled)
npm run dev
# → http://localhost:5173
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
**Never use `onClick`** — it fires after the browser clears the selection, breaking the UX entirely.

```tsx
// ✅ Correct
<button onMouseDown={(e) => { e.preventDefault(); createBranch(); }}>

// ❌ Fatal bug
<button onClick={() => createBranch()}>
```

### 2. Re-render Defense Line

- `<MainChatFlow>` and `<BranchDrawer>` are wrapped in `React.memo`.
- Every function passed as a prop from `<App>` is wrapped in `useCallback`.
- **Never pass inline arrow functions** (`onClick={() => doX()}`) to memoized children.

### 3. Post-Merge Scroll Timing

The `alignNodeToViewport` call is wrapped in `setTimeout(..., 350)` to wait for the 300ms flexbox collapse animation before calculating `getBoundingClientRect`.

### 4. Streaming Lock

`isStreaming` ref/state is set to `true` before streaming starts. While `true`, **all input fields and the branch button are disabled** — enforced at the component level.

---

## 🎨 Design Decisions

- **Flexbox Squeeze** (not modal/overlay): The side drawer pushes the main view by removing its width. No z-index gymnastics.
- **Tailwind-only styling**: No custom `.css` files (except global keyframe animations in `index.css`).
- **No persistence**: MVP intentionally uses in-memory state and mock streaming. No backend, no localStorage.
- **Strict TypeScript**: `any` is banned. All state conforms to the interfaces above.

---

## 📄 Related Docs

- [`AGENTS.md`](./AGENTS.md) — AI agent development rules and architecture constraints
- [`支线对话交互架构开发文档 (MVP版).md`](<./支线对话交互架构开发文档%20(MVP版).md>) — Full Chinese PRD with interaction flows
