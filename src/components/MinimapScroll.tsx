import React, { useEffect, useState, useRef } from "react";

import type { Message } from "@/types";

interface MinimapScrollProps {
  messages: Message[];
}

const MinimapScroll: React.FC<MinimapScrollProps> = ({ messages }) => {
  const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        const viewportTop = window.scrollY;
        const viewportBottom = viewportTop + window.innerHeight;
        const newActive = new Set<number>();

        messages.forEach((msg, index) => {
          const el = document.getElementById(`msg-node-${msg.id}`);
          if (!el) return;

          const rect = el.getBoundingClientRect();
          const absoluteTop = rect.top + window.scrollY;
          const absoluteBottom = absoluteTop + rect.height;

          if (absoluteBottom > viewportTop && absoluteTop < viewportBottom) {
            newActive.add(index);
          }
        });

        setActiveIndices(newActive);
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 py-3 px-1.5 bg-zinc-900/60 backdrop-blur-md rounded-full border border-zinc-700/30 shadow-lg">
      {messages.map((msg, index) => {
        const isActive = activeIndices.has(index);
        const isMerged = msg.isBranchMerged === true;

        return (
          <button
            key={msg.id}
            onClick={() => {
              const el = document.getElementById(`msg-node-${msg.id}`);
              if (!el) return;
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="group relative"
            title={`Message ${index + 1}`}
          >
            <div
              className={`
                w-5 h-1 rounded-full transition-all duration-300
                ${
                  isActive
                    ? isMerged
                      ? "bg-zinc-400 w-6 shadow-sm shadow-zinc-400/20"
                      : "bg-zinc-300 w-6 shadow-sm shadow-zinc-300/20"
                    : isMerged
                      ? "bg-zinc-600 group-hover:bg-zinc-500"
                      : "bg-zinc-700 group-hover:bg-zinc-500"
                }
              `}
            />
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(MinimapScroll);
