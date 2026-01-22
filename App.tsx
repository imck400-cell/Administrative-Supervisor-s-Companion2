
import React, { useState } from 'react';
import { GlobalProvider, useGlobal } from './context/GlobalState';
import Layout from './components/Layout';
import Dashboard from './app/Dashboard';
import SubstitutionPage from './app/SubstitutionPage';
import { DailyReportsPage, ViolationsPage, StudentsReportsPage } from './app/ReportsPage';
import SpecialReportsPage from './app/SpecialReportsPage';
import DataManagementModal from './components/DataManagementModal';
import { Lock, LayoutDashboard, ClipboardCheck, UserX, UserPlus, Users, Sparkles, UserCircle, Database, Settings, FileSearch } from 'lucide-react';

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

  if (!isAuthenticated) return <LoginPage />;

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard setView={setView} />;
      case 'substitute': return <SubstitutionPage />;
      case 'daily': return <DailyReportsPage />;
      case 'violations': return <ViolationsPage />;
      case 'studentReports': return <StudentsReportsPage />;
      case 'specialReports': return <SpecialReportsPage />;
      default: return <Dashboard setView={setView} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: lang === 'ar' ? 'الرئيسية' : 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'daily', label: lang === 'ar' ? 'متابعة المعلمين' : 'Teachers Log', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'substitute', label: lang === 'ar' ? 'جدول التغطية' : 'Coverage Log', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'violations', label: lang === 'ar' ? 'التعهدات' : 'Violations', icon: <UserX className="w-4 h-4" /> },
    { id: 'studentReports', label: lang === 'ar' ? 'تقارير الطلاب' : 'Student Reports', icon: <Users className="w-4 h-4" /> },
    { id: 'specialReports', label: lang === 'ar' ? 'تقارير خاصة' : 'Special Reports', icon: <FileSearch className="w-4 h-4" /> },
  ];

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800"> رفيق المشرف الإداري </h2>
          <p className="text-blue-500 text-sm font-bold"> رفيقك في كتابة تقارير الإشراف الإداري </p>
        </div>
        
        <button 
          onClick={() => setIsDataModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-[1.2rem] text-slate-600 font-black text-sm hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"
        >
          <Database className="w-5 h-5 text-blue-600" />
          <span>إدارة ونقل البيانات</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
              view === item.id 
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-105' 
              : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {renderView()}
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
