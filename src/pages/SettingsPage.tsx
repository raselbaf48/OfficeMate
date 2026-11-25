import React, { useRef, useState } from 'react';
import {
  Download,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { DEFAULT_BAF_RANKS } from '../data/seedData';
import { OfficeMateBackupPayload } from '../services/storage';
import { AppSettings, DateFormatOption, Signer } from '../types/models';
import { formatDateByPattern } from '../utils/placeholderEngine';

interface SettingsPageProps {
  settings: AppSettings;
  signers: Signer[];
  onSaveSettings: (s: AppSettings) => Promise<void>;
  onSaveSigner: (signer: Signer) => Promise<void>;
  onDeleteSigner: (signer: Signer) => void;
  onBackupDownload: () => Promise<void>;
  onRestoreBackup: (payload: OfficeMateBackupPayload) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  signers,
  onSaveSettings,
  onSaveSigner,
  onDeleteSigner,
  onBackupDownload,
  onRestoreBackup,
  onNotify,
}) => {
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [newRank, setNewRank] = useState('');
  const [editingSigner, setEditingSigner] = useState<Signer | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.pinEnabled && form.pinCode.trim().length < 4) {
      onNotify('error', 'PIN must be at least 4 digits when PIN lock is enabled.');
      return;
    }
    await onSaveSettings(form);
    onNotify('success', 'Settings saved.');
  };

  const handleAddRank = () => {
    const trimmed = newRank.trim();
    if (!trimmed) return;
    if (form.ranks.includes(trimmed)) {
      onNotify('info', 'Rank already exists in the list.');
      return;
    }
    setForm((p) => ({ ...p, ranks: [...p.ranks, trimmed] }));
    setNewRank('');
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as OfficeMateBackupPayload;
      await onRestoreBackup(payload);
      onNotify('success', 'Backup restored successfully.');
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Invalid backup JSON file.',
      );
    }
  };

  const handleSaveSignerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSigner) return;
    if (!editingSigner.role.trim() || !editingSigner.name.trim()) {
      onNotify('error', 'Role and Name are required for a signer profile.');
      return;
    }
    await onSaveSigner(editingSigner);
    setEditingSigner(null);
    onNotify('success', 'Signer profile saved.');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure unit defaults, signer profiles, rank list, PIN security, and local backups.
        </p>
      </div>

      {/* General & Formatting */}
      <form
        onSubmit={handleSaveGeneral}
        className="bg-[#0C1526] border border-slate-800 rounded-xl p-6 space-y-5"
      >
        <h2 className="text-base font-semibold text-white">
          Unit Defaults &amp; Formatting
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Default Unit / Base
            </label>
            <input
              type="text"
              value={form.defaultUnit}
              onChange={(e) => setForm({ ...form, defaultUnit: e.target.value })}
              className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Date Format
            </label>
            <select
              value={form.dateFormat}
              onChange={(e) =>
                setForm({ ...form, dateFormat: e.target.value as DateFormatOption })
              }
              className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg"
            >
              <option value="DD Mon YY">DD Mon YY (e.g. 16 Oct 26)</option>
              <option value="DD MMM YYYY">DD MMM YYYY (e.g. 16 Oct 2026)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 16/10/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-16)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Default Document Font
            </label>
            <select
              value={form.defaultFont}
              onChange={(e) => setForm({ ...form, defaultFont: e.target.value })}
              className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg"
            >
              <option value="Arial">Arial (English 12pt)</option>
              <option value="SutonnyMJ">SutonnyMJ (Bangla 14pt)</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Noto Sans Bengali">Noto Sans Bengali</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Default Font Size (pt)
            </label>
            <input
              type="number"
              min={9}
              max={16}
              value={form.defaultFontSize}
              onChange={(e) =>
                setForm({ ...form, defaultFontSize: Number(e.target.value) || 12 })
              }
              className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg"
            />
          </div>
        </div>

        {/* Ranks List */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200">
              Rank Dropdown List
            </label>
            <button
              type="button"
              onClick={() => setForm({ ...form, ranks: [...DEFAULT_BAF_RANKS] })}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to BAF defaults</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {form.ranks.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#111C31] text-slate-200 rounded-md border border-slate-700"
              >
                <span>{r}</span>
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, ranks: form.ranks.filter((x) => x !== r) })
                  }
                  className="text-slate-400 hover:text-red-400"
                  aria-label={`Remove ${r}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-xs">
            <input
              type="text"
              value={newRank}
              onChange={(e) => setNewRank(e.target.value)}
              placeholder="Add rank (e.g. WO)"
              className="flex-1 px-3 py-1.5 text-xs bg-[#111C31] text-white border border-slate-700 rounded-lg"
            />
            <button
              type="button"
              onClick={handleAddRank}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
            >
              Add
            </button>
          </div>
        </div>

        {/* PIN Lock & Backup Reminder */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={form.pinEnabled}
                onChange={(e) => setForm({ ...form, pinEnabled: e.target.checked })}
              />
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Require PIN Lock on App Open</span>
            </label>
            {form.pinEnabled ? (
              <input
                type="password"
                inputMode="numeric"
                value={form.pinCode}
                onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                placeholder="4-6 digit PIN"
                className="w-full px-3 py-2 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg font-mono"
              />
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Backup Reminder Interval (Days)
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={form.backupReminderDays}
              onChange={(e) =>
                setForm({ ...form, backupReminderDays: Number(e.target.value) || 7 })
              }
              className="w-full px-3 py-2 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Signer Profiles */}
      <div className="bg-[#0C1526] border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Signer Profiles</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Used to autofill Document Clerk, Adjutant, or CO signature blocks.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setEditingSigner({
                id: `signer-${Date.now()}`,
                role: 'Document Clerk',
                bd_no: '',
                rank: 'Cpl',
                name: '',
                designation: 'Orderly Room Clerk',
                unit: settings.defaultUnit,
                isDefault: false,
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Signer</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg">
          {signers.map((s) => (
            <div
              key={s.id}
              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
            >
              <div>
                <div className="font-medium text-white">
                  {s.role}: {s.rank} {s.name}
                </div>
                <div className="text-xs text-slate-400">
                  BD/No {s.bd_no} · {s.designation} · {s.unit}
                  {s.isDefault ? ' · Default' : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingSigner({ ...s })}
                  className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded hover:bg-slate-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSigner(s)}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded"
                  title="Delete signer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {editingSigner ? (
          <form
            onSubmit={handleSaveSignerForm}
            className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-4 space-y-3 text-xs"
          >
            <div className="font-semibold text-white">Edit Signer Profile</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                required
                placeholder="Role (e.g. Document Clerk)"
                value={editingSigner.role}
                onChange={(e) =>
                  setEditingSigner({ ...editingSigner, role: e.target.value })
                }
                className="px-2.5 py-1.5 border border-slate-700 rounded bg-[#111C31] text-white"
              />
              <input
                type="text"
                placeholder="BD / No"
                value={editingSigner.bd_no}
                onChange={(e) =>
                  setEditingSigner({ ...editingSigner, bd_no: e.target.value })
                }
                className="px-2.5 py-1.5 border border-slate-700 rounded bg-[#111C31] text-white font-mono"
              />
              <select
                value={editingSigner.rank}
                onChange={(e) =>
                  setEditingSigner({ ...editingSigner, rank: e.target.value })
                }
                className="px-2.5 py-1.5 border border-slate-700 rounded bg-[#111C31] text-white"
              >
                {form.ranks.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={editingSigner.name}
                onChange={(e) =>
                  setEditingSigner({ ...editingSigner, name: e.target.value })
                }
                className="px-2.5 py-1.5 border border-slate-700 rounded bg-[#111C31] text-white"
              />
              <input
                type="text"
                placeholder="Designation"
                value={editingSigner.designation}
                onChange={(e) =>
                  setEditingSigner({ ...editingSigner, designation: e.target.value })
                }
                className="px-2.5 py-1.5 border border-slate-700 rounded bg-[#111C31] text-white"
              />
              <input
                type="text"
                placeholder="Unit"
                value={editingSigner.unit}
                onChange={(e) =>
                  setEditingSigner({ ...editingSigner, unit: e.target.value })
                }
                className="px-2.5 py-1.5 border border-slate-700 rounded bg-[#111C31] text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(editingSigner.isDefault)}
                  onChange={(e) =>
                    setEditingSigner({ ...editingSigner, isDefault: e.target.checked })
                  }
                />
                <span>Set as default for this role</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSigner(null)}
                  className="px-3 py-1.5 bg-[#111C31] border border-slate-700 rounded text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-500 text-slate-950 rounded font-semibold"
                >
                  Save Signer
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </div>

      {/* Backup & Restore */}
      <div className="bg-[#0C1526] border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">
            Local Cloud Backup &amp; Restore
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Export all templates, personnel records, signers, settings, and history as a single JSON file.
            {settings.lastBackupAt
              ? ` Last backup: ${formatDateByPattern(settings.lastBackupAt, settings.dateFormat)}.`
              : ''}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleRestoreFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => restoreInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
          >
            <Upload className="w-4 h-4" />
            <span>Restore JSON</span>
          </button>
          <button
            type="button"
            onClick={() => void onBackupDownload()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
