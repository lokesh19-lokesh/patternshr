import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, CheckSquare, ListPlus } from 'lucide-react';

interface InMeetingNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialNotes?: string;
  onSaveNotes: (notes: string) => Promise<void>;
  onGenerateSummary?: () => void;
  isHostOrHr: boolean;
}

export const InMeetingNotesDrawer: React.FC<InMeetingNotesDrawerProps> = ({
  isOpen,
  onClose,
  initialNotes = '',
  onSaveNotes,
  onGenerateSummary,
  isHostOrHr,
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

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
          <h3 className="text-sm font-bold text-white">Meeting Notes</h3>
          <p className="text-[11px] text-gray-400">Collaborative notes & action items</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

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
            onClick={onGenerateSummary}
            className="ml-auto px-2.5 py-1 bg-soft-green/20 hover:bg-soft-green/30 text-primary-green border border-primary-green/30 rounded-lg text-[11px] font-bold flex items-center space-x-1"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>AI Summarize</span>
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
          {saved ? '✓ Saved successfully' : 'Changes saved to workspace'}
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
    </div>
  );
};
