import React, { useMemo, useState } from 'react';
import {
  Copy,
  Download,
  FolderOpen,
  Search,
  Trash2,
} from 'lucide-react';
import { DatePickerField } from '../components/DatePickerModal';
import { AppSettings, GeneratedDocument, Template } from '../types/models';
import {
  buildDocumentFilename,
  exportHtmlItemsToPdf,
  exportSingleDocx,
} from '../utils/exporters';
import { formatDateByPattern } from '../utils/placeholderEngine';

interface HistoryPageProps {
  documents: GeneratedDocument[];
  templates: Template[];
  settings: AppSettings;
  onReopen: (doc: GeneratedDocument, duplicate: boolean) => void;
  onDeleteDocument: (doc: GeneratedDocument) => void;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  documents,
  templates,
  settings,
  onReopen,
  onDeleteDocument,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((doc) => {
      if (templateFilter !== 'all' && doc.templateId !== templateFilter) return false;
      const docDay = doc.createdAt.slice(0, 10);
      if (dateFrom && docDay < dateFrom) return false;
      if (dateTo && docDay > dateTo) return false;
      if (!q) return true;
      return (
        doc.templateName.toLowerCase().includes(q) ||
        (doc.personSummary.name ?? '').toLowerCase().includes(q) ||
        (doc.personSummary.bd_no ?? '').toLowerCase().includes(q) ||
        (doc.personSummary.rank ?? '').toLowerCase().includes(q)
      );
    });
  }, [documents, search, templateFilter, dateFrom, dateTo]);

  const handleReExport = async (doc: GeneratedDocument, kind: 'docx' | 'pdf') => {
    const tpl = templates.find((t) => t.id === doc.templateId);
    if (!tpl) {
      onNotify('error', 'Original template was deleted; open document to inspect.');
      return;
    }
    setBusyId(`${doc.id}-${kind}`);
    try {
      const filename = buildDocumentFilename(doc.templateName, doc.values, kind);
      if (kind === 'docx') {
        await exportSingleDocx(tpl, doc.renderedHtml, filename);
      } else {
        await exportHtmlItemsToPdf(tpl, [doc.renderedHtml], filename);
      }
      onNotify('success', `Re-exported ${filename}`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Document History
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Every generated document is stored locally with its field values so you can re-open, duplicate, or re-export anytime.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#0C1526] border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search person, BD/No, template..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#111C31] text-white border border-slate-700 rounded-lg"
          />
        </div>

        <select
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-[#111C31] text-white border border-slate-700 rounded-lg"
        >
          <option value="all">All Templates</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <DatePickerField
          ariaLabel="Filter from date"
          value={dateFrom ? formatDateByPattern(dateFrom, settings.dateFormat) : ''}
          onChange={(_formatted, iso) => setDateFrom(iso)}
          placeholder="From date"
          dateFormat={settings.dateFormat}
          className="py-1.5 text-xs"
        />

        <DatePickerField
          ariaLabel="Filter to date"
          value={dateTo ? formatDateByPattern(dateTo, settings.dateFormat) : ''}
          onChange={(_formatted, iso) => setDateTo(iso)}
          placeholder="To date"
          dateFormat={settings.dateFormat}
          className="py-1.5 text-xs"
        />
      </div>

      {/* History Table */}
      <div className="bg-[#0C1526] border border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-white">No documents found</p>
            <p className="text-xs text-slate-400 mt-1">
              Generated and exported documents will appear in this log.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0A1120] text-xs font-semibold text-slate-400">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">BD / No</th>
                  <th className="py-3 px-4">Person</th>
                  <th className="py-3 px-4">Template</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#111C31] transition-colors">
                    <td className="py-3 px-4 text-xs text-slate-400 tabular-nums whitespace-nowrap">
                      {formatDateByPattern(doc.createdAt, settings.dateFormat)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-emerald-400 tabular-nums">
                      {doc.personSummary.bd_no || '—'}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      {doc.personSummary.rank} {doc.personSummary.name || 'Unnamed'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs max-w-xs truncate">
                      {doc.templateName}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onReopen(doc, false)}
                          title="Re-open and edit"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded hover:bg-slate-800"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onReopen(doc, true)}
                          title="Duplicate for another person"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === `${doc.id}-docx`}
                          onClick={() => void handleReExport(doc, 'docx')}
                          title="Download DOCX"
                          className="px-2 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/15 rounded"
                        >
                          DOCX
                        </button>
                        <button
                          type="button"
                          disabled={busyId === `${doc.id}-pdf`}
                          onClick={() => void handleReExport(doc, 'pdf')}
                          title="Download PDF"
                          className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 rounded"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDocument(doc)}
                          title="Delete record"
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
