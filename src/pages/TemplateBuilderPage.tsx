import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Eye,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Outdent,
  PenLine,
  Plus,
  Redo2,
  Save,
  ScissorsLineDashed,
  Table as TableIcon,
  Tag,
  Trash2,
  Underline,
  Undo2,
} from 'lucide-react';
import { A4DocumentPreview } from '../components/A4DocumentPreview';
import {
  AppSettings,
  AutoFormulaType,
  FieldType,
  PersonProperty,
  Signer,
  SignerProperty,
  Template,
  TemplateCategory,
  TemplateField,
} from '../types/models';
import {
  buildSampleValues,
  extractPlaceholderKeys,
  renderTemplateBody,
} from '../utils/placeholderEngine';

const CATEGORIES: TemplateCategory[] = [
  'Leave',
  'Allowance',
  'Certificate',
  'Application',
  'Letter',
  'Other',
];

const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select Dropdown' },
  { value: 'textarea', label: 'Multi-line Text' },
  { value: 'rank', label: 'Rank Dropdown' },
  { value: 'person', label: 'Person-linked' },
  { value: 'signer', label: 'Signer-linked' },
  { value: 'auto', label: 'Auto-calculated' },
];

interface TemplateBuilderPageProps {
  initialTemplate: Template | null;
  settings: AppSettings;
  signers: Signer[];
  onSaveTemplate: (tpl: Template) => Promise<void>;
  onCancel: () => void;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

function createBlankTemplate(settings: AppSettings): Template {
  const now = new Date().toISOString();
  return {
    id: `tpl-${Date.now()}`,
    name: 'Untitled Official Document',
    category: 'Application',
    description: '',
    bodyHtml: `<p style="text-align: center;"><strong><u>OFFICIAL DOCUMENT TITLE</u></strong></p>
<p><br></p>
<p>Date: {{document_date}}</p>
<p>BD/No {{bd_no}} Rank {{rank}} Name {{name}} of {{unit}}.</p>
<p><br></p>
<p style="text-align: right;">Sign ..........................</p>`,
    fields: [
      {
        id: `f-${Date.now()}-1`,
        key: 'document_date',
        label: 'Document Date',
        type: 'date',
        required: true,
        defaultValue: '',
      },
      {
        id: `f-${Date.now()}-2`,
        key: 'bd_no',
        label: 'BD / No',
        type: 'person',
        personProperty: 'bd_no',
        required: true,
        defaultValue: '',
        validation: { kind: 'bd_no' },
      },
      {
        id: `f-${Date.now()}-3`,
        key: 'rank',
        label: 'Rank',
        type: 'rank',
        personProperty: 'rank',
        required: true,
        defaultValue: '',
      },
      {
        id: `f-${Date.now()}-4`,
        key: 'name',
        label: 'Full Name',
        type: 'person',
        personProperty: 'name',
        required: true,
        defaultValue: '',
      },
      {
        id: `f-${Date.now()}-5`,
        key: 'unit',
        label: 'Base / Unit',
        type: 'text',
        required: true,
        defaultValue: settings.defaultUnit,
      },
    ],
    pageSettings: {
      size: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 22 },
      fontFamily: settings.defaultFont || 'Arial',
      fontSize: settings.defaultFontSize || 12,
      lineHeight: 1.45,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export const TemplateBuilderPage: React.FC<TemplateBuilderPageProps> = ({
  initialTemplate,
  settings,
  signers,
  onSaveTemplate,
  onCancel,
  onNotify,
}) => {
  const [template, setTemplate] = useState<Template>(() =>
    initialTemplate ? structuredClone(initialTemplate) : createBlankTemplate(settings),
  );
  const [rightTab, setRightTab] = useState<'fields' | 'page'>('fields');
  const [previewMode, setPreviewMode] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const undoStack = useRef<string[]>([template.bodyHtml]);
  const redoStack = useRef<string[]>([]);

  useEffect(() => {
    const next = initialTemplate ? structuredClone(initialTemplate) : createBlankTemplate(settings);
    setTemplate(next);
    undoStack.current = [next.bodyHtml];
    redoStack.current = [];
    if (editorRef.current) {
      editorRef.current.innerHTML = next.bodyHtml;
    }
  }, [initialTemplate, settings]);

  useEffect(() => {
    if (!previewMode && editorRef.current && editorRef.current.innerHTML !== template.bodyHtml) {
      editorRef.current.innerHTML = template.bodyHtml;
    }
  }, [previewMode]);

  const syncEditorHtml = (recordUndo = true) => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (recordUndo && undoStack.current[undoStack.current.length - 1] !== html) {
      undoStack.current.push(html);
      if (undoStack.current.length > 50) undoStack.current.shift();
      redoStack.current = [];
    }
    setTemplate((prev) => ({ ...prev, bodyHtml: html }));
  };

  const handleUndo = () => {
    if (undoStack.current.length <= 1) return;
    const current = undoStack.current.pop()!;
    redoStack.current.push(current);
    const previous = undoStack.current[undoStack.current.length - 1];
    if (editorRef.current) editorRef.current.innerHTML = previous;
    setTemplate((prev) => ({ ...prev, bodyHtml: previous }));
  };

  const handleRedo = () => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(next);
    if (editorRef.current) editorRef.current.innerHTML = next;
    setTemplate((prev) => ({ ...prev, bodyHtml: next }));
  };

  const execFormat = (command: string, value?: string) => {
    if (previewMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorHtml(true);
  };

  const insertLetteredList = () => {
    if (previewMode) return;
    editorRef.current?.focus();
    document.execCommand('insertOrderedList');
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    const ol =
      anchor instanceof HTMLElement
        ? anchor.closest('ol')
        : anchor?.parentElement?.closest('ol');
    if (ol) {
      ol.setAttribute('data-list-style', 'lower-alpha');
      ol.classList.add('list-alpha');
    }
    syncEditorHtml(true);
  };

  const insertTable = () => {
    if (previewMode) return;
    const tableHtml = `<table><tbody><tr><td><strong>Label</strong></td><td>{{value_1}}</td></tr><tr><td><strong>Label 2</strong></td><td>{{value_2}}</td></tr></tbody></table><p><br></p>`;
    execFormat('insertHTML', tableHtml);
  };

  const insertSignatureLine = () => {
    if (previewMode) return;
    const sigHtml = `<p style="text-align: right;">Sign ..........................</p><p style="text-align: right;">BD/No {{bd_no}}</p><p style="text-align: right;">Rank {{rank}}</p><p style="text-align: right;">Name {{name}}</p>`;
    execFormat('insertHTML', sigHtml);
  };

  const insertCountersigned = () => {
    if (previewMode) return;
    execFormat('insertHTML', `<p><br></p><p style="text-align: center;"><strong>COUNTERSIGNED</strong></p>`);
  };

  const insertPageBreak = () => {
    if (previewMode) return;
    execFormat('insertHTML', `<hr class="om-page-break" /><p><br></p>`);
  };

  const insertPlaceholderAtCursor = (key: string) => {
    if (previewMode) {
      setPreviewMode(false);
      setTimeout(() => {
        editorRef.current?.focus();
        document.execCommand('insertText', false, `{{${key}}}`);
        syncEditorHtml(true);
      }, 20);
      return;
    }
    editorRef.current?.focus();
    document.execCommand('insertText', false, `{{${key}}}`);
    syncEditorHtml(true);
  };

  const handleMakePlaceholderFromSelection = () => {
    if (previewMode) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      onNotify('info', 'Highlight some text in the document first to turn it into a placeholder.');
      return;
    }
    const selectedText = sel.toString().trim();
    if (!selectedText) {
      onNotify('info', 'Select a word, value, or blank line first.');
      return;
    }

    const cleanKey =
      selectedText
        .toLowerCase()
        .replace(/\{\{|\}\}/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 24) || `field_${template.fields.length + 1}`;

    let uniqueKey = cleanKey;
    let counter = 2;
    while (template.fields.some((f) => f.key === uniqueKey)) {
      uniqueKey = `${cleanKey}_${counter}`;
      counter++;
    }

    document.execCommand('insertText', false, `{{${uniqueKey}}}`);
    syncEditorHtml(true);

    const newField: TemplateField = {
      id: `f-${Date.now()}`,
      key: uniqueKey,
      label: selectedText.replace(/[_.\{\}]/g, '').trim() || uniqueKey,
      type: 'text',
      required: true,
      defaultValue: '',
    };

    setTemplate((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
    setEditingFieldId(newField.id);
    setRightTab('fields');
    onNotify('success', `Created placeholder {{${uniqueKey}}}.`);
  };

  const handleAddField = () => {
    const idx = template.fields.length + 1;
    const newField: TemplateField = {
      id: `f-${Date.now()}`,
      key: `custom_field_${idx}`,
      label: `Custom Field ${idx}`,
      type: 'text',
      required: true,
      defaultValue: '',
    };
    setTemplate((prev) => ({ ...prev, fields: [...prev.fields, newField] }));
    setEditingFieldId(newField.id);
  };

  const updateField = (id: string, patch: Partial<TemplateField>) => {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };

  const moveField = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= template.fields.length) return;
    setTemplate((prev) => {
      const next = [...prev.fields];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return { ...prev, fields: next };
    });
  };

  const deleteField = (id: string) => {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== id),
    }));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  const syncMissingFieldsFromBody = () => {
    const keysInBody = extractPlaceholderKeys(template.bodyHtml);
    const existingKeys = new Set(template.fields.map((f) => f.key));
    const additions: TemplateField[] = [];
    for (const key of keysInBody) {
      if (!existingKeys.has(key)) {
        additions.push({
          id: `f-${Date.now()}-${key}`,
          key,
          label: key
            .split('_')
            .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
            .join(' '),
          type: key.includes('date') ? 'date' : key === 'rank' ? 'rank' : 'text',
          required: true,
          defaultValue: '',
        });
      }
    }
    if (additions.length === 0) {
      onNotify('info', 'All placeholders in the document body already have field definitions.');
      return;
    }
    setTemplate((prev) => ({ ...prev, fields: [...prev.fields, ...additions] }));
    onNotify('success', `Added ${additions.length} field(s) detected in document body.`);
  };

  const handleSave = async () => {
    if (!template.name.trim()) {
      onNotify('error', 'Please enter a template name.');
      return;
    }
    setSaving(true);
    try {
      await onSaveTemplate({
        ...template,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSaving(false);
    }
  };

  const sampleValues = buildSampleValues(
    template,
    settings.dateFormat,
    settings.defaultUnit,
  );
  const samplePreview = renderTemplateBody(template, sampleValues, settings.dateFormat, {
    highlightUnfilled: true,
  });

  const signerRoles = Array.from(new Set(signers.map((s) => s.role)));

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-[#0C1526] border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="tpl-name" className="block text-xs font-medium text-slate-400 mb-1">
              Template Name
            </label>
            <input
              id="tpl-name"
              type="text"
              value={template.name}
              onChange={(e) => setTemplate((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm font-medium bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="tpl-cat" className="block text-xs font-medium text-slate-400 mb-1">
              Category
            </label>
            <select
              id="tpl-cat"
              value={template.category}
              onChange={(e) =>
                setTemplate((p) => ({ ...p, category: e.target.value as TemplateCategory }))
              }
              className="w-full px-3 py-1.5 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setPreviewMode((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              previewMode
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-[#111C31] text-slate-200 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{previewMode ? 'Back to Editor' : 'Sample Preview'}</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: Rich Text Document Editor */}
        <div className="xl:col-span-8 bg-[#0C1526] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          {/* Formatting Toolbar */}
          <div className="px-3 py-2.5 border-b border-slate-800 bg-[#0A1120] flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              title="Undo"
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              title="Redo"
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={() => execFormat('bold')}
              title="Bold"
              className="p-1.5 text-slate-200 hover:bg-slate-800 rounded"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('italic')}
              title="Italic"
              className="p-1.5 text-slate-200 hover:bg-slate-800 rounded"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('underline')}
              title="Underline"
              className="p-1.5 text-slate-200 hover:bg-slate-800 rounded"
            >
              <Underline className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={() => execFormat('justifyLeft')}
              title="Align Left"
              className="p-1.5 text-slate-200 hover:bg-slate-800 rounded"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('justifyCenter')}
              title="Align Center"
              className="p-1.5 text-slate-200 hover:bg-slate-800 rounded"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('justifyRight')}
              title="Align Right"
              className="p-1.5 text-slate-200 hover:bg-slate-800 rounded"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('justifyFull')}
              title="Justify"
              className="p-1.5 text-slate-200 hover:bg-slate-800 rounded"
            >
              <AlignJustify className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={() => execFormat('insertOrderedList')}
              title="Numbered List (1, 2, 3)"
              className="p-1.5 text-slate-200 hover:bg-slate-800 rounded"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={insertLetteredList}
              title="Lettered List (a, b, c)"
              className="px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded"
            >
              a.b.c
            </button>
            <button
              type="button"
              onClick={() => execFormat('insertUnorderedList')}
              title="Bullet List"
              className="p-1.5 text-slate-200 hover:bg-slate-800 rounded"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('indent')}
              title="Indent"
              className="p-1.5 text-slate-200 hover:bg-slate-800 rounded"
            >
              <IndentIncrease className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('outdent')}
              title="Outdent"
              className="p-1.5 text-slate-200 hover:bg-slate-800 rounded"
            >
              <Outdent className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={insertTable}
              title="Insert Table"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>

            <button
              type="button"
              onClick={insertSignatureLine}
              title="Insert Dotted Signature Block"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Sign Line</span>
            </button>

            <button
              type="button"
              onClick={insertCountersigned}
              title="Insert Countersigned Block"
              className="px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded"
            >
              Countersigned
            </button>

            <button
              type="button"
              onClick={insertPageBreak}
              title="Insert Page Break"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded"
            >
              <ScissorsLineDashed className="w-3.5 h-3.5" />
              <span>Page Break</span>
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={handleMakePlaceholderFromSelection}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 rounded transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Make Placeholder</span>
            </button>
          </div>

          {/* Document Canvas (A4 Paper stays white/black for realistic print preview) */}
          <div className="bg-[#080E1B] p-4 sm:p-6 overflow-x-auto flex justify-center min-h-[680px]">
            {previewMode ? (
              <A4DocumentPreview
                renderedHtml={samplePreview.html}
                pageSettings={template.pageSettings}
              />
            ) : (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => syncEditorHtml(true)}
                className="a4-paper om-editor-canvas border border-slate-400 shadow-lg"
                style={{
                  padding: `${template.pageSettings.margins.top}mm ${template.pageSettings.margins.right}mm ${template.pageSettings.margins.bottom}mm ${template.pageSettings.margins.left}mm`,
                  fontFamily: `"${template.pageSettings.fontFamily}", "SutonnyMJ", "Noto Sans Bengali", sans-serif`,
                  fontSize: `${template.pageSettings.fontSize}pt`,
                  lineHeight: String(template.pageSettings.lineHeight),
                }}
              />
            )}
          </div>
        </div>

        {/* Right: Fields & Page Settings Panel */}
        <div className="xl:col-span-4 bg-[#0C1526] border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-800">
            <button
              type="button"
              onClick={() => setRightTab('fields')}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                rightTab === 'fields'
                  ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fields ({template.fields.length})
            </button>
            <button
              type="button"
              onClick={() => setRightTab('page')}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                rightTab === 'page'
                  ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-50/5'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Page Settings
            </button>
          </div>

          {rightTab === 'fields' ? (
            <div className="p-4 space-y-3 max-h-[720px] overflow-y-auto">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={syncMissingFieldsFromBody}
                  className="text-xs font-medium text-emerald-400 hover:underline"
                >
                  Scan body for {'{{placeholders}}'}
                </button>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-md hover:bg-emerald-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {template.fields.map((field, index) => {
                  const isEditing = editingFieldId === field.id;
                  return (
                    <div
                      key={field.id}
                      className="border border-slate-800 rounded-lg p-3 bg-[#111C31]/80"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingFieldId(isEditing ? null : field.id)
                          }
                          className="text-left min-w-0 flex-1"
                        >
                          <div className="text-xs font-semibold text-white truncate">
                            {field.label}
                          </div>
                          <div className="text-[11px] text-emerald-400/80 font-mono truncate">
                            {`{{${field.key}}}`} · {field.type}
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => insertPlaceholderAtCursor(field.key)}
                            title="Insert placeholder at cursor"
                            className="px-2 py-1 text-[11px] font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded hover:bg-emerald-500/25"
                          >
                            Insert
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(index, -1)}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(index, 1)}
                            disabled={index === template.fields.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteField(field.id)}
                            className="p-1 text-slate-400 hover:text-red-400"
                            title="Delete field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                Placeholder Key
                              </label>
                              <input
                                type="text"
                                value={field.key}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'),
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                Label
                              </label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) =>
                                  updateField(field.id, { label: e.target.value })
                                }
                                className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                Field Type
                              </label>
                              <select
                                value={field.type}
                                onChange={(e) =>
                                  updateField(field.id, { type: e.target.value as FieldType })
                                }
                                className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white"
                              >
                                {FIELD_TYPES.map((ft) => (
                                  <option key={ft.value} value={ft.value}>
                                    {ft.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                Default Value
                              </label>
                              <input
                                type="text"
                                value={field.defaultValue}
                                onChange={(e) =>
                                  updateField(field.id, { defaultValue: e.target.value })
                                }
                                className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white"
                              />
                            </div>
                          </div>

                          {field.type === 'select' ? (
                            <div>
                              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                Options (comma-separated)
                              </label>
                              <input
                                type="text"
                                value={(field.options ?? []).join(', ')}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    options: e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white"
                              />
                            </div>
                          ) : null}

                          {field.type === 'person' || field.type === 'rank' ? (
                            <div>
                              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                Autofill from Person Property
                              </label>
                              <select
                                value={field.personProperty ?? ''}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    personProperty: (e.target.value || undefined) as
                                      | PersonProperty
                                      | undefined,
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white"
                              >
                                <option value="">None</option>
                                <option value="bd_no">BD / No</option>
                                <option value="rank">Rank</option>
                                <option value="name">Name</option>
                                <option value="unit">Unit / Section</option>
                                <option value="trade">Trade</option>
                              </select>
                            </div>
                          ) : null}

                          {field.type === 'signer' ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                  Signer Role
                                </label>
                                <select
                                  value={field.signerRole ?? 'Document Clerk'}
                                  onChange={(e) =>
                                    updateField(field.id, { signerRole: e.target.value })
                                  }
                                  className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white"
                                >
                                  {signerRoles.map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                  Signer Property
                                </label>
                                <select
                                  value={field.signerProperty ?? 'name'}
                                  onChange={(e) =>
                                    updateField(field.id, {
                                      signerProperty: e.target.value as SignerProperty,
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white"
                                >
                                  <option value="bd_no">BD / No</option>
                                  <option value="rank">Rank</option>
                                  <option value="name">Name</option>
                                  <option value="designation">Designation</option>
                                  <option value="unit">Unit</option>
                                </select>
                              </div>
                            </div>
                          ) : null}

                          {field.type === 'auto' ? (
                            <div className="space-y-2">
                              <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                  Auto Formula
                                </label>
                                <select
                                  value={field.autoConfig?.formula ?? 'add_years'}
                                  onChange={(e) =>
                                    updateField(field.id, {
                                      autoConfig: {
                                        formula: e.target.value as AutoFormulaType,
                                        sourceKey: field.autoConfig?.sourceKey ?? '',
                                        secondaryKey: field.autoConfig?.secondaryKey,
                                        offset: field.autoConfig?.offset ?? 3,
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white"
                                >
                                  <option value="add_years">Add Years to Date</option>
                                  <option value="add_days">Add Days to Date</option>
                                  <option value="days_between">Days Between Two Dates</option>
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                    Source Field Key
                                  </label>
                                  <input
                                    type="text"
                                    value={field.autoConfig?.sourceKey ?? ''}
                                    onChange={(e) =>
                                      updateField(field.id, {
                                        autoConfig: {
                                          formula: field.autoConfig?.formula ?? 'add_years',
                                          sourceKey: e.target.value,
                                          secondaryKey: field.autoConfig?.secondaryKey,
                                          offset: field.autoConfig?.offset ?? 3,
                                        },
                                      })
                                    }
                                    placeholder="e.g. cycle_start"
                                    className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white font-mono"
                                  />
                                </div>
                                {field.autoConfig?.formula === 'days_between' ? (
                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                      End Field Key
                                    </label>
                                    <input
                                      type="text"
                                      value={field.autoConfig?.secondaryKey ?? ''}
                                      onChange={(e) =>
                                        updateField(field.id, {
                                          autoConfig: {
                                            formula: 'days_between',
                                            sourceKey: field.autoConfig?.sourceKey ?? '',
                                            secondaryKey: e.target.value,
                                          },
                                        })
                                      }
                                      placeholder="e.g. leave_to"
                                      className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white font-mono"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                      Offset (+/-)
                                    </label>
                                    <input
                                      type="number"
                                      value={field.autoConfig?.offset ?? 3}
                                      onChange={(e) =>
                                        updateField(field.id, {
                                          autoConfig: {
                                            formula: field.autoConfig?.formula ?? 'add_years',
                                            sourceKey: field.autoConfig?.sourceKey ?? '',
                                            offset: Number(e.target.value),
                                          },
                                        })
                                      }
                                      className="w-full px-2 py-1.5 border border-slate-700 rounded bg-[#0C1526] text-white"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}

                          <label className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                updateField(field.id, { required: e.target.checked })
                              }
                            />
                            <span className="text-slate-300">Required field</span>
                          </label>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={template.description}
                  onChange={(e) =>
                    setTemplate((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 bg-[#111C31] text-white border border-slate-700 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Font Family
                  </label>
                  <select
                    value={template.pageSettings.fontFamily}
                    onChange={(e) =>
                      setTemplate((p) => ({
                        ...p,
                        pageSettings: { ...p.pageSettings, fontFamily: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-[#111C31] text-white border border-slate-700 rounded-lg"
                  >
                    <option value="Arial">Arial (English 12pt)</option>
                    <option value="SutonnyMJ">SutonnyMJ (Bangla 14pt)</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Noto Sans Bengali">Noto Sans Bengali</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Font Size (pt)
                  </label>
                  <input
                    type="number"
                    min={9}
                    max={18}
                    value={template.pageSettings.fontSize}
                    onChange={(e) =>
                      setTemplate((p) => ({
                        ...p,
                        pageSettings: {
                          ...p.pageSettings,
                          fontSize: Number(e.target.value) || 12,
                        },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-[#111C31] text-white border border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Line Spacing
                </label>
                <select
                  value={template.pageSettings.lineHeight}
                  onChange={(e) =>
                    setTemplate((p) => ({
                      ...p,
                      pageSettings: {
                        ...p.pageSettings,
                        lineHeight: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-[#111C31] text-white border border-slate-700 rounded-lg"
                >
                  <option value={1.15}>1.15 (Compact)</option>
                  <option value={1.3}>1.30</option>
                  <option value={1.45}>1.45 (Standard Official)</option>
                  <option value={1.6}>1.60</option>
                  <option value={2.0}>2.00 (Double)</option>
                </select>
              </div>

              <div>
                <div className="font-medium text-slate-300 mb-1.5">A4 Margins (mm)</div>
                <div className="grid grid-cols-4 gap-2">
                  {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                    <div key={side}>
                      <label className="block text-[11px] text-slate-400 capitalize mb-0.5">
                        {side}
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={45}
                        value={template.pageSettings.margins[side]}
                        onChange={(e) =>
                          setTemplate((p) => ({
                            ...p,
                            pageSettings: {
                              ...p.pageSettings,
                              margins: {
                                ...p.pageSettings.margins,
                                [side]: Number(e.target.value) || 20,
                              },
                            },
                          }))
                        }
                        className="w-full px-2 py-1 bg-[#111C31] text-white border border-slate-700 rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Header Text (optional)
                </label>
                <input
                  type="text"
                  value={template.pageSettings.headerText}
                  onChange={(e) =>
                    setTemplate((p) => ({
                      ...p,
                      pageSettings: { ...p.pageSettings, headerText: e.target.value },
                    }))
                  }
                  placeholder="e.g. RESTRICTED"
                  className="w-full px-2.5 py-1.5 bg-[#111C31] text-white border border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Footer Text (optional)
                </label>
                <input
                  type="text"
                  value={template.pageSettings.footerText}
                  onChange={(e) =>
                    setTemplate((p) => ({
                      ...p,
                      pageSettings: { ...p.pageSettings, footerText: e.target.value },
                    }))
                  }
                  placeholder="e.g. 155 UASU BAF"
                  className="w-full px-2.5 py-1.5 bg-[#111C31] text-white border border-slate-700 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
