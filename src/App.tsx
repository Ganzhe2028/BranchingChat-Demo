import React, { useState, useCallback, useRef } from "react";

import { v4 as uuidv4 } from "uuid";

import MainChatFlow from "./components/MainChatFlow";
import BranchDrawer from "./components/BranchDrawer";
import MinimapScroll from "./components/MinimapScroll";
import { alignNodeToViewport } from "@/utils/alignment";
import { MOCK_MESSAGES } from "@/utils/mockData";

import type { Message, SavedBranch, ActiveBranch, AppState } from "@/types";

const INITIAL_ACTIVE_BRANCH: ActiveBranch = {
  isActive: false,
  branchId: null,
};

const INITIAL_STATE: AppState = {
  mainFlow: [...MOCK_MESSAGES],
  savedBranches: {},
  activeBranch: { ...INITIAL_ACTIVE_BRANCH },
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const isStreamingRef = useRef(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const appStateRef = useRef(appState);
  appStateRef.current = appState;

  const handleStreamStart = useCallback(() => {
    isStreamingRef.current = true;
    setIsStreaming(true);
  }, []);

  const handleStreamEnd = useCallback(() => {
    isStreamingRef.current = false;
    setIsStreaming(false);
  }, []);

  /**
   * Create a new branch from selected text in an assistant message.
   * Immediately saves the branch and opens the drawer.
   */
  const handleCreateBranch = useCallback(
    (sourceNodeId: string, selectedText: string, historyContext: Message[]) => {
      if (isStreamingRef.current) return;

      const branchId = uuidv4();
      const newBranch: SavedBranch = {
        id: branchId,
        sourceNodeId,
        selectedText,
        historyContext: historyContext.map((m) => ({ ...m })),
        branchMessages: [],
      };

      setAppState((prev) => {
        // Add highlight to the source message
        const updatedMainFlow = prev.mainFlow.map((msg) => {
          if (msg.id === sourceNodeId) {
            const existingHighlights = msg.branchHighlights ?? [];
            return {
              ...msg,
              branchHighlights: [
                ...existingHighlights,
                { branchId, text: selectedText },
              ],
            };
          }
          return msg;
        });

        return {
          ...prev,
          mainFlow: updatedMainFlow,
          savedBranches: {
            ...prev.savedBranches,
            [branchId]: newBranch,
          },
          activeBranch: {
            isActive: true,
            branchId,
          },
        };
      });
    },
    [],
  );

  /**
   * Open an existing saved branch by its ID (when user clicks a highlight).
   */
  const handleOpenBranch = useCallback((branchId: string) => {
    if (isStreamingRef.current) return;
    setAppState((prev) => ({
      ...prev,
      activeBranch: {
        isActive: true,
        branchId,
      },
    }));
  }, []);

  /**
   * Close the branch drawer (return to main chat).
   * Branch data stays saved in savedBranches.
   */
  const handleCloseBranch = useCallback(() => {
    if (isStreamingRef.current) return;
    setAppState((prev) => ({
      ...prev,
      activeBranch: { ...INITIAL_ACTIVE_BRANCH },
    }));
  }, []);

  /**
   * Update messages in the currently active branch.
   */
  const handleUpdateBranchMessages = useCallback((messages: Message[]) => {
    setAppState((prev) => {
      const { branchId } = prev.activeBranch;
      if (!branchId) return prev;

      const branch = prev.savedBranches[branchId];
      if (!branch) return prev;

      return {
        ...prev,
        savedBranches: {
          ...prev.savedBranches,
          [branchId]: {
            ...branch,
            branchMessages: messages,
          },
        },
      };
    });
  }, []);

  /**
   * Merge the active branch back into the main flow.
   */
  const handleMergeBranch = useCallback(() => {
    if (isStreamingRef.current) return;

    // Capture the source node ID before state update for alignment
    const currentState = appStateRef.current;
    const branchId = currentState.activeBranch.branchId;
    if (!branchId) return;
    const branch = currentState.savedBranches[branchId];
    if (!branch) return;
    const sourceNodeId = branch.sourceNodeId;

    // Pass the ID of the *first* branch message to align it to the viewport
    const firstBranchMessageId = branch.branchMessages[0]?.id;
    const targetAlignId = firstBranchMessageId || sourceNodeId;

    setAppState((prev) => {
      const { branchId: bid } = prev.activeBranch;
      if (!bid) return prev;

      const b = prev.savedBranches[bid];
      if (!b || b.branchMessages.length === 0) return prev;

      const sourceIndex = prev.mainFlow.findIndex(
        (m) => m.id === b.sourceNodeId,
      );
      if (sourceIndex < 0) return prev;

      const updatedMainFlow = [...prev.mainFlow];

      // Add selected text anchor to source
      updatedMainFlow[sourceIndex] = {
        ...updatedMainFlow[sourceIndex],
        selectedText: b.selectedText,
      };

      // Prepare merged messages
      const mergedMessages = b.branchMessages.map((msg) => ({
        ...msg,
        isBranchMerged: true,
        branchSourceId: b.sourceNodeId,
      }));

      updatedMainFlow.splice(sourceIndex + 1, 0, ...mergedMessages);

      // Remove the branch from saved branches since it's merged
      const { [bid]: _removed, ...remainingBranches } = prev.savedBranches;

      // Remove the highlight for this branch from the source message
      updatedMainFlow[sourceIndex] = {
        ...updatedMainFlow[sourceIndex],
        branchHighlights: updatedMainFlow[sourceIndex].branchHighlights?.filter(
          (h) => h.branchId !== bid,
        ),
      };

      return {
        mainFlow: updatedMainFlow,
        savedBranches: remainingBranches,
        activeBranch: { ...INITIAL_ACTIVE_BRANCH },
      };
    });

    // Align viewport to the first newly merged message (or fallback to source)
    alignNodeToViewport(targetAlignId);
  }, []);

  const handleSendMainMessage = useCallback((_content: string) => {
    // Handled by MainChatFlow streaming logic
  }, []);

  const handleUpdateMainMessages = useCallback((messages: Message[]) => {
    setAppState((prev) => ({
      ...prev,
      mainFlow: messages,
    }));
  }, []);

  // Derive the active branch data for BranchDrawer
  const activeBranchData = appState.activeBranch.branchId
    ? (appState.savedBranches[appState.activeBranch.branchId] ?? null)
    : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-900 text-zinc-100">
      <MainChatFlow
        messages={appState.mainFlow}
        onCreateBranch={handleCreateBranch}
        onOpenBranch={handleOpenBranch}
        onSendMainMessage={handleSendMainMessage}
        isStreaming={isStreaming}
        isBranchActive={appState.activeBranch.isActive}
        onStreamStart={handleStreamStart}
        onStreamEnd={handleStreamEnd}
        onUpdateMessages={handleUpdateMainMessages}
      />
      <BranchDrawer
        isActive={appState.activeBranch.isActive}
        branchData={activeBranchData}
        onCloseBranch={handleCloseBranch}
        onMergeBranch={handleMergeBranch}
        isStreaming={isStreaming}
        onStreamStart={handleStreamStart}
        onStreamEnd={handleStreamEnd}
        onUpdateBranchMessages={handleUpdateBranchMessages}
      />
      <MinimapScroll messages={appState.mainFlow} />
    </div>
  );
};

export default App;
