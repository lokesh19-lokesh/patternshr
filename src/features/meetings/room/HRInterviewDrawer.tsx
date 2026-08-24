import React, { useState } from 'react';
import { X, Star, UserCheck, Save } from 'lucide-react';
import type { MeetingInterviewDetails } from '../../../services/meeting.service';

interface HRInterviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialDetails?: MeetingInterviewDetails;
  onSaveDetails: (details: Partial<MeetingInterviewDetails>) => Promise<void>;
}

export const HRInterviewDrawer: React.FC<HRInterviewDrawerProps> = ({
  isOpen,
  onClose,
  initialDetails,
  onSaveDetails,
}) => {
  const [candidateName, setCandidateName] = useState(initialDetails?.candidate_name || '');
  const [position, setPosition] = useState(initialDetails?.position || '');
  const [stage, setStage] = useState(initialDetails?.stage || 'Technical Round 1');
  const [rating, setRating] = useState(initialDetails?.rating || 4);
  const [recommendation, setRecommendation] = useState<'Selected' | 'Rejected' | 'Hold' | 'Next Round'>(
    initialDetails?.recommendation || 'Next Round'
  );
  const [feedback, setFeedback] = useState(initialDetails?.feedback || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSaveDetails({
        candidate_name: candidateName,
        position,
        stage,
        rating,
        recommendation,
        feedback,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('Could not save interview evaluation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed sm:absolute top-0 right-0 w-full sm:w-80 md:w-96 h-full bg-[#1F2327] border-l border-gray-800 flex flex-col z-40 animate-slide-left shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-purple-950/30">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-900/50 text-purple-300 border border-purple-700/50">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Interview Scorecard</h3>
            <p className="text-[11px] text-purple-300">Confidential HR hiring evaluation</p>
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
        {/* Candidate Profile */}
        <div className="p-3 bg-[#24292D] border border-gray-800 rounded-2xl space-y-2.5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Candidate Name</label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Candidate Full Name"
              className="w-full px-3 py-2 bg-[#171A1C] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Job Position</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-3 py-2 bg-[#171A1C] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Interview Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-3 py-2 bg-[#171A1C] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 font-medium"
            >
              <option value="Screening">Initial Screening</option>
              <option value="Technical Round 1">Technical Round 1</option>
              <option value="Technical Round 2">Technical Round 2</option>
              <option value="HR / Culture Fit">HR / Culture Fit</option>
              <option value="Management Final">Management Final</option>
            </select>
          </div>
        </div>

        {/* Rating Stars (1 to 5) */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Overall Technical & Cultural Rating ({rating} / 5)
          </label>
          <div className="flex items-center space-x-2 p-3 bg-[#24292D] border border-gray-800 rounded-2xl justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-125 transition-transform"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Recommendation Decision */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Hiring Recommendation
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Selected', 'Next Round', 'Hold', 'Rejected'] as const).map((opt) => {
              const isSelected = recommendation === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRecommendation(opt)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? opt === 'Selected'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                        : opt === 'Rejected'
                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg'
                        : 'bg-purple-600 border-purple-500 text-white shadow-lg'
                      : 'bg-[#24292D] border-gray-800 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Feedback */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Interview Evaluation Notes & Feedback
          </label>
          <textarea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Candidate strengths, code proficiency, problem solving skills, communication..."
            className="w-full p-3 bg-[#24292D] border border-gray-700 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 bg-[#171A1C] flex items-center justify-between">
        <span className="text-[11px] text-gray-400 font-medium">
          {saved ? '✓ Scorecard Updated' : 'Confidential HR record'}
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{saving ? 'Saving...' : 'Submit Evaluation'}</span>
        </button>
      </div>
    </div>
  );
};
