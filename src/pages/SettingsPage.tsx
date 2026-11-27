import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Building2,
  Check,
  ChevronRight,
  Download,
  HardDriveDownload,
  Lock,
  Monitor,
  Moon,
  Palette,
  PenTool,
  Plus,
  RotateCcw,
  Save,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DEFAULT_BAF_RANKS } from '../data/seedData';
import { OfficeMateBackupPayload } from '../services/storage';
import {
  AnimationPace,
  AppSettings,
  DateFormatOption,
  Signer,
  ThemeMode,
} from '../types/models';
import { BACKDROP_TRANSITION, modalPanelVariants } from '../utils/motionConfig';
import { formatDateByPattern } from '../utils/placeholderEngine';

type SettingsSectionId =
  | 'theme'
  | 'unit'
  | 'ranks'
  | 'signers'
  | 'security'
  | 'backup';

interface SettingsPageProps {
  settings: AppSettings;
  resolvedTheme: 'light' | 'dark';
  signers: Signer[];
  onSaveSettings: (s: AppSettings) => Promise<void>;
  onSaveSigner: (signer: Signer) => Promise<void>;
  onDeleteSigner: (signer: Signer) => void;
  onBackupDownload: () => Promise<void>;
  onRestoreBackup: (payload: OfficeMateBackupPayload) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

const THEME_OPTIONS: Array<{
  id: ThemeMode;
  name: string;
  subtitle: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  swatchTop: string;
  swatchCard: string;
  swatchAccent: string;
}> = [
  {
    id: 'light',
    name: 'Light',
    subtitle: 'Clean daylight workspace with crisp white surfaces',
    icon: Sun,
    swatchTop: '#F1F5F9',
    swatchCard: '#FFFFFF',
    swatchAccent: '#059669',
  },
  {
    id: 'dark',
    name: 'Dark',
    subtitle: 'Low-glare dark navy & forest slate workspace',
    icon: Moon,
    swatchTop: '#060B16',
    swatchCard: '#0C1526',
    swatchAccent: '#10B981',
  },
  {
    id: 'system',
    name: 'System',
    subtitle: 'Automatically follows your device theme preference',
    badge: 'Default',
    icon: Monitor,
    swatchTop: 'linear-gradient(135deg, #F1F5F9 50%, #060B16 50%)',
    swatchCard: 'linear-gradient(135deg, #FFFFFF 50%, #0C1526 50%)',
    swatchAccent: '#10B981',
  },
];

const ANIMATION_PACES: Array<{
  id: AnimationPace;
  label: string;
  description: string;
}> = [
  {
    id: 'relaxed',
    label: 'Relaxed (Smooth)',
    description: 'Slow, fluid page and drawer transitions across the workspace.',
  },
  {
    id: 'normal',
    label: 'Balanced',
    description: 'Standard smooth transitions with crisp motion cues.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Reduces animations for instant switching and lower motion.',
  },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  resolvedTheme,
  signers,
  onSaveSettings,
  onSaveSigner,
  onDeleteSigner,
  onBackupDownload,
  onRestoreBackup,
  onNotify,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionId | null>(null);
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [newRank, setNewRank] = useState('');
  const [editingSigner, setEditingSigner] = useState<Signer | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  useEffect(() => {
    if (!activeSection) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSection(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSection]);

  const openSection = (id: SettingsSectionId) => {
    setForm({ ...settings });
    setEditingSigner(null);
    setNewRank('');
    setActiveSection(id);
  };

  const closeSection = () => {
    setActiveSection(null);
    setEditingSigner(null);
    setNewRank('');
  };

  const currentThemeMode: ThemeMode = form.themeMode ?? settings.themeMode ?? 'system';
  const activeThemeMeta =
    THEME_OPTIONS.find((t) => t.id === currentThemeMode) ?? THEME_OPTIONS[2];

  const activePace =
    ANIMATION_PACES.find((p) => p.id === (form.animationPace ?? settings.animationPace ?? 'relaxed')) ??
    ANIMATION_PACES[0];

  const handleSelectThemeMode = async (mode: ThemeMode) => {
    const next: AppSettings = { ...form, themeMode: mode };
    setForm(next);
    await onSaveSettings(next);
    const label = THEME_OPTIONS.find((t) => t.id === mode)?.name ?? mode;
    onNotify('success', `Theme set to ${label}.`);
  };

  const handleSelectPace = async (pace: AnimationPace) => {
    const next: AppSettings = { ...form, animationPace: pace };
    setForm(next);
    await onSaveSettings(next);
    const label = ANIMATION_PACES.find((p) => p.id === pace)?.label ?? pace;
    onNotify('success', `Animation pace set to ${label}.`);
  };

  const handleSaveUnitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(form);
    onNotify('success', 'Unit defaults & formatting saved.');
    closeSection();
  };

  const handleSaveRanks = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(form);
    onNotify('success', 'Rank dropdown list updated.');
    closeSection();
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.pinEnabled && form.pinCode.trim().length < 4) {
      onNotify('error', 'PIN must be at least 4 digits when PIN lock is enabled.');
      return;
    }
    await onSaveSettings(form);
    onNotify('success', 'Security & PIN preferences saved.');
    closeSection();
  };

  const handleSaveBackupInterval = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(form);
    onNotify('success', 'Backup reminder interval updated.');
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

  const themeStatusLabel =
    currentThemeMode === 'system'
      ? `System (${resolvedTheme === 'light' ? 'Light' : 'Dark'} active)`
      : activeThemeMeta.name;

  const settingsListItems: Array<{
    id: SettingsSectionId;
    title: string;
    description: string;
    statusText: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'theme',
      title: 'Theme & Appearance',
      description: 'Switch between Light, Dark, or System appearance and animation pace.',
      statusText: `${themeStatusLabel} · ${activePace.label}`,
      icon: Palette,
    },
    {
      id: 'unit',
      title: 'Unit Defaults & Formatting',
      description: 'Configure default unit name, date format, font family, and font size.',
      statusText: `${settings.defaultUnit} · ${settings.dateFormat} · ${settings.defaultFont} ${settings.defaultFontSize}pt`,
      icon: Building2,
    },
    {
      id: 'ranks',
      title: 'Rank Dropdown List',
      description: 'Add, remove, or restore standard BAF ranks shown across forms.',
      statusText: `${settings.ranks.length} configured ranks`,
      icon: Award,
    },
    {
      id: 'signers',
      title: 'Signer Profiles',
      description: 'Manage Document Clerk, Adjutant, and Commanding Officer signature blocks.',
      statusText: `${signers.length} saved signer${signers.length === 1 ? '' : 's'}`,
      icon: PenTool,
    },
    {
      id: 'security',
      title: 'Security & PIN Lock',
      description: 'Require a numeric PIN screen lock whenever OfficeMate is opened.',
      statusText: settings.pinEnabled ? 'PIN Lock Enabled' : 'PIN Lock Disabled',
      icon: Lock,
    },
    {
      id: 'backup',
      title: 'Backup & Restore',
      description: 'Export local database JSON backups, restore data, and set reminder intervals.',
      statusText: settings.lastBackupAt
        ? `Last backup: ${formatDateByPattern(settings.lastBackupAt, settings.dateFormat)} · Every ${settings.backupReminderDays}d`
        : `No backup recorded yet · Reminder every ${settings.backupReminderDays}d`,
      icon: HardDriveDownload,
    },
  ];

  const activeItemMeta = settingsListItems.find((item) => item.id === activeSection) ?? null;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Select an option below to configure it in a dedicated window.
        </p>
      </div>

      {/* Vertical Settings Option List */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#091220] divide-y divide-slate-800/80 overflow-hidden shadow-sm">
        {settingsListItems.map((item) => {
          const Icon = item.icon;
          const isOpen = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openSection(item.id)}
              className={`w-full px-4 sm:px-5 py-4 flex items-center justify-between gap-4 text-left transition-colors ${
                isOpen
                  ? 'bg-emerald-500/10'
                  : 'hover:bg-slate-800/45 active:bg-slate-800/65'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#0F1B2E] border border-slate-700/80 flex items-center justify-center shrink-0 text-emerald-400">
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                  <div className="text-[11px] font-medium text-emerald-400 mt-1 truncate">
                    {item.statusText}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 text-slate-400">
                <span className="hidden sm:inline text-[11px] font-medium text-slate-400">
                  Configure
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Dedicated Modal Window for the Clicked Setting Option */}
      <AnimatePresence>
        {activeSection && activeItemMeta ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={BACKDROP_TRANSITION}
            onClick={closeSection}
            className="no-print fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-[3px] p-3 sm:p-5"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-modal-title"
              variants={modalPanelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0C1526] border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
            >
              {/* Window Header */}
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-[#091220]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <activeItemMeta.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id="settings-modal-title"
                      className="text-base font-bold text-white truncate"
                    >
                      {activeItemMeta.title}
                    </h2>
                    <p className="text-[11px] text-slate-400 truncate">
                      {activeItemMeta.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeSection}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                  aria-label="Close settings window"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Window Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5">
                {/* 1. Theme & Appearance */}
                {activeSection === 'theme' ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          App Theme
                        </span>
                        <span className="text-[11px] font-medium text-emerald-400">
                          Active: {resolvedTheme === 'light' ? 'Light' : 'Dark'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {THEME_OPTIONS.map((opt) => {
                          const OptIcon = opt.icon;
                          const selected = currentThemeMode === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => void handleSelectThemeMode(opt.id)}
                              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                                selected
                                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/35'
                                  : 'border-slate-800 bg-[#111C31]/70 hover:border-slate-700 hover:bg-[#111C31]'
                              }`}
                            >
                              {/* Mini theme preview mockup */}
                              <div
                                className="w-full h-14 rounded-lg border border-slate-700/70 p-2 flex flex-col justify-between overflow-hidden"
                                style={{ background: opt.swatchTop }}
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className="w-8 h-1.5 rounded-full"
                                    style={{ backgroundColor: opt.swatchAccent }}
                                  />
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: opt.swatchAccent }}
                                  />
                                </div>
                                <div
                                  className="w-full h-5 rounded border border-slate-500/20"
                                  style={{ background: opt.swatchCard }}
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <OptIcon
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        selected ? 'text-emerald-400' : 'text-slate-400'
                                      }`}
                                    />
                                    <span className="text-sm font-semibold text-white truncate">
                                      {opt.name}
                                    </span>
                                  </div>

                                  {selected ? (
                                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3" />
                                    </span>
                                  ) : opt.badge ? (
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                                      {opt.badge}
                                    </span>
                                  ) : null}
                                </div>

                                <p className="text-[11px] text-slate-400 leading-snug">
                                  {opt.subtitle}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Animation Pace
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {ANIMATION_PACES.map((pace) => {
                          const selected =
                            (form.animationPace ?? 'relaxed') === pace.id;
                          return (
                            <button
                              key={pace.id}
                              type="button"
                              onClick={() => void handleSelectPace(pace.id)}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                selected
                                  ? 'border-emerald-500 bg-emerald-500/10'
                                  : 'border-slate-800 bg-[#111C31]/70 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-white">
                                  {pace.label}
                                </span>
                                {selected ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : null}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                                {pace.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={closeSection}
                        className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* 2. Unit Defaults & Formatting */}
                {activeSection === 'unit' ? (
                  <form onSubmit={handleSaveUnitSettings} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Default Unit / Base
                        </label>
                        <input
                          type="text"
                          value={form.defaultUnit}
                          onChange={(e) =>
                            setForm({ ...form, defaultUnit: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Date Format
                        </label>
                        <select
                          value={form.dateFormat}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              dateFormat: e.target.value as DateFormatOption,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                        >
                          <option value="DD Mon YY">DD Mon YY (e.g. 16 Oct 26)</option>
                          <option value="DD MMM YYYY">DD MMM YYYY (e.g. 16 Oct 2026)</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 16/10/2026)</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-16)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Default Document Font
                        </label>
                        <select
                          value={form.defaultFont}
                          onChange={(e) =>
                            setForm({ ...form, defaultFont: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Arial">Arial (English 12pt)</option>
                          <option value="SutonnyMJ">SutonnyMJ (Bangla 14pt)</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Noto Sans Bengali">Noto Sans Bengali</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Default Font Size (pt)
                        </label>
                        <input
                          type="number"
                          min={9}
                          max={16}
                          value={form.defaultFontSize}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              defaultFontSize: Number(e.target.value) || 12,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={closeSection}
                        className="px-4 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                ) : null}

                {/* 3. Rank Dropdown List */}
                {activeSection === 'ranks' ? (
                  <form onSubmit={handleSaveRanks} className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        Active Ranks ({form.ranks.length})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({ ...form, ranks: [...DEFAULT_BAF_RANKS] })
                        }
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset to BAF defaults</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 p-3.5 rounded-xl bg-[#091220] border border-slate-800 max-h-56 overflow-y-auto">
                      {form.ranks.map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#111C31] text-slate-100 rounded-md border border-slate-700"
                        >
                          <span>{r}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                ranks: form.ranks.filter((x) => x !== r),
                              })
                            }
                            className="text-slate-400 hover:text-red-400 leading-none"
                            aria-label={`Remove ${r}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newRank}
                        onChange={(e) => setNewRank(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRank();
                          }
                        }}
                        placeholder="Add new rank (e.g. WO)"
                        className="flex-1 px-3 py-2 text-xs bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddRank}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-100 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={closeSection}
                        className="px-4 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Rank List</span>
                      </button>
                    </div>
                  </form>
                ) : null}

                {/* 4. Signer Profiles */}
                {activeSection === 'signers' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-400">
                        Autofill signature blocks in templates and documents.
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Signer</span>
                      </button>
                    </div>

                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-[#091220] overflow-hidden">
                      {signers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-400">
                          No signer profiles saved yet.
                        </div>
                      ) : (
                        signers.map((s) => (
                          <div
                            key={s.id}
                            className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                          >
                            <div>
                              <div className="font-medium text-white">
                                {s.role}: {s.rank} {s.name}
                              </div>
                              <div className="text-xs text-slate-400">
                                BD/No {s.bd_no || '—'} · {s.designation} · {s.unit}
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
                        ))
                      )}
                    </div>

                    {editingSigner ? (
                      <form
                        onSubmit={handleSaveSignerForm}
                        className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-4 space-y-3 text-xs"
                      >
                        <div className="font-semibold text-white">
                          {signers.some((s) => s.id === editingSigner.id)
                            ? 'Edit Signer Profile'
                            : 'New Signer Profile'}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <input
                            type="text"
                            required
                            placeholder="Role (e.g. Document Clerk)"
                            value={editingSigner.role}
                            onChange={(e) =>
                              setEditingSigner({
                                ...editingSigner,
                                role: e.target.value,
                              })
                            }
                            className="px-2.5 py-2 border border-slate-700 rounded-lg bg-[#111C31] text-white"
                          />
                          <input
                            type="text"
                            placeholder="BD / No"
                            value={editingSigner.bd_no}
                            onChange={(e) =>
                              setEditingSigner({
                                ...editingSigner,
                                bd_no: e.target.value,
                              })
                            }
                            className="px-2.5 py-2 border border-slate-700 rounded-lg bg-[#111C31] text-white font-mono"
                          />
                          <select
                            value={editingSigner.rank}
                            onChange={(e) =>
                              setEditingSigner({
                                ...editingSigner,
                                rank: e.target.value,
                              })
                            }
                            className="px-2.5 py-2 border border-slate-700 rounded-lg bg-[#111C31] text-white"
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
                              setEditingSigner({
                                ...editingSigner,
                                name: e.target.value,
                              })
                            }
                            className="px-2.5 py-2 border border-slate-700 rounded-lg bg-[#111C31] text-white"
                          />
                          <input
                            type="text"
                            placeholder="Designation"
                            value={editingSigner.designation}
                            onChange={(e) =>
                              setEditingSigner({
                                ...editingSigner,
                                designation: e.target.value,
                              })
                            }
                            className="px-2.5 py-2 border border-slate-700 rounded-lg bg-[#111C31] text-white"
                          />
                          <input
                            type="text"
                            placeholder="Unit"
                            value={editingSigner.unit}
                            onChange={(e) =>
                              setEditingSigner({
                                ...editingSigner,
                                unit: e.target.value,
                              })
                            }
                            className="px-2.5 py-2 border border-slate-700 rounded-lg bg-[#111C31] text-white"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <label className="flex items-center gap-2 text-slate-300">
                            <input
                              type="checkbox"
                              checked={Boolean(editingSigner.isDefault)}
                              onChange={(e) =>
                                setEditingSigner({
                                  ...editingSigner,
                                  isDefault: e.target.checked,
                                })
                              }
                            />
                            <span>Set as default for this role</span>
                          </label>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSigner(null)}
                              className="px-3 py-1.5 bg-[#111C31] border border-slate-700 rounded-lg text-slate-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 rounded-lg font-semibold"
                            >
                              Save Signer
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : null}

                    <div className="pt-2 border-t border-slate-800 flex justify-end">
                      <button
                        type="button"
                        onClick={closeSection}
                        className="px-4 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* 5. Security & PIN Lock */}
                {activeSection === 'security' ? (
                  <form onSubmit={handleSaveSecurity} className="space-y-5">
                    <div className="p-4 rounded-xl bg-[#091220] border border-slate-800 space-y-3">
                      <label className="flex items-center gap-2.5 text-sm font-medium text-slate-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.pinEnabled}
                          onChange={(e) =>
                            setForm({ ...form, pinEnabled: e.target.checked })
                          }
                          className="rounded border-slate-600"
                        />
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span>Require PIN Lock on App Open</span>
                      </label>
                      <p className="text-xs text-slate-400">
                        When enabled, OfficeMate prompts for a numeric PIN before displaying workspace documents and personnel data.
                      </p>

                      {form.pinEnabled ? (
                        <div className="pt-2">
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Numeric PIN (4–6 digits)
                          </label>
                          <input
                            type="password"
                            inputMode="numeric"
                            value={form.pinCode}
                            onChange={(e) =>
                              setForm({ ...form, pinCode: e.target.value })
                            }
                            placeholder="Enter 4-6 digit PIN"
                            className="w-full max-w-xs px-3 py-2 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={closeSection}
                        className="px-4 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Security</span>
                      </button>
                    </div>
                  </form>
                ) : null}

                {/* 6. Backup & Restore */}
                {activeSection === 'backup' ? (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-[#091220] border border-slate-800 space-y-3">
                      <div className="text-xs text-slate-300 leading-relaxed">
                        Export all templates, personnel records, signers, settings, and document history as a single portable JSON file.
                        {settings.lastBackupAt ? (
                          <div className="mt-1.5 text-emerald-400 font-medium">
                            Last backup: {formatDateByPattern(settings.lastBackupAt, settings.dateFormat)}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
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

                    <form
                      onSubmit={handleSaveBackupInterval}
                      className="p-4 rounded-xl bg-[#091220] border border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-3"
                    >
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Backup Reminder Interval (Days)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={form.backupReminderDays}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              backupReminderDays: Number(e.target.value) || 7,
                            })
                          }
                          className="w-full max-w-[160px] px-3 py-2 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg"
                        />
                      </div>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 self-start sm:self-auto"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Interval</span>
                      </button>
                    </form>

                    <div className="pt-2 border-t border-slate-800 flex justify-end">
                      <button
                        type="button"
                        onClick={closeSection}
                        className="px-4 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
