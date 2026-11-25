import React, { useMemo, useRef, useState } from 'react';
import {
  Copy,
  Download,
  FilePlus2,
  Pencil,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { AppSettings, Template, TemplateCategory } from '../types/models';
import { triggerFileDownload } from '../utils/exporters';
import { formatDateByPattern } from '../utils/placeholderEngine';

const CATEGORIES: Array<'All' | TemplateCategory> = [
  'All',
  'Leave',
  'Allowance',
  'Certificate',
  'Application',
  'Letter',
  'Other',
];

interface TemplatesPageProps {
  templates: Template[];
  settings: AppSettings;
  onUseTemplate: (id: string) => void;
  onEditTemplate: (id: string) => void;
  onCreateNew: () => void;
  onDuplicateTemplate: (tpl: Template) => void;
  onDeleteTemplate: (tpl: Template) => void;
  onImportTemplateJson: (tpl: Template) => void;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  templates,
  settings,
  onUseTemplate,
  onEditTemplate,
  onCreateNew,
  onDuplicateTemplate,
  onDeleteTemplate,
  onImportTemplateJson,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | TemplateCategory>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (category !== 'All' && t.category !== category) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [templates, search, category]);

  const handleExportJson = (tpl: Template) => {
    const json = JSON.stringify(tpl, null, 2);
    const slug = tpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
    triggerFileDownload(
      new Blob([json], { type: 'application/json' }),
      `${slug}.officemate.json`,
    );
    onNotify('success', `Exported "${tpl.name}" as JSON.`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Template;
      if (!parsed.name || !parsed.bodyHtml || !Array.isArray(parsed.fields)) {
        throw new Error('Invalid template JSON structure.');
      }
      const imported: Template = {
        ...parsed,
        id: `tpl-${Date.now()}`,
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onImportTemplateJson(imported);
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to import template JSON.',
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Templates Library
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage reusable document formats, import/export JSON templates, or start generating.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0C1526] border border-slate-700 rounded-lg hover:bg-[#111C31] transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            <span>Import JSON</span>
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors whitespace-nowrap"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#0C1526] border border-slate-800 rounded-lg overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                category === cat
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#0C1526] text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Templates List */}
      {filtered.length === 0 ? (
        <div className="bg-[#0C1526] border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-white">No templates match your filter</p>
          <p className="text-xs text-slate-400 mt-1">
            Try clearing your search or create a new template format.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-[#0C1526] border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors"
            >
              <div>
                <div className="text-xs text-emerald-400/90">
                  <span>{tpl.category}</span>
                  <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                  <span className="tabular-nums text-slate-400">
                    {tpl.fields.length} fields
                  </span>
                  <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                  <span className="tabular-nums text-slate-400">
                    Updated {formatDateByPattern(tpl.updatedAt, settings.dateFormat)}
                  </span>
                </div>

                <h3 className="mt-1.5 text-base font-semibold text-white leading-snug">
                  {tpl.name}
                </h3>
                {tpl.description ? (
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {tpl.description}
                  </p>
                ) : null}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditTemplate(tpl.id)}
                    title="Edit in Builder"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateTemplate(tpl)}
                    title="Duplicate template"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportJson(tpl)}
                    title="Export template as JSON"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTemplate(tpl)}
                    title="Delete template"
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onUseTemplate(tpl.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors whitespace-nowrap"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
