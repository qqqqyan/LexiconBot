"use client";

import React, { memo } from "react";
import { Book, ChevronLeft } from "lucide-react";
import { WordDetail } from "./WordDetail";
import StoryDetailView from "./StoryDetailView";
import type { AppView } from "../type";

interface Props {
  activeId: number | null;
  browseView: AppView;
  onClose: () => void;
}

export const RightPanel = memo(function RightPanel({
  activeId,
  browseView,
  onClose,
}: Props) {
  return (
    <div
      className={`flex-1 h-full overflow-y-auto bg-slate-50/50 scroll-smooth relative ${
        !activeId ? "hidden md:block" : "block"
      }`}
    >
      {activeId && (
        <button
          onClick={onClose}
          className="md:hidden fixed top-0 left-0 right-0 z-20 w-full flex items-center gap-1 px-4 py-3 text-sm text-slate-500 hover:text-slate-700 border-b border-slate-100 bg-white/90 backdrop-blur-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      )}

      <div className="h-full pt-12 md:pt-6 p-6 md:p-10">
        {!activeId ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center">
              <Book className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-lg font-medium">
              Select a word or story to view details
            </p>
          </div>
        ) : browseView === "story" ? (
          <StoryDetailView key={activeId} id={activeId} />
        ) : (
          <WordDetail key={activeId} id={activeId} />
        )}
      </div>
    </div>
  );
});
