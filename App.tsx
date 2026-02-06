
import React, { useState, useEffect, useMemo } from 'react';
import { GlobalProvider, useGlobal } from './context/GlobalState';
import Layout from './components/Layout';
import Dashboard from './app/Dashboard';
import SubstitutionPage from './app/SubstitutionPage';
import { DailyReportsPage, ViolationsPage, StudentsReportsPage } from './app/ReportsPage';
import SpecialReportsPage from './app/SpecialReportsPage';
import ProfilePage from './app/ProfilePage';
import DataManagementModal from './components/DataManagementModal';
import {
  Lock, LayoutDashboard, ClipboardCheck, UserX, UserPlus,
  Users, Sparkles, UserCircle, Database, Settings,
  FileSearch, ArrowUp, ArrowDown, Clock, ShieldAlert,
  Hammer, FileText, Calendar, Star, AlertCircle, ArrowLeftRight
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useGlobal();
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(pass)) setError(true);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4 font-arabic">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-8 border-4 border-blue-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-200 mb-6 transform rotate-3">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight"> رفيق المشرف الإداري </h2>
          <p className="text-blue-500 font-bold mt-2 text-sm">رفيقك في كتابة تقارير الإشراف الإداري</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 mr-2">كلمة المرور</label>
            <input
              type="password"
              className={`w-full p-5 bg-slate-50 border-2 rounded-[1.5rem] focus:ring-4 focus:ring-blue-100 transition-all text-center text-xl font-bold tracking-widest ${error ? 'border-red-500' : 'border-slate-100 focus:border-blue-500'}`}
              value={pass}
              onChange={(e) => { setPass(e.target.value); setError(false); }}
              placeholder="•••"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center font-bold animate-bounce">كلمة المرور غير صحيحة!</p>}
          <button className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black text-xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all transform hover:scale-[1.02] active:scale-95">
            دخول النظام
          </button>
        </form>
        <div className="text-center text-slate-400 text-xs font-bold border-t pt-6">
          بإشراف المستشار إبراهيم دخان
        </div>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { isAuthenticated, lang } = useGlobal();
  const [view, setView] = useState('dashboard');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  const navItems = useMemo(() => [
    { id: 'dashboard', label: lang === 'ar' ? 'الرئيسية' : 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'daily', label: lang === 'ar' ? 'متابعة المعلمين' : 'Teachers Log', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'substitute', label: lang === 'ar' ? 'جدول التغطية' : 'Coverage Log', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'violations', label: lang === 'ar' ? 'التعهدات' : 'Violations', icon: <UserX className="w-4 h-4" /> },
    { id: 'studentReports', label: lang === 'ar' ? 'تقارير الطلاب' : 'Student Reports', icon: <Users className="w-4 h-4" /> },
    { id: 'specialReports', label: lang === 'ar' ? 'تقارير خاصة' : 'Special Reports', icon: <FileSearch className="w-4 h-4" /> },
  ], [lang]);

  const [recentActionIds, setRecentActionIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('recent_nav_ids_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const trackAction = (viewId: string) => {
    if (viewId === 'dashboard') return;

    setRecentActionIds(prev => {
      const filtered = prev.filter(id => id !== viewId);
      const updated = [viewId, ...filtered].slice(0, 12);
      localStorage.setItem('recent_nav_ids_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const recentActions = useMemo(() => {
    return recentActionIds
      .map(id => {
        if (id.includes(':')) {
          const [mainId, subLabel] = id.split(':');
          const mainItem = navItems.find(item => item.id === mainId);
          if (!mainItem) return null;

          let subIcon = <FileText className="w-4 h-4" />;
          if (subLabel.includes('الغياب')) subIcon = <Clock className="w-4 h-4" />;
          if (subLabel.includes('التأخر')) subIcon = <Clock className="w-4 h-4 text-orange-500" />;
          if (subLabel.includes('خروج')) subIcon = <UserPlus className="w-4 h-4" />;
          if (subLabel.includes('المخالفات')) subIcon = <ShieldAlert className="w-4 h-4 text-red-500" />;
          if (subLabel.includes('إتلاف')) subIcon = <Hammer className="w-4 h-4" />;
          if (subLabel.includes('زيارة')) subIcon = <UserPlus className="w-4 h-4 text-indigo-600" />;
          if (subLabel.includes('الخطة')) subIcon = <Calendar className="w-4 h-4 text-blue-500" />;
          if (subLabel.includes('إبداع')) subIcon = <Star className="w-4 h-4 text-yellow-500" />;
          if (subLabel.includes('اختبار')) subIcon = <FileSearch className="w-4 h-4 text-purple-500" />;

          return { id, label: subLabel, icon: subIcon };
        }
        return navItems.find(item => item.id === id);
      })
      .filter((item): item is { id: string; label: string; icon: React.ReactElement } => !!item);
  }, [recentActionIds, navItems]);

  const handleSetView = (v: string) => {
    setView(v);
    trackAction(v);
    setIsSidebarCollapsed(true); // Auto-collapse on selection
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  if (!isAuthenticated) return <LoginPage />;

  const renderView = () => {
    const [mainView, subView] = view.split(':');
    switch (mainView) {
      case 'dashboard': return <Dashboard setView={handleSetView} recentActions={recentActions} />;
      case 'substitute': return <SubstitutionPage />;
      case 'daily': return <DailyReportsPage />;
      case 'violations': return <ViolationsPage />;
      case 'studentReports': return <StudentsReportsPage />;
      // START OF CHANGE
      case 'specialReports': return <SpecialReportsPage initialSubTab={subView} onSubTabOpen={(subId) => trackAction(`specialReports:${subId}`)} onNavigate={handleSetView} />;
      // END OF CHANGE
      case 'profile': return <ProfilePage />;
      default: return <Dashboard setView={handleSetView} recentActions={recentActions} />;
    }
  };

  return (
    <Layout onNavigate={handleSetView} onOpenSettings={() => setIsDataModalOpen(true)}>
      <div className={`fixed top-0 right-0 h-full z-[100] transition-all duration-500 ease-in-out border-l shadow-2xl bg-white/80 backdrop-blur-xl flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="p-6 border-b flex items-center justify-center">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-90"
          >
            {isSidebarCollapsed ? <LayoutDashboard size={24} /> : <ArrowLeftRight size={24} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSetView(item.id)}
              className={`flex items-center gap-4 w-full p-4 rounded-2xl font-black text-sm transition-all group relative ${view.startsWith(item.id)
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-100'
                : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                }`}
            >
              <div className={`flex-shrink-0 transition-transform ${view.startsWith(item.id) ? 'scale-110' : 'group-hover:scale-110'}`}>
                {React.cloneElement(item.icon as React.ReactElement<any>, { size: 22 })}
              </div>
              {!isSidebarCollapsed && (
                <span className="truncate animate-in fade-in slide-in-from-right-2 duration-300">{item.label}</span>
              )}
              {isSidebarCollapsed && view.startsWith(item.id) && (
                <div className="absolute left-0 w-1.5 h-8 bg-blue-600 rounded-r-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={() => setIsDataModalOpen(true)}
            className={`flex items-center gap-4 w-full p-4 rounded-2xl font-black text-sm transition-all bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <Database size={22} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">إدارة البيانات</span>}
          </button>
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out ${isSidebarCollapsed ? 'pr-20 md:pr-24' : 'pr-20 md:pr-80'}`}>
        {/* Restored Header Title - Centered */}
        <div className="pt-8 pb-4 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 drop-shadow-sm">رفيق المشرف الإداري</h1>
          <p className="text-blue-500 font-bold mt-2 opacity-80">رفيقك في كتابة تقارير الإشراف الإداري</p>
        </div>

        <div className="fixed top-20 left-6 z-[60] flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-90"
            title="أعلى الشاشة"
          >
            <ArrowUp size={20} />
          </button>
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all active:scale-90"
            title="أسفل الشاشة"
          >
            <ArrowDown size={20} />
          </button>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
            {renderView()}
          </div>
        </div>


      </div>

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
      />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <GlobalProvider>
      <MainApp />
    </GlobalProvider>
  );
};

export default App;
