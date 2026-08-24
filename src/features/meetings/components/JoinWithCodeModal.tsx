import React, { useState } from 'react';
import { X, KeyRound, ArrowRight } from 'lucide-react';

interface JoinWithCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
}

export const JoinWithCodeModal: React.FC<JoinWithCodeModalProps> = ({
  isOpen,
  onClose,
  onJoin,
}) => {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onJoin(code.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-light-grey/40">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-soft-green text-dark-green border border-primary-green/20">
              <KeyRound className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-charcoal">Join with Code / Link</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-200/60 text-gray-400 hover:text-charcoal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-charcoal uppercase tracking-wider mb-1.5">
              Meeting Code or URL
            </label>
            <input
              type="text"
              autoFocus
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. tpc-abc-xyz"
              className="w-full px-3.5 py-2.5 bg-light-grey/50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-green/30"
            />
            <p className="text-[11px] text-text-grey mt-1">
              Enter the 10-character code provided in your invitation.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-gray-200 font-bold text-charcoal hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code.trim()}
              className="px-4 py-2 rounded-xl bg-primary-green hover:bg-dark-green text-white font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-200 disabled:opacity-50"
            >
              <span>Join Room</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
