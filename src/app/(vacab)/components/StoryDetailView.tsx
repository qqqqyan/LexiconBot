"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { fetchStoryDetailAction } from "@/actions/story";
import { UI_ERROR_MESSAGES } from "@/lib/constants/ui-message";
const ReactMarkdown = dynamic(() => import("react-markdown"));

interface StoryDetailViewProps {
  id: number;
}

export default function StoryDetailView({ id }: StoryDetailViewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const res = await fetchStoryDetailAction(id);
        if (res.success) {
          setContent(res.data.content as string);
        } else {
          setIsError(true);
          toast.error(UI_ERROR_MESSAGES[res.errorCode]);
        }
      } catch {
        setIsError(true);
        toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStory();
  }, [id]);

  if (isLoading)
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-lg font-medium">Loading story...</p>
      </div>
    );

  if (isError || !content)
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <X className="w-10 h-10 text-slate-400" />
        <p className="text-lg font-medium">Failed to load the story.</p>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 block">
          AI Generated Story
        </span>
      </div>
      <article className="prose prose-slate prose-lg max-w-none bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
