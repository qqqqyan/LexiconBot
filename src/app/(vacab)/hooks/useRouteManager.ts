// src/hooks/useRouteManager.ts
import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AppView, RouteState, BrowseState } from "../type";
import { VocabType } from "@/types/vocab";

export function useRouteManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- 1. 严格解析 URL 状态 (右侧详情的真实状态) ---
  const urlState: RouteState = {
    view: (searchParams.get("view") as AppView) === "story" ? "story" : "vocab", // 默认为 vocab
    type:
      (searchParams.get("type") as VocabType) === "tech" ? "tech" : "culture", // 默认为 culture
    id: searchParams.get("id") || null,
  };

  // --- 2. 独立的浏览状态 (左侧边栏的缓存状态) ---
  const [browseState, setBrowseState] = useState<BrowseState>({
    view: urlState.view,
    type: urlState.type,
  });

  // --- 3. 初始化与对齐 (Reconciliation) ---
  // 当用户首次通过带参数的 URL 进入，或者强刷新页面时，确保左侧的浏览状态与 URL 对齐。
  // 注意：只在初始加载时对齐，后续 URL 改变不强制重置左侧的浏览 Tab，实现彻底解耦。
  //   useEffect(() => {
  //     setBrowseState({
  //       tab: urlState.tab,
  //       type: urlState.type,
  //     });
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, []); // 仅挂载时执行一次

  // --- 4. 状态操作方法 (封装内部逻辑，暴露极简 API) ---

  // A. 左侧切换 Tab 或 Type (仅改变本地状态，不影响右侧 URL)
  const changeBrowseView = useCallback((newView: AppView) => {
    setBrowseState((prev) => ({ ...prev, view: newView }));
  }, []);

  const changeBrowseType = useCallback((newType: VocabType) => {
    setBrowseState((prev) => ({ ...prev, type: newType }));
  }, []);

  // B. 点击列表项 (生成并跳转到严格合法的 URL)
  const openDetail = useCallback(
    (targetView: AppView, targetType: VocabType, targetId: string) => {
      const params = new URLSearchParams();
      params.set("view", targetView);
      params.set("type", targetType); // 强制传以保证格式统一
      params.set("id", targetId);

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router],
  );

  return {
    urlState, // 供右侧判断或高亮当前选中项使用
    browseState, // 供左侧控制列表数据和 UI 切换使用
    changeBrowseView,
    changeBrowseType,
    openDetail,
  };
}
