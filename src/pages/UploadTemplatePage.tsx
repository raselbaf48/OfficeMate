import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  FileUp,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';
import {
  AppSettings,
  FieldType,
  Template,
  TemplateCategory,
  TemplateField,
} from '../types/models';
import {
  DetectedVariable,
  applyDetectedVariablesToHtml,
  parseUploadedDocument,
} from '../utils/documentImporter';
import { extractPlaceholderKeys, sanitizeDocumentHtml } from '../utils/placeholderEngine';

interface UploadTemplatePageProps {
  settings: AppSettings;
  onSaveTemplate: (tpl: Template, openInBuilder: boolean) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const UploadTemplatePage: React.FC<UploadTemplatePageProps> = ({
  settings,
  onSaveTemplate,
  onNotify,
}) => {
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('Application');
  const [rawHtml, setRawHtml] = useState<string>('');
  const [detected, setDetected] = useState<DetectedVariable[]>([]);
  const [sourceFormat, setSourceFormat] = useState<'docx' | 'pdf' | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const result = await parseUploadedDocument(file, settings.ranks);
      setRawHtml(result.rawHtml);
      setDetected(result.detectedVariables);
      setSourceFormat(result.sourceFormat);
      const baseName = file.name.replace(/\.(docx|pdf)$/i, '').replace(/[_-]+/g, ' ');
      setTemplateName(baseName || 'Imported Document');
      onNotify(
        'success',
        `Imported ${file.name} and detected ${result.detectedVariables.length} potential placeholder(s).`,
      );
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Could not read document file.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualHighlightToPlaceholder = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      onNotify('info', 'Highlight any text inside the imported document preview first.');
      return;
    }
    const selectedText = sel.toString().trim();
    if (!selectedText) {
      onNotify('info', 'Select a word, number, or blank line inside the document.');
      return;
    }

    const baseKey =
      selectedText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 24) || `field_${detected.length + 1}`;

    let key = baseKey;
    let idx = 2;
    while (detected.some((d) => d.key === key)) {
      key = `${baseKey}_${idx}`;
      idx++;
    }

    setDetected((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        originalText: selectedText,
        key,
        label: selectedText.replace(/[_.\s]+/g, ' ').trim() || key,
        type: 'text',
        accepted: true,
        confidence: 'high',
      },
    ]);
    onNotify('success', `Added "${selectedText}" -> {{${key}}}`);
  };

  const buildTemplateObject = (): Template => {
    const finalHtml = applyDetectedVariablesToHtml(rawHtml, detected);
    const keysInHtml = extractPlaceholderKeys(finalHtml);

    const fields: TemplateField[] = [];
    const seen = new Set<string>();

    for (const d of detected) {
      if (!d.accepted || seen.has(d.key)) continue;
      seen.add(d.key);
      fields.push({
        id: `f-${Date.now()}-${d.key}`,
        key: d.key,
        label: d.label || d.key,
        type: d.type,
        required: true,
        defaultValue: d.key === 'unit' ? settings.defaultUnit : '',
        personProperty:
          d.key === 'bd_no'
            ? 'bd_no'
            : d.key === 'rank'
              ? 'rank'
              : d.key === 'name'
                ? 'name'
                : d.key === 'trade'
                  ? 'trade'
                  : undefined,
      });
    }

    for (const k of keysInHtml) {
      if (seen.has(k)) continue;
      seen.add(k);
      fields.push({
        id: `f-${Date.now()}-${k}`,
        key: k,
        label: k,
        type: 'text',
        required: true,
        defaultValue: '',
      });
    }

    const now = new Date().toISOString();
    return {
      id: `tpl-${Date.now()}`,
      name: templateName.trim() || 'Imported Template',
      category,
      description: `Imported from ${sourceFormat?.toUpperCase() ?? 'document'} file`,
      bodyHtml: finalHtml,
      fields,
      pageSettings: {
        size: 'A4',
        margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
        fontFamily: settings.defaultFont || 'Arial',
        fontSize:
          (settings.defaultFont || 'Arial') === 'SutonnyMJ'
            ? 14
            : settings.defaultFontSize || 12,
        lineHeight: 1.45,
        headerText: '',
        footerText: '',
        showSignatureBlock: false,
        showCountersigned: false,
      },
      createdAt: now,
      updatedAt: now,
    };
  };

  const handleComplete = async (openInBuilder: boolean) => {
    if (!rawHtml) return;
    setSaving(true);
    try {
      const tpl = buildTemplateObject();
      await onSaveTemplate(tpl, openInBuilder);
    } finally {
      setSaving(false);
    }
  };

  const previewHtmlWithPlaceholders = sanitizeDocumentHtml(
    applyDetectedVariablesToHtml(rawHtml, detected),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Upload to Template
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload an existing .docx or text-based .pdf file. OfficeMate detects names, ranks,
          BD numbers, dates, and blanks so you can convert them into reusable placeholders.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) void handleFile(f);
        }}
        className="bg-[#0C1526] border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-emerald-500/70 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void handleFile(f);
          }}
          className="hidden"
        />
        <FileUp className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-white">
          {loading ? 'Analyzing document...' : 'Drop a .docx or .pdf file here, or browse'}
        </p>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Preserves paragraphs, bold/underline emphasis, lists, and tables from Word documents.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? 'Extracting...' : 'Choose DOCX / PDF File'}
        </button>
      </div>

      {rawHtml ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left: Extracted Preview with Manual Highlight */}
          <div className="xl:col-span-7 bg-[#0C1526] border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 bg-[#0A1120] flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-medium text-slate-300">
                Extracted Preview — highlight any text below and click Make Placeholder
              </div>
              <button
                type="button"
                onClick={handleManualHighlightToPlaceholder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-md hover:bg-emerald-500/25"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Convert Selection to Placeholder</span>
              </button>
            </div>

            <div className="p-6 bg-[#080E1B] overflow-auto max-h-[700px]">
              <div
                ref={previewRef}
                className="a4-paper border border-slate-400 shadow-lg mx-auto"
                style={{ padding: '18mm' }}
                dangerouslySetInnerHTML={{ __html: previewHtmlWithPlaceholders }}
              />
            </div>
          </div>

          {/* Right: Detected Variables & Save */}
          <div className="xl:col-span-5 bg-[#0C1526] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="space-y-3 pb-4 border-b border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  className="w-full px-3 py-2 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg"
                >
                  {(['Leave', 'Allowance', 'Certificate', 'Application', 'Letter', 'Other'] as const).map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Detected Placeholders ({detected.length})</span>
              </h3>
            </div>

            {detected.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">
                No automatic variables found. Highlight text on the left and click
                &ldquo;Convert Selection to Placeholder&rdquo;.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {detected.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-3 text-xs space-y-2 ${
                      item.accepted
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-slate-800 bg-[#111C31] opacity-65'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 font-medium text-slate-100 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.accepted}
                          onChange={(e) =>
                            setDetected((prev) =>
                              prev.map((d) =>
                                d.id === item.id ? { ...d, accepted: e.target.checked } : d,
                              ),
                            )
                          }
                        />
                        <span className="truncate">
                          Found:{' '}
                          <span className="font-mono text-emerald-300">
                            &ldquo;{item.originalText}&rdquo;
                          </span>
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setDetected((prev) => prev.filter((d) => d.id !== item.id))
                        }
                        className="text-slate-400 hover:text-red-400 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={item.key}
                        onChange={(e) =>
                          setDetected((prev) =>
                            prev.map((d) =>
                              d.id === item.id
                                ? {
                                    ...d,
                                    key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'),
                                  }
                                : d,
                            ),
                          )
                        }
                        placeholder="key"
                        className="px-2 py-1 border border-slate-700 rounded bg-[#0C1526] text-white font-mono"
                      />
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) =>
                          setDetected((prev) =>
                            prev.map((d) =>
                              d.id === item.id ? { ...d, label: e.target.value } : d,
                            ),
                          )
                        }
                        placeholder="Label"
                        className="px-2 py-1 border border-slate-700 rounded bg-[#0C1526] text-white"
                      />
                      <select
                        value={item.type}
                        onChange={(e) =>
                          setDetected((prev) =>
                            prev.map((d) =>
                              d.id === item.id
                                ? { ...d, type: e.target.value as FieldType }
                                : d,
                            ),
                          )
                        }
                        className="px-2 py-1 border border-slate-700 rounded bg-[#0C1526] text-white"
                      >
                        <option value="text">Text</option>
                        <option value="date">Date</option>
                        <option value="rank">Rank</option>
                        <option value="person">Person</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleComplete(true)}
                className="flex-1 px-4 py-2.5 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
              >
                Refine in Template Builder
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleComplete(false)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save as Template</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
