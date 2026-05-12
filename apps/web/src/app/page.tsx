'use client';

import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Users, 
  Globe, 
  Clock, 
  AlertCircle,
  Database,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OsintGraph } from '@/components/dashboard/graph/osint-graph';

const demoElements = [
  { data: { id: '1', label: '8.8.8.8', kind: 'IP' } },
  { data: { id: '2', label: 'google.com', kind: 'DOMAIN' } },
  { data: { id: '3', label: 'dns.google', kind: 'DOMAIN' } },
  { data: { source: '1', target: '2', relation: 'resolves' } },
  { data: { source: '1', target: '3', relation: 'resolves' } },
];

const stats = [
  { label: 'Active Investigations', value: '24', icon: ShieldAlert, change: '+12%', trend: 'up' },
  { label: 'Entities Monitored', value: '1,429', icon: Database, change: '+5.4%', trend: 'up' },
  { label: 'Intelligence Sources', value: '12', icon: Globe, change: 'Stable', trend: 'neutral' },
  { label: 'System Alerts', value: '3', icon: AlertCircle, change: '-2', trend: 'down' },
];

const recentActivity = [
  { entity: '8.8.8.8', action: 'IP Enrichment completed via Shodan/VirusTotal', time: '2m ago' },
  { entity: 'Phishing Campaign Alpha', action: 'New investigation started by System', time: '15m ago' },
  { entity: 'malicious-link.top', action: 'Domain reputation alert triggered', time: '45m ago' },
  { entity: 'support@bank.com', action: 'Email breach check: 12 matches found', time: '1h ago' },
];

const systemHealth = [
  { service: 'Enrichment Engine', load: 32, uptime: '99.9%' },
  { service: 'Database Core', load: 15, uptime: '100%' },
  { service: 'API Gateway', load: 45, uptime: '99.9%' },
];

export default function Home() {
  return (
    <div className="animate-fade-up">
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-4xl title-serif font-medium tracking-tight">Intelligence Overview</h1>
        <p className="text-brand-gray-300">Current system status and active investigation metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel p-6 group hover:border-white/20 transition-all duration-500">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-white/5 text-brand-gray-200 group-hover:text-white transition-colors">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-full border",
                stat.trend === 'up' ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" : "text-brand-gray-300 border-white/10"
              )}>
                {stat.change}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-medium tracking-tight">{stat.value}</h3>
              <p className="text-[10px] uppercase tracking-widest text-brand-gray-300 font-mono">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Graph Section */}
      <div className="h-[500px] w-full mb-12">
        <OsintGraph elements={demoElements} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 pb-12">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-white rounded-full" />
              <h2 className="title-serif text-2xl">Recent Intelligence</h2>
            </div>
            <button className="text-[10px] uppercase tracking-widest text-brand-gray-300 hover:text-white transition-colors">
              View All Archive
            </button>
          </div>
          
          <div className="space-y-6">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-6 group">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-brand-gray-300 group-hover:border-white/20 transition-all">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium tracking-wide uppercase">{activity.entity}</span>
                    <span className="text-[10px] text-brand-gray-300 font-mono">{activity.time}</span>
                  </div>
                  <p className="text-xs text-brand-gray-200">{activity.action}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] uppercase tracking-tighter font-bold text-brand-gray-300">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="glass-panel p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1.5 h-6 bg-white rounded-full" />
            <h2 className="title-serif text-2xl">System Core</h2>
          </div>
          
          <div className="space-y-8">
            {systemHealth.map((item) => (
              <div key={item.service} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-brand-gray-200">{item.service}</span>
                  <span className="text-[10px] font-mono text-brand-gray-300">{item.uptime} Uptime</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white/40 rounded-full" 
                    style={{ width: `${item.load}%` }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] uppercase tracking-tighter text-brand-gray-300">Synchronized</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="w-4 h-4 text-brand-gray-200" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Security Level</span>
            </div>
            <p className="text-[24px] title-serif text-white">DEFCON 4</p>
          </div>
        </div>
      </div>
    </div>
  );
}
