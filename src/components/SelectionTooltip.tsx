import React from "react";

import type { TooltipState } from "@/types";

interface SelectionTooltipProps {
  tooltip: TooltipState;
  onCreateBranch: (sourceNodeId: string, selectedText: string) => void;
  isDisabled: boolean;
}

const SelectionTooltip: React.FC<SelectionTooltipProps> = ({
  tooltip,
  onCreateBranch,
  isDisabled,
}) => {
  if (!tooltip.isVisible) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      onCreateBranch(tooltip.sourceNodeId, tooltip.text);
    }
  };

  return (
    <div
      className="fixed z-50 animate-tooltip-in"
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y + 10}px`, // Moved slightly lower to not cover text
      }}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800/95 backdrop-blur-md rounded-xl shadow-xl shadow-black/40 border border-zinc-700/80">
        <button
          onMouseDown={handleMouseDown}
          disabled={isDisabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-zinc-100 hover:text-white bg-transparent hover:bg-zinc-700/80 rounded-lg transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          创建支线
        </button>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-2.5 h-2.5 bg-zinc-800/95 rotate-45 border-r border-b border-zinc-700/80 -mt-1.5" />
    </div>
  );
};

export default SelectionTooltip;
