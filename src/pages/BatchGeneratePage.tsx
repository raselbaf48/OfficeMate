import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  FileArchive,
  FileText,
  Square,
} from 'lucide-react';
import { A4DocumentPreview } from '../components/A4DocumentPreview';
import { DatePickerField } from '../components/DatePickerModal';
import {
  AppSettings,
  GeneratedDocument,
  Person,
  Signer,
  Template,
} from '../types/models';
import {
  buildDocumentFilename,
  exportCombinedDocx,
  exportDocxZip,
  exportHtmlItemsToPdf,
  parseSpreadsheetPasteOrCsv,
} from '../utils/exporters';
import {
  computeAutoFields,
  renderTemplateBody,
} from '../utils/placeholderEngine';

interface BatchGeneratePageProps {
  templates: Template[];
  personnel: Person[];
  signers: Signer[];
  settings: AppSettings;
  onSaveBatchToHistory: (docs: GeneratedDocument[]) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const BatchGeneratePage: React.FC<BatchGeneratePageProps> = ({
  templates,
  personnel,
  signers,
  settings,
  onSaveBatchToHistory,
  onNotify,
}) => {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? templates[0] ?? null,
    [templates, templateId],
  );

  const [sourceMode, setSourceMode] = useState<'registry' | 'paste'>('registry');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pasteRaw, setPasteRaw] = useState('');
  const [sharedValues, setSharedValues] = useState<Record<string, string>>({});
  const [previewIndex, setPreviewIndex] = useState(0);
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTemplate) return;
    const defaults: Record<string, string> = {};
    for (const f of activeTemplate.fields) {
      if (f.type === 'signer' && f.signerRole && f.signerProperty) {
        const signer =
          signers.find((s) => s.role === f.signerRole && s.isDefault) ??
          signers.find((s) => s.role === f.signerRole);
        defaults[f.key] = signer ? signer[f.signerProperty] : f.defaultValue;
      } else if (f.key === 'unit' && !f.defaultValue) {
        defaults[f.key] = settings.defaultUnit;
      } else {
        defaults[f.key] = f.defaultValue || '';
      }
    }
    setSharedValues(defaults);
    setPreviewIndex(0);
  }, [activeTemplate?.id]);

  const sharedFields = useMemo(() => {
    if (!activeTemplate) return [];
    const personKeys = new Set(['bd_no', 'rank', 'name', 'trade']);
    return activeTemplate.fields.filter(
      (f) => !f.personProperty && !personKeys.has(f.key) && f.type !== 'auto',
    );
  }, [activeTemplate]);

  const batchRecords = useMemo(() => {
    if (!activeTemplate) return [];

    let rows: Array<Record<string, string>> = [];
    if (sourceMode === 'registry') {
      const picked = personnel.filter((p) => selectedIds.includes(p.id));
      rows = picked.map((p) => ({
        _personId: p.id,
        bd_no: p.bd_no,
        rank: p.rank,
        name: p.name,
        trade: p.trade,
        unit: p.unit || settings.defaultUnit,
      }));
    } else if (pasteRaw.trim()) {
      rows = parseSpreadsheetPasteOrCsv(pasteRaw);
    }

    return rows.map((row) => {
      const merged: Record<string, string> = { ...sharedValues };
      for (const f of activeTemplate.fields) {
        if (f.personProperty && row[f.personProperty]) {
          merged[f.key] = row[f.personProperty];
        } else if (row[f.key]) {
          merged[f.key] = row[f.key];
        }
      }
      const computed = computeAutoFields(
        activeTemplate.fields,
        merged,
        settings.dateFormat,
      );
      const renderedPreview = renderTemplateBody(
        activeTemplate,
        computed,
        settings.dateFormat,
        { highlightUnfilled: true },
      );
      const renderedClean = renderTemplateBody(
        activeTemplate,
        computed,
        settings.dateFormat,
        { highlightUnfilled: false },
      );

      return {
        personId: row._personId,
        values: computed,
        previewHtml: renderedPreview.html,
        cleanHtml: renderedClean.html,
      };
    });
  }, [activeTemplate, sourceMode, selectedIds, personnel, pasteRaw, sharedValues, settings]);

  const toggleAllRegistry = () => {
    if (selectedIds.length === personnel.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(personnel.map((p) => p.id));
    }
  };

  const togglePerson = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const persistBatchHistoryIfEnabled = async () => {
    if (!saveToHistory || !activeTemplate || batchRecords.length === 0) return;
    const now = new Date().toISOString();
    const docs: GeneratedDocument[] = batchRecords.map((rec, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      templateId: activeTemplate.id,
      templateName: activeTemplate.name,
      category: activeTemplate.category,
      personId: rec.personId,
      personSummary: {
        bd_no: rec.values.bd_no ?? '',
        rank: rec.values.rank ?? '',
        name: rec.values.name ?? '',
      },
      values: rec.values,
      renderedHtml: rec.cleanHtml,
      createdAt: now,
      updatedAt: now,
    }));
    await onSaveBatchToHistory(docs);
  };

  const handleBatchExport = async (mode: 'merged_pdf' | 'zip_docx' | 'combined_docx') => {
    if (!activeTemplate || batchRecords.length === 0) {
      onNotify('error', 'Select at least one person or paste table rows first.');
      return;
    }

    setExporting(mode);
    try {
      const safeTpl = activeTemplate.name.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40);
      if (mode === 'merged_pdf') {
        await exportHtmlItemsToPdf(
          activeTemplate,
          batchRecords.map((r) => r.cleanHtml),
          `${safeTpl}_Batch_${batchRecords.length}.pdf`,
        );
        onNotify('success', `Exported merged PDF (${batchRecords.length} documents).`);
      } else if (mode === 'combined_docx') {
        await exportCombinedDocx(
          activeTemplate,
          batchRecords.map((r) => r.cleanHtml),
          `${safeTpl}_Combined_${batchRecords.length}.docx`,
        );
        onNotify('success', `Exported combined DOCX (${batchRecords.length} pages).`);
      } else {
        await exportDocxZip(
          activeTemplate,
          batchRecords.map((r) => ({
            html: r.cleanHtml,
            filename: buildDocumentFilename(activeTemplate.name, r.values, 'docx'),
          })),
          `${safeTpl}_Batch_DOCX.zip`,
        );
        onNotify('success', `Exported ZIP with ${batchRecords.length} DOCX files.`);
      }
      await persistBatchHistoryIfEnabled();
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Batch export failed.',
      );
    } finally {
      setExporting(null);
    }
  };

  if (!activeTemplate) {
    return (
      <div className="bg-[#0C1526] border border-slate-800 rounded-xl p-12 text-center">
        <p className="text-sm font-medium text-white">Create a template first</p>
      </div>
    );
  }

  const safeIdx = Math.min(previewIndex, Math.max(0, batchRecords.length - 1));
  const currentRecord = batchRecords[safeIdx];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Batch Generate
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate one formatted document per person and export as a merged PDF, ZIP of DOCX files, or combined DOCX.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={batchRecords.length === 0 || exporting !== null}
            onClick={() => void handleBatchExport('merged_pdf')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0C1526] border border-slate-700 rounded-lg hover:bg-[#111C31] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exporting === 'merged_pdf' ? 'Building PDF...' : 'Merged PDF'}</span>
          </button>

          <button
            type="button"
            disabled={batchRecords.length === 0 || exporting !== null}
            onClick={() => void handleBatchExport('combined_docx')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0C1526] border border-slate-700 rounded-lg hover:bg-[#111C31] disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>
              {exporting === 'combined_docx' ? 'Building DOCX...' : 'Combined DOCX'}
            </span>
          </button>

          <button
            type="button"
            disabled={batchRecords.length === 0 || exporting !== null}
            onClick={() => void handleBatchExport('zip_docx')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 disabled:opacity-50"
          >
            <FileArchive className="w-4 h-4" />
            <span>{exporting === 'zip_docx' ? 'Zipping...' : 'ZIP of DOCX'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Config */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-[#0C1526] border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                1. Choose Template
              </label>
              <select
                value={activeTemplate.id}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300">
                  2. Select Personnel ({batchRecords.length} selected)
                </span>
                <div className="flex items-center gap-1 bg-[#111C31] border border-slate-800 p-0.5 rounded-md text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSourceMode('registry')}
                    className={`px-2 py-1 rounded ${
                      sourceMode === 'registry'
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Registry
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceMode('paste')}
                    className={`px-2 py-1 rounded ${
                      sourceMode === 'paste'
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paste Table
                  </button>
                </div>
              </div>

              {sourceMode === 'registry' ? (
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-[#0A1120] border-b border-slate-800 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={toggleAllRegistry}
                      className="inline-flex items-center gap-1.5 font-medium text-slate-200 hover:text-white"
                    >
                      {selectedIds.length === personnel.length && personnel.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Select All ({personnel.length})</span>
                    </button>
                    <span className="text-emerald-400 tabular-nums">
                      {selectedIds.length} picked
                    </span>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/70">
                    {personnel.map((p) => {
                      const checked = selectedIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#111C31] cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePerson(p.id)}
                            />
                            <span className="font-medium text-slate-100 truncate">
                              {p.rank} {p.name}
                            </span>
                          </span>
                          <span className="font-mono text-emerald-400/80 tabular-nums shrink-0 ml-2">
                            {p.bd_no}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <textarea
                  rows={6}
                  value={pasteRaw}
                  onChange={(e) => setPasteRaw(e.target.value)}
                  placeholder={`BD/No\tRank\tName\tUnit\n458912\tSgt\tMd. Rafiqul Islam\t155 UASU BAF`}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#111C31] text-white border border-slate-700 rounded-lg"
                />
              )}
            </div>

            {sharedFields.length > 0 ? (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-200">
                  3. Shared Document Values
                </div>
                {sharedFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {field.label}
                    </label>
                    {field.type === 'date' ? (
                      <DatePickerField
                        value={sharedValues[field.key] ?? ''}
                        onChange={(formatted) =>
                          setSharedValues((p) => ({ ...p, [field.key]: formatted }))
                        }
                        placeholder={settings.dateFormat}
                        dateFormat={settings.dateFormat}
                        ariaLabel={field.label}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={sharedValues[field.key] ?? ''}
                        onChange={(e) =>
                          setSharedValues((p) => ({ ...p, [field.key]: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg"
                      >
                        {(field.options ?? []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={sharedValues[field.key] ?? ''}
                        onChange={(e) =>
                          setSharedValues((p) => ({ ...p, [field.key]: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            <label className="flex items-center gap-2 pt-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={saveToHistory}
                onChange={(e) => setSaveToHistory(e.target.checked)}
              />
              <span>Save generated batch documents to History</span>
            </label>
          </div>
        </div>

        {/* Right Batch Preview Carousel */}
        <div className="xl:col-span-7 bg-[#080E1B] border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-[#0C1526] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="text-xs font-semibold text-white">
              {currentRecord
                ? `Preview ${safeIdx + 1} of ${batchRecords.length}: ${currentRecord.values.rank ?? ''} ${currentRecord.values.name ?? ''}`
                : 'Batch Preview'}
            </div>

            {batchRecords.length > 1 ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safeIdx === 0}
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  className="p-1.5 text-slate-300 hover:bg-slate-800 rounded disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safeIdx >= batchRecords.length - 1}
                  onClick={() =>
                    setPreviewIndex((i) => Math.min(batchRecords.length - 1, i + 1))
                  }
                  className="p-1.5 text-slate-300 hover:bg-slate-800 rounded disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="p-6 overflow-auto max-h-[760px] flex justify-center">
            {currentRecord ? (
              <div style={{ width: `${210 * 0.72}mm` }}>
                <A4DocumentPreview
                  renderedHtml={currentRecord.previewHtml}
                  pageSettings={activeTemplate.pageSettings}
                  zoom={0.72}
                />
              </div>
            ) : (
              <div className="py-24 text-center text-sm text-slate-400">
                Select one or more service members on the left to preview the batch output.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
