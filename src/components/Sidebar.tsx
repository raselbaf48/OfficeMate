import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  CalendarDays,
  Car,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileBadge,
  FileCheck2,
  FileSignature,
  FileText,
  Flame,
  Lock,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from 'lucide-react';
import { NavRoute } from '../types/models';

interface SidebarProps {
  activeRoute: NavRoute;
  activeTemplateId: string | null;
  onSelectDocument: (templateId: string) => void;
  onNavigate: (route: NavRoute) => void;
  unitName: string;
  pinEnabled: boolean;
  onLock: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const LEAVE_SUB_ITEMS = [
  {
    id: 'tpl-jsi-8-80',
    label: 'R/L Allowance Certificate',
    icon: FileCheck2,
  },
  {
    id: 'tpl-baf-10096',
    label: 'Leave Application',
    icon: CalendarCheck,
  },
  {
    id: 'tpl-baf-295',
    label: 'BAF Form-295',
    icon: ClipboardCheck,
  },
];

const LEAVE_SUB_IDS = new Set(LEAVE_SUB_ITEMS.map((item) => item.id));

const RATION_SUB_ITEMS = [
  {
    id: 'tpl-ration-card',
    label: 'Ration Card',
    icon: ClipboardList,
  },
  {
    id: 'tpl-ration-cert',
    label: 'Ration Certificate',
    icon: FileCheck2,
  },
  {
    id: 'tpl-auth-chit',
    label: 'Authorization Chit',
    icon: FileSignature,
  },
  {
    id: 'tpl-ration-fuel',
    label: 'For Fuel',
    icon: Flame,
  },
];

const RATION_SUB_IDS = new Set(RATION_SUB_ITEMS.map((item) => item.id));

export const Sidebar: React.FC<SidebarProps> = ({
  activeRoute,
  activeTemplateId,
  onSelectDocument,
  onNavigate,
  unitName,
  pinEnabled,
  onLock,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const isLeaveChildActive =
    activeRoute === 'generate' && Boolean(activeTemplateId && LEAVE_SUB_IDS.has(activeTemplateId));
  const [leaveOpen, setLeaveOpen] = useState<boolean>(true);

  const isRationChildActive =
    activeRoute === 'generate' && Boolean(activeTemplateId && RATION_SUB_IDS.has(activeTemplateId));
  const [rationOpen, setRationOpen] = useState<boolean>(true);

  useEffect(() => {
    if (isLeaveChildActive) {
      setLeaveOpen(true);
    }
  }, [isLeaveChildActive]);

  useEffect(() => {
    if (isRationChildActive) {
      setRationOpen(true);
    }
  }, [isRationChildActive]);

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
      id: 'tpl-statement-bn',
      label: 'Statement (বিবৃতি)',
      icon: FileText,
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
              <div className="w-9 h-9 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src="/logo.png"
                  alt="OfficeMate"
                  className="w-full h-full object-contain rounded-md"
                />
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

        {/* Expandable Leave Group with 3 Sub-Options */}
        <div className="pt-0.5 space-y-1">
          <button
            type="button"
            onClick={() => {
              if (isCollapsed) {
                onToggleCollapse();
                setLeaveOpen(true);
              } else {
                setLeaveOpen((prev) => !prev);
              }
            }}
            aria-expanded={leaveOpen}
            title="Leave"
            className={`w-full flex items-center rounded-lg text-[13px] font-medium transition-colors ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
            } ${
              isLeaveChildActive
                ? 'bg-emerald-900/70 text-emerald-300 border border-emerald-700/60 font-semibold'
                : 'text-emerald-100/85 hover:bg-emerald-900/45 hover:text-white border border-transparent hover:border-emerald-800/50'
            }`}
          >
            <span className={`flex items-center ${isCollapsed ? '' : 'gap-2.5 min-w-0'}`}>
              <CalendarDays
                className={`w-4 h-4 shrink-0 ${
                  isLeaveChildActive ? 'text-emerald-400' : 'text-emerald-400/75'
                }`}
              />
              {!isCollapsed ? <span className="truncate">Leave</span> : null}
            </span>
            {!isCollapsed ? (
              leaveOpen ? (
                <ChevronDown className="w-4 h-4 shrink-0 text-emerald-300/80" />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0 text-emerald-300/80" />
              )
            ) : null}
          </button>

          {!isCollapsed && leaveOpen ? (
            <div className="ml-3.5 pl-2.5 border-l border-emerald-800/70 space-y-1">
              {LEAVE_SUB_ITEMS.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = activeRoute === 'generate' && activeTemplateId === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelectDoc(sub.id)}
                    title={sub.label}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors ${
                      isSubActive
                        ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                        : 'text-emerald-100/80 hover:bg-emerald-900/45 hover:text-white border border-transparent hover:border-emerald-800/50'
                    }`}
                  >
                    <SubIcon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSubActive ? 'text-slate-950' : 'text-emerald-400/75'
                      }`}
                    />
                    <span className="truncate">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Expandable Ration Group with 4 Sub-Options */}
        <div className="pt-0.5 space-y-1">
          <button
            type="button"
            onClick={() => {
              if (isCollapsed) {
                onToggleCollapse();
                setRationOpen(true);
              } else {
                setRationOpen((prev) => !prev);
              }
            }}
            aria-expanded={rationOpen}
            title="Ration"
            className={`w-full flex items-center rounded-lg text-[13px] font-medium transition-colors ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
            } ${
              isRationChildActive
                ? 'bg-emerald-900/70 text-emerald-300 border border-emerald-700/60 font-semibold'
                : 'text-emerald-100/85 hover:bg-emerald-900/45 hover:text-white border border-transparent hover:border-emerald-800/50'
            }`}
          >
            <span className={`flex items-center ${isCollapsed ? '' : 'gap-2.5 min-w-0'}`}>
              <PackageCheck
                className={`w-4 h-4 shrink-0 ${
                  isRationChildActive ? 'text-emerald-400' : 'text-emerald-400/75'
                }`}
              />
              {!isCollapsed ? <span className="truncate">Ration</span> : null}
            </span>
            {!isCollapsed ? (
              rationOpen ? (
                <ChevronDown className="w-4 h-4 shrink-0 text-emerald-300/80" />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0 text-emerald-300/80" />
              )
            ) : null}
          </button>

          {!isCollapsed && rationOpen ? (
            <div className="ml-3.5 pl-2.5 border-l border-emerald-800/70 space-y-1">
              {RATION_SUB_ITEMS.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = activeRoute === 'generate' && activeTemplateId === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelectDoc(sub.id)}
                    title={sub.label}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors ${
                      isSubActive
                        ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                        : 'text-emerald-100/80 hover:bg-emerald-900/45 hover:text-white border border-transparent hover:border-emerald-800/50'
                    }`}
                  >
                    <SubIcon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSubActive ? 'text-slate-950' : 'text-emerald-400/75'
                      }`}
                    />
                    <span className="truncate">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </nav>

      {/* FIXED BOTTOM: Lock & Settings */}
      <div className="shrink-0 border-t border-emerald-900/60 bg-[#031911]">
        <div className="p-3 space-y-2">
          {pinEnabled ? (
            <button
              type="button"
              onClick={onLock}
              title="Lock OfficeMate"
              className={`w-full flex items-center rounded-lg text-[13px] font-medium text-emerald-200/85 hover:text-white hover:bg-emerald-900/50 border border-emerald-800/40 transition-colors ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0 text-emerald-400" />
              {!isCollapsed ? <span>Lock Workspace</span> : null}
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
