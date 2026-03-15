import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { VocabView } from "./components/VocabView";
import StoryDetailView from "./components/StoryDetailView";
import type { AppView, RouteState } from "./type";

interface PageProps {
  searchParams: Promise<RouteState>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const view = (params.view as AppView) === "story" ? "story" : "vocab";
  const id = params.id || null;

  const storyDetailSlot =
    view === "story" && id ? (
      <Suspense
        key={id}
        fallback={
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-lg font-medium">Loading story...</p>
          </div>
        }
      >
        <StoryDetailView id={id} />
      </Suspense>
    ) : null;

  return <VocabView storyDetailSlot={storyDetailSlot} />;
}
