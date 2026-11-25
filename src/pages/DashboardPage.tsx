import React from 'react';
import {
  ArrowRight,
  Copy,
  Download,
  FileCheck2,
  FilePlus2,
  FileSpreadsheet,
  FolderKanban,
  FolderOpen,
  History,
  Upload,
  Users,
} from 'lucide-react';
import {
  AppSettings,
  GeneratedDocument,
  NavRoute,
  Person,
  Template,
} from '../types/models';
import { formatDateByPattern } from '../utils/placeholderEngine';

interface DashboardPageProps {
  templates: Template[];
  personnel: Person[];
  documents: GeneratedDocument[];
  settings: AppSettings;
  onNavigate: (route: NavRoute) => void;
  onUseTemplate: (templateId: string) => void;
  onEditTemplate: (templateId: string) => void;
  onReopenDocument: (doc: GeneratedDocument, duplicate?: boolean) => void;
  onBackupNow: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  templates,
  personnel,
  documents,
  settings,
  onNavigate,
  onUseTemplate,
  onEditTemplate,
  onReopenDocument,
  onBackupNow,
}) => {
  const daysSinceBackup = React.useMemo(() => {
    if (!settings.lastBackupAt) return null;
    const diff = Date.now() - new Date(settings.lastBackupAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [settings.lastBackupAt]);

  const backupDue =
    daysSinceBackup === null || daysSinceBackup >= (settings.backupReminderDays || 7);

  const recentTemplates = templates.slice(0, 4);
  const recentDocuments = documents.slice(0, 5);
  const todayLabel = formatDateByPattern(new Date(), settings.dateFormat);

  return (
    <div className="space-y-6">
      {/* Unit Command Banner */}
      <div className="bg-[#0C1526] border border-slate-800/90 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {settings.defaultUnit} · OfficeMate Operations
            </h1>
            <span className="text-xs font-medium text-emerald-400">
              Active Workspace
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            {todayLabel} · {templates.length} Templates · {personnel.length} Registered Personnel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>History</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import DOCX/PDF</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('generate')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Generate Document</span>
          </button>
        </div>
      </div>

      {backupDue ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-amber-200 leading-relaxed">
            <span className="font-semibold text-amber-300">Backup Reminder:</span>{' '}
            {daysSinceBackup === null
              ? 'No local backup exported yet. Save a JSON backup to protect templates and personnel records.'
              : `Last backup was ${daysSinceBackup} day(s) ago. Download an updated JSON backup.`}
          </div>
          <button
            type="button"
            onClick={onBackupNow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup JSON</span>
          </button>
        </div>
      ) : null}

      {/* 4-column KPI Strip styled after operations dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('templates')}
          className="text-left bg-[#0C1526] border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Saved Templates</span>
            <span className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300">
              <FolderKanban className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-3xl font-bold text-white tabular-nums">
              {templates.length}
            </span>
            <span className="text-xs text-slate-400">Browse →</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('personnel')}
          className="text-left bg-[#0C1526] border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-300/90">
              Personnel Registry
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-3xl font-bold text-emerald-400 tabular-nums">
              {personnel.length}
            </span>
            <span className="text-xs text-emerald-400">Autofill →</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('history')}
          className="text-left bg-[#0C1526] border border-amber-500/30 hover:border-amber-500/60 rounded-xl p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300/90">
              Documents Generated
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-3xl font-bold text-amber-400 tabular-nums">
              {documents.length}
            </span>
            <span className="text-xs text-amber-400">Logs →</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onBackupNow}
          className="text-left bg-[#0C1526] border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-300/90">Last Backup</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
              <Download className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-lg font-bold text-indigo-300 tabular-nums">
              {settings.lastBackupAt
                ? formatDateByPattern(settings.lastBackupAt, settings.dateFormat)
                : 'Not yet'}
            </span>
            <span className="text-xs text-indigo-400">Export →</span>
          </div>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('generate')}
          className="text-left bg-[#0C1526] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-colors group"
        >
          <FileCheck2 className="w-5 h-5 text-emerald-400 mb-2.5" />
          <div className="text-sm font-semibold text-white group-hover:text-emerald-300">
            Fill &amp; Export Document
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Pick a template and personnel record for live A4 export.
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('builder')}
          className="text-left bg-[#0C1526] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-colors group"
        >
          <FilePlus2 className="w-5 h-5 text-emerald-400 mb-2.5" />
          <div className="text-sm font-semibold text-white group-hover:text-emerald-300">
            Create New Template
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Build a reusable format with placeholders and auto-dates.
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('upload')}
          className="text-left bg-[#0C1526] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-colors group"
        >
          <Upload className="w-5 h-5 text-emerald-400 mb-2.5" />
          <div className="text-sm font-semibold text-white group-hover:text-emerald-300">
            Upload DOCX or PDF
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Import an existing form and auto-detect variable blanks.
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('batch')}
          className="text-left bg-[#0C1526] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-colors group"
        >
          <FileSpreadsheet className="w-5 h-5 text-emerald-400 mb-2.5" />
          <div className="text-sm font-semibold text-white group-hover:text-emerald-300">
            Batch Generate
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Generate certificates for multiple airmen in one click.
          </div>
        </button>
      </div>

      {/* Recent Templates & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0C1526] border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Templates</h2>
            <button
              type="button"
              onClick={() => onNavigate('templates')}
              className="text-xs font-medium text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTemplates.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No templates saved yet. Create one in Template Builder.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {recentTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#111C31] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">
                      {tpl.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {tpl.category} · {tpl.fields.length} fields
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditTemplate(tpl.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white border border-slate-700 rounded-md bg-[#111C31]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onUseTemplate(tpl.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-md"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0C1526] border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Documents</h2>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Full history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentDocuments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400 mb-3">
                Generated documents will appear here once you save or export one.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('generate')}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/25"
              >
                Create First Document
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#111C31] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">
                      {doc.personSummary.rank} {doc.personSummary.name || 'Unnamed'}
                      {doc.personSummary.bd_no ? (
                        <span className="font-mono text-xs text-emerald-400/90 ml-2 tabular-nums">
                          ({doc.personSummary.bd_no})
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      {doc.templateName} ·{' '}
                      {formatDateByPattern(doc.createdAt, settings.dateFormat)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onReopenDocument(doc, true)}
                      title="Duplicate for another person"
                      className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onReopenDocument(doc, false)}
                      title="Re-open document"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-md hover:bg-slate-800"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
