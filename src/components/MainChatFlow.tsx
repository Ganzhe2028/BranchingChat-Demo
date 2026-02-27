import React, { useState, useRef, useEffect, useCallback } from "react";

import { v4 as uuidv4 } from "uuid";

import MessageBubble from "./MessageBubble";
import SelectionTooltip from "./SelectionTooltip";
import { streamMockResponse } from "@/utils/stream";
import { MOCK_RESPONSES } from "@/utils/mockData";

import type { Message, TooltipState } from "@/types";

interface MainChatFlowProps {
  messages: Message[];
  onCreateBranch: (
    sourceNodeId: string,
    selectedText: string,
    historyContext: Message[],
  ) => void;
  onOpenBranch: (branchId: string) => void;
  onSendMainMessage: (content: string) => void;
  isStreaming: boolean;
  isBranchActive: boolean;
  onStreamStart: () => void;
  onStreamEnd: () => void;
  onUpdateMessages: (messages: Message[]) => void;
}

const INITIAL_TOOLTIP: TooltipState = {
  isVisible: false,
  x: 0,
  y: 0,
  text: "",
  sourceNodeId: "",
};

const MainChatFlow: React.FC<MainChatFlowProps> = ({
  messages,
  onCreateBranch,
  onOpenBranch,
  onSendMainMessage,
  isStreaming,
  onStreamStart,
  onStreamEnd,
  onUpdateMessages,
}) => {
  const [tooltip, setTooltip] = useState<TooltipState>(INITIAL_TOOLTIP);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const lastMessageIdRef = useRef<string | null>(null);
  useEffect(() => {
    // Only auto-scroll when last message changes (new msg at bottom), not on merge splice
    const lastMsg = messages[messages.length - 1];
    const lastId = lastMsg?.id ?? null;
    if (lastId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastId;
      scrollToBottom();
    }
  }, [messages]);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) {
      setTooltip(INITIAL_TOOLTIP);
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();

    if (text.length === 0) {
      setTooltip(INITIAL_TOOLTIP);
      return;
    }

    // Find the closest message node ancestor
    let element: HTMLElement | null = range.startContainer.parentElement;
    let sourceNodeId: string | null = null;

    while (element && containerRef.current?.contains(element)) {
      const id = element.id;
      if (id?.startsWith("msg-node-")) {
        sourceNodeId = id.replace("msg-node-", "");
        break;
      }
      element = element.parentElement;
    }

    if (!sourceNodeId) {
      setTooltip(INITIAL_TOOLTIP);
      return;
    }

    // Only allow branching from non-merged assistant messages
    const sourceMessage = messages.find((m) => m.id === sourceNodeId);
    if (
      !sourceMessage ||
      sourceMessage.role === "user" ||
      sourceMessage.isBranchMerged
    ) {
      setTooltip(INITIAL_TOOLTIP);
      return;
    }

    const rect = range.getBoundingClientRect();
    setTooltip({
      isVisible: true,
      x: rect.left + rect.width / 2 - 60,
      y: rect.top - 50,
      text,
      sourceNodeId,
    });
  }, [messages]);

  const handleCreateBranchFromTooltip = useCallback(
    (sourceNodeId: string, selectedText: string) => {
      // Build history context: all messages up to and including the source node
      const sourceIndex = messages.findIndex((m) => m.id === sourceNodeId);
      const historyContext =
        sourceIndex >= 0 ? messages.slice(0, sourceIndex + 1) : [];

      onCreateBranch(sourceNodeId, selectedText, historyContext);
      setTooltip(INITIAL_TOOLTIP);
      window.getSelection()?.removeAllRanges();
    },
    [messages, onCreateBranch],
  );

  // Dismiss tooltip on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setTooltip(INITIAL_TOOLTIP);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;

    setInputValue("");
    const userMsg: Message = {
      id: uuidv4(),
      role: "user",
      content: trimmed,
    };
    onSendMainMessage(trimmed);

    // Stream mock assistant response
    onStreamStart();
    const assistantId = uuidv4();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    const updatedMessages = [...messages, userMsg, assistantMsg];
    onUpdateMessages(updatedMessages);

    try {
      let accumulated = "";
      await streamMockResponse(MOCK_RESPONSES.default, (char) => {
        accumulated += char;
        const newMessages = updatedMessages.map((msg) =>
          msg.id === assistantId ? { ...msg, content: accumulated } : msg,
        );
        onUpdateMessages(newMessages);
      });
    } catch (error) {
      console.error("Stream error:", error);
    } finally {
      onStreamEnd();
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="flex items-center px-6 py-4 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-zinc-700/50 bg-zinc-800 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-zinc-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-medium text-zinc-100 tracking-wide">
              BranchingChat
            </h1>
            <p className="text-[13px] text-zinc-500">划选 AI 回复创建支线</p>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-6 min-h-0"
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
      >
        <div className="max-w-3xl mx-auto space-y-1">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onOpenBranch={onOpenBranch}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Selection Tooltip */}
      <SelectionTooltip
        tooltip={tooltip}
        onCreateBranch={handleCreateBranchFromTooltip}
        isDisabled={isStreaming}
      />

      {/* Input */}
      <div className="bg-zinc-900 pb-6 pt-2">
        <form
          onSubmit={handleSubmit}
          className="relative max-w-3xl mx-auto px-4 md:px-0"
        >
          <div className="relative flex items-end gap-2 bg-zinc-800 rounded-3xl border border-zinc-700/60 shadow-sm focus-within:ring-2 focus-within:ring-zinc-600 focus-within:border-zinc-500 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isStreaming}
              placeholder={
                isStreaming
                  ? "正在生成回复…"
                  : "输入消息，或划选 AI 回复创建支线…"
              }
              className="flex-1 bg-transparent px-5 py-3.5 min-h-[52px] text-[15px] text-zinc-200 placeholder-zinc-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isStreaming || !inputValue.trim()}
              className="mb-1.5 mr-1.5 p-2 bg-zinc-100 text-zinc-900 hover:bg-white rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-zinc-100 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="发送消息"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19V5m0 0l-6 6m6-6l6 6"
                />
              </svg>
            </button>
          </div>
          <div className="text-center mt-2 text-xs text-zinc-500">
            AI 可能会犯错。请核对重要信息。
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(MainChatFlow);
