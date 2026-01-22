
import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalState';
import { 
  Menu, X, Home, Users, ClipboardList, BookOpen, 
  Settings, LogOut, MessageCircle, FileText, UserPlus, AlertTriangle
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang, setLang, logout, data } = useGlobal();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const t = {
    ar: {
      dashboard: 'لوحة التحكم',
      profile: 'ملف المدرسة',
      daily: 'التقرير اليومي',
      substitute: 'جدول التغطية',
      students: 'شؤون الطلاب',
      teachers: 'شؤون المعلمين',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      footer: 'إعداد المستشار الإداري والتربوي إبراهيم دخان'
    },
    en: {
      dashboard: 'Dashboard',
      profile: 'School Profile',
      daily: 'Daily Report',
      substitute: 'Coverage Schedule',
      students: 'Student Management',
      teachers: 'Teacher Management',
      settings: 'Settings',
      logout: 'Logout',
      footer: 'Prepared by Admin Consultant Ibrahim Dukhan'
    }
  }[lang];

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: t.dashboard, path: 'dashboard' },
    { icon: <FileText className="w-5 h-5" />, label: t.profile, path: 'profile' },
    { icon: <ClipboardList className="w-5 h-5" />, label: t.daily, path: 'daily' },
    { icon: <UserPlus className="w-5 h-5" />, label: t.substitute, path: 'substitute' },
    { icon: <Users className="w-5 h-5" />, label: t.students, path: 'students' },
    { icon: <BookOpen className="w-5 h-5" />, label: t.teachers, path: 'teachers' },
    { icon: <Settings className="w-5 h-5" />, label: t.settings, path: 'settings' },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${lang === 'ar' ? 'font-arabic' : ''}`}>
      {/* Header */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-md">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          <h1 className="text-xl font-bold text-blue-600"> رفيق المشرف الإداري </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1 border rounded-full text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
          <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'} transition-all bg-white border-e h-[calc(100vh-4rem)] sticky top-16`}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item, idx) => (
              <button 
                key={idx}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-medium"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 bg-slate-50 overflow-auto">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-4 px-6 flex items-center justify-center gap-4">
        <span className="text-slate-600 font-semibold">{t.footer}</span>
        <a 
          href="https://wa.me/967780804012" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-transform hover:scale-110"
        >
          <MessageCircle className="w-5 h-5" />
        </a>
      </footer>
    </div>
  );
};

export default Layout;