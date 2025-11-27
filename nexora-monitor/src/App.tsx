import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Terminal, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Settings,
  RefreshCw,
  Play,
  Sparkles,
  X,
  Zap,
  Layers,
  ShieldAlert,
  User,
  PieChart,
  Download,
  RotateCcw,
  MessageSquare,
  Volume2,
  VolumeX,
  ThermometerSun,
  Lock,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';

// --- CONFIGURATION ZONE ---
const DEFAULT_READ_WEBHOOK = "https://50356-4vb9a.s3.irann8n.com/webhook-test/sfwefewir2348r23rh238r23r93hr92";  
const DEFAULT_WRITE_WEBHOOK = "YOUR_N8N_WRITE_WEBHOOK_URL_HERE"; 

// --- SECURITY NOTE ---
const apiKey = ""; 

// --- Types ---
interface LogEntry {
  id: string;
  workflowName: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: string | number;
  executionTime?: number;
  user?: {
    id: string | number;
    role: string;
    platform?: string;
  };
  metrics?: {
    tokensUsed?: number;
    toolCalled?: string;
    executionTime?: number;
  };
  tags?: string[];
}

interface ApiConfig {
  readUrl: string;
  writeUrl?: string;
  authToken: string;
}

// --- Components ---

const StatusBadge = ({ status, className }: { status: string, className?: string }) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
  };

  const icons = {
    success: <CheckCircle2 size={12} className="mr-1.5" />,
    error: <AlertCircle size={12} className="mr-1.5" />,
    warning: <ShieldAlert size={12} className="mr-1.5" />,
  };

  return (
    <span className={`flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase font-bold border backdrop-blur-sm transition-all ${styles[status as keyof typeof styles] || styles.warning} ${className}`}>
      {icons[status as keyof typeof icons]}
      {status === 'success' ? 'SUCCESS' : status === 'error' ? 'FAILURE' : 'WARNING'}
    </span>
  );
};

const JsonViewer = ({ data }: { data: any }) => {
  if (!data) return <span className="text-slate-500 italic">No Data</span>;
  return (
    <pre className="bg-[#050508] p-3 rounded-lg text-[10px] font-mono text-cyan-300/80 overflow-x-auto border border-white/5 dir-ltr text-left max-h-40 custom-scrollbar">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

// --- Custom Charts ---

const TokenChart = ({ data }: { data: LogEntry[] }) => {
    const chartData = [...data].reverse().slice(-20);
    const maxTokens = Math.max(...chartData.map(d => d.metrics?.tokensUsed || 0), 100);
    
    return (
        <div className="h-24 flex items-end gap-1 w-full pt-4 relative">
             <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                 <div className="w-full h-px bg-white"></div>
                 <div className="w-full h-px bg-white"></div>
                 <div className="w-full h-px bg-white"></div>
             </div>
             
             {chartData.map((d, i) => {
                 const height = ((d.metrics?.tokensUsed || 0) / maxTokens) * 100;
                 return (
                     <div key={i} className="flex-1 flex flex-col items-center group relative">
                         <div 
                            className="w-full bg-cyan-500/20 hover:bg-cyan-400/60 transition-all rounded-t-sm border-t border-cyan-400/50" 
                            style={{ height: `${height}%` }}
                         ></div>
                         <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-black/90 border border-cyan-500/30 text-cyan-400 text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                             {d.metrics?.tokensUsed} Tokens
                         </div>
                     </div>
                 )
             })}
        </div>
    )
}

const ToolPieChart = ({ data }: { data: LogEntry[] }) => {
    const tools = data.reduce((acc, curr) => {
        const tool = curr.metrics?.toolCalled || 'General Chat';
        acc[tool] = (acc[tool] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const total = Object.values(tools).reduce((a, b) => a + b, 0);
    let cumulativePercent = 0;
    const colors = ['#06b6d4', '#d946ef', '#10b981', '#f59e0b', '#6366f1']; 

    return (
        <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10 shrink-0" style={{
                background: `conic-gradient(${Object.entries(tools).map(([_tool, count], i) => {
                    const percent = (count / total) * 100;
                    const start = cumulativePercent;
                    cumulativePercent += percent;
                    return `${colors[i % colors.length]} ${start}% ${cumulativePercent}%`;
                }).join(', ')})`
            }}>
                <div className="absolute inset-2 bg-[#0d0d12] rounded-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Total</div>
                        <div className="text-sm font-bold text-white">{total}</div>
                    </div>
                </div>
            </div>
            <div className="space-y-1 flex-1">
                {Object.entries(tools).slice(0, 4).map(([tool, count], i) => (
                    <div key={tool} className="flex items-center justify-between text-[10px] hover:bg-white/5 px-1 rounded transition-colors cursor-help" title={`${count} calls`}>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }}></span>
                            <span className="text-slate-300 truncate max-w-[80px]">{tool}</span>
                        </div>
                        <span className="font-mono text-slate-500">{Math.round((count/total)*100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const LatencyHeatmap = ({ data }: { data: LogEntry[] }) => {
    const hourlyStats = useMemo(() => {
        const buckets = Array(24).fill(0).map(() => ({ count: 0, totalTime: 0 }));
        data.forEach(log => {
            if (log.timestamp) {
                const date = new Date(log.timestamp);
                const hour = date.getHours();
                const time = log.metrics?.executionTime || log.executionTime || 0;
                if (hour >= 0 && hour < 24) {
                    buckets[hour].count++;
                    buckets[hour].totalTime += time;
                }
            }
        });
        return buckets.map((bucket, hour) => ({
            hour,
            avg: bucket.count > 0 ? Math.round(bucket.totalTime / bucket.count) : 0,
            count: bucket.count
        }));
    }, [data]);

    const getColor = (avg: number, count: number) => {
        if (count === 0) return 'bg-white/5 border-white/5 text-slate-700';
        if (avg < 500) return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30';
        if (avg < 1500) return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30';
        if (avg < 3000) return 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30';
        return 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30 animate-pulse';
    };

    return (
        <div className="w-full">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                {hourlyStats.map((stat) => (
                    <div key={stat.hour} className={`relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-help group ${getColor(stat.avg, stat.count)}`}>
                        <span className="text-[10px] font-bold opacity-60 mb-0.5">{String(stat.hour).padStart(2, '0')}</span>
                        <span className={`text-xs font-mono font-bold ${stat.count === 0 ? 'opacity-0' : 'opacity-100'}`}>
                            {stat.count > 0 ? `${(stat.avg/1000).toFixed(1)}s` : '-'}
                        </span>
                        {stat.count > 0 && (
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-white/10 p-2 rounded-lg z-20 pointer-events-none w-32 text-center backdrop-blur-md">
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Hour {stat.hour}:00</div>
                                <div className="text-sm font-bold text-white">{stat.avg}ms <span className="text-[10px] text-slate-500 font-normal">avg</span></div>
                                <div className="text-[10px] text-slate-500">{stat.count} requests</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
                <div className="flex gap-4 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500/50"></div> &lt;0.5s</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-500/50"></div> &lt;1.5s</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500/50"></div> &lt;3s</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500/50"></div> &gt;3s</span>
                </div>
                <div className="text-[10px] text-slate-600 font-mono">24H CYCLE</div>
            </div>
        </div>
    );
};

// --- Main Application ---

export default function App() {
  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'users'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // UI State
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [replayUserId, setReplayUserId] = useState<string | number | null>(null);
  const [analyzingLogId, setAnalyzingLogId] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<Record<string, string>>({}); 
  const [showConfig, setShowConfig] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Config
  const [config, setConfig] = useState<ApiConfig>({ 
      readUrl: DEFAULT_READ_WEBHOOK, 
      writeUrl: DEFAULT_WRITE_WEBHOOK, 
      authToken: '' 
  });
  
  // Init
  useEffect(() => {
    const savedConfig = localStorage.getItem('n8n_dashboard_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(prev => ({
          ...prev,
          authToken: parsed.authToken || ''
      }));
      
      if (parsed.authToken) {
          setTimeout(() => fetchLogs({ ...parsed, readUrl: DEFAULT_READ_WEBHOOK }), 100);
      } else {
          setShowConfig(true);
      }
    } else {
        setShowConfig(true);
    }
  }, []);

  // Audio Alert
  useEffect(() => {
      if (!isMuted && logs.length > 0) {
          const latestLog = logs[0];
          const logTime = new Date(latestLog.timestamp).getTime();
          const now = Date.now();
          if (now - logTime < 10000 && latestLog.status === 'error' && latestLog.user?.role === 'CEO') {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
              audio.volume = 0.5;
              audio.play().catch(() => console.warn("Audio blocked"));
          }
      }
  }, [logs, isMuted]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      intervalId = setInterval(() => { if (config.readUrl && !loading) fetchLogs(config, true); }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [autoRefresh, config, loading]);

  // --- API Functions ---

  const fetchLogs = useCallback(async (currentConfig: ApiConfig = config, silent = false) => {
    const targetUrl = currentConfig.readUrl || DEFAULT_READ_WEBHOOK;
    if (!targetUrl || targetUrl.includes("YOUR_N8N")) return;

    if (!silent) setLoading(true);
    
    try {
      const headers: HeadersInit = { 
          'Content-Type': 'application/json',
          'Authorization': currentConfig.authToken
      };

      const response = await fetch(targetUrl, { headers });
      
      if (response.status === 401 || response.status === 403) {
          if (!silent) alert("دسترسی غیرمجاز! لطفاً کد دسترسی (Token) را چک کنید.");
          setShowConfig(true);
          throw new Error("Unauthorized");
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      let data = await response.json();
      
      const logsArray = Array.isArray(data) 
        ? data 
        : (Array.isArray(data.data) ? data.data : (Array.isArray(data.logs) ? data.logs : []));

      const formattedLogs = logsArray.map((log: any, index: number) => ({
        id: String(log.id) || `log-${index}-${Date.now()}`,
        workflowName: log.workflowName || 'Unknown Workflow',
        status: log.status || 'warning',
        message: log.message || '',
        details: log.details || {},
        timestamp: log.timestamp || new Date().toISOString(),
        executionTime: log.metrics?.executionTime || log.executionTime || 0,
        user: log.user || { id: 'anon', role: 'Guest', platform: 'web' },
        metrics: {
            tokensUsed: log.metrics?.tokensUsed || 0,
            toolCalled: log.metrics?.toolCalled || (log.details?.tool ? log.details.tool : 'General'),
            executionTime: log.metrics?.executionTime || log.executionTime
        },
        tags: log.tags || []
      }));

      formattedLogs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(formattedLogs);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem('n8n_dashboard_config', JSON.stringify(config));
    setShowConfig(false);
    fetchLogs(config);
  };

  const handleAddTestLog = async () => {
    if (!config.writeUrl || config.writeUrl.includes("YOUR_N8N")) {
        const isSecurityEvent = Math.random() > 0.8;
        const isCEO = Math.random() > 0.8;
        const randomHour = Math.floor(Math.random() * 24);
        const now = new Date();
        now.setHours(randomHour);
        let execTime = Math.floor(Math.random() * 500);
        if (randomHour >= 12 && randomHour <= 14) execTime += 3000;

        const newLog: LogEntry = {
            id: `mock-${Date.now()}`,
            workflowName: "Nexora_Main_Flow",
            status: isSecurityEvent ? 'warning' : (Math.random() > 0.9 ? 'error' : 'success'),
            message: isSecurityEvent ? "Unauthorized access attempt detected" : "User query processed",
            timestamp: now.toISOString(),
            details: { step: "Identity Check", confidence: 0.98 },
            tags: isSecurityEvent ? ['unauthorized_access'] : [],
            user: {
                id: isCEO ? 796496346 : Math.floor(Math.random() * 10000),
                role: isCEO ? 'CEO' : 'Employee',
                platform: 'Telegram'
            },
            metrics: {
                tokensUsed: Math.floor(Math.random() * 1500),
                toolCalled: isSecurityEvent ? 'Firewall' : ['Google Sheets', 'Gemini Pro'][Math.floor(Math.random()*2)],
                executionTime: execTime
            }
        };
        setLogs(prev => [newLog, ...prev]);
        return;
    }
    
    try {
        const headers: HeadersInit = { 
            'Content-Type': 'application/json',
            'Authorization': config.authToken
        };
        await fetch(config.writeUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message: "Dashboard Connection Test" })
        });
        alert("تست اتصال ارسال شد.");
    } catch (e) {
        alert("خطا در ارسال تست.");
    }
  };

  const exportCSV = () => {
      const headers = ['ID', 'Workflow', 'Status', 'Message', 'User ID', 'Role', 'Tokens', 'Tool', 'Time'];
      const rows = logs.map(l => [
          l.id, l.workflowName, l.status, l.message, l.user?.id, l.user?.role, l.metrics?.tokensUsed, l.metrics?.toolCalled, l.timestamp
      ].join(','));
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `nexora_logs_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleAnalyzeError = async (log: LogEntry) => {
    setAnalyzingLogId(log.id);
    const prompt = `Analyze n8n error (Persian response): Workflow: ${log.workflowName}, Error: ${log.message}, User: ${log.user?.role}`;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const result = await response.json();
      setAiAnalysisResult(prev => ({ ...prev, [log.id]: result.candidates?.[0]?.content?.parts?.[0]?.text || "No response." }));
    } catch (e) { setAiAnalysisResult(prev => ({ ...prev, [log.id]: "Error connecting to AI." })); }
    finally { setAnalyzingLogId(null); }
  };

  const stats = useMemo(() => {
      const sourceData = logs; 
      const totalTokens = sourceData.reduce((acc, curr) => acc + (curr.metrics?.tokensUsed || 0), 0);
      const unauthorized = sourceData.filter(l => l.tags?.includes('unauthorized_access') || (l.status === 'warning' && l.message.includes('Unauthorized'))).length;
      return {
          total: sourceData.length,
          success: sourceData.filter(l => l.status === 'success').length,
          error: sourceData.filter(l => l.status === 'error').length,
          totalTokens: totalTokens.toLocaleString(),
          securityAlerts: unauthorized
      };
  }, [logs]);

  const filteredLogs = useMemo(() => {
      return logs.filter(log => {
          const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                log.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                String(log.user?.id).includes(searchTerm);
          const matchesStatus = filterStatus === 'all' ? true : log.status === filterStatus;
          if (activeTab === 'security') return matchesSearch && (log.tags?.includes('unauthorized_access') || log.status === 'error' || log.status === 'warning');
          return matchesSearch && matchesStatus;
      });
  }, [logs, searchTerm, filterStatus, activeTab]);

  // --- Render ---
  
  const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`relative overflow-hidden bg-[#0d0d12]/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ${className}`}>
        {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020205] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative" dir="rtl">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
      </div>

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020205]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                 <Cpu className="text-white" size={18} />
             </div>
             <div>
                <h1 className="text-lg font-bold text-white tracking-widest font-[Rajdhani]">NEXORA <span className="font-light text-cyan-400">v2.5</span></h1>
             </div>
          </div>
          
          <div className="hidden md:flex items-center bg-white/5 rounded-full p-1 border border-white/5">
              {[
                  { id: 'overview', icon: Layers, label: 'مرکز کنترل' },
                  { id: 'security', icon: ShieldAlert, label: 'امنیت' },
                  { id: 'users', icon: User, label: 'کاربران' }
              ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                      <tab.icon size={14} /> {tab.label}
                  </button>
              ))}
          </div>

          <div className="flex items-center gap-2">
             <button 
                onClick={() => setIsMuted(!isMuted)} 
                className={`p-2 rounded-lg transition-all ${!isMuted ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 hover:text-white'}`}
                title={isMuted ? "Unmute Alerts" : "Mute Alerts"}
             >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
             </button>

             <button onClick={() => setAutoRefresh(!autoRefresh)} className={`p-2 rounded-lg transition-all ${autoRefresh ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-white'}`}>
                {autoRefresh ? <Activity size={18} className="animate-pulse"/> : <Play size={18}/>}
             </button>
             <button onClick={() => fetchLogs()} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
                 <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
             </button>
             <button onClick={() => setShowConfig(!showConfig)} className="p-2 text-slate-400 hover:text-white transition-colors">
                 <Settings size={18} />
             </button>
          </div>
        </div>
        {autoRefresh && <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse"></div>}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-24 relative z-10">

        {/* --- SECURE CONFIG MODAL --- */}
        {showConfig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                    {/* Decorative header line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-fuchsia-600"></div>
                    
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Lock size={20} className="text-cyan-400" /> احراز هویت امن
                        </h3>
                        <button onClick={() => setShowConfig(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-5">
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-[11px] text-amber-200/80 leading-5">
                            <p className="flex gap-2"><ShieldAlert size={14} className="shrink-0 mt-0.5"/> لینک‌های وب‌هوک شما در سیستم محافظت شده‌اند.</p>
                            <p className="mt-1 opacity-70">برای اتصال، لطفاً رمز عبور (Authorization Token) تعریف شده در n8n را وارد کنید.</p>
                        </div>

                        {/* Read-only URL fields just for confirmation */}
                        <div className="space-y-3 opacity-60 pointer-events-none select-none filter grayscale">
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">System Read Hook (GET)</label>
                                <input type="text" value={DEFAULT_READ_WEBHOOK} readOnly className="w-full bg-black/20 border border-white/5 rounded-lg p-2.5 text-xs text-slate-400 font-mono dir-ltr text-left truncate" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">System Write Hook (POST)</label>
                                <input type="text" value={DEFAULT_WRITE_WEBHOOK} readOnly className="w-full bg-black/20 border border-white/5 rounded-lg p-2.5 text-xs text-slate-400 font-mono dir-ltr text-left truncate" />
                            </div>
                        </div>

                        {/* Active Password Field */}
                        <div className="space-y-2">
                            <label className="text-xs text-cyan-400 font-bold block flex items-center gap-2">
                                <Key size={14}/> کد دسترسی (Access Token)
                            </label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={config.authToken} 
                                    onChange={e => setConfig({...config, authToken: e.target.value})} 
                                    placeholder="کلید امنیتی خود را وارد کنید..." 
                                    className="w-full bg-black/40 border border-cyan-500/30 rounded-lg p-3 pl-10 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all dir-ltr text-left font-mono" 
                                />
                                <button 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveConfig} 
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-cyan-900/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Lock size={16} />
                            تایید و اتصال امن
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <GlassCard className="p-4 relative group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><CheckCircle2 size={18}/></div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">موفقیت</span>
                        </div>
                        <div className="text-2xl font-black text-white">{stats.success} <span className="text-sm text-slate-500 font-normal">/ {stats.total}</span></div>
                        <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-[80%] opacity-50"></div>
                    </GlassCard>

                    <GlassCard className="p-4 relative group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-fuchsia-500/10 rounded-lg text-fuchsia-400"><Sparkles size={18}/></div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">مصرف توکن</span>
                        </div>
                        <div className="text-2xl font-black text-white">{stats.totalTokens}</div>
                        <div className="text-[10px] text-fuchsia-300 mt-1 flex items-center gap-1"><Zap size={10}/> Total Output Tokens</div>
                    </GlassCard>

                    <GlassCard className="p-4 relative group col-span-1 md:col-span-2 flex flex-col justify-between">
                         <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <PieChart size={16} className="text-amber-400" />
                                <span className="text-[10px] text-slate-400 uppercase font-bold">آمار ابزارها & روند توکن</span>
                            </div>
                         </div>
                         <div className="flex items-end justify-between gap-4">
                             <div className="w-1/2">
                                <ToolPieChart data={logs} />
                             </div>
                             <div className="w-1/2 border-r border-white/5 pr-4">
                                <div className="text-[10px] text-right text-slate-500 mb-1">روند مصرف (20 اجرای آخر)</div>
                                <TokenChart data={logs} />
                             </div>
                         </div>
                    </GlassCard>
                </div>

                {/* Heatmap Section */}
                <div className="mb-6">
                     <GlassCard className="p-4">
                         <div className="flex items-center gap-2 mb-4">
                             <div className="p-1.5 bg-cyan-500/10 rounded text-cyan-400"><ThermometerSun size={16}/></div>
                             <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">هیت‌مپ تاخیر (Latency Heatmap) - 24 ساعت</h3>
                         </div>
                         <LatencyHeatmap data={logs} />
                     </GlassCard>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="جستجو در ID، پیام یا ابزار..." 
                            className="w-full bg-[#0d0d12] border border-white/10 rounded-lg py-2.5 pr-9 pl-3 text-xs text-white focus:border-cyan-500/50 outline-none"
                        />
                    </div>
                    
                    <div className="flex items-center bg-[#0d0d12] border border-white/10 rounded-lg p-1">
                        {['all', 'success', 'error', 'warning'].map(s => (
                            <button 
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all ${filterStatus === s ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition-colors">
                        <Download size={14} /> <span className="hidden sm:inline">CSV</span>
                    </button>
                    
                    <button onClick={handleAddTestLog} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-xs text-white font-bold transition-transform active:scale-95 shadow-lg shadow-cyan-900/20">
                        <Terminal size={14} /> تست نفوذ
                    </button>
                </div>

                {/* Logs Table */}
                <GlassCard>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-wider">
                                    <th className="p-4 font-medium">وضعیت</th>
                                    <th className="p-4 font-medium">ورک‌فلو</th>
                                    <th className="p-4 font-medium">کاربر / نقش</th>
                                    <th className="p-4 font-medium text-center">ابزار</th>
                                    <th className="p-4 font-medium text-center">توکن</th>
                                    <th className="p-4 font-medium text-left">زمان</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                {filteredLogs.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-slate-600">داده‌ای یافت نشد</td></tr>
                                ) : filteredLogs.map(log => (
                                    <React.Fragment key={log.id}>
                                        <tr 
                                            className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${selectedLog === log.id ? 'bg-white/[0.04]' : ''} ${log.user?.role === 'CEO' && log.status === 'error' ? 'bg-rose-500/5' : ''}`}
                                            onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                                        >
                                            <td className="p-4 whitespace-nowrap"><StatusBadge status={log.status} /></td>
                                            <td className="p-4 font-medium text-white">{log.workflowName}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {log.user?.role === 'CEO' && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse"></div>}
                                                    <span className={log.user?.role === 'CEO' ? 'text-amber-300 font-bold' : 'text-slate-400'}>{log.user?.role || 'Guest'}</span>
                                                    <span className="text-[10px] text-slate-600 bg-white/5 px-1.5 rounded ml-1">{log.user?.id}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {log.metrics?.toolCalled ? (
                                                    <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] border border-white/5">{log.metrics.toolCalled}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-center font-mono text-fuchsia-400/80">{log.metrics?.tokensUsed || 0}</td>
                                            <td className="p-4 text-left dir-ltr font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                            <td className="p-4 text-slate-600">{selectedLog === log.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</td>
                                        </tr>
                                        
                                        {/* Expanded Details */}
                                        {selectedLog === log.id && (
                                            <tr className="bg-[#050508]/50">
                                                <td colSpan={7} className="p-6 border-b border-white/5">
                                                    <div className="flex gap-6">
                                                        <div className="flex-1 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-xs font-bold text-white flex items-center gap-2"><Terminal size={14} className="text-cyan-400"/> جزئیات فنی</h4>
                                                                <div className="flex gap-2">
                                                                    <button onClick={(e) => { e.stopPropagation(); setReplayUserId(log.user?.id || null); }} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] flex items-center gap-1 transition-colors">
                                                                        <MessageSquare size={12}/> مشاهده تاریخچه
                                                                    </button>
                                                                    <button onClick={(e) => { e.stopPropagation(); }} className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded text-[10px] flex items-center gap-1 transition-colors border border-indigo-500/20">
                                                                        <RotateCcw size={12}/> تلاش مجدد
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="p-3 bg-black/40 rounded border border-white/5">
                                                                <div className="mb-2 text-slate-400">{log.message}</div>
                                                                <JsonViewer data={log.details} />
                                                            </div>
                                                        </div>
                                                        
                                                        {/* AI Analysis Widget */}
                                                        {(log.status === 'error' || log.status === 'warning') && (
                                                            <div className="w-1/3 bg-rose-900/5 border border-rose-500/20 rounded-lg p-4">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-rose-400 text-xs font-bold flex items-center gap-1"><ShieldAlert size={14}/> تحلیل خطا</span>
                                                                    {!aiAnalysisResult[log.id] && (
                                                                        <button onClick={() => handleAnalyzeError(log)} disabled={analyzingLogId === log.id} className="text-[10px] bg-rose-500/20 px-2 py-1 rounded hover:bg-rose-500/30 text-rose-300 transition-colors">
                                                                            {analyzingLogId === log.id ? '...' : 'تحلیل هوشمند'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] text-slate-300 leading-relaxed min-h-[60px]">
                                                                    {aiAnalysisResult[log.id] || "برای دریافت راهکار رفع خطا، دکمه تحلیل را بزنید."}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        )}

        {/* --- SECURITY & USERS TABS --- */}
        {activeTab === 'security' && (
             <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <GlassCard className="p-6 border-rose-500/30 bg-rose-900/5">
                        <div className="flex items-center gap-3 mb-2 text-rose-400">
                            <ShieldAlert size={24} />
                            <h3 className="font-bold uppercase tracking-wider">هشدارهای بحرانی</h3>
                        </div>
                        <div className="text-3xl font-black text-white">{stats.securityAlerts}</div>
                        <p className="text-xs text-rose-300/60 mt-2">تلاش‌های غیرمجاز یا خطاهای بحرانی</p>
                    </GlassCard>
                </div>
                
                <h3 className="text-slate-400 text-xs font-bold uppercase mb-3 flex items-center gap-2"><Layers size={14}/> لیست رخدادهای امنیتی</h3>
                <GlassCard>
                    <div className="p-4">
                        {filteredLogs.filter(l => l.status === 'warning' || l.status === 'error').length === 0 ? (
                            <div className="text-center py-10 text-emerald-500/50 flex flex-col items-center gap-2">
                                <CheckCircle2 size={32}/>
                                <span>سیستم ایمن است. هیچ تهدیدی شناسایی نشد.</span>
                            </div>
                        ) : (
                            filteredLogs.filter(l => l.status === 'warning' || l.status === 'error').map(log => (
                                <div key={log.id} className="flex items-start gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <div className="mt-1">
                                        {log.tags?.includes('unauthorized_access') ? <ShieldAlert className="text-rose-500" size={20}/> : <AlertCircle className="text-amber-500" size={20}/>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="text-white font-bold text-sm">{log.message}</span>
                                            <span className="text-slate-500 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1 font-mono">
                                            User ID: <span className="text-cyan-400">{log.user?.id}</span> | Role: {log.user?.role} | Platform: {log.user?.platform}
                                        </div>
                                        {log.tags && log.tags.length > 0 && (
                                            <div className="flex gap-2 mt-2">
                                                {log.tags.map(t => <span key={t} className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] rounded border border-rose-500/20">{t}</span>)}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => setReplayUserId(log.user?.id || null)} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded text-slate-300">بررسی کاربر</button>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>
        )}

        {activeTab === 'users' && (
             <div className="animate-in fade-in duration-500">
                <GlassCard className="p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><User size={16}/> کاربران فعال</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.from(new Set(logs.map(l => l.user?.id))).slice(0, 9).map((uid) => {
                            const userLogs = logs.filter(l => l.user?.id === uid);
                            const role = userLogs[0]?.user?.role;
                            const isCEO = role === 'CEO';
                            
                            return (
                                <div key={uid} className={`p-4 rounded-xl border ${isCEO ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/5 border-white/5'} flex items-center gap-4`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCEO ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase font-bold">{role}</div>
                                        <div className="text-sm font-mono text-white">{uid}</div>
                                        <div className="text-[10px] text-slate-500 mt-1">{userLogs.length} درخواست ثبت شده</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </GlassCard>
            </div>
        )}

      </main>

      {/* --- REPLAY MODAL --- */}
      {replayUserId && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-2xl bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#020205]">
                      <h3 className="font-bold text-white flex items-center gap-2"><MessageSquare size={16} className="text-cyan-400"/> تاریخچه مکالمه: {replayUserId}</h3>
                      <button onClick={() => setReplayUserId(null)}><X size={20} className="text-slate-500 hover:text-white"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-100">
                      {logs.filter(l => l.user?.id === replayUserId).reverse().map((log) => (
                          <div key={log.id} className={`flex flex-col max-w-[80%] ${log.status === 'error' ? 'self-center w-full' : (log.metrics?.toolCalled ? 'self-start' : 'self-end')}`}>
                              <div className={`p-3 rounded-xl text-xs border ${
                                  log.status === 'error' 
                                  ? 'bg-rose-900/20 border-rose-500/30 text-rose-200' 
                                  : (log.metrics?.toolCalled ? 'bg-slate-800 border-white/5 text-slate-300' : 'bg-cyan-900/20 border-cyan-500/30 text-cyan-100')
                              }`}>
                                  {log.status === 'error' && <div className="font-bold text-rose-400 mb-1 flex items-center gap-1"><AlertCircle size={10}/> SYSTEM ERROR</div>}
                                  {log.metrics?.toolCalled && <div className="font-bold text-slate-500 mb-1 text-[10px] uppercase">{log.metrics.toolCalled} Action</div>}
                                  {log.message}
                              </div>
                              <span className="text-[10px] text-slate-600 mt-1 px-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #050509; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>
    </div>
  );
}
