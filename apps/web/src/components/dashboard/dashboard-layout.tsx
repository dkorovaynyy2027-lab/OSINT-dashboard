"use client";

import React, { useState } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  ShieldAlert, 
  Database, 
  History, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Activity,
  Menu,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: ShieldAlert, label: 'Investigations', href: '/investigations' },
  { icon: Database, label: 'Entity Search', href: '/search' },
  { icon: Activity, label: 'Live Monitor', href: '/monitor' },
  { icon: History, label: 'Audit Log', href: '/audit' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Scanning Line Animation Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] overflow-hidden">
        <div className="w-full h-1 bg-primary animate-scan" />
      </div>

      {/* Sidebar */}
      <aside 
        className={cn(
          "relative flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-primary">
                <ShieldAlert className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold tracking-tight text-lg neon-glow">OSINT.PRO</span>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2 mt-4">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative",
                pathname === item.href 
                  ? "bg-primary/10 text-primary border-l-2 border-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={20} className={cn(
                "min-w-[20px]",
                pathname === item.href && "neon-glow"
              )} />
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              {collapsed && (
                <div className="absolute left-14 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
            <Settings size={20} />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </Link>
          <button className="flex items-center gap-3 px-3 py-2 w-full text-muted-foreground hover:text-destructive transition-colors">
            <LogOut size={20} />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Global Entity Search (Email, IP, Domain...)" 
                className="w-full bg-muted/50 border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full neon-border animate-pulse" />
            </button>
            <div className="h-8 w-[1px] bg-border" />
            <div className="flex items-center gap-3 pl-2">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold">Operator #2027</span>
                <span className="text-[10px] text-primary uppercase font-bold tracking-widest">Administrator</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent border border-primary/50" />
            </div>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
