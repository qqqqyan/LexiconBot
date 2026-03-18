"use client";

import React from "react";
import { useRouteManager } from "./hooks/useRouteManager";
import { LeftSidebar } from "./components/LeftSidebar";
import { RightPanel } from "./components/RightPanel";

export default function Page() {
  const {
    urlState,
    browseState,
    changeBrowseView,
    changeBrowseType,
    openDetail,
    closeDetail,
  } = useRouteManager();

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <LeftSidebar
        activeId={urlState.id}
        browseState={browseState}
        isVisible={!urlState.id}
        onChangeBrowseView={changeBrowseView}
        onChangeBrowseType={changeBrowseType}
        onOpenDetail={openDetail}
      />
      <RightPanel
        activeId={urlState.id}
        browseView={urlState.view}
        onClose={closeDetail}
      />
    </div>
  );
}
