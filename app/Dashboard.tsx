
import React, { useState, useMemo, useEffect } from 'react';
import { useGlobal } from '../context/GlobalState';
import { 
  Users, CheckCircle2, AlertCircle, FileText, 
  TrendingUp, Calendar, Clock, Filter, ChevronDown, 
  UserCheck, UserX, BookOpen, Star, AlertTriangle, Search,
  ClipboardCheck, Sparkles, GraduationCap, ShieldAlert, 
  UserCheck as UserPlusIcon, CalendarDays, Activity, Medal, School, User,
  FileSpreadsheet, Share2, ChevronLeft, ChevronRight, Triangle,
  ArrowLeftRight, History, Home, MapPin, Briefcase, HeartPulse, UserPlus, Hammer, MessageSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';

type DataCategory = 'students' | 'teachers' | 'violations' | 'substitutions' | 'special_reports';
type TimeRange = 'daily' | 'weekly' | 'monthly' | 'custom' | 'all';

interface CardConfig {
  id: number;
  category: DataCategory;
  subType: string;
}

// START OF CHANGE - Updated Dashboard Props to include recentActions
interface DashboardProps {
  setView?: (v: string) => void;
  recentActions?: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ setView, recentActions = [] }) => {
  const { lang, data } = useGlobal();

  const today = new Date().toISOString().split('T')[0];
  const [globalTimeRange, setGlobalTimeRange] = useState<TimeRange>('all');
  const [dateRange, setDateRange] = useState({ start: today, end: today });
  
  const [cycleIndex, setCycleIndex] = useState(0);
  const [cycleDuration, setCycleDuration] = useState(5000);
  const [cardOffsets, setCardOffsets] = useState<Record<number, number>>({});

  // Main Categories defined by user request
  const mainCategories = [
    { id: 'students', label: 'تقارير الطلاب', icon: <GraduationCap className="text-blue-500" />, view: 'studentReports' },
    { id: 'teachers', label: 'متابعة المعلمين', icon: <UserCheck className="text-emerald-500" />, view: 'daily' },
    { id: 'violations', label: 'التعهدات والمخالفات', icon: <ShieldAlert className="text-red-500" />, view: 'violations' },
    { id: 'special_reports', label: 'التقارير الخاصة', icon: <FileText className="text-orange-500" />, view: 'specialReports' },
    { id: 'substitutions', label: 'جدول التغطية', icon: <UserPlusIcon className="text-purple-500" />, view: 'substitute' },
  ];

  // Logic to fetch subtypes for each main category as requested (Surgical Detail)
  const getSubTypes = (category: DataCategory) => {
    switch (category) {
      case 'students':
        return [
          { id: 'all', label: 'جميع الحقول', icon: <Users size={12} /> },
          { id: 'address', label: 'السكن', icon: <MapPin size={12} /> },
          { id: 'workOutside', label: 'العمل', icon: <Briefcase size={12} /> },
          { id: 'healthStatus', label: 'الحالة الصحية', icon: <HeartPulse size={12} /> },
          { id: 'academicReading', label: 'القراءة', icon: <BookOpen size={12} /> },
          { id: 'academicWriting', label: 'الكتابة', icon: <FileText size={12} /> },
          { id: 'behaviorLevel', label: 'المستوى السلوكي', icon: <Activity size={12} /> },
          { id: 'mainNotes', label: 'الملاحظات السلوكية', icon: <AlertTriangle size={12} /> },
          { id: 'guardianCooperation', label: 'تعاون ولي الأمر', icon: <UserPlus size={12} /> },
          { id: 'notes', label: 'ملاحظات أخرى', icon: <MessageSquare size={12} /> },
        ];
      case 'teachers':
        return [
          { id: 'all', label: 'الكل', icon: <Users size={12} /> },
          { id: 'attendance', label: 'الحضور', icon: <Clock size={12} /> },
          { id: 'preparation', label: 'التحضير', icon: <CheckCircle2 size={12} /> },
          { id: 'supervision', label: 'الإشراف', icon: <UserCheck size={12} /> },
          { id: 'violations', label: 'المخالفات', icon: <AlertCircle size={12} /> },
        ];
      case 'special_reports':
        return [
          { id: 'all', label: 'جميع السجلات', icon: <History size={12} /> },
          { id: 'absences', label: 'غياب الطلاب', icon: <UserX size={12} /> },
          { id: 'lateness', label: 'تأخر الطلاب', icon: <Clock size={12} /> },
          { id: 'exits', label: 'خروج الطلاب', icon: <UserPlusIcon size={12} /> },
          { id: 'damages', label: 'إتلافات المدرسة', icon: <Hammer size={12} /> },
          { id: 'visits', label: 'زيارات أولياء الأمور', icon: <Users size={12} /> },
        ];
      case 'substitutions':
        return [
          { id: 'all', label: 'الكل', icon: <UserPlusIcon size={12} /> },
          { id: 'pending', label: 'قيد التغطية', icon: <Clock size={12} /> },
          { id: 'paid', label: 'تمت التغطية', icon: <CheckCircle2 size={12} /> },
        ];
      default:
        return [{ id: 'all', label: 'الكل', icon: <Users size={12} /> }];
    }
  };

  // Memoized data processing for efficiency
  const processedData = useMemo(() => {
    const results: Record<string, any[]> = {
      students: (data.studentReports || []).map(s => ({ ...s, displayName: s.name, type: 'student' })),
      teachers: (data.dailyReports.flatMap(r => r.teachersData)).map(t => ({ ...t, displayName: t.teacherName, type: 'teacher' })),
      violations: (data.violations || []).map(v => ({ ...v, displayName: v.studentName || v.teacherName, type: 'violation' })),
      substitutions: (data.substitutions || []).map(s => ({ ...s, displayName: s.absentTeacher, type: 'substitution' })),
      special_reports: [
        ...(data.absenceLogs || []).map(l => ({ ...l, displayName: l.studentName, stype: 'absences', icon: <UserX size={12}/> })),
        ...(data.latenessLogs || []).map(l => ({ ...l, displayName: l.studentName, stype: 'lateness', icon: <Clock size={12}/> })),
        ...(data.exitLogs || []).map(l => ({ ...l, displayName: l.studentName, stype: 'exits', icon: <UserPlusIcon size={12}/> })),
        ...(data.damageLogs || []).map(l => ({ ...l, displayName: l.studentName, stype: 'damages', icon: <Hammer size={12}/> })),
        ...(data.parentVisitLogs || []).map(l => ({ ...l, displayName: l.studentName, stype: 'visits', icon: <Users size={12}/> })),
      ]
    };

    // Apply Global Time Filters
    Object.keys(results).forEach(key => {
      if (globalTimeRange !== 'all') {
        const now = new Date();
        results[key] = results[key].filter(item => {
          const itemDate = new Date(item.date || item.createdAt || Date.now());
          if (globalTimeRange === 'daily') return itemDate.toDateString() === now.toDateString();
          if (globalTimeRange === 'weekly') return (now.getTime() - itemDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          if (globalTimeRange === 'monthly') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
          if (globalTimeRange === 'custom') {
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            return itemDate >= start && itemDate <= end;
          }
          return true;
        });
      }
    });

    return results;
  }, [data, globalTimeRange, dateRange]);

  // Initial Card Setup
  const [cards, setCards] = useState<CardConfig[]>(() => {
    const cats: DataCategory[] = ['students', 'teachers', 'violations', 'special_reports', 'substitutions', 'students', 'teachers', 'special_reports'];
    return cats.map((cat, i) => ({ id: i + 1, category: cat, subType: 'all' }));
  });

  useEffect(() => {
    const timer = setInterval(() => setCycleIndex(prev => prev + 1), cycleDuration);
    return () => clearInterval(timer);
  }, [cycleDuration]);

  // Pagination Logic
  useEffect(() => {
    setCardOffsets(prev => {
      const nextOffsets = { ...prev };
      cards.forEach(card => {
        const list = processedData[card.category] || [];
        if (list.length > 3) {
          const current = nextOffsets[card.id] || 0;
          let next = current + 3;
          if (next >= list.length) next = 0;
          nextOffsets[card.id] = next;
        }
      });
      return nextOffsets;
    });
  }, [cycleIndex, processedData]);

  const updateCard = (id: number, updates: Partial<CardConfig>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const shiftCardData = (cardId: number, direction: 'prev' | 'next', max: number) => {
    setCardOffsets(prev => {
      const current = prev[cardId] || 0;
      let next = direction === 'next' ? current + 3 : current - 3;
      if (next < 0) next = Math.max(0, (Math.ceil(max / 3) - 1) * 3);
      if (next >= max) next = 0;
      return { ...prev, [cardId]: next };
    });
  };

  const handleExportExcel = (title: string, list: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(list.map(item => ({ 'الاسم': item.displayName, 'الحالة': item.stype || '---' })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${title}_Report.xlsx`);
  };

  const cardColors = [
    { gradient: 'linear-gradient(135deg, #f0f9ff 50%, #e0f2fe 50%)', text: 'text-sky-700', border: 'border-sky-200', accent: 'bg-sky-600' },
    { gradient: 'linear-gradient(135deg, #f0fdf4 50%, #dcfce7 50%)', text: 'text-emerald-700', border: 'border-emerald-200', accent: 'bg-emerald-600' },
    { gradient: 'linear-gradient(135deg, #faf5ff 50%, #f3e8ff 50%)', text: 'text-purple-700', border: 'border-purple-200', accent: 'bg-purple-600' },
    { gradient: 'linear-gradient(135deg, #fff7ed 50%, #ffedd5 50%)', text: 'text-orange-700', border: 'border-orange-200', accent: 'bg-orange-600' },
    { gradient: 'linear-gradient(135deg, #f5f3ff 50%, #ede9fe 50%)', text: 'text-indigo-700', border: 'border-indigo-200', accent: 'bg-indigo-600' },
    { gradient: 'linear-gradient(135deg, #fdf2f8 50%, #fce7f3 50%)', text: 'text-pink-700', border: 'border-pink-200', accent: 'bg-pink-600' },
    { gradient: 'linear-gradient(135deg, #f0fdfa 50%, #ccfbf1 50%)', text: 'text-teal-700', border: 'border-teal-200', accent: 'bg-teal-600' },
    { gradient: 'linear-gradient(135deg, #fefce8 50%, #fef9c3 50%)', text: 'text-yellow-700', border: 'border-yellow-200', accent: 'bg-yellow-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-arabic pb-20">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border shadow-sm">
        <div className="flex-1">
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Sparkles className="text-blue-600 animate-pulse" />
            لوحه التحكم الذكيه
          </h2>
          <p className="text-slate-500 font-bold mt-1 text-xs">أتمتة ذكية ومتابعة مرئية لكافة المعايير</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border shadow-sm">
              <History className="w-4 h-4 text-blue-500" />
              <select value={cycleDuration} onChange={(e) => setCycleDuration(Number(e.target.value))} className="text-[10px] font-black bg-transparent outline-none cursor-pointer">
                <option value={3000}>3 ثوانٍ</option>
                <option value={5000}>5 ثوانٍ</option>
                <option value={10000}>10 ثوانٍ</option>
              </select>
           </div>

           <div className="flex gap-1 bg-white p-1 rounded-2xl border shadow-inner">
             {['all', 'daily', 'weekly', 'monthly', 'custom'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setGlobalTimeRange(t as any)}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${globalTimeRange === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  {t === 'all' ? 'الكل' : t === 'daily' ? 'يومية' : t === 'weekly' ? 'أسبوعية' : t === 'monthly' ? 'شهرية' : 'مخصص'}
                </button>
             ))}
           </div>

           {globalTimeRange === 'custom' && (
             <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border shadow-sm animate-in slide-in-from-right-2">
               <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="text-[9px] font-black outline-none bg-transparent" />
               <span className="text-slate-200">|</span>
               <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="text-[9px] font-black outline-none bg-transparent" />
             </div>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          let list = processedData[card.category] || [];
          // Filtering logic based on subtype if not 'all'
          if (card.subType !== 'all') {
            if (card.category === 'special_reports') list = list.filter(i => i.stype === card.subType);
            else if (card.category === 'substitutions') list = list.filter(i => i.paymentStatus === card.subType);
            else if (card.category === 'students') {
               // Show only students who have data in that specific field
               list = list.filter(i => (i as any)[card.subType]);
            }
          }

          const count = list.length;
          const currentCat = mainCategories.find(c => c.id === card.category);
          const currentSub = getSubTypes(card.category).find(s => s.id === card.subType);
          const design = cardColors[idx % cardColors.length];
          const offset = cardOffsets[card.id] || 0;
          const visibleItems = list.slice(offset, offset + 3);

          return (
            <div 
                key={card.id} 
                className={`rounded-[2.5rem] border-2 ${design.border} p-4 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-col gap-1.5 relative overflow-visible h-[290px] mt-6`}
                style={{ background: design.gradient }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30">
                 <div className={`w-14 h-14 rounded-full border-4 border-white flex items-center justify-center font-black text-2xl text-white shadow-xl ${design.accent}`}>
                    {count}
                 </div>
              </div>

              <div className="flex flex-col gap-1 relative z-10 pt-4 px-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className={`p-1.5 rounded-xl bg-white shadow-md transform group-hover:rotate-12 transition-transform`}>
                            {currentCat?.icon && React.cloneElement(currentCat.icon as React.ReactElement, { size: 14 })}
                        </div>
                        <select 
                            value={card.category}
                            onChange={(e) => updateCard(card.id, { category: e.target.value as DataCategory, subType: 'all' })}
                            className={`text-[9px] font-black bg-white ${design.text} rounded-lg px-2 py-1 outline-none border-none cursor-pointer shadow-sm hover:bg-slate-50 transition-colors uppercase tracking-wider`}
                        >
                            {mainCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                        </select>
                    </div>
                    
                    <div className="flex gap-1">
                      <button onClick={() => handleExportExcel(currentSub?.label || 'Data', list)} className="p-1.5 bg-white text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-colors">
                        <FileSpreadsheet size={12} />
                      </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md p-0.5 rounded-lg border border-white/40 shadow-inner">
                    <div className={`p-1 rounded bg-white shadow-sm`}>{currentSub?.icon}</div>
                    <select 
                        value={card.subType}
                        onChange={(e) => updateCard(card.id, { subType: e.target.value })}
                        className={`text-[9px] font-bold ${design.text} bg-transparent outline-none w-full cursor-pointer`}
                    >
                        {getSubTypes(card.category).map(sub => <option key={sub.id} value={sub.id}>{sub.label}</option>)}
                    </select>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-1 py-1 relative z-10 overflow-hidden">
                 {count === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <History size={20} className="opacity-20" />
                      <span className="italic text-[8px] font-bold">لا توجد بيانات</span>
                    </div>
                 ) : (
                    visibleItems.map((item, i) => {
                       // Dynamic Icon based on sub filter
                       let dynamicIcon = currentSub?.icon || <User size={12} />;
                       if (card.category === 'special_reports') dynamicIcon = item.icon || dynamicIcon;
                       
                       return (
                        <div 
                          key={`${card.id}-${offset}-${i}`}
                          onClick={() => setView?.(currentCat?.view || 'dashboard')}
                          className="bg-white/90 backdrop-blur-sm p-1 rounded-xl border border-white shadow-sm flex items-center gap-2 hover:bg-white hover:shadow-lg hover:-translate-x-1 cursor-pointer transition-all animate-in slide-in-from-right-2 fade-in duration-300 h-[38px]"
                        >
                           <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs bg-slate-50 border`}>
                             {dynamicIcon}
                           </div>
                           <div className="flex-1 overflow-hidden">
                              <div className="font-black text-[9px] text-slate-800 truncate leading-none">{item.displayName}</div>
                              <div className="text-[7px] text-slate-500 font-bold truncate">
                                {item.grade ? `${item.grade} - ${item.section}` : item.subjectCode || item.date || '---'}
                              </div>
                           </div>
                           <ChevronLeft size={10} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                       );
                    })
                 )}
              </div>

              {count > 3 && (
                <div className="flex justify-center items-center gap-10 relative z-20 pt-1 border-t border-white/40 mt-auto">
                   <button 
                     onClick={() => shiftCardData(card.id, 'prev', count)}
                     className={`p-1.5 rounded-full bg-white/80 hover:bg-white ${design.text} transition-all shadow-md active:scale-90`}
                   >
                     <ChevronRight size={16} />
                   </button>
                   <button 
                     onClick={() => shiftCardData(card.id, 'next', count)}
                     className={`p-1.5 rounded-full bg-white/80 hover:bg-white ${design.text} transition-all shadow-md active:scale-90`}
                   >
                     <ChevronLeft size={16} />
                   </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 group-hover:w-3 transition-all"></div>
          <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800">
            <CalendarDays className="text-blue-600" />
            بيانات المؤسسة
          </h3>
          <div className="space-y-6">
            <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600"><School size={16}/></div>
                <div>
                  <label className="text-[10px] text-slate-400 font-black uppercase mb-1 block">اسم المدرسة</label>
                  <div className="text-slate-800 font-black text-sm">{data.profile.schoolName || '---'}</div>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600"><User size={16}/></div>
                <div>
                  <label className="text-[10px] text-slate-400 font-black uppercase mb-1 block">المشرف المسؤول</label>
                  <div className="text-slate-800 font-black text-sm">{data.profile.supervisorName || '---'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-50 rounded-full opacity-50"></div>
          <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800">
            <TrendingUp className="text-green-600" />
            الوصول السريع
          </h3>
          {/* START OF CHANGE - Expanded grid for 12 buttons (4 static + 8 recent) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            {[
              { label: 'التقرير اليومي', icon: <FileText />, view: 'daily' },
              { label: 'تغطية الحصص', icon: <UserPlusIcon />, view: 'substitute' },
              { label: 'تعهد طالب', icon: <AlertCircle />, view: 'violations' },
              { label: 'خطة الإشراف', icon: <CalendarDays />, view: 'specialReports' },
              // Map recent actions (last 8)
              ...recentActions.map(action => ({
                label: action.label,
                icon: action.icon,
                view: action.id
              }))
            ].slice(0, 12).map((btn, i) => (
              <button 
                key={i} 
                onClick={() => setView?.(btn.view)}
                className="flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50 hover:bg-white hover:border-blue-600 hover:shadow-2xl hover:-translate-y-2 transition-all gap-3 group"
              >
                <div className={`p-4 rounded-2xl bg-white shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600`}>
                  {btn.icon}
                </div>
                <span className="text-xs font-black text-slate-700 truncate w-full text-center px-1">{btn.label}</span>
              </button>
            ))}
          </div>
          {/* END OF CHANGE */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
