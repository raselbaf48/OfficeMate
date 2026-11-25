import React from 'react';
import {
  CalendarCheck,
  Car,
  ClipboardCheck,
  ClipboardList,
  FileBadge,
  FileCheck2,
  FileText,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import { NavRoute } from '../types/models';

interface SidebarProps {
  activeRoute: NavRoute;
  activeTemplateId: string | null;
  onSelectDocument: (templateId: string) => void;
  onNavigate: (route: NavRoute) => void;
  unitName: string;
  clerkLabel: string;
  pinEnabled: boolean;
  onLock: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeRoute,
  activeTemplateId,
  onSelectDocument,
  onNavigate,
  unitName,
  clerkLabel,
  pinEnabled,
  onLock,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const handleSelect = (route: NavRoute) => {
    onNavigate(route);
    onCloseMobile();
  };

  const handleSelectDoc = (templateId: string) => {
    onSelectDocument(templateId);
    onCloseMobile();
  };

  const docItems = [
    {
      id: 'tpl-jsi-8-80',
      label: 'Recreation Allowance Certificate',
      icon: FileCheck2,
    },
    {
      id: 'tpl-statement-bn',
      label: 'Statement (বিবৃতি)',
      icon: FileText,
    },
    {
      id: 'tpl-baf-295',
      label: 'BAF Form 295 (Leave / Pass)',
      icon: ClipboardCheck,
    },
    {
      id: 'tpl-baf-10096',
      label: 'Leave Application (10096)',
      icon: CalendarCheck,
    },
    {
      id: 'tpl-td-cert-bn',
      label: 'TD Certificate (প্রত্যয়ন পত্র)',
      icon: FileBadge,
    },
    {
      id: 'tpl-vehicle-pass-bn',
      label: 'Vehicle Pass (গাড়ীর পাশ)',
      icon: Car,
    },
    {
      id: 'tpl-ration-card',
      label: 'Ration Card Form',
      icon: ClipboardList,
    },
  ];

  const renderContent = (isCollapsed: boolean) => (
    <div
      className={`flex flex-col h-full bg-gradient-to-b from-[#06291b] via-[#042317] to-[#031b12] border-r border-emerald-900/60 text-emerald-50 select-none transition-[width] duration-200 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* FIXED TOP: OfficeMate Brand Header + Collapse Toggle */}
      <div
        className={`shrink-0 py-4 border-b border-emerald-900/60 flex items-center ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4 gap-2'
        }`}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand Sidebar (OfficeMate)"
            className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/25 transition-colors"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold tracking-tight text-white truncate">
                  OfficeMate
                </div>
                <div className="text-[10px] font-medium tracking-wider text-emerald-300/75 uppercase truncate">
                  {unitName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
              className="hidden lg:inline-flex p-1.5 text-emerald-300/80 hover:text-white hover:bg-emerald-900/50 rounded-md shrink-0 transition-colors"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-emerald-200/70 hover:text-white rounded-md"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* SCROLLABLE MIDDLE: Document Options */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1.5">
        {!isCollapsed ? (
          <div className="px-2 mb-2 text-[10px] font-semibold tracking-widest text-emerald-300/60 uppercase">
            DOCUMENTS
          </div>
        ) : null}

        {docItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === 'generate' && activeTemplateId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectDoc(item.id)}
              title={item.label}
              className={`w-full flex items-center rounded-lg text-[13px] font-medium transition-colors ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-emerald-100/80 hover:bg-emerald-900/45 hover:text-white border border-transparent hover:border-emerald-800/50'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-slate-950' : 'text-emerald-400/75'
                }`}
              />
              {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
            </button>
          );
        })}
      </nav>

      {/* FIXED BOTTOM: Clerk Info & Settings */}
      <div className="shrink-0 border-t border-emerald-900/60 bg-[#031911]">
        <div className="p-3 space-y-2">
          {!isCollapsed ? (
            <div className="px-3 py-2 rounded-lg bg-emerald-950/70 border border-emerald-800/50 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-emerald-50 truncate">
                  {clerkLabel}
                </div>
                <div className="text-[11px] text-emerald-400/75 truncate">
                  {unitName} · Clerk
                </div>
              </div>
              {pinEnabled ? (
                <button
                  type="button"
                  onClick={onLock}
                  title="Lock OfficeMate"
                  className="p-1.5 rounded-md text-emerald-300/80 hover:text-white hover:bg-emerald-900/60 shrink-0"
                >
                  <Lock className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          ) : pinEnabled ? (
            <button
              type="button"
              onClick={onLock}
              title="Lock OfficeMate"
              className="w-full flex items-center justify-center p-2.5 rounded-lg text-emerald-300/80 hover:text-white hover:bg-emerald-900/60"
            >
              <Lock className="w-4 h-4" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => handleSelect('settings')}
            title="Settings"
            className={`w-full flex items-center rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'
            } ${
              activeRoute === 'settings'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-emerald-100/85 hover:bg-emerald-900/50 hover:text-white border border-emerald-800/40'
            }`}
          >
            <Settings
              className={`w-4 h-4 shrink-0 ${
                activeRoute === 'settings' ? 'text-slate-950' : 'text-emerald-400'
              }`}
            />
            {!isCollapsed ? <span>Settings</span> : null}
          </button>
        </div>

        {!isCollapsed ? (
          <div className="px-4 py-2 border-t border-emerald-900/50 flex items-center justify-between text-[11px] text-emerald-400/65 font-mono">
            <span className="truncate">{unitName}</span>
            <span>OfficeMate</span>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <aside className="no-print hidden lg:block shrink-0 h-screen sticky top-0 z-30">
        {renderContent(collapsed)}
      </aside>

      {mobileOpen ? (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{renderContent(false)}</div>
        </div>
      ) : null}
    </>
  );
};
