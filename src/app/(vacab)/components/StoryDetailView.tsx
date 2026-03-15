import ReactMarkdown from "react-markdown";
import { fetchStoryDetailAction } from "@/actions/story";
import { X } from "lucide-react";

interface StoryDetailViewProps {
  id: number;
}

export default async function StoryDetailView({ id }: StoryDetailViewProps) {
  let storyContent: string | null = null;

  try {
    const res = await fetchStoryDetailAction(id);
    if (res.success) storyContent = res.data.content as string;
  } catch {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <X className="w-10 h-10 text-slate-400" />
        <p className="text-lg font-medium">Failed to load the story.</p>
      </div>
    );
  }

  if (!storyContent)
    return <div className="text-center mt-10">Story not found.</div>;

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 block">
          AI Generated Story
        </span>
      </div>
      <article className="prose prose-slate prose-lg max-w-none bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <ReactMarkdown>{storyContent}</ReactMarkdown>
      </article>
    </div>
  );
}
