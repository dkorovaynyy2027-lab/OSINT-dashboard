'use client';

import React, { useState, useEffect } from 'react';
import { Search, Shield, Globe, Mail, Hash, User, Wallet, Activity, Zap, Info, Loader2, CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const entityTypes = [
  { id: 'IP', label: 'IP Address', icon: Globe, placeholder: '8.8.8.8' },
  { id: 'DOMAIN', label: 'Domain', icon: Zap, placeholder: 'google.com' },
  { id: 'EMAIL', label: 'Email', icon: Mail, placeholder: 'target@example.com' },
  { id: 'HASH', label: 'Hash', icon: Hash, placeholder: 'sha256...' },
  { id: 'USERNAME', label: 'Username', icon: User, placeholder: 'handle_name' },
];

export default function IntelligencePage() {
  const [selectedType, setSelectedType] = useState('IP');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'error'}[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [selectedInvestigation, setSelectedInvestigation] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    
    if (storedToken) {
      fetchInvestigations(storedToken);
    }
  }, []);

  const fetchInvestigations = async (t: string) => {
    try {
      const res = await fetch('http://localhost:4000/investigations', {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvestigations(data);
        if (data.length > 0) setSelectedInvestigation(data[0].id);
      }
    } catch (e) {}
  };

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { msg, type }]);
  };

  const handleSearch = async () => {
    if (!query) return;
    
    setIsLoading(true);
    setResults([]);
    setLogs([{ msg: `Initializing enrichment for ${selectedType}: ${query}`, type: 'info' }]);

    try {
      addLog(`Target workspace: ${investigations.find(i => i.id === selectedInvestigation)?.title || 'Global'}`, 'info');
      const response = await fetch('http://localhost:4000/enrichment/quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          type: selectedType, 
          value: query,
          investigationId: selectedInvestigation 
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to start enrichment');
      }

      const data = await response.json();
      setJobId(data.jobId);
      addLog(`Enrichment job started: ${data.jobId}`, 'success');
      addLog('Queuing providers: Shodan, VirusTotal, GitHub...', 'info');
      
      pollStatus(data.jobId);
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
      setIsLoading(false);
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:4000/enrichment/job/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.state === 'completed') {
          clearInterval(interval);
          setIsLoading(false);
          setResults(data.results || []);
          addLog('Enrichment completed successfully', 'success');
        } else if (data.state === 'failed') {
          clearInterval(interval);
          setIsLoading(false);
          addLog(`Enrichment job failed: ${data.failedReason || 'Unknown error'}`, 'error');
        } else {
          addLog(`Processing... Status: ${data.state} (${data.progress || 0}%)`, 'info');
        }
      } catch (e) {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 2000);
  };

  if (!isClient) return null;

  return (
    <div className="max-w-6xl mx-auto pt-12 animate-fade-up px-6 pb-24">
      {/* Header Area */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel border-white/10 rounded-full mb-6">
          <Shield className="w-4 h-4 text-brand-gray-200" />
          <span className="text-[10px] uppercase tracking-widest text-brand-gray-200 font-mono">Pipeline Status: Operational</span>
        </div>
        <h1 className="title-serif text-6xl mb-4">Entity Intelligence</h1>
        <p className="text-brand-gray-300 max-w-xl mx-auto">
          Deep enrichment across the digital footprint. Enter any entity to start high-fidelity data gathering.
        </p>
      </div>

      {/* Search Console */}
      <div className="glass-panel p-2 mb-12">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-gray-300 opacity-50" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-brand-gray-300">Active Workspace:</span>
              </div>
              <select 
                value={selectedInvestigation || ''} 
                onChange={(e) => setSelectedInvestigation(e.target.value)}
                className="bg-transparent text-[10px] uppercase tracking-widest font-bold text-white focus:outline-none border-b border-white/10 pb-1 cursor-pointer hover:border-white/30 transition-all"
              >
                {investigations.map(inv => (
                  <option key={inv.id} value={inv.id} className="bg-brand-black">{inv.title}</option>
                ))}
                {investigations.length === 0 && <option value="">Global Sandbox</option>}
              </select>
            </div>
            {token && (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] uppercase font-bold tracking-widest text-emerald-400">Node Sync Active</span>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex flex-wrap md:flex-nowrap gap-1 p-1 bg-white/5 rounded-[22px]">
            {entityTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 group",
                  selectedType === type.id 
                    ? "bg-white text-black shadow-lg" 
                    : "text-brand-gray-200 hover:bg-white/5 hover:text-white"
                )}
              >
                <type.icon className={cn("w-3.5 h-3.5", selectedType === type.id ? "text-black" : "text-brand-gray-300 group-hover:text-white")} />
                <span className="text-[10px] uppercase tracking-wider font-bold">{type.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 relative group flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={`Enter ${entityTypes.find(t => t.id === selectedType)?.label}...`}
                className="w-full h-full bg-white/5 border border-white/5 rounded-[22px] px-6 py-4 text-sm font-mono placeholder:text-brand-gray-300 focus:outline-none focus:border-white/20 transition-all"
              />
              <button 
                onClick={handleSearch}
                disabled={isLoading}
                className="absolute right-2 top-2 bottom-2 px-6 bg-white text-black rounded-[18px] flex items-center gap-2 hover:opacity-90 transition-all group active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">{isLoading ? 'Processing' : 'Investigate'}</span>
              </button>
            </div>

            {!token ? (
              <button 
                onClick={async () => {
                  addLog('Authenticating with default credentials...', 'info');
                  try {
                    const res = await fetch('http://localhost:4000/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: 'admin@osint.io', password: 'admin123' })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      localStorage.setItem('token', data.accessToken);
                      setToken(data.accessToken);
                      addLog('System authenticated as Admin', 'success');
                    } else {
                      const err = await res.json().catch(() => ({}));
                      addLog(`Auth failed: ${err.message || res.statusText}`, 'error');
                    }
                  } catch (e: any) {
                    addLog(`Connection error: ${e.message}`, 'error');
                  }
                }}
                className="px-6 glass-panel text-white rounded-[22px] text-[8px] uppercase font-bold tracking-widest hover:bg-white/10 transition-all whitespace-nowrap border-emerald-500/30 text-emerald-400"
              >
                Authenticate System
              </button>
            ) : (
              <div className="px-4 flex items-center gap-2 glass-panel rounded-[22px] border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] uppercase font-bold tracking-widest text-emerald-400">Authorized</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Logs Area */}
        <div className="md:col-span-1">
          <div className="glass-panel p-6 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-brand-gray-200">Terminal Output</h3>
              <div className="flex items-center gap-2">
                {token ? (
                  <span className="text-[8px] uppercase text-emerald-500 font-mono">Session: Active</span>
                ) : (
                  <span className="text-[8px] uppercase text-red-500 font-mono animate-pulse">Session: Missing</span>
                )}
                <Activity className="w-3 h-3 text-brand-gray-300" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px]">
              {logs.map((log, i) => (
                <div key={i} className={cn(
                  "border-l-2 pl-2 py-1",
                  log.type === 'success' ? "border-emerald-500 text-emerald-400" : 
                  log.type === 'error' ? "border-red-500 text-red-400" : "border-white/10 text-brand-gray-300"
                )}>
                  <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  {log.msg}
                </div>
              ))}
              {logs.length === 0 && <div className="text-brand-gray-400 italic">Waiting for query...</div>}
              {isLoading && <div className="animate-pulse text-white">_</div>}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="md:col-span-2">
          <div className="glass-panel p-6 min-h-[400px]">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-brand-gray-200 mb-6">Discovery Findings</h3>
            
            {results.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {results.map((res, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-4">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-brand-gray-300">{res.provider}</span>
                        <span className="text-[9px] font-mono opacity-40 uppercase">{res.status}</span>
                      </div>
                      <div className="space-y-3">
                        {res.findings.length > 0 ? res.findings.map((f: any, fi: number) => (
                          <div key={fi} className="flex flex-col gap-1 p-2 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded font-bold",
                                f.severity === 'CRITICAL' ? "bg-red-500/20 text-red-400" :
                                f.severity === 'HIGH' ? "bg-orange-500/20 text-orange-400" : 
                                f.severity === 'INFO' ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"
                              )}>{f.severity}</span>
                              <span className="text-[10px] font-bold text-white">{f.title}</span>
                            </div>
                            <span className="text-[10px] text-brand-gray-300 leading-relaxed">{f.description}</span>
                          </div>
                        )) : (
                          <div className="text-[10px] text-brand-gray-500 italic">No specific findings reported.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 pt-12">
                <Database className="w-12 h-12 mb-4" />
                <p className="text-xs uppercase tracking-widest">No active findings displayed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
