import React, { useState } from 'react';
import { Hash, X, Check, Search } from 'lucide-react';
import type { Employee } from '../../../services/employee.service';

interface CreateGroupModalProps {
  allEmployees: Employee[];
  currentEmployeeId: string;
  onClose: () => void;
  onCreateGroup: (title: string, description: string, memberIds: string[]) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  allEmployees,
  currentEmployeeId,
  onClose,
  onCreateGroup,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([currentEmployeeId]);
  const [filterQuery, setFilterQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleMember = (id: string) => {
    if (id === currentEmployeeId) return; // Creator is always member
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await onCreateGroup(title.trim(), description.trim(), selectedMembers);
      onClose();
    } catch (e) {
      alert('Failed to create channel');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = allEmployees.filter((emp) =>
    `${emp.first_name} ${emp.last_name || ''} ${emp.department?.name || ''}`
      .toLowerCase()
      .includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-xl bg-soft-green text-dark-green flex items-center justify-center font-bold">
              <Hash className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-charcoal">Create Team Channel</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-grey hover:text-charcoal hover:bg-light-grey"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 flex-1 flex flex-col overflow-hidden">
          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
              Channel Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. development-team, marketing, sprint-planning"
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs sm:text-sm text-charcoal focus:border-primary-green focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs sm:text-sm text-charcoal focus:border-primary-green focus:outline-none"
            />
          </div>

          {/* Members Selector */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
              Add Members ({selectedMembers.length} selected)
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-text-grey" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-primary-green"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-44 pr-1 border border-gray-100 rounded-xl p-1">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedMembers.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleMember(emp.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors text-xs ${
                      isSelected ? 'bg-soft-green/50 text-dark-green' : 'hover:bg-light-grey text-charcoal'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <div className="h-6 w-6 rounded-lg bg-primary-green/15 text-dark-green flex items-center justify-center font-bold text-[10px]">
                        {emp.first_name[0]}
                      </div>
                      <span className="font-semibold truncate">
                        {emp.first_name} {emp.last_name || ''}
                      </span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary-green flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-grey hover:bg-light-grey"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-4 py-2 bg-primary-green hover:bg-deep-green disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              {submitting ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
