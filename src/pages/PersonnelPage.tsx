import React, { useMemo, useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AppSettings, Person } from '../types/models';
import {
  exportPersonnelToCsv,
  parseSpreadsheetPasteOrCsv,
} from '../utils/exporters';

interface PersonnelPageProps {
  personnel: Person[];
  settings: AppSettings;
  onSavePerson: (person: Person) => Promise<void>;
  onBulkImport: (people: Person[]) => Promise<void>;
  onDeletePerson: (person: Person) => void;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const PersonnelPage: React.FC<PersonnelPageProps> = ({
  personnel,
  settings,
  onSavePerson,
  onBulkImport,
  onDeletePerson,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Person | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const csvInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return personnel;
    return personnel.filter(
      (p) =>
        p.bd_no.toLowerCase().includes(q) ||
        p.rank.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.unit.toLowerCase().includes(q) ||
        p.trade.toLowerCase().includes(q),
    );
  }, [personnel, search]);

  const openNewPerson = () => {
    const now = new Date().toISOString();
    setEditing({
      id: `person-${Date.now()}`,
      bd_no: '',
      rank: settings.ranks[0] ?? 'LAC',
      name: '',
      unit: settings.defaultUnit,
      trade: '',
      phone: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    });
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.bd_no.trim() || !editing.name.trim()) {
      onNotify('error', 'BD/No and Full Name are required.');
      return;
    }
    await onSavePerson(editing);
    setEditing(null);
    onNotify('success', `Saved ${editing.rank} ${editing.name}.`);
  };

  const parsedPreview = useMemo(() => {
    if (!pasteText.trim()) return [];
    return parseSpreadsheetPasteOrCsv(pasteText);
  }, [pasteText]);

  const handleConfirmImport = async () => {
    if (parsedPreview.length === 0) {
      onNotify('error', 'No valid rows detected.');
      return;
    }
    const now = new Date().toISOString();
    const mapped: Person[] = parsedPreview
      .filter((r) => r.bd_no || r.name)
      .map((r, idx) => ({
        id: `person-${Date.now()}-${idx}`,
        bd_no: r.bd_no ?? '',
        rank: r.rank ?? '',
        name: r.name ?? '',
        unit: r.unit || settings.defaultUnit,
        trade: r.trade ?? '',
        phone: r.phone ?? '',
        notes: r.notes ?? '',
        createdAt: now,
        updatedAt: now,
      }));

    await onBulkImport(mapped);
    setPasteText('');
    setShowImportModal(false);
    onNotify('success', `Imported ${mapped.length} personnel records.`);
  };

  const handleCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    setPasteText(text);
    setShowImportModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Personnel Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Store service members once to autofill particulars across any document template.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleCsvFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => exportPersonnelToCsv(personnel)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#0C1526] border border-slate-700 rounded-lg hover:bg-[#111C31]"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#0C1526] border border-slate-700 rounded-lg hover:bg-[#111C31]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import CSV / Excel</span>
          </button>
          <button
            type="button"
            onClick={openNewPerson}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400"
          >
            <Plus className="w-4 h-4" />
            <span>Add Person</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by BD/No, Rank, Name, Trade, or Unit..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#0C1526] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-400 tabular-nums shrink-0">
          {filtered.length} of {personnel.length} records
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0C1526] border border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-white">No personnel records found</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add a service member or paste an Excel / CSV table to populate the registry.
            </p>
            <button
              type="button"
              onClick={openNewPerson}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400"
            >
              Add First Person
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0A1120] text-xs font-semibold text-slate-400">
                  <th className="py-3 px-4">BD / No</th>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Trade</th>
                  <th className="py-3 px-4">Unit / Section</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#111C31] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-emerald-400 tabular-nums">
                      {p.bd_no}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">{p.rank}</td>
                    <td className="py-3 px-4 text-white">{p.name}</td>
                    <td className="py-3 px-4 text-slate-400">{p.trade || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">{p.unit}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing({ ...p })}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePerson(p)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add/Edit Modal */}
      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleSaveModal}
            className="bg-[#0C1526] border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {personnel.some((p) => p.id === editing.id)
                  ? 'Edit Personnel Record'
                  : 'Add Personnel Record'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  BD / No *
                </label>
                <input
                  type="text"
                  required
                  value={editing.bd_no}
                  onChange={(e) => setEditing({ ...editing, bd_no: e.target.value })}
                  className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Rank *
                </label>
                <select
                  value={editing.rank}
                  onChange={(e) => setEditing({ ...editing, rank: e.target.value })}
                  className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg"
                >
                  {settings.ranks.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-sm">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Unit / Section
                </label>
                <input
                  type="text"
                  value={editing.unit}
                  onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                  className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Trade
                </label>
                <input
                  type="text"
                  value={editing.trade}
                  onChange={(e) => setEditing({ ...editing, trade: e.target.value })}
                  className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={editing.phone ?? ''}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={editing.notes ?? ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-[#111C31] text-white border border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Import CSV / Paste Excel Modal */}
      {showImportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0C1526] border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                Import Personnel from CSV or Excel Paste
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>
                Paste rows directly from Excel / Google Sheets (tab-separated) or CSV with
                columns: <code className="text-emerald-300">BD/No, Rank, Name, Unit, Trade</code>.
              </span>
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-emerald-400 font-medium hover:underline shrink-0 ml-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Load .csv file</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`BD/No\tRank\tName\tUnit\tTrade\n458912\tSgt\tMd. Rafiqul Islam\t155 UASU BAF\tAirframe Fitter`}
              className="w-full px-3 py-2 text-xs font-mono bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {parsedPreview.length > 0 ? (
              <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                Detected <strong>{parsedPreview.length}</strong> row(s) ready to import.
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmImport()}
                disabled={parsedPreview.length === 0}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 disabled:opacity-50"
              >
                Import {parsedPreview.length} Record(s)
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
