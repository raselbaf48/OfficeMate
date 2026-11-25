import React, { useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, Lock, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="no-print fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-lg text-sm bg-[#0E182B] ${
            t.type === 'error'
              ? 'border-red-500/40 text-red-200'
              : t.type === 'success'
                ? 'border-emerald-500/40 text-slate-100'
                : 'border-slate-700 text-slate-100'
          }`}
        >
          {t.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-slate-100 p-0.5"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#0C1526] border border-slate-700/80 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              danger
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              danger
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const GuideModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#0C1526] border border-slate-700/80 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">
              How to Create &amp; Use Templates
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300 leading-relaxed">
          <div>
            <h4 className="font-semibold text-white mb-1">
              1. Start from Scratch or Import an Existing File
            </h4>
            <p>
              Open <strong className="text-white">Template Builder</strong> to write and format a new document, or use{' '}
              <strong className="text-white">Upload to Template</strong> to import an existing <code>.docx</code> or
              text-based <code>.pdf</code>. OfficeMate automatically detects dates, BD numbers,
              ranks, and dotted blanks so you can convert them into reusable placeholders.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1">
              2. Turn Text into Placeholders
            </h4>
            <p>
              Highlight any word or blank in the Template Builder editor and click{' '}
              <strong className="text-white">Make Placeholder</strong>, or place your cursor and insert a field such as{' '}
              <code className="font-mono bg-[#111C31] text-emerald-300 px-1.5 py-0.5 rounded">{'{{name}}'}</code> or{' '}
              <code className="font-mono bg-[#111C31] text-emerald-300 px-1.5 py-0.5 rounded">{'{{bd_no}}'}</code>.
              You can also apply formatting filters:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <code className="font-mono text-xs bg-[#111C31] text-emerald-300 px-1 py-0.5 rounded">
                  {'{{name|upper}}'}
                </code>{' '}
                — converts text to UPPERCASE
              </li>
              <li>
                <code className="font-mono text-xs bg-[#111C31] text-emerald-300 px-1 py-0.5 rounded">
                  {'{{name|title}}'}
                </code>{' '}
                — Title Cases words
              </li>
              <li>
                <code className="font-mono text-xs bg-[#111C31] text-emerald-300 px-1 py-0.5 rounded">
                  {'{{leave_from|date:DD MMM YYYY}}'}
                </code>{' '}
                — custom date format inside a specific placeholder
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1">
              3. Link Personnel, Signers &amp; Auto-Calculations
            </h4>
            <p>
              Set a field type to <strong className="text-white">Person-linked</strong> (e.g. BD/No, Name, Trade) or{' '}
              <strong className="text-white">Rank</strong> to auto-fill it whenever you pick someone from the{' '}
              <strong className="text-white">Personnel Registry</strong>. Use <strong className="text-white">Signer-linked</strong> fields to
              auto-fill the Document Clerk, Adjutant, or CO block from Settings. Use{' '}
              <strong className="text-white">Auto-calculated</strong> fields for dates like{' '}
              <code>cycle_end = cycle_start + 3 years</code> or leave duration in days.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1">
              4. Keyboard Shortcuts &amp; Backups
            </h4>
            <p>
              In <strong className="text-white">Generate Document</strong>, press{' '}
              <kbd className="px-1.5 py-0.5 bg-[#111C31] border border-slate-700 rounded text-xs text-slate-200">Tab</kbd> to
              move cleanly across fields,{' '}
              <kbd className="px-1.5 py-0.5 bg-[#111C31] border border-slate-700 rounded text-xs text-slate-200">Ctrl+S</kbd> to save to
              Document History, and{' '}
              <kbd className="px-1.5 py-0.5 bg-[#111C31] border border-slate-700 rounded text-xs text-slate-200">Ctrl+P</kbd> to print A4 directly.
              Export a JSON backup regularly from <strong className="text-white">Settings</strong>.
            </p>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export const PinLockScreen: React.FC<{
  expectedPin: string;
  unitName: string;
  onUnlock: () => void;
}> = ({ expectedPin, unitName, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === expectedPin) {
      setError('');
      onUnlock();
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-[#060B16] flex items-center justify-center p-4">
      <div className="bg-[#0C1526] border border-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-7">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">OfficeMate</h1>
            <p className="text-xs text-emerald-400/80">{unitName}</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-4">
          Enter your office PIN to access templates, personnel records, and document history.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="om-pin-input" className="block text-xs font-medium text-slate-300 mb-1.5">
              Access PIN
            </label>
            <input
              id="om-pin-input"
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full px-3 py-2.5 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest"
            />
            {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : null}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-sm font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors"
          >
            Unlock OfficeMate
          </button>
        </form>
      </div>
    </div>
  );
};
