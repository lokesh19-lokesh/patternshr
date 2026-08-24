import React, { useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { chatService } from '../../../services/chat.service';
import type { ChatMessage } from '../../../services/chat.service';

interface MessageSearchModalProps {
  companyId: string;
  currentEmployeeId: string;
  onClose: () => void;
  onSelectMessageResult: (conversationId: string) => void;
}

export const MessageSearchModal: React.FC<MessageSearchModalProps> = ({
  companyId,
  currentEmployeeId,
  onClose,
  onSelectMessageResult,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatMessage[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setSearching(true);
      const res = await chatService.searchMessages(companyId, currentEmployeeId, query.trim());
      setResults(res);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Search Input Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-charcoal">Search Messages & Files</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-grey hover:text-charcoal hover:bg-light-grey"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="py-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-grey" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword, e.g. 'salary', 'meeting', 'project'..."
              className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 text-charcoal focus:border-primary-green focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-primary-green hover:bg-deep-green disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
            >
              {searching ? '...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-72 pr-1">
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-grey">
              {query ? 'No matching messages found.' : 'Type a word and press search to find messages.'}
            </div>
          ) : (
            results.map((msg) => (
              <button
                key={msg.id}
                type="button"
                onClick={() => {
                  onSelectMessageResult(msg.conversation_id);
                  onClose();
                }}
                className="w-full flex items-start justify-between p-3 hover:bg-light-grey/80 rounded-xl transition-colors text-left group"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-charcoal">
                      {msg.sender?.first_name} {msg.sender?.last_name || ''}
                    </span>
                    <span className="text-[10px] text-text-grey">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-text-grey mt-0.5 line-clamp-2 leading-relaxed">
                    {msg.message_text}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-grey group-hover:text-primary-green flex-shrink-0 mt-1 transition-transform group-hover:translate-x-1" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
