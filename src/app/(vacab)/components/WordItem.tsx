"use client";

import React, { memo } from "react";
import { Check } from "lucide-react";
import type { VocabListItem } from "@/types";

interface Props {
  entry: VocabListItem;
  isActive: boolean;
  isSelected: boolean;
  onToggle: (e: React.MouseEvent, id: number) => void;
  onClick: (id: number) => void;
}

export const WordItem = memo(function WordItem({
  entry,
  isActive,
  isSelected,
  onToggle,
  onClick,
}: Props) {
  return (
    <div
      onClick={() => onClick(entry.id)}
      className={`
        group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent
        ${isActive ? "bg-indigo-50 border-indigo-100 shadow-sm" : "hover:bg-slate-50 hover:border-slate-200"}
      `}
    >
      <div className="flex items-center gap-3 overflow-hidden w-full">
        <div
          onClick={(e) => onToggle(e, entry.id)}
          className={`
            w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer
            ${isSelected ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300 hover:border-indigo-400"}
          `}
        >
          {isSelected && (
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          )}
        </div>
        <span
          className={`font-medium truncate ${isActive ? "text-indigo-900" : "text-slate-700"}`}
        >
          {entry.word}
        </span>
      </div>
    </div>
  );
});
