import { VocabType } from "@/types/vocab";

export type AppView = "vocab" | "story";

export interface RouteState {
  view: AppView;
  type: VocabType; // 用于恢复左侧列表展示
  id: number | null;
}

// 右侧详情页的状态类型（从 URL 解析而来）
export type ViewState = Pick<RouteState, "view" | "id">;

// 左侧浏览状态类型（独立于 URL 的本地状态）
export type BrowseState = Pick<RouteState, "view" | "type">;
