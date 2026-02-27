# AGENTS.md - Branching Chat MVP Instruction Manual

## 1. Project Overview & Context
Welcome, AI Agent. You are assigned to the "Branching Chat MVP" repository. 
This project aims to revolutionize the traditional single-thread chat interface by implementing a mesh-interaction model. 
Users can highlight text to spawn side-branches (Branch Drawer), converse in a parallel context, and eventually merge those branches back into the main chat flow (Main Chat Flow).
Your generated code must adhere strictly to the rules below and the architecture outlined in `支线对话交互架构开发文档 (MVP版).md`.

## 2. Technology Stack
- **Framework**: React 18+ (Functional Components & Hooks only)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Exclusive styling solution)
- **Build Tool**: Vite (Default configuration)
- **Testing**: Vitest + React Testing Library + Playwright

## 3. Core Commands
Before finalizing tasks, you must ensure all codebase checks pass. Use these standard commands:
- **Install Dependencies**: `npm install`
- **Development Server**: `npm run dev`
- **Production Build**: `npm run build`
- **Linting**: `npm run lint` (ESLint configuration)
- **Formatting**: `npm run format` (Prettier configuration)

### Testing Commands (Crucial for Verification)
- **Run all unit tests**: `npm run test`
- **Run tests in watch mode**: `npm run test:watch`
- **Run a single test file**: `npx vitest run <path/to/file.test.ts>` 
- **Run a specific test case**: `npx vitest run <path/to/file.test.ts> -t "test name"`
- **Run E2E tests**: `npx playwright test`

## 4. Architectural & Performance Constraints (Fatal Rules)

### 4.1. The React.memo & useCallback Defense Line
Because this app involves heavy list rendering (chat flows) and complex state merges, preventing ghost re-renders is the highest priority.
- `<App>` manages the global `AppState`.
- `<MainChatFlow>` and `<BranchDrawer>` **MUST** be wrapped in `React.memo`.
- Every single function passed as a prop from `<App>` to children **MUST** be wrapped in `useCallback`.
- **BANNED**: Never pass inline arrow functions (e.g., `onClick={() => doSomething()}`) to memoized components. This destroys the memoization cache and triggers cascading re-renders.

### 4.2. State Interfaces (Strict Adherence)
You must use the exact interfaces defined in the PRD. Do not invent redundant state.
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isBranchMerged?: boolean; 
  branchSourceId?: string; // Points to the parent node ID
  selectedText?: string; // Selected text that triggered the branch
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

## 5. Coding Style Guidelines

### 5.1. TypeScript Rules
- Enforce strict null checks.
- Do not use `any`. Use `unknown` if a type is truly dynamic, then narrow it down with type guards.
- Avoid non-null assertions (`!`). Use optional chaining (`?.`) and fallback values (`??`).
- No `@ts-ignore` or `@ts-expect-error` without a comprehensive explanatory comment detailing why it is unavoidable.

### 5.2. Styling & Tailwind CSS
- All styling must use Tailwind utility classes.
- Use `clsx` or `tailwind-merge` for dynamic class assignment.
- Avoid writing custom `.css`. Complex keyframe animations are the only exception.
- Layout strictly follows the flexbox squeeze model:
  - Container: `display: flex`, `overflow: hidden`
  - Main view: `flex: 1`, `min-width: 0`
  - Drawer (Hidden): `width: 0px`
  - Drawer (Active): `width: 400px`, `flex-shrink: 0`
  - Transition: `transition: flex-basis 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)`

### 5.3. Naming Conventions
- **Components/Files**: `PascalCase` (e.g., `SelectionTooltip.tsx`)
- **Functions/Variables**: `camelCase` (e.g., `handleSelection`, `isBranchMerged`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`, `ANIMATION_DELAY_MS`)
- **Boolean Variables**: Must begin with `is`, `has`, `should`, or `can` (e.g., `isStreaming`, `hasSelection`).

### 5.4. Import Grouping & Ordering
Organize imports logically at the top of every file in the following order:
1. External React APIs (`import React, { useState, useCallback } from 'react'`)
2. Third-party packages (`import { v4 as uuidv4 } from 'uuid'`)
3. Internal shared utilities/hooks (`import { alignNodeToViewport } from '@/utils'`)
4. Internal component imports (`import MessageBubble from './MessageBubble'`)
5. Types and Interfaces (`import type { Message } from '@/types'`)

## 6. Error Handling & Edge Cases
- **DOM Manipulations**: Always verify DOM nodes exist before acting.
  ```typescript
  const targetElement = document.getElementById(`msg-node-${nodeId}`);
  if (!targetElement) return; // Silent graceful exit
  ```
- **Async Operations**: All asynchronous LLM calls or mock streams must be wrapped in `try/catch`. 
- **Concurrency Locks**: During mock streaming (`streamMockResponse`), `isStreaming` must be `true`. While `true`, absolutely all input fields and branch-creation buttons must be disabled.

## 7. Interaction Caveats (From MVP Spec)

### 7.1. Ghost Selection Interception
When rendering the `<SelectionTooltip>` based on `window.getSelection()`:
- The "Create Branch" button **MUST** be bound to `onMouseDown`.
- You **MUST** call `e.preventDefault()` inside that handler.
- **NEVER** bind it to `onClick`. `onClick` fires after the browser native logic clears the selection, causing fatal UI bugs.

### 7.2. DOM Animation Alignment Math
When merging a branch back into the main flow, the active scroll node must align to 25% of the viewport.
- The alignment logic **MUST** execute within a `setTimeout(..., 350)` to allow the 300ms flexbox layout animation to fully complete before `window.scrollTo` is invoked.

## 8. Agentic Workflow Instructions
- **Think Before You Act**: Formulate a clear plan before modifying complex DOM alignment logic or React render cycles.
- **Verify**: Never assume a refactor worked. Run the single-file test (`npx vitest run <file>`) or check `lsp_diagnostics`.
- **Simplicity First**: Implement the simplest viable solution for the MVP. Over-engineering is strictly forbidden.
- **No Hallucinated Implementations**: If the design document does not specify a feature (e.g., user login, database persistence), do not build it unless instructed. Rely on mock data arrays and timers.

## 9. AI Copilot & IDE Rules (Cursor / GitHub Copilot)
If integrating with Cursor or GitHub Copilot, treat these instructions as the foundational `.cursorrules` or `.github/copilot-instructions.md`.
- **Context Window**: Always parse `AGENTS.md` and the MVP Document before proposing architectural changes.
- **Auto-Fixing**: When auto-fixing ESLint or TypeScript errors, do not inadvertently strip the `useCallback` or `React.memo` wrappers. Maintain the defense line.

## 10. Version Control & Git Commit Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`).
- Keep commits atomic. A single commit should represent one logical change.
- Never force push or commit broken tests or type errors to the main branch.
