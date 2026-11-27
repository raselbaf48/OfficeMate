import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText, Lock, Menu, Plus, Shield } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  ConfirmModal,
  GuideModal,
  PinLockScreen,
  ToastContainer,
  ToastMessage,
} from './components/CommonModals';
import { OfflineIndicator, PWAInstallButton } from './components/PWAComponents';
import { Sidebar } from './components/Sidebar';
import { DEFAULT_SETTINGS } from './data/seedData';
import { BatchGeneratePage } from './pages/BatchGeneratePage';
import { GenerateDocumentPage } from './pages/GenerateDocumentPage';
import { HistoryPage } from './pages/HistoryPage';
import { PersonnelPage } from './pages/PersonnelPage';
import { SettingsPage } from './pages/SettingsPage';
import { TemplateBuilderPage } from './pages/TemplateBuilderPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { UploadTemplatePage } from './pages/UploadTemplatePage';
import { OfficeMateBackupPayload, storage } from './services/storage';
import {
  AppSettings,
  GeneratedDocument,
  NavRoute,
  Person,
  Signer,
  Template,
} from './types/models';
import { triggerFileDownload } from './utils/exporters';
import { SMOOTH_EASE, drawerVariants, pageVariants } from './utils/motionConfig';

const ROUTE_TITLES: Record<NavRoute, string> = {
  generate: 'Generate Official Document',
  templates: 'Templates Library',
  builder: 'Template Builder',
  upload: 'Upload to Template',
  personnel: 'Personnel Registry',
  batch: 'Batch Document Generator',
  history: 'Document History',
  settings: 'System Settings',
};

const ROUTE_BREADCRUMBS: Record<NavRoute, string> = {
  generate: 'GENERATE',
  templates: 'TEMPLATES',
  builder: 'BUILDER',
  upload: 'SMART IMPORT',
  personnel: 'NOMINAL ROLL',
  batch: 'BATCH EXPORT',
  history: 'ARCHIVES',
  settings: 'SETTINGS',
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<NavRoute>('generate');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [personnel, setPersonnel] = useState<Person[]>([]);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [unlocked, setUnlocked] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Active workspace states
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>('tpl-jsi-8-80');
  const [reopenValues, setReopenValues] = useState<Record<string, string> | null>(null);
  const [reopenPersonId, setReopenPersonId] = useState<string | undefined>(undefined);

  // Header Export dropdown state for Generate page
  const exportTriggerRef = useRef<((kind: 'pdf' | 'docx') => void) | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportingKind, setExportingKind] = useState<'pdf' | 'docx' | null>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [exportMenuOpen]);

  // Confirm delete dialog
  const [confirmDelete, setConfirmDelete] = useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const notify = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    [],
  );

  const loadAllData = useCallback(async () => {
    await storage.seedInitialData();
    const [tpls, ppl, sgn, docs, cfg] = await Promise.all([
      storage.getTemplates(),
      storage.getPeople(),
      storage.getSigners(),
      storage.getDocuments(),
      storage.getSettings(),
    ]);
    setTemplates(tpls);
    setPersonnel(ppl);
    setSigners(sgn);
    setDocuments(docs);
    setSettings(cfg);
    if (tpls.length > 0) {
      setSelectedTemplateId((prev) =>
        prev && tpls.some((t) => t.id === prev) ? prev : tpls[0].id,
      );
    }
    setUnlocked(!cfg.pinEnabled);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const themeMode = settings.themeMode ?? 'system';
  const resolvedTheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemIsDark ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'light' ? '#f1f5f9' : '#060B16',
      );
    }
  }, [resolvedTheme]);

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setReopenValues(null);
    setReopenPersonId(undefined);
    setRoute('generate');
  };

  const handleEditTemplate = (templateId: string) => {
    const found = templates.find((t) => t.id === templateId) ?? null;
    setEditingTemplate(found);
    setRoute('builder');
  };

  const handleCreateNewTemplate = () => {
    setEditingTemplate(null);
    setRoute('builder');
  };

  const handleSaveTemplate = async (tpl: Template, nextRoute: NavRoute = 'templates') => {
    await storage.saveTemplate(tpl);
    const updated = await storage.getTemplates();
    setTemplates(updated);
    setSelectedTemplateId(tpl.id);
    setRoute(nextRoute);
    notify('success', `Saved template "${tpl.name}".`);
  };

  const handleDuplicateTemplate = async (tpl: Template) => {
    const now = new Date().toISOString();
    const copy: Template = {
      ...structuredClone(tpl),
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    };
    await storage.saveTemplate(copy);
    setTemplates(await storage.getTemplates());
    notify('success', `Duplicated "${tpl.name}".`);
  };

  const handleDeleteTemplate = (tpl: Template) => {
    setConfirmDelete({
      title: 'Delete Template?',
      description: `Are you sure you want to remove "${tpl.name}"? Existing documents in History will remain intact.`,
      onConfirm: async () => {
        await storage.deleteTemplate(tpl.id);
        setTemplates(await storage.getTemplates());
        setConfirmDelete(null);
        notify('success', `Deleted template "${tpl.name}".`);
      },
    });
  };

  const handleSavePerson = async (person: Person) => {
    await storage.savePerson(person);
    setPersonnel(await storage.getPeople());
  };

  const handleBulkImportPeople = async (people: Person[]) => {
    await storage.bulkSavePeople(people);
    setPersonnel(await storage.getPeople());
  };

  const handleDeletePerson = (person: Person) => {
    setConfirmDelete({
      title: 'Remove Personnel Record?',
      description: `Delete ${person.rank} ${person.name} (${person.bd_no}) from the Personnel Registry?`,
      onConfirm: async () => {
        await storage.deletePerson(person.id);
        setPersonnel(await storage.getPeople());
        setConfirmDelete(null);
        notify('success', `Removed ${person.rank} ${person.name}.`);
      },
    });
  };

  const handleSaveDocumentToHistory = async (doc: GeneratedDocument) => {
    await storage.saveDocument(doc);
    setDocuments(await storage.getDocuments());
  };

  const handleSaveBatchToHistory = async (docs: GeneratedDocument[]) => {
    for (const doc of docs) {
      await storage.saveDocument(doc);
    }
    setDocuments(await storage.getDocuments());
  };

  const handleReopenDocument = (doc: GeneratedDocument, duplicate = false) => {
    setSelectedTemplateId(doc.templateId);
    if (duplicate) {
      const cloned = { ...doc.values };
      delete cloned.bd_no;
      delete cloned.rank;
      delete cloned.name;
      delete cloned.trade;
      setReopenValues(cloned);
      setReopenPersonId(undefined);
      notify('info', 'Duplicated document values. Pick a new person to autofill.');
    } else {
      setReopenValues({ ...doc.values });
      setReopenPersonId(doc.personId);
    }
    setRoute('generate');
  };

  const handleDeleteDocument = (doc: GeneratedDocument) => {
    setConfirmDelete({
      title: 'Delete History Record?',
      description: `Remove generated document for ${doc.personSummary.rank} ${doc.personSummary.name || 'Unnamed'} from History?`,
      onConfirm: async () => {
        await storage.deleteDocument(doc.id);
        setDocuments(await storage.getDocuments());
        setConfirmDelete(null);
        notify('success', 'Document removed from history.');
      },
    });
  };

  const handleSaveSettings = async (next: AppSettings) => {
    await storage.saveSettings(next);
    setSettings(next);
  };

  const handleSaveSigner = async (signer: Signer) => {
    await storage.saveSigner(signer);
    setSigners(await storage.getSigners());
  };

  const handleDeleteSigner = (signer: Signer) => {
    setConfirmDelete({
      title: 'Delete Signer Profile?',
      description: `Remove ${signer.role} (${signer.rank} ${signer.name})?`,
      onConfirm: async () => {
        await storage.deleteSigner(signer.id);
        setSigners(await storage.getSigners());
        setConfirmDelete(null);
        notify('success', 'Signer profile removed.');
      },
    });
  };

  const handleBackupDownload = async () => {
    const payload = await storage.exportBackup();
    setSettings(payload.settings);
    const stamp = new Date().toISOString().slice(0, 10);
    triggerFileDownload(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      `officemate_backup_${stamp}.json`,
    );
    notify('success', 'Backup JSON downloaded.');
  };

  const handleRestoreBackup = async (payload: OfficeMateBackupPayload) => {
    await storage.importBackup(payload);
    await loadAllData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--om-bg)] flex items-center justify-center">
        <div className="text-sm text-emerald-300">Loading OfficeMate workspace...</div>
      </div>
    );
  }

  if (settings.pinEnabled && !unlocked && settings.pinCode) {
    return (
      <PinLockScreen
        expectedPin={settings.pinCode}
        unitName={settings.defaultUnit}
        onUnlock={() => setUnlocked(true)}
      />
    );
  }

  const activeViewKey =
    route === 'generate' ? `generate-${selectedTemplateId ?? 'default'}` : route;

  return (
    <MotionConfig
      reducedMotion={settings.animationPace === 'minimal' ? 'always' : 'user'}
    >
    <div className="min-h-screen flex bg-[var(--om-bg)] text-slate-100 transition-colors duration-300">
      <Sidebar
        activeRoute={route}
        activeTemplateId={selectedTemplateId}
        resolvedTheme={resolvedTheme}
        onSelectDocument={(templateId) => {
          setSelectedTemplateId(templateId);
          setReopenValues(null);
          setReopenPersonId(undefined);
          setRoute('generate');
        }}
        onNavigate={(r) => {
          setRoute(r);
        }}
        unitName={settings.defaultUnit}
        pinEnabled={settings.pinEnabled}
        onLock={() => setUnlocked(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Context Header */}
        <header className="no-print sticky top-0 z-20 bg-[#08101E]/95 backdrop-blur border-b border-slate-800/80 px-3 sm:px-5 py-1.5 sm:py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-300 hover:bg-slate-800 rounded-md shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeViewKey}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28, ease: SMOOTH_EASE }}
                  className="min-w-0"
                >
                  <div className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase truncate">
                    {ROUTE_BREADCRUMBS[route]} · {settings.defaultUnit}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white truncate">
                    {route === 'generate'
                      ? (templates.find((t) => t.id === selectedTemplateId) ?? templates[0])?.name ??
                        ROUTE_TITLES[route]
                      : ROUTE_TITLES[route]}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton />

            {settings.pinEnabled ? (
              <button
                type="button"
                onClick={() => setUnlocked(false)}
                title="Lock Workspace"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock</span>
              </button>
            ) : null}

            {route === 'generate' ? (
              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  disabled={exportingKind !== null}
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  aria-expanded={exportMenuOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 disabled:opacity-60 transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {exportingKind === 'pdf'
                      ? 'Exporting PDF...'
                      : exportingKind === 'docx'
                        ? 'Exporting DOCX...'
                        : 'Export'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <AnimatePresence>
                  {exportMenuOpen ? (
                    <motion.div
                      role="menu"
                      variants={drawerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0C1526] border border-slate-700 shadow-2xl py-1.5 z-50 origin-top-right"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setExportMenuOpen(false);
                          exportTriggerRef.current?.('pdf');
                        }}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-xs font-medium text-slate-100 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                        <div>
                          <div className="font-semibold">PDF</div>
                          <div className="text-[10px] text-slate-400">Export A4 PDF document</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setExportMenuOpen(false);
                          exportTriggerRef.current?.('docx');
                        }}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-xs font-medium text-slate-100 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-sky-400 shrink-0" />
                        <div>
                          <div className="font-semibold">DOCX</div>
                          <div className="text-[10px] text-slate-400">Export editable Word file</div>
                        </div>
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRoute('generate')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>New Document</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Viewport */}
        <main
          className={`flex-1 min-w-0 max-w-[1440px] w-full mx-auto ${
            route === 'generate' ? 'p-1.5 sm:p-3 lg:p-4' : 'p-4 sm:p-6 lg:p-7'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeViewKey}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
          {route === 'templates' ? (
            <TemplatesPage
              templates={templates}
              settings={settings}
              onUseTemplate={handleUseTemplate}
              onEditTemplate={handleEditTemplate}
              onCreateNew={handleCreateNewTemplate}
              onDuplicateTemplate={(tpl) => void handleDuplicateTemplate(tpl)}
              onDeleteTemplate={handleDeleteTemplate}
              onImportTemplateJson={(tpl) => void handleSaveTemplate(tpl, 'templates')}
              onNotify={notify}
            />
          ) : null}

          {route === 'builder' ? (
            <TemplateBuilderPage
              initialTemplate={editingTemplate}
              settings={settings}
              signers={signers}
              onSaveTemplate={(tpl) => handleSaveTemplate(tpl, 'templates')}
              onCancel={() => setRoute('templates')}
              onNotify={notify}
            />
          ) : null}

          {route === 'upload' ? (
            <UploadTemplatePage
              settings={settings}
              onSaveTemplate={async (tpl, openInBuilder) => {
                await storage.saveTemplate(tpl);
                setTemplates(await storage.getTemplates());
                if (openInBuilder) {
                  setEditingTemplate(tpl);
                  setRoute('builder');
                } else {
                  setRoute('templates');
                }
                notify('success', `Saved imported template "${tpl.name}".`);
              }}
              onNotify={notify}
            />
          ) : null}

          {route === 'generate' ? (
            <GenerateDocumentPage
              templates={templates}
              personnel={personnel}
              signers={signers}
              settings={settings}
              selectedTemplateId={selectedTemplateId}
              initialValues={reopenValues}
              initialPersonId={reopenPersonId}
              onSelectTemplateId={(id) => {
                setSelectedTemplateId(id);
                setReopenValues(null);
                setReopenPersonId(undefined);
              }}
              exportTriggerRef={exportTriggerRef}
              onExportingChange={setExportingKind}
              onSaveToHistory={handleSaveDocumentToHistory}
              onNotify={notify}
            />
          ) : null}

          {route === 'personnel' ? (
            <PersonnelPage
              personnel={personnel}
              settings={settings}
              onSavePerson={handleSavePerson}
              onBulkImport={handleBulkImportPeople}
              onDeletePerson={handleDeletePerson}
              onNotify={notify}
            />
          ) : null}

          {route === 'batch' ? (
            <BatchGeneratePage
              templates={templates}
              personnel={personnel}
              signers={signers}
              settings={settings}
              onSaveBatchToHistory={handleSaveBatchToHistory}
              onNotify={notify}
            />
          ) : null}

          {route === 'history' ? (
            <HistoryPage
              documents={documents}
              templates={templates}
              settings={settings}
              onReopen={handleReopenDocument}
              onDeleteDocument={handleDeleteDocument}
              onNotify={notify}
            />
          ) : null}

          {route === 'settings' ? (
            <SettingsPage
              settings={settings}
              resolvedTheme={resolvedTheme}
              signers={signers}
              onSaveSettings={handleSaveSettings}
              onSaveSigner={handleSaveSigner}
              onDeleteSigner={handleDeleteSigner}
              onBackupDownload={handleBackupDownload}
              onRestoreBackup={handleRestoreBackup}
              onNotify={notify}
            />
          ) : null}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Quiet Footer */}
        <footer className="no-print border-t border-slate-800/80 px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-slate-300">
              {settings.defaultUnit} · OfficeMate Document System
            </span>
          </div>
          <div>Local IndexedDB Storage · Fill. Generate. Export.</div>
        </footer>
      </div>

      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />

      <ConfirmModal
        open={confirmDelete !== null}
        title={confirmDelete?.title ?? ''}
        description={confirmDelete?.description ?? ''}
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) void confirmDelete.onConfirm();
        }}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />

      <OfflineIndicator />
    </div>
    </MotionConfig>
  );
}
