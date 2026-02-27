export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isBranchMerged?: boolean;
  branchSourceId?: string;
  selectedText?: string;
  // Inline branch highlights within assistant message content
  branchHighlights?: BranchHighlight[];
}

/** A saved highlight that marks a branched text range inside an assistant message */
export interface BranchHighlight {
  branchId: string;
  text: string; // The exact selected text
}

/** A fully persisted branch conversation */
export interface SavedBranch {
  id: string;
  sourceNodeId: string;
  selectedText: string;
  historyContext: Message[];
  branchMessages: Message[];
}

export interface ActiveBranch {
  isActive: boolean;
  branchId: string | null; // references SavedBranch.id
}

export interface AppState {
  mainFlow: Message[];
  savedBranches: Record<string, SavedBranch>; // branchId → SavedBranch
  activeBranch: ActiveBranch;
}

export interface TooltipState {
  isVisible: boolean;
  x: number;
  y: number;
  text: string;
  sourceNodeId: string;
}
