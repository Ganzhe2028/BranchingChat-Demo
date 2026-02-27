import React, { useState, useRef, useEffect } from "react";

import { v4 as uuidv4 } from "uuid";

import MessageBubble from "./MessageBubble";
import { streamMockResponse } from "@/utils/stream";
import { MOCK_RESPONSES } from "@/utils/mockData";

import type { Message, SavedBranch } from "@/types";

interface BranchDrawerProps {
  isActive: boolean;
  branchData: SavedBranch | null;
  onCloseBranch: () => void;
  onMergeBranch: () => void;
  isStreaming: boolean;
  onStreamStart: () => void;
  onStreamEnd: () => void;
  onUpdateBranchMessages: (messages: Message[]) => void;
}

const BranchDrawer: React.FC<BranchDrawerProps> = ({
  isActive,
  branchData,
  onCloseBranch,
  onMergeBranch,
  isStreaming,
  onStreamStart,
  onStreamEnd,
  onUpdateBranchMessages,
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const branchMessages = branchData?.branchMessages ?? [];

  useEffect(() => {
    scrollToBottom();
  }, [branchMessages]);

  useEffect(() => {
    if (isActive && !isStreaming) {
      inputRef.current?.focus();
    }
  }, [isActive, isStreaming]);

  // Reset input when switching branches
  useEffect(() => {
    setInputValue("");
  }, [branchData?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming || !branchData) return;

    setInputValue("");

    // Stream mock assistant response
    onStreamStart();
    const assistantId = uuidv4();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    const currentMessages = [
      ...branchMessages,
      { id: uuidv4(), role: "user" as const, content: trimmed },
      assistantMsg,
    ];
    onUpdateBranchMessages(currentMessages);

    try {
      let accumulated = "";
      await streamMockResponse(MOCK_RESPONSES.branch, (char) => {
        accumulated += char;
        const updatedMessages = currentMessages.map((msg) =>
          msg.id === assistantId ? { ...msg, content: accumulated } : msg,
        );
        onUpdateBranchMessages(updatedMessages);
      });
    } catch (error) {
      console.error("Stream error:", error);
    } finally {
      onStreamEnd();
    }
  };

  return (
    <div
      className={`
        flex-shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        border-l border-zinc-800 bg-zinc-900 shadow-2xl
        overflow-hidden flex flex-col
        ${isActive ? "w-[400px]" : "w-0"}
      `}
    >
      {isActive && branchData && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              {/* Close / Return button */}
              <button
                onClick={onCloseBranch}
                disabled={isStreaming}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                aria-label="返回主聊天"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <h3 className="text-sm font-medium text-zinc-200">支线探索</h3>
            </div>
            <button
              onClick={onMergeBranch}
              disabled={isStreaming || branchMessages.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
              合并到主线
            </button>
          </div>

          {/* Selected context */}
          {branchData.selectedText && (
            <div className="mx-4 mt-4 px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
              <p className="text-[11px] text-zinc-400 font-medium mb-1 uppercase tracking-wider">
                上下文
              </p>
              <p className="text-[13px] text-zinc-300 leading-relaxed line-clamp-4">
                "{branchData.selectedText}"
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0">
            {branchMessages.length === 0 && (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                输入你的问题来探索这个支线…
              </div>
            )}
            {branchMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-zinc-900">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-end gap-2 bg-zinc-800 rounded-2xl border border-zinc-700/60 shadow-sm focus-within:ring-2 focus-within:ring-zinc-600 focus-within:border-zinc-500 transition-colors"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isStreaming}
                placeholder={isStreaming ? "生成回复中…" : "在支线中提问…"}
                className="flex-1 bg-transparent px-4 py-3 min-h-[44px] text-[14px] text-zinc-200 placeholder-zinc-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isStreaming || !inputValue.trim()}
                className="mb-1 mr-1 p-1.5 bg-zinc-200 text-zinc-900 hover:bg-white rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-zinc-200 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="发送支线消息"
              >
                <svg
                  className="w-4 h-4"
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
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(BranchDrawer);
