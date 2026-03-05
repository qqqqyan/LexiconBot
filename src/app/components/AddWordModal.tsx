import React, { useState } from "react";
import { toast } from "sonner";
import { processVocabAction } from "../../actions/vocab";
import { UI_ERROR_MESSAGES } from "@/lib/constants/ui-message";
import { Loader2, Sparkles, X } from "lucide-react";
import { VocabListItem, VocabType } from "@/types/vocab";

interface Props {
  currentBrowseType: VocabType;
  isAddModalOpen: boolean;
  onCloseModal: () => void;
  onAddWordSuccess: (word: VocabListItem) => void;
}

export const AddWordModal: React.FC<Props> = ({
  currentBrowseType,
  isAddModalOpen,
  onCloseModal,
  onAddWordSuccess,
}) => {
  const [newWordInput, setNewWordInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddWord = async () => {
    const newWord = newWordInput.trim();
    if (!newWord) {
      toast.warning("请输入要添加的单词");
      return;
    }
    if (newWord.length > 24) {
      toast.warning("单词过长，请控制在24个字符以内");
      return;
    }
    if (!/^[a-zA-Z\s\-\']+$/.test(newWord)) {
      toast.warning("格式错误，请仅输入英文单词或短语");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await processVocabAction(newWord, currentBrowseType);
      if (res.success) {
        const { meta, data } = res.data;
        if (meta.status === "corrected" && meta.corrected_word) {
          toast.info(
            `输入的单词 "${meta.original_input}" 已被更正为 "${meta.corrected_word}" 并添加到词库中。`,
          );
        }
        onAddWordSuccess(data);
        setNewWordInput("");
      } else {
        toast.error(UI_ERROR_MESSAGES[res.errorCode]);
      }
    } catch {
      toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAddModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Add New Word</h2>
          <button
            onClick={() => onCloseModal()}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Word to Analyze
            </label>
            <input
              autoFocus
              type="text"
              value={newWordInput}
              onChange={(e) => setNewWordInput(e.target.value)}
              placeholder="e.g. Serendipity"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg"
              onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
            />
          </div>
          <button
            onClick={handleAddWord}
            disabled={isGenerating || !newWordInput.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze & Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWordModal;
