// src/hooks/useRouteManager.ts
import { useState, useCallback, useEffect } from "react";
import { AppView, RouteState, BrowseState } from "../type";
import { VocabType } from "@/types/vocab";

const DEFAULT_URL_STATE: RouteState = { view: "vocab", type: "culture", id: null };

function parseUrlSearch(search: string): RouteState {
  const params = new URLSearchParams(search);
  return {
    view: params.get("view") === "story" ? "story" : "vocab",
    type: params.get("type") === "tech" ? "tech" : "culture",
    id: params.get("id") ? parseInt(params.get("id") as string, 10) : null,
  };
}

export function useRouteManager() {
  // --- 1. URL 状态：SSR/客户端都用默认值初始化，挂载后再读实际 URL ---
  const [urlState, setUrlState] = useState<RouteState>(DEFAULT_URL_STATE);

  useEffect(() => {
    setUrlState(parseUrlSearch(window.location.search));
  }, []);

  // --- 2. 独立的浏览状态 (左侧边栏的缓存状态) ---
  const [browseState, setBrowseState] = useState<BrowseState>({
    view: urlState.view,
    type: urlState.type,
  });

  // --- 3. 状态操作方法 ---

  // A. 左侧切换 Tab 或 Type (仅改变本地状态，不影响右侧)
  const changeBrowseView = useCallback((newView: AppView) => {
    setBrowseState((prev) => ({ ...prev, view: newView }));
  }, []);

  const changeBrowseType = useCallback((newType: VocabType) => {
    setBrowseState((prev) => ({ ...prev, type: newType }));
  }, []);

  // B. 点击列表项：更新 React 状态 + 同步地址栏
  const openDetail = useCallback(
    (targetView: AppView, targetType: VocabType, targetId: number) => {
      const newState: RouteState = { view: targetView, type: targetType, id: targetId };
      setUrlState(newState);

      const params = new URLSearchParams();
      params.set("view", targetView);
      params.set("type", targetType);
      params.set("id", targetId.toString());
      window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
    },
    [],
  );

  // C. 关闭详情：更新 React 状态 + 同步地址栏
  const closeDetail = useCallback(() => {
    setUrlState((prev) => {
      const next = { ...prev, id: null };
      const params = new URLSearchParams();
      params.set("view", prev.view);
      params.set("type", prev.type);
      window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
      return next;
    });
  }, []);

  return {
    urlState,
    browseState,
    changeBrowseView,
    changeBrowseType,
    openDetail,
    closeDetail,
  };
}
