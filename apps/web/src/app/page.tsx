import React from 'react';
import { 
  Users, 
  ShieldAlert, 
  Zap, 
  TrendingUp, 
  Clock,
  ExternalLink,
  Info
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

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Intelligence Overview</h1>
        <p className="text-muted-foreground">Current system status and active investigation metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Investigations', value: '12', icon: ShieldAlert, color: 'text-primary' },
          { label: 'Total Entities', value: '1,284', icon: Users, color: 'text-accent' },
          { label: 'Enrichment Jobs', value: '48', icon: Zap, color: 'text-yellow-400' },
          { label: 'Threat Findings', value: '156', icon: TrendingUp, color: 'text-destructive' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-6 group hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className={stat.color}>
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live</span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
            <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary/40 group-hover:bg-primary transition-all duration-1000" style={{ width: '65%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Graph Section */}
      <div className="h-[400px] w-full">
        <OsintGraph elements={demoElements} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-panel">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <h2 className="font-semibold">Recent Intelligence Activity</h2>
            </div>
            <button className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ExternalLink size={12} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {[
              { type: 'enrichment', target: '8.8.8.8', actor: 'Operator #2027', time: '2m ago', status: 'completed' },
              { type: 'investigation', target: 'Phishing Campaign Alpha', actor: 'System', time: '15m ago', status: 'created' },
              { type: 'alert', target: 'Suspicious Domain Match', actor: 'Watchlist Engine', time: '45m ago', status: 'triggered' },
              { type: 'entity', target: 'support@bank-verify.com', actor: 'Operator #2027', time: '1h ago', status: 'enriched' },
              { type: 'auth', target: 'User login', actor: 'Operator #2028', time: '3h ago', status: 'success' },
            ].map((act, i) => (
              <div key={i} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <Info size={18} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{act.target}</div>
                    <div className="text-xs text-muted-foreground">Action by {act.actor} • {act.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono">{act.time}</div>
                  <div className={cn(
                    "text-[10px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded border mt-1 inline-block",
                    act.status === 'completed' || act.status === 'success' ? "border-primary/50 text-primary" : "border-muted text-muted-foreground"
                  )}>
                    {act.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health / Quick Actions */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h2 className="font-semibold mb-4">Pipeline Status</h2>
            <div className="space-y-4">
              {[
                { name: 'API Server', status: 'online', latency: '24ms' },
                { name: 'Enrichment Queue', status: 'online', latency: '0 jobs' },
                { name: 'Database Clusters', status: 'online', latency: '3ms' },
                { name: 'Search Engine', status: 'online', latency: '12ms' },
              ].map((sys, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm">{sys.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-muted-foreground">{sys.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 bg-primary/5 border-primary/20">
            <h2 className="font-semibold mb-2">Pro Tip</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use the global search bar to instantly identify entities. The system automatically detects data types and suggests relevant enrichment providers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
