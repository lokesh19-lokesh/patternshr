import React, { useState } from 'react';
import { X, Award, Save } from 'lucide-react';
import type { MeetingReviewDetails } from '../../../services/meeting.service';

interface HRPerformanceReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialDetails?: MeetingReviewDetails;
  onSaveDetails: (details: Partial<MeetingReviewDetails>) => Promise<void>;
}

export const HRPerformanceReviewDrawer: React.FC<HRPerformanceReviewDrawerProps> = ({
  isOpen,
  onClose,
  initialDetails,
  onSaveDetails,
}) => {
  const [goals, setGoals] = useState(initialDetails?.goals || '');
  const [score, setScore] = useState(initialDetails?.score || 8);
  const [strengths, setStrengths] = useState(initialDetails?.strengths || '');
  const [improvements, setImprovements] = useState(initialDetails?.improvements || '');
  const [actionPlan, setActionPlan] = useState(initialDetails?.action_plan || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSaveDetails({
        goals,
        score,
        strengths,
        improvements,
        action_plan: actionPlan,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('Could not save performance review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed sm:absolute top-0 right-0 w-full sm:w-80 md:w-96 h-full bg-[#1F2327] border-l border-gray-800 flex flex-col z-40 animate-slide-left shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-blue-950/30">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-blue-900/50 text-blue-300 border border-blue-700/50">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Performance Review</h3>
            <p className="text-[11px] text-blue-300">Goals, achievements & rating</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {/* Score Slider (1 to 10) */}
        <div className="p-4 bg-[#24292D] border border-gray-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-300 uppercase tracking-wider text-[10px]">Performance Score</span>
            <span className="font-black text-sm text-blue-400">{score} / 10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        {/* Goals Evaluated */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Deliverables & Goals Reviewed
          </label>
          <textarea
            rows={2}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Review period milestones, projects shipped..."
            className="w-full p-3 bg-[#24292D] border border-gray-700 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>

        {/* Key Strengths */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Core Strengths & Highlights
          </label>
          <textarea
            rows={2}
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder="Technical mastery, leadership, reliability..."
            className="w-full p-3 bg-[#24292D] border border-gray-700 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>

        {/* Areas for Growth */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Areas for Development
          </label>
          <textarea
            rows={2}
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="Skill improvements, process enhancements..."
            className="w-full p-3 bg-[#24292D] border border-gray-700 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>

        {/* Action Plan */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Next Quarter Growth & Action Plan
          </label>
          <textarea
            rows={2}
            value={actionPlan}
            onChange={(e) => setActionPlan(e.target.value)}
            placeholder="Target certifications, mentorship, upcoming goals..."
            className="w-full p-3 bg-[#24292D] border border-gray-700 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 bg-[#171A1C] flex items-center justify-between">
        <span className="text-[11px] text-gray-400 font-medium">
          {saved ? '✓ Review Saved' : 'Saved to employee dossier'}
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{saving ? 'Saving...' : 'Save Review'}</span>
        </button>
      </div>
    </div>
  );
};
