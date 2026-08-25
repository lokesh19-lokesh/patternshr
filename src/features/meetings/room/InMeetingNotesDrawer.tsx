import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, CheckSquare, ListPlus, CheckCircle2, Lightbulb, FileText } from 'lucide-react';
import type { MeetingAISummary } from '../../../services/meeting.service';

interface InMeetingNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialNotes?: string;
  onSaveNotes: (notes: string) => Promise<void>;
  onGenerateSummary?: (currentNotes: string) => Promise<MeetingAISummary | null>;
  initialAISummary?: MeetingAISummary;
  isHostOrHr: boolean;
}

export const InMeetingNotesDrawer: React.FC<InMeetingNotesDrawerProps> = ({
  isOpen,
  onClose,
  initialNotes = '',
  onSaveNotes,
  onGenerateSummary,
  initialAISummary,
  isHostOrHr,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'summary'>('notes');
  const [notes, setNotes] = useState(initialNotes);
  const [aiSummary, setAiSummary] = useState<MeetingAISummary | undefined>(initialAISummary);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    if (initialAISummary) setAiSummary(initialAISummary);
  }, [initialAISummary]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSaveNotes(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('Could not save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleRunAISummary = async () => {
    if (!onGenerateSummary) return;
    try {
      setIsGeneratingAI(true);
      const res = await onGenerateSummary(notes);
      if (res) {
        setAiSummary(res);
        setActiveTab('summary');
      }
    } catch (err) {
      alert('Failed to generate AI summary');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleInsertTemplate = (type: 'action' | 'bullet' | 'header') => {
    if (type === 'action') {
      setNotes((prev) => `${prev}\n- [ ] Action item for @name: `);
    } else if (type === 'bullet') {
      setNotes((prev) => `${prev}\n• Key point: `);
    } else if (type === 'header') {
      setNotes((prev) => `${prev}\n\n### Next Steps & Decisions\n`);
    }
  };

  return (
    <div className="fixed sm:absolute top-0 right-0 w-full sm:w-80 md:w-96 h-full bg-[#1F2327] border-l border-gray-800 flex flex-col z-40 animate-slide-left shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Meeting Intelligence</h3>
          <p className="text-[11px] text-gray-400">Notes & automated AI action items</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-[#171A1C] px-4 pt-2">
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${
            activeTab === 'notes'
              ? 'border-primary-green text-primary-green'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Minutes & Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${
            activeTab === 'summary'
              ? 'border-primary-green text-primary-green'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>AI Summary {aiSummary ? '(Ready)' : ''}</span>
        </button>
      </div>

      {/* TAB 1: NOTES */}
      {activeTab === 'notes' && (
        <>
          {/* Quick Insert Toolbar */}
          <div className="px-4 py-2.5 bg-[#171A1C] border-b border-gray-800 flex items-center space-x-2 text-xs">
            <button
              type="button"
              onClick={() => handleInsertTemplate('action')}
              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-[11px] font-medium flex items-center space-x-1"
            >
              <CheckSquare className="h-3.5 w-3.5 text-primary-green" />
              <span>+ Task</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertTemplate('bullet')}
              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-[11px] font-medium flex items-center space-x-1"
            >
              <ListPlus className="h-3.5 w-3.5 text-blue-400" />
              <span>+ Bullet</span>
            </button>

            {isHostOrHr && onGenerateSummary && (
              <button
                type="button"
                onClick={handleRunAISummary}
                disabled={isGeneratingAI}
                className="ml-auto px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-primary-green/40 text-emerald-300 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition-all disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                <span>{isGeneratingAI ? 'Generating...' : 'AI Summary'}</span>
              </button>
            )}
          </div>

          {/* Notes Editor */}
          <div className="flex-1 p-4 flex flex-col">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Take real-time minutes, record decisions, and assign action items..."
              className="flex-1 w-full p-3.5 bg-[#24292D] border border-gray-700 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-green leading-relaxed resize-none font-sans"
            />
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-800 bg-[#171A1C] flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-medium">
              {saved ? '✓ Saved successfully' : 'Changes synced to workspace'}
            </span>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary-green hover:bg-dark-green text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>
        </>
      )}

      {/* TAB 2: AI SUMMARY */}
      {activeTab === 'summary' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {aiSummary ? (
            <>
              {/* Key Decisions */}
              {aiSummary.decisions && aiSummary.decisions.length > 0 && (
                <div className="p-3.5 bg-[#24292D] border border-gray-800 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                    <Lightbulb className="h-4 w-4" />
                    <span>Decisions Made</span>
                  </div>
                  <ul className="space-y-1.5 text-gray-300 list-disc list-inside leading-relaxed">
                    {aiSummary.decisions.map((d, i) => (
                      <li key={i} className="pl-1">{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {aiSummary.action_items && aiSummary.action_items.length > 0 && (
                <div className="p-3.5 bg-[#24292D] border border-gray-800 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-blue-400 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Action Items & Tasks</span>
                  </div>
                  <div className="space-y-1.5">
                    {aiSummary.action_items.map((item, i) => (
                      <div key={i} className="p-2 bg-[#171A1C] rounded-xl flex items-start justify-between gap-2 border border-gray-800">
                        <span className="text-white font-medium">{item.task}</span>
                        {item.assignee && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-green/20 text-primary-green text-[10px] font-bold flex-shrink-0">
                            @{item.assignee}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {aiSummary.topics && aiSummary.topics.length > 0 && (
                <div className="p-3.5 bg-[#24292D] border border-gray-800 rounded-2xl space-y-2">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Discussed Topics</span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSummary.topics.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg text-[11px] font-medium border border-gray-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleRunAISummary}
                disabled={isGeneratingAI}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{isGeneratingAI ? 'Regenerating...' : 'Regenerate AI Summary'}</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 text-gray-400">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">No AI Summary Yet</h4>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                  Generate instant structured key takeaways and assigned action items from the notes taken during this session.
                </p>
              </div>
              <button
                onClick={handleRunAISummary}
                disabled={isGeneratingAI}
                className="px-5 py-2.5 bg-primary-green hover:bg-dark-green text-white text-xs font-bold rounded-xl shadow-lg flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>{isGeneratingAI ? 'Analyzing...' : 'Generate AI Summary'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
