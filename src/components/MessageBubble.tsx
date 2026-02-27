import React, { useMemo } from "react";

import clsx from "clsx";

import type { Message, BranchHighlight } from "@/types";

interface MessageBubbleProps {
  message: Message;
  onOpenBranch?: (branchId: string) => void;
}

/**
 * Renders message content with inline dashed highlights for branched text.
 * Clicking a highlight opens the associated branch drawer.
 */
function renderContentWithHighlights(
  content: string,
  highlights: BranchHighlight[],
  onOpenBranch?: (branchId: string) => void,
): React.ReactNode {
  if (highlights.length === 0) {
    return <span>{content}</span>;
  }

  // Build a list of segments: plain text and highlighted text
  const segments: React.ReactNode[] = [];
  let remaining = content;
  let keyIdx = 0;

  // Sort highlights by their first occurrence position in the text
  const sortedHighlights = [...highlights].sort((a, b) => {
    const posA = remaining.indexOf(a.text);
    const posB = remaining.indexOf(b.text);
    return posA - posB;
  });

  for (const hl of sortedHighlights) {
    const idx = remaining.indexOf(hl.text);
    if (idx === -1) continue; // text not found, skip

    // Add plain text before the highlight
    if (idx > 0) {
      segments.push(
        <span key={`plain-${keyIdx++}`}>{remaining.slice(0, idx)}</span>,
      );
    }

    // Add the highlighted span
    segments.push(
      <span
        key={`hl-${hl.branchId}`}
        className="border border-dashed border-violet-400/60 bg-violet-500/10 rounded-sm px-0.5 py-0.5 cursor-pointer hover:bg-violet-500/20 hover:border-violet-400 transition-colors inline"
        onClick={(e) => {
          e.stopPropagation();
          onOpenBranch?.(hl.branchId);
        }}
        title="点击查看支线对话"
      >
        {hl.text}
      </span>,
    );

    remaining = remaining.slice(idx + hl.text.length);
  }

  // Add any remaining plain text
  if (remaining.length > 0) {
    segments.push(<span key={`plain-${keyIdx++}`}>{remaining}</span>);
  }

  return <>{segments}</>;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onOpenBranch,
}) => {
  const isUser = message.role === "user";
  const isMerged = message.isBranchMerged === true;
  const hasHighlights = (message.branchHighlights?.length ?? 0) > 0;

  const renderedContent = useMemo(() => {
    if (!hasHighlights || !message.branchHighlights) {
      return <span>{message.content}</span>;
    }
    return renderContentWithHighlights(
      message.content,
      message.branchHighlights,
      onOpenBranch,
    );
  }, [message.content, message.branchHighlights, onOpenBranch, hasHighlights]);

  return (
    <div
      id={`msg-node-${message.id}`}
      className={clsx(
        "flex w-full mb-6 relative group",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="hidden md:flex flex-shrink-0 mr-4 mt-1 w-8 h-8 rounded-full border border-zinc-700/50 bg-zinc-800/50 items-center justify-center">
          <svg
            className="w-4 h-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
            />
          </svg>
        </div>
      )}
      <div
        className={clsx(
          "relative max-w-[85%] md:max-w-[75%] px-5 py-3.5 text-[15px] leading-relaxed",
          isUser
            ? "bg-zinc-800 text-zinc-100 rounded-3xl rounded-br-lg"
            : "text-zinc-100",
          isMerged &&
            !isUser &&
            "border-l-2 border-amber-500/50 pl-6 rounded-none",
        )}
      >
        {message.selectedText && (
          <div className="mb-3 px-3 py-2 bg-zinc-800/50 border-l-2 border-zinc-500 rounded-r-md text-sm text-zinc-400 italic">
            <span className="font-medium not-italic text-zinc-300 mr-1">
              引用:
            </span>
            "{message.selectedText}"
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{renderedContent}</div>
        {isMerged && (
          <div
            className={clsx(
              "mt-3 flex items-center gap-1.5 text-xs text-amber-500/80 font-medium select-none pointer-events-none",
              isUser ? "justify-end" : "justify-start",
            )}
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
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
            来自支线合并
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MessageBubble);
