import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Mail, Trash2, X, RefreshCw } from 'lucide-react';
import { useTenant } from '../../lib/auth/TenantProvider';
import { useAuth } from '../../lib/auth/AuthProvider';
import { tenantService } from '../../services/tenant.service';

interface DeleteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteWorkspaceModal: React.FC<DeleteWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const { company, refreshTenant } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'notes' | 'otp'>(() => {
    return (sessionStorage.getItem('ws_del_step') as 'notes' | 'otp') || 'notes';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSentTo, setEmailSentTo] = useState<string>(() => {
    return sessionStorage.getItem('ws_del_email') || '';
  });
  const [otpCode, setOtpCode] = useState('');
  const [confirmName, setConfirmName] = useState('');

  if (!isOpen || !company) return null;

  const handleRequestOtp = async () => {
    if (!user?.email) {
      setError('No authenticated email found.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await tenantService.requestWorkspaceDeletionOtp(user.email);
      setEmailSentTo(user.email);
      sessionStorage.setItem('ws_del_email', user.email);
      sessionStorage.setItem('ws_del_step', 'otp');
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6 || cleanOtp.length > 8) {
      setError('Please enter the OTP verification code from your email (6 to 8 digits).');
      return;
    }

    if (confirmName.trim().toLowerCase() !== company.name.trim().toLowerCase()) {
      setError(`Please type the exact company name "${company.name}" to confirm.`);
      return;
    }

    if (!user?.email) {
      setError('Admin email not found.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const backupData = await tenantService.verifyAndDeleteWorkspace(company.id, user.email, cleanOtp, confirmName.trim());
      
      // If backup data returned, trigger an automatic browser download as well
      if (backupData) {
        try {
          const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute("href", jsonStr);
          downloadAnchor.setAttribute("download", `${company.name.replace(/\s+/g, '_')}_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
        } catch (downloadErr) {
          console.error('Backup download trigger error:', downloadErr);
        }
      }

      sessionStorage.removeItem('ws_del_step');
      sessionStorage.removeItem('ws_del_email');

      // Refresh tenant so the app knows user has no company
      await refreshTenant();
      
      onClose();
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to delete workspace. Please check your verification code.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    sessionStorage.removeItem('ws_del_step');
    sessionStorage.removeItem('ws_del_email');
    setStep('notes');
    setError(null);
    setOtpCode('');
    setConfirmName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-red-100 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-100 rounded-full text-red-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Delete Workspace</h3>
              <p className="text-xs text-gray-500">{company.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Warning & Pre-deletion Note Points */}
        {step === 'notes' && (
          <div className="mt-5 space-y-4">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <h4 className="text-sm font-bold text-red-800 uppercase tracking-wide">
                Critical Warning — Permanent Data Wipe
              </h4>
              <p className="text-sm text-red-700 mt-1">
                Deleting this workspace will permanently erase all company records and cannot be undone.
              </p>
            </div>

            {/* Backup Delivery Guarantee */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div className="text-sm text-blue-900">
                <p className="font-bold">Full Data Backup Emailed to You</p>
                <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                  Before deletion completes, a complete archive containing all employee records, attendance logs, leaves, work reports, and payroll history will be compiled and delivered to your admin email address.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                What will be permanently deleted:
              </h5>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-2">•</span>
                  <span><strong>All Employee Profiles:</strong> Personal information, designations, bank details, and employee accounts.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-2">•</span>
                  <span><strong>Attendance & Time Logs:</strong> All daily rosters, check-in/out timestamps, and working hour records.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-2">•</span>
                  <span><strong>Time Off & Work Reports:</strong> Leave requests, balances, daily tasks, achievements, and review comments.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-2">•</span>
                  <span><strong>Payroll & Payslips:</strong> Salary structures, monthly payroll runs, and historical payslip records.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-2">•</span>
                  <span><strong>Access & Subscriptions:</strong> All team members will immediately lose access to this workspace.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm flex items-center space-x-2 disabled:bg-red-300"
              >
                <Mail className="h-4 w-4" />
                <span>{loading ? 'Sending Code...' : 'Send OTP to Email & Continue'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification & Confirmation */}
        {step === 'otp' && (
          <form onSubmit={handleConfirmDelete} className="mt-5 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <span>
                A verification code has been sent to <strong>{emailSentTo || 'your email'}</strong>. Please check your inbox and enter the code below.
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enter Email OTP Code
              </label>
              <input
                type="text"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 94840137"
                autoComplete="one-time-code"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-xl font-mono tracking-widest text-center text-gray-900 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type company name <span className="font-bold text-gray-900">"{company.name}"</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={company.name}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem('ws_del_step', 'notes');
                    setStep('notes');
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6 || confirmName.trim().toLowerCase() !== company.name.trim().toLowerCase()}
                  className="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm flex items-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{loading ? 'Deleting Workspace...' : 'Permanently Delete Workspace'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
