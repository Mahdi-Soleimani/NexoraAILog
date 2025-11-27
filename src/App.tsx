import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  ComposedChart, Area, Line, Cell, PieChart, Pie
} from 'recharts';
import { 
  Activity, Database, Search, RefreshCw, 
  CheckCircle2, XCircle, User, 
  Settings, LayoutDashboard, List, 
  Sparkles, Loader2, FileText, BrainCircuit, Zap, PieChart as PieIcon,
  Download, Moon, Sun, WifiOff, Wifi, PauseCircle, Timer, History,
  Users, DollarSign, BarChart3
} from 'lucide-react';

// --- 1. Data Models ---
interface LogUser {
  id: string;
  role: string;
  platform: string;
}

interface LogMetrics {
  tokensUsed: number;
  toolCalled: string;
  executionTime: number;
}

interface LogDetails {
  question: string;
  answer: string;
}

interface LogEntry {
  id: string;
  workflowName: string;
  status: 'success' | 'error';
  message: string;
  timestamp: string;
  user: LogUser;
  metrics: LogMetrics;
  details: LogDetails;
  tags: string[];
}

// --- 2. Mock Data ---
const MOCK_DATA: LogEntry[] = [
  {
    "id": "23c4ce43-0efe-42ce-8e87-7f7672ff153a",
    "workflowName": "Nexora AI",
    "status": "success",
    "message": "ok",
    "timestamp": "2025-11-27T02:28:59.441Z",
    "user": { "id": "796496346", "role": "CEO", "platform": "miniapp" },
    "metrics": { "tokensUsed": 51, "toolCalled": "bot/miniapp", "executionTime": 8352 },
    "details": { "question": "من کیم", "answer": "شما مهدی سلیمانی، مدیرعامل شرکت نکسورا هستید." },
    "tags": []
  },
  {
    "id": "901b21fd-1b4c-46a1-8718-592675e0f84e",
    "workflowName": "Nexora AI",
    "status": "success",
    "message": "ok",
    "timestamp": "2025-11-27T02:28:06.227Z",
    "user": { "id": "796496346", "role": "CEO", "platform": "telegram" },
    "metrics": { "tokensUsed": 47, "toolCalled": "bot/miniapp", "executionTime": 12000 },
    "details": { "question": "سلام چطوری", "answer": "درود بر شما. چه کمکی از من ساخته است؟" },
    "tags": []
  },
  {
    "id": "0fa66ff5-4e4b-40ab-b4ac-230d08078310",
    "workflowName": "Nexora AI",
    "status": "success",
    "message": "ok",
    "timestamp": "2025-11-27T02:26:54.885Z",
    "user": { "id": "796496346", "role": "CEO", "platform": "telegram" },
    "metrics": { "tokensUsed": 40, "toolCalled": "bot/miniapp", "executionTime": 35000 },
    "details": { "question": "sdf", "answer": "درود بر شما. چه کمکی از من ساخته است؟" },
    "tags": []
  }
];

// --- Helper Functions ---
const formatTime = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return "---"; }
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' });
  } catch (e) { return "---"; }
};

// Export to CSV Function
const exportToCSV = (data: LogEntry[]) => {
  const headers = ["ID,Status,Time,User Role,Platform,Question,Answer,Tokens,Latency(ms)"];
  const rows = data.map(log => 
    `"${log.id}","${log.status}","${new Date(log.timestamp).toLocaleString('fa-IR')}","${log.user.role}","${log.user.platform}","${log.details.question.replace(/"/g, '""')}","${log.details.answer.replace(/"/g, '""')}","${log.metrics.tokensUsed}","${log.metrics.executionTime}"`
  );
  
  const csvContent = "\uFEFF" + [headers, ...rows].join("\n"); 
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `nexora_logs_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Gemini API Helper ---
const callGeminiAPI = async (prompt: string, jsonResponse: boolean = false): Promise<any> => {
  const apiKey = "AIzaSyBaICt1MD8be2m_wRsTslkVf1bczmQvWpE"; 
  try {
    const payload: any = { contents: [{ parts: [{ text: prompt }] }] };
    if (jsonResponse) payload.generationConfig = { responseMimeType: "application/json" };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return jsonResponse ? JSON.parse(text) : text || "پاسخی دریافت نشد.";
  } catch (error) {
    console.error("Gemini API Call Failed:", error);
    return jsonResponse ? [] : "خطا در ارتباط با سرویس هوش مصنوعی.";
  }
};

// --- Main Component ---
export default function NexoraProfessionalPanel() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [urlHistory, setUrlHistory] = useState<string[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'performance' | 'users'>('dashboard');
  
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSmartSearch, setIsSmartSearch] = useState(false);
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiReportResult, setAiReportResult] = useState<string | null>(null);
  const [showAiReportModal, setShowAiReportModal] = useState(false);

  const AUTH_TOKEN = "nexoraai2025";
  const COST_PER_TOKEN_TOMAN = 0.5; 

  useEffect(() => {
    const savedUrl = localStorage.getItem('nexora_webhook_url');
    const savedTheme = localStorage.getItem('nexora_theme');
    const savedHistory = localStorage.getItem('nexora_url_history');
    
    if (savedTheme === 'dark') setIsDarkMode(true);
    if (savedHistory) {
      try { setUrlHistory(JSON.parse(savedHistory)); } catch(e) { console.log(e); }
    }

    if (savedUrl) {
      setWebhookUrl(savedUrl);
      fetchLogs(savedUrl);
    } else {
      setLogs(MOCK_DATA);
      setConnectionStatus('idle'); 
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAutoRefresh && webhookUrl) {
      interval = setInterval(() => {
        fetchLogs(webhookUrl, true);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoRefresh, webhookUrl]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
      return;
    }
    if (!isSmartSearch) {
      const lowerQ = searchQuery.toLowerCase();
      const results = logs.filter(log => 
        (log.details?.question || '').toLowerCase().includes(lowerQ) ||
        (log.details?.answer || '').toLowerCase().includes(lowerQ) ||
        (log.user?.role || '').toLowerCase().includes(lowerQ)
      );
      setFilteredLogs(results);
    }
  }, [searchQuery, logs, isSmartSearch]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('nexora_theme', newTheme ? 'dark' : 'light');
  };

  const fetchLogs = async (url: string = webhookUrl, silent: boolean = false) => {
    let targetUrl = url.trim();
    if (!targetUrl) return;
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl; 
    
    if (!silent) setLoading(true);
    if (!silent) setErrorMsg(null); 

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Authorization': AUTH_TOKEN }
      });

      if (!response.ok) throw new Error(`خطای سرور: ${response.status}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setLogs(data);
        localStorage.setItem('nexora_webhook_url', targetUrl);
        setConnectionStatus('connected');
        setErrorMsg(null);
        if (!urlHistory.includes(targetUrl)) {
          const newHistory = [targetUrl, ...urlHistory].slice(0, 3);
          setUrlHistory(newHistory);
          localStorage.setItem('nexora_url_history', JSON.stringify(newHistory));
        }
      } else {
        console.warn("Invalid Data Format", data);
        if (logs.length === 0) setLogs(MOCK_DATA);
        setConnectionStatus('error');
        setErrorMsg("فرمت داده دریافتی صحیح نیست.");
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setConnectionStatus('error');
      setErrorMsg("عدم برقراری ارتباط با وب‌هوک.");
      if (logs.length === 0) setLogs(MOCK_DATA);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSaveConfig = () => { setIsConfigOpen(false); fetchLogs(webhookUrl); };

  const generateDashboardReport = async () => {
    setAiReportLoading(true);
    setShowAiReportModal(true);
    setAiReportResult(null);
    const recentLogs = logs.slice(0, 30).map(l => `- ${l.user.role}: ${l.details.question.substring(0, 30)}...`).join("\n");
    const prompt = `گزارش مدیریتی فارسی خلاصه برای مدیرعامل از وضعیت سوالات کاربران:\n${recentLogs}`;
    const result = await callGeminiAPI(prompt);
    setAiReportResult(result);
    setAiReportLoading(false);
  };

  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSmartSearch(true);
    setSmartSearchLoading(true);
    const searchableData = logs.map(l => ({ id: l.id, text: `${l.details.question} | ${l.details.answer}` }));
    const prompt = `Search intent: "${searchQuery}". Match IDs from: ${JSON.stringify(searchableData)}. Return JSON {matchedIds: []}`;
    try {
      const result = await callGeminiAPI(prompt, true);
      setFilteredLogs(logs.filter(l => (result.matchedIds || []).includes(l.id)));
    } catch (e) { 
        console.log(e);
        setIsSmartSearch(false); 
    } finally { setSmartSearchLoading(false); }
  };

  const clearSearch = () => { setSearchQuery(''); setIsSmartSearch(false); setFilteredLogs(logs); };

  // Stats Logic
  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter(l => l.status === 'success').length;
    const errors = total - success;
    const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : '0';
    const totalTokens = logs.reduce((acc, curr) => acc + (curr.metrics?.tokensUsed || 0), 0);
    const avgTime = total > 0 ? (logs.reduce((acc, curr) => acc + (curr.metrics?.executionTime || 0), 0) / total).toFixed(0) : '0';
    const estimatedCost = totalTokens * COST_PER_TOKEN_TOMAN;
    return { total, success, errors, successRate, totalTokens, avgTime, estimatedCost };
  }, [logs]);

  const topUsersData = useMemo(() => {
    const userMap: Record<string, { role: string, count: number, tokens: number }> = {};
    logs.forEach(log => {
      const key = log.user.id;
      if (!userMap[key]) userMap[key] = { role: log.user.role, count: 0, tokens: 0 };
      userMap[key].count += 1;
      userMap[key].tokens += (log.metrics?.tokensUsed || 0);
    });
    return Object.entries(userMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); 
  }, [logs]);

  const latencyData = useMemo(() => {
    let fast = 0, medium = 0, slow = 0;
    logs.forEach(log => {
      const t = log.metrics?.executionTime || 0;
      if (t <= 10000) fast++;
      else if (t <= 30000) medium++;
      else slow++;
    });
    return [
      { name: 'سریع (زیر ۱۰ ثانیه)', value: fast, color: '#10b981' }, 
      { name: 'متوسط (۱۰ تا ۳۰ ثانیه)', value: medium, color: '#f59e0b' }, 
      { name: 'کند (بالای ۳۰ ثانیه)', value: slow, color: '#ef4444' } 
    ];
  }, [logs]);

  const toolUsageData = useMemo(() => {
    const toolMap: Record<string, number> = {};
    logs.forEach(log => {
      const tool = log.metrics?.toolCalled || 'General';
      toolMap[tool] = (toolMap[tool] || 0) + (log.metrics?.executionTime || 0);
    });
    return Object.entries(toolMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [logs]);

  const costData = useMemo(() => {
    const costMap: Record<string, number> = {};
    logs.forEach(log => {
      const role = log.user.role || 'Unknown';
      costMap[role] = (costMap[role] || 0) + ((log.metrics?.tokensUsed || 0) * COST_PER_TOKEN_TOMAN);
    });
    return Object.entries(costMap).map(([name, value]) => ({ name, value }));
  }, [logs]);

  const timelineData = useMemo(() => [...logs].reverse().slice(-20).map(log => ({
    time: formatTime(log.timestamp),
    executionTime: log.metrics?.executionTime || 0,
    tokens: log.metrics?.tokensUsed || 0,
    status: log.status
  })), [logs]);

  const platformData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => { const p = log.user?.platform || 'نامشخص'; counts[p] = (counts[p] || 0) + 1; });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [logs]);

  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-gray-100',
    text: isDarkMode ? 'text-slate-100' : 'text-gray-800',
    subText: isDarkMode ? 'text-slate-400' : 'text-gray-500',
    header: isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-gray-200',
    card: isDarkMode ? 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white/60 border-white/50 hover:bg-white/80',
    tableHeader: isDarkMode ? 'bg-slate-800/50 text-slate-300' : 'bg-gray-50/50 text-gray-500',
    tableRowHover: isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-white/50',
    glass: 'backdrop-blur-xl',
    chartGrid: isDarkMode ? '#334155' : '#e5e7eb',
    chartText: isDarkMode ? '#94a3b8' : '#6b7280',
    input: isDarkMode ? 'bg-slate-900/80 border-slate-700 text-white placeholder-slate-500' : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-400',
  };

  const bgGradient = isDarkMode 
    ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black' 
    : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-gray-100 to-white';

  const PLATFORM_COLORS: Record<string, string> = {
    'telegram': '#3b82f6',
    'miniapp': '#06b6d4',
    'web': '#8b5cf6',
    'unknown': '#9ca3af'
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${theme.bg} ${theme.text} ${bgGradient}`} dir="rtl">
      
      {/* --- Connection Error Banner --- */}
      {errorMsg && (
        <div className="sticky top-0 z-[100] w-full animate-in slide-in-from-top duration-500">
           <div className={`mx-auto max-w-2xl mt-4 rounded-full p-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0 backdrop-blur-md`}>
              <div className="bg-red-950/80 text-red-200 px-6 py-2 rounded-full flex items-center justify-center gap-3 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                 <WifiOff className="w-4 h-4 animate-pulse" />
                 <span className="text-sm font-medium">{errorMsg}</span>
                 <button onClick={() => fetchLogs(webhookUrl)} className="text-xs bg-red-800/50 hover:bg-red-700 px-2 py-1 rounded transition-colors">تلاش مجدد</button>
              </div>
           </div>
        </div>
      )}

      {/* --- Header --- */}
      <header className={`sticky top-0 z-40 border-b ${theme.header} ${theme.glass} transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                <Database className="w-5 h-5 text-white" />
             </div>
             <div>
                <h1 className="text-lg font-bold tracking-tight">سامانه هوشمند نکسورا</h1>
                <p className={`text-[10px] ${theme.subText}`}>پنل نظارت و پایش عملکرد</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : connectionStatus === 'error'
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
               {connectionStatus === 'connected' ? <Wifi className="w-3 h-3"/> : connectionStatus === 'error' ? <WifiOff className="w-3 h-3"/> : <span className="w-2 h-2 rounded-full bg-gray-400"></span>}
               <span>
                 {connectionStatus === 'connected' ? 'اتصال برقرار است' : connectionStatus === 'error' ? 'خطا در اتصال' : 'آماده به کار'}
               </span>
            </div>

            <button 
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isAutoRefresh 
                  ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' 
                  : `bg-transparent border-transparent ${theme.subText} hover:bg-gray-100/10`
              }`}
              title={isAutoRefresh ? "توقف بروزرسانی خودکار" : "شروع بروزرسانی خودکار (هر ۵ ثانیه)"}
            >
              {isAutoRefresh ? <PauseCircle className="w-4 h-4"/> : <Timer className="w-4 h-4"/>}
              <span className="hidden sm:inline">{isAutoRefresh ? "خودکار" : "خامو‌ش"}</span>
            </button>

            <div className={`h-6 w-px mx-1 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`}></div>

            <button onClick={toggleTheme} className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-gray-100 text-slate-600'}`}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button onClick={generateDashboardReport} className="hidden md:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 hover:from-indigo-500/20 hover:to-blue-500/20 text-indigo-500 border border-indigo-500/20 rounded-lg text-sm font-medium transition-all">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">گزارش تحلیلی</span>
            </button>

            <button 
              onClick={() => fetchLogs(webhookUrl)} 
              disabled={loading} 
              className={`p-2 rounded-lg transition-all duration-300 ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} ${loading ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100' : ''}`}
              title="بروزرسانی دستی"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button onClick={() => setIsConfigOpen(true)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* --- KPI Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="کل درخواست‌ها" value={stats.total} icon={<Activity className="text-blue-500"/>} trend="+5%" theme={theme} color="blue" />
          <KpiCard title="نرخ موفقیت" value={`%${stats.successRate}`} icon={<CheckCircle2 className="text-emerald-500"/>} theme={theme} color="emerald" />
          <KpiCard title="میانگین زمان پاسخ" value={`${stats.avgTime} ms`} icon={<Zap className="text-amber-500"/>} theme={theme} color="amber" />
          {/* Cost KPI - Updated */}
          <KpiCard title="هزینه تقریبی (تومان)" value={stats.estimatedCost.toLocaleString()} icon={<DollarSign className="text-purple-500"/>} theme={theme} color="purple" />
        </div>

        {/* --- Tabs (Updated with new sections) --- */}
        <div className={`border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
          <nav className="-mb-px flex space-x-8 space-x-reverse overflow-x-auto" aria-label="Tabs">
            <TabItem id="dashboard" label="داشبورد مدیریتی" icon={<LayoutDashboard className="w-4 h-4"/>} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />
            <TabItem id="performance" label="عملکرد فنی" icon={<BarChart3 className="w-4 h-4"/>} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />
            <TabItem id="users" label="تحلیل کاربران" icon={<Users className="w-4 h-4"/>} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />
            <TabItem id="logs" label="لیست تراکنش‌ها" icon={<List className="w-4 h-4"/>} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />
          </nav>
        </div>

        {/* --- Dashboard Content --- */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className={`lg:col-span-2 rounded-2xl shadow-sm border p-6 transition-all duration-300 ${theme.card} ${theme.glass}`}>
              <h3 className={`text-base font-semibold mb-6 flex items-center gap-2 ${theme.text}`}>
                 <Activity className={`w-5 h-5 ${theme.subText}`} /> روند فعالیت سیستم
              </h3>
              <div className="h-72 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chartGrid} />
                    <XAxis dataKey="time" stroke={theme.chartText} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={theme.chartText} fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', border: `1px solid ${isDarkMode ? '#334155' : '#e5e7eb'}`, borderRadius: '12px', color: isDarkMode ? '#fff' : '#000' }} />
                    <Legend />
                    <Area type="monotone" dataKey="executionTime" name="زمان پاسخ (ms)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTime)" strokeWidth={2} />
                    <Line type="monotone" dataKey="tokens" name="توکن مصرفی" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`rounded-2xl shadow-sm border p-6 transition-all duration-300 ${theme.card} ${theme.glass}`}>
               <h3 className={`text-base font-semibold mb-6 flex items-center justify-between ${theme.text}`}>
                  <div className="flex items-center gap-2">
                    <PieIcon className={`w-5 h-5 ${theme.subText}`} /> توزیع پلتفرم کاربران
                  </div>
               </h3>
               <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData} layout="vertical" barSize={30} margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.chartGrid} />
                       <XAxis type="number" hide />
                       <YAxis type="category" dataKey="name" hide />
                       <RechartsTooltip cursor={{fill: isDarkMode ? '#334155' : '#f3f4f6'}} contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', border: `1px solid ${isDarkMode ? '#334155' : '#e5e7eb'}`, borderRadius: '12px' }} />
                       <Legend verticalAlign="top" height={36} content={() => (
                            <div className="flex justify-center gap-4 text-xs mb-4 flex-wrap">
                              {platformData.map((entry, index) => (
                                <div key={`legend-${index}`} className="flex items-center gap-1">
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[entry.name.toLowerCase()] || PLATFORM_COLORS.unknown }}></span>
                                  <span className={theme.subText}>{entry.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                       />
                       <Bar dataKey="value" name="تعداد" radius={[4, 4, 4, 4]}>
                          {platformData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[entry.name.toLowerCase()] || PLATFORM_COLORS.unknown} />
                          ))}
                       </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        )}

        {/* --- Performance Tab (New Feature: Deep Dive) --- */}
        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
             {/* Latency Heatmap */}
             <div className={`rounded-2xl shadow-sm border p-6 ${theme.card} ${theme.glass}`}>
               <h3 className={`text-base font-semibold mb-6 flex items-center gap-2 ${theme.text}`}>
                  <Timer className={`w-5 h-5 ${theme.subText}`} /> توزیع تاخیر (Latency Heatmap)
               </h3>
               <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie data={latencyData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                           {latencyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: '12px' }}/>
                        <Legend />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
             </div>

             {/* Tool Usage */}
             <div className={`rounded-2xl shadow-sm border p-6 ${theme.card} ${theme.glass}`}>
               <h3 className={`text-base font-semibold mb-6 flex items-center gap-2 ${theme.text}`}>
                  <BrainCircuit className={`w-5 h-5 ${theme.subText}`} /> سنگین‌ترین ابزارها (زمان پردازش)
               </h3>
               <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={toolUsageData} layout="vertical" margin={{left: 20}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.chartGrid} />
                        <XAxis type="number" stroke={theme.chartText} fontSize={10}/>
                        <YAxis type="category" dataKey="name" stroke={theme.chartText} width={100} fontSize={11} />
                        <RechartsTooltip cursor={{fill: isDarkMode ? '#334155' : '#f3f4f6'}} contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: '12px' }} />
                        <Bar dataKey="value" name="زمان (ms)" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
             </div>
          </div>
        )}

        {/* --- Users Tab (New Feature: Top Users & Cost) --- */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
             {/* Top Users */}
             <div className={`rounded-2xl shadow-sm border p-6 ${theme.card} ${theme.glass}`}>
               <h3 className={`text-base font-semibold mb-6 flex items-center gap-2 ${theme.text}`}>
                  <Users className={`w-5 h-5 ${theme.subText}`} /> کاربران برتر (بیشترین تعامل)
               </h3>
               <div className="space-y-4">
                  {topUsersData.map((user, i) => (
                     <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{i+1}</div>
                           <div>
                              <div className={`text-sm font-medium ${theme.text}`}>{user.role}</div>
                              <div className="text-[10px] text-gray-400">ID: {user.id}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className={`text-sm font-bold ${theme.text}`}>{user.count} <span className="text-xs font-normal text-gray-500">درخواست</span></div>
                           <div className="text-[10px] text-purple-500">{user.tokens} توکن</div>
                        </div>
                     </div>
                  ))}
               </div>
             </div>

             {/* Cost Breakdown */}
             <div className={`rounded-2xl shadow-sm border p-6 ${theme.card} ${theme.glass}`}>
               <h3 className={`text-base font-semibold mb-6 flex items-center gap-2 ${theme.text}`}>
                  <DollarSign className={`w-5 h-5 ${theme.subText}`} /> هزینه به تفکیک نقش (تومان)
               </h3>
               <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={costData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chartGrid} />
                        <XAxis dataKey="name" stroke={theme.chartText} fontSize={12} />
                        <YAxis stroke={theme.chartText} fontSize={12} />
                        <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: '12px' }} />
                        <Bar dataKey="value" name="هزینه" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={40} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
             </div>
          </div>
        )}

        {/* --- Logs Table Content (With Export) --- */}
        {activeTab === 'logs' && (
          <div className={`rounded-2xl shadow-sm border overflow-hidden animate-in fade-in duration-500 transition-all ${theme.card} ${theme.glass}`}>
             <div className={`p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4 ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'}`}>
                <div className="relative w-full sm:w-96">
                   <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Search className={`h-4 w-4 ${theme.subText}`} />
                   </div>
                   <input type="text" className={`block w-full pr-10 pl-3 py-2 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.input} ${isSmartSearch ? (isDarkMode ? 'border-indigo-500/50 ring-1 ring-indigo-500/30' : 'border-indigo-300 ring-1 ring-indigo-100') : ''}`} placeholder={isSmartSearch ? "در حال جستجوی هوشمند..." : "جستجو در متن سوال، پاسخ یا نقش..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()} />
                   {searchQuery && <button onClick={clearSearch} className="absolute inset-y-0 left-0 pl-3 flex items-center"><XCircle className={`h-4 w-4 hover:text-red-500 ${theme.subText}`} /></button>}
                </div>
                <div className="flex gap-2">
                   <button onClick={handleSmartSearch} disabled={smartSearchLoading || !searchQuery} className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
                      {smartSearchLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 ml-2" />} جستجوی معنایی
                   </button>
                   {/* Export Button */}
                   <button onClick={() => exportToCSV(filteredLogs)} className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl transition-colors ${isDarkMode ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                      <Download className="w-4 h-4 ml-2" /> خروجی Excel
                   </button>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-200'}`}>
                   <thead className={theme.tableHeader}>
                      <tr>
                         <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">وضعیت</th>
                         <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">زمان ثبت</th>
                         <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">کاربر</th>
                         <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">خلاصه درخواست</th>
                         <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider">مصرف توکن</th>
                         <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider">عملیات</th>
                      </tr>
                   </thead>
                   <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-200'}`}>
                      {filteredLogs.map((log) => (
                         <tr key={log.id} className={`${theme.tableRowHover} transition-colors`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                               <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${log.status === 'success' ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-green-100 text-green-800 border-green-200') : (isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-100 text-red-800 border-red-200')}`}>{log.status === 'success' ? 'موفق' : 'خطا'}</span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm dir-ltr text-right ${theme.subText}`}>{formatTime(log.timestamp)}<span className="block text-xs opacity-60">{formatDate(log.timestamp)}</span></td>
                            <td className="px-6 py-4 whitespace-nowrap">
                               <div className="flex items-center"><div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}><User className={`h-4 w-4 ${theme.subText}`} /></div><div className="mr-3"><div className={`text-sm font-medium ${theme.text}`}>{log.user.role}</div><div className={`text-xs ${theme.subText}`}>{log.user.platform}</div></div></div>
                            </td>
                            <td className="px-6 py-4"><div className={`text-sm max-w-xs truncate ${theme.text}`}>{log.details.question}</div></td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-mono ${theme.subText}`}>{log.metrics.tokensUsed}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium"><button onClick={() => setSelectedLog(log)} className={`px-3 py-1 rounded-lg transition-colors text-xs ${isDarkMode ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>جزئیات</button></td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                {filteredLogs.length === 0 && <div className={`p-12 text-center ${theme.subText}`}><Database className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>داده‌ای یافت نشد.</p></div>}
             </div>
          </div>
        )}
      </main>

      {/* --- Modals --- */}
      {isConfigOpen && (
        <GlassModal title="پیکربندی اتصال" onClose={() => setIsConfigOpen(false)} isDarkMode={isDarkMode}>
           <div className="space-y-4">
              <div>
                 <label className={`block text-sm font-medium mb-2 ${theme.text}`}>آدرس وب‌هوک (Webhook URL)</label>
                 <input type="text" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." className={`block w-full border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dir-ltr ${theme.input}`} />
              </div>
              
              {urlHistory.length > 0 && (
                <div className="mt-2">
                  <span className={`text-xs ${theme.subText} block mb-2 flex items-center gap-1`}><History className="w-3 h-3"/> آخرین آدرس‌های موفق:</span>
                  <div className="flex flex-col gap-2">
                    {urlHistory.map((url, i) => (
                      <button key={i} onClick={() => setWebhookUrl(url)} className={`text-xs text-left px-3 py-2 rounded-lg truncate transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700'}`}>
                        {url}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleSaveConfig} className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all">ذخیره و تست ارتباط</button>
           </div>
        </GlassModal>
      )}

      {showAiReportModal && (
        <GlassModal title="گزارش تحلیلی سیستم" onClose={() => setShowAiReportModal(false)} isDarkMode={isDarkMode} maxWidth="max-w-2xl">
           <div className="min-h-[200px] flex items-center justify-center">
              {aiReportLoading ? <div className="flex flex-col items-center justify-center space-y-4"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /><p className={`text-sm ${theme.subText}`}>در حال پردازش داده‌ها...</p></div> : <div className={`prose prose-sm max-w-none leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'prose-invert' : ''} ${theme.text}`}>{aiReportResult}</div>}
           </div>
        </GlassModal>
      )}

      {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} isDarkMode={isDarkMode} />}
    </div>
  );
}

// --- Helper Components ---
const GlassModal = ({ title, children, onClose, isDarkMode, maxWidth="max-w-md" }: any) => {
   const glassClass = isDarkMode ? 'bg-slate-900/80 border-slate-700 text-slate-100' : 'bg-white/80 border-gray-200 text-gray-900';
   return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
         <div className={`${glassClass} backdrop-blur-xl border rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden transform transition-all scale-100`}>
             <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700/50' : 'border-gray-100'}`}><h3 className="text-lg font-bold">{title}</h3><button onClick={onClose} className={`hover:opacity-70 transition-opacity`}><XCircle className="w-6 h-6" /></button></div>
             <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
         </div>
      </div>
   );
}

const TabItem = ({ id, label, icon, activeTab, setActiveTab, theme }: any) => (
  <button 
    onClick={() => setActiveTab(id)} 
    className={`${activeTab === id ? 'border-blue-500 text-blue-500' : 'border-transparent ' + theme.subText + ' hover:' + theme.text} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
  >
    {icon} {label}
  </button>
);

const KpiCard = ({ title, value, icon, color, theme }: any) => {
   const colorStyles: any = { blue: 'bg-blue-500/10 text-blue-500', emerald: 'bg-emerald-500/10 text-emerald-500', amber: 'bg-amber-500/10 text-amber-500', purple: 'bg-purple-500/10 text-purple-500' };
   return (
      <div className={`rounded-2xl shadow-sm border p-5 transition-all hover:-translate-y-1 ${theme.card} ${theme.glass}`}>
         <div className="flex items-center"><div className={`flex-shrink-0 rounded-xl p-3 ${colorStyles[color]}`}>{icon}</div><div className="mr-4 w-0 flex-1"><dl><dt className={`text-xs font-medium truncate mb-1 ${theme.subText}`}>{title}</dt><dd><div className={`text-xl font-bold ${theme.text}`}>{value}</div></dd></dl></div></div>
      </div>
   );
};

const DetailModal = ({ log, onClose, isDarkMode }: { log: LogEntry, onClose: () => void, isDarkMode: boolean }) => {
   const [analysis, setAnalysis] = useState<string | null>(null);
   const [analyzing, setAnalyzing] = useState(false);
   const handleAnalyze = async () => { setAnalyzing(true); const prompt = `تحلیل کوتاه فارسی:\nQ: "${log.details.question}"\nA: "${log.details.answer}"`; const result = await callGeminiAPI(prompt); setAnalysis(result); setAnalyzing(false); };
   const bubbleClass = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200';
   const aiBubbleClass = isDarkMode ? 'bg-blue-900/20 border-blue-800/30' : 'bg-blue-50 border-blue-100';
   return (
      <GlassModal title={`جزئیات تراکنش #${log.id.split('-')[1] || log.id}`} onClose={onClose} isDarkMode={isDarkMode} maxWidth="max-w-3xl">
         <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[ { label: "کاربر", value: log.user.role, sub: log.user.platform }, { label: "زمان", value: `${log.metrics.executionTime} ms`, sub: null }, { label: "توکن", value: log.metrics.tokensUsed, sub: null }, { label: "وضعیت", value: log.status, sub: null, isBadge: true } ].map((item, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50'}`}><div className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{item.label}</div>{item.isBadge ? (<span className={`px-2 py-0.5 rounded text-xs font-bold ${item.value === 'success' ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>{item.value === 'success' ? 'موفق' : 'خطا'}</span>) : (<div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.value}</div>)}{item.sub && <div className="text-[10px] opacity-60 mt-1">{item.sub}</div>}</div>
               ))}
            </div>
            <div className="space-y-4"><div><div className={`text-xs font-bold mb-1 opacity-70 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>درخواست کاربر</div><div className={`p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed border ${bubbleClass}`}>{log.details.question}</div></div><div><div className={`text-xs font-bold mb-1 opacity-70 text-blue-500`}>پاسخ سیستم</div><div className={`p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed border ${aiBubbleClass}`}>{log.details.answer || <span className="opacity-50 italic">بدون پاسخ</span>}</div></div></div>
            <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}><div className="flex justify-between items-center mb-3"><h4 className="text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500"/> تحلیل هوشمند</h4>{!analysis && (<button onClick={handleAnalyze} disabled={analyzing} className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-2 ${isDarkMode ? 'bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20' : 'bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100'}`}>{analyzing ? <Loader2 className="w-3 h-3 animate-spin"/> : <BrainCircuit className="w-3 h-3"/>} شروع تحلیل</button>)}</div>{analysis && (<div className={`p-4 rounded-xl text-sm leading-relaxed border animate-in fade-in ${isDarkMode ? 'bg-purple-900/10 border-purple-500/20 text-purple-200' : 'bg-purple-50 border-purple-100 text-purple-900'}`}>{analysis}</div>)}</div>
         </div>
      </GlassModal>
   );
};