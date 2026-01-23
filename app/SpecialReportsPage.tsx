
import React, { useState, useMemo, useEffect } from 'react';
import { useGlobal } from '../context/GlobalState';
// Add missing LayoutList to imports from lucide-react
import { 
  Briefcase, Users, FileText, GraduationCap, 
  ChevronRight, Calendar, Plus, Save, Share2, 
  Trash2, FileSpreadsheet, Download, Search, 
  CheckCircle, AlertCircle, Phone, MessageSquare, 
  UserCircle, Star, Filter, Clock, ShieldAlert, X,
  FileSearch, Archive, CheckSquare, PencilLine, Zap,
  Sparkles, Database, FileUp, FileDown, MessageCircle,
  Activity, Fingerprint, History, RefreshCw, Upload, LayoutList,
  Hammer, UserPlus
} from 'lucide-react';
import { AbsenceLog, LatenessLog, StudentViolationLog, StudentReport, ExitLog, DamageLog, ParentVisitLog } from '../types';
import * as XLSX from 'xlsx';

type MainTab = 'supervisor' | 'staff' | 'students' | 'tests';
type SubTab = string;

const SpecialReportsPage: React.FC = () => {
  const { lang, data, updateData } = useGlobal();
  const [activeTab, setActiveTab] = useState<MainTab>('supervisor');
  const [activeSubTab, setActiveSubTab] = useState<SubTab | null>(null);
  
  // View states
  const [showTable, setShowTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Universal Date Defaults and Multi-Selection States
  const today = new Date().toISOString().split('T')[0];
  const gradeOptions = ["التمهيدي", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"];
  const sectionOptions = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];

  // Filter States
  const [filterValues, setFilterValues] = useState({ semester: '', start: today, end: today, grade: '', section: '' });
  const [tempNames, setTempNames] = useState<string[]>([]);
  const [appliedNames, setAppliedNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState('');

  // Form States
  const [absenceForm, setAbsenceForm] = useState<Partial<AbsenceLog>>({
    date: today, semester: 'الأول', status: 'expected', reason: '', commStatus: 'لم يتم التواصل', commType: 'هاتف', replier: 'الأب', result: 'لم يتم الرد', notes: '', prevAbsenceCount: 0
  });

  const [latenessForm, setLatenessForm] = useState<Partial<LatenessLog>>({
    date: today, semester: 'الأول', status: 'recurring', reason: '', action: 'تنبيه 1', pledge: '', notes: '', prevLatenessCount: 0
  });

  const [violationForm, setViolationForm] = useState<Partial<StudentViolationLog>>({
    date: today, semester: 'الأول', behaviorViolations: [], dutiesViolations: [], achievementViolations: [], status: 'rare', action: 'تنبيه 1', pledge: '', notes: ''
  });

  const [exitForm, setExitForm] = useState<Partial<ExitLog>>({
    date: today, semester: 'الفصلين', status: 'نادر الخروج', customStatusItems: [], action: 'تنبيه 1', pledge: '', notes: '', prevExitCount: 0
  });

  const [damageForm, setDamageForm] = useState<Partial<DamageLog>>({
    date: today, semester: 'الفصلين', description: '', statusTags: [], action: 'تنبيه', pledge: '', notes: '', prevDamageCount: 0
  });

  const [visitForm, setVisitForm] = useState<Partial<ParentVisitLog>>({
    date: today, semester: 'الفصلين', type: 'visit', status: 'نادر الزيارة', customStatusItems: [], visitorName: '', reason: '', recommendations: '', actions: '', followUpStatus: [], notes: '', prevVisitCount: 0
  });

  // Data helpers
  const students = data.studentReports || [];
  const getDayName = (dateStr: string) => {
    return new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date(dateStr));
  };

  const structure = {
    supervisor: {
      title: 'المشرف الإداري',
      icon: <Briefcase />,
      items: ['الخطة الفصلية', 'الخلاصة الشهرية', 'المهام اليومية', 'المهام المضافة', 'المهام المرحلة', 'أهم المشكلات اليومية', 'التوصيات العامة', 'احتياجات الدور', 'سجل متابعة الدفاتر والتصحيح', 'الجرد العام للعهد', 'ملاحظات عامة']
    },
    staff: {
      title: 'الكادر التعليمي',
      icon: <Users />,
      items: ['سجل الإبداع والتميز', 'كشف الاستلام والتسليم', 'المخالفات', 'التعميمات']
    },
    students: {
      title: 'الطلاب/ الطالبات',
      icon: <GraduationCap />,
      items: ['الغياب اليومي', 'التأخر', 'خروج طالب أثناء الدراسة', 'المخالفات الطلابية', 'سجل الإتلاف المدرسي', 'سجل الحالات الخاصة', 'سجل الحالة الصحية', 'سجل زيارة أولياء الأمور والتواصل بهم']
    },
    tests: {
      title: 'تقارير الاختبار',
      icon: <FileSearch />,
      items: ['الاختبار الشهري', 'الاختبار الفصلي']
    }
  };

  const shareWhatsAppRich = (title: string, tableData: any[], columns: { label: string, key: string }[]) => {
    let msg = `*📋 تقرير: ${title}*\n`;
    msg += `*التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n`;
    msg += `----------------------------------\n\n`;
    tableData.forEach((row, idx) => {
      msg += `*🔹 البند (${idx + 1}):*\n`;
      columns.forEach(col => {
        let val = Array.isArray(row[col.key]) ? row[col.key].join('، ') : row[col.key];
        let symbol = '▪️';
        if (col.key === 'studentName' || col.key === 'name') symbol = '👤';
        if (col.key === 'grade') symbol = '📍';
        if (col.key === 'date') symbol = '📅';
        if (col.key === 'status') symbol = '🏷️';
        if (col.key === 'action') symbol = '🛡️';
        msg += `${symbol} *${col.label}:* ${val || '---'}\n`;
      });
      msg += `\n`;
    });
    msg += `----------------------------------\n`;
    msg += `*إعداد المستشار الإداري والتربوي إبراهيم دخان*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Shared Reusable Filter Component for all special reports
  const FilterSection = ({ 
    values, setValues, tempNames, setTempNames, appliedNames, setAppliedNames, nameInput, setNameInput, onExportExcel, onExportTxt, onExportWA, suggestions 
  }: any) => (
    <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 space-y-6 shadow-sm mb-6 animate-in slide-in-from-top-4 duration-300">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[300px] space-y-2">
          <label className="text-xs font-black text-slate-500 mr-2">فلترة بالأسماء (متعدد)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border-2 focus-within:border-blue-400 transition-all shadow-sm">
                <Search size={16} className="text-slate-400"/>
                <input type="text" className="text-xs font-black outline-none bg-transparent w-full" placeholder="اكتب الاسم..." value={nameInput} onChange={e => setNameInput(e.target.value)} />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-[100] bg-white border-2 rounded-xl shadow-2xl mt-2 max-h-48 overflow-y-auto">
                  {suggestions.map((s: any) => (
                    <button key={s.id} onClick={() => { setTempNames([...tempNames, s.name]); setNameInput(''); }} className="w-full text-right p-3 text-xs font-bold hover:bg-blue-50 border-b last:border-none flex justify-between items-center transition-colors">
                      <span>{s.name}</span> <span className="text-[10px] text-slate-300">{s.grade}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setAppliedNames(tempNames)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-blue-700 transition-all shadow-md active:scale-95">موافق</button>
            <button onClick={() => { setTempNames([]); setAppliedNames([]); }} className="bg-white border-2 text-slate-400 px-4 py-2 rounded-xl font-black text-xs hover:bg-slate-50 transition-all">تصفير</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tempNames.map((name: string) => (
              <span key={name} className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black border border-blue-200">
                {name} <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setTempNames(tempNames.filter((n: string) => n !== name))} />
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 mr-2">نطاق التاريخ</label>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border-2 shadow-sm">
            <Calendar size={16} className="text-slate-400"/>
            <input type="date" className="text-xs font-black outline-none bg-transparent" value={values.start} onChange={e => setValues({...values, start: e.target.value})} />
            <span className="text-slate-200">|</span>
            <input type="date" className="text-xs font-black outline-none bg-transparent" value={values.end} onChange={e => setValues({...values, end: e.target.value})} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 mr-2">الفصل</label>
          <select className="p-2.5 bg-white border-2 rounded-xl font-black text-xs outline-none focus:border-blue-400 shadow-sm appearance-none" value={values.semester} onChange={e => setValues({...values, semester: e.target.value})}>
            <option value="">الكل</option><option value="الأول">الأول</option><option value="الثاني">الثاني</option><option value="الفصلين">الفصلين</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 mr-2">الصف</label>
          <select className="p-2.5 bg-white border-2 rounded-xl font-black text-xs outline-none focus:border-blue-400 shadow-sm appearance-none" value={values.grade} onChange={e => setValues({...values, grade: e.target.value})}>
            <option value="">الكل</option>{gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 mr-2">الشعبة</label>
          <select className="p-2.5 bg-white border-2 rounded-xl font-black text-xs outline-none focus:border-blue-400 shadow-sm appearance-none" value={values.section} onChange={e => setValues({...values, section: e.target.value})}>
            <option value="">الكل</option>{sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex gap-2 pb-0.5">
          <button title="استيراد" className="p-3 bg-white border-2 text-blue-600 rounded-xl shadow-sm hover:bg-blue-50 transition-all"><Upload size={20}/></button>
          <button title="تصدير TXT" onClick={onExportTxt} className="p-3 bg-white border-2 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all"><FileText size={20}/></button>
          <button title="تصدير Excel" onClick={onExportExcel} className="p-3 bg-white border-2 text-green-700 rounded-xl shadow-sm hover:bg-green-50 transition-all"><FileSpreadsheet size={20}/></button>
          <button title="واتساب" onClick={onExportWA} className="p-3 bg-green-600 text-white rounded-xl shadow-xl hover:bg-green-700 transition-all active:scale-95"><MessageCircle size={20}/></button>
        </div>
      </div>
    </div>
  );

  // START OF CHANGE - Requirement: Daily Absence (1, 2)
  const renderAbsenceModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const nameSugg = nameInput.trim() ? students.filter(s => s.name.includes(nameInput) && !tempNames.includes(s.name)) : [];
    const filtered = (data.absenceLogs || []).filter(l => {
      if (appliedNames.length > 0 && !appliedNames.includes(l.studentName)) return false;
      if (filterValues.start && l.date < filterValues.start) return false;
      if (filterValues.end && l.date > filterValues.end) return false;
      if (filterValues.semester && l.semester !== filterValues.semester) return false;
      if (filterValues.grade && l.grade !== filterValues.grade) return false;
      if (filterValues.section && l.section !== filterValues.section) return false;
      return true;
    });

    const statusOptions = [
      { id: 'expected', label: 'غياب متوقع', color: 'bg-red-600' },
      { id: 'recurring', label: 'غياب متكرر', color: 'bg-slate-100' },
      { id: 'week1', label: 'أكثر من أسبوع', color: 'bg-slate-100' },
      { id: 'week2', label: 'أكثر من أسبوعين', color: 'bg-slate-100' },
      { id: 'most', label: 'الأكثر غياباً', color: 'bg-slate-100' },
      { id: 'disconnected', label: 'المنقطع', color: 'bg-slate-100' }
    ];

    const reasons = ["مرض", "انشغال", "تأخر", "لم يمر له الباص", "سفر"];

    const saveLog = () => {
      if (!absenceForm.studentId) return alert('يرجى اختيار طالب أولاً');
      const newLog: AbsenceLog = { 
        ...absenceForm as AbsenceLog, 
        id: Date.now().toString(), 
        day: getDayName(absenceForm.date || today) 
      };
      updateData({ absenceLogs: [newLog, ...(data.absenceLogs || [])] });
      setAbsenceForm({ ...absenceForm, studentName: '', studentId: '', reason: '', notes: '', result: '' });
      alert('تم حفظ البيانات بنجاح');
    };

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'الصف / الشعبة', key: 'grade' }, { label: 'عدد الغياب', key: 'prevAbsenceCount' }, 
      { label: 'التاريخ', key: 'date' }, { label: 'السبب', key: 'reason' }, { label: 'حالة التواصل', key: 'commStatus' }, 
      { label: 'المجيب', key: 'replier' }, { label: 'ملاحظات', key: 'notes' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <div className="flex gap-2">
              <button onClick={() => setShowTable(!showTable)} className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-100 transition-all flex items-center gap-2">
                {showTable ? <Plus size={18}/> : <LayoutList size={18}/>}
                {showTable ? 'تسجيل جديد' : 'جدول الغائبين'}
              </button>
              <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
           </div>
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              غياب يوم {getDayName(absenceForm.date || today)} بتاريخ {absenceForm.date} <Clock className="text-blue-600" size={24}/>
           </h2>
        </div>

        {!showTable ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
               <div className="flex flex-wrap gap-2 justify-end">
                  {statusOptions.map(opt => (
                    <button 
                      key={opt.id} 
                      onClick={() => setAbsenceForm({...absenceForm, status: opt.id as any})}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${absenceForm.status === opt.id ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
               </div>
               <div className="relative">
                  <label className="text-xs font-black text-slate-400 mb-2 block mr-2">اسم الطالب</label>
                  <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-blue-500 shadow-sm transition-all">
                    <Search className="text-slate-400" size={20}/>
                    <input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="ابحث عن الاسم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[100] bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-48 overflow-y-auto">
                      {suggestions.map(s => (
                        <button key={s.id} onClick={() => { 
                          setAbsenceForm({ ...absenceForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevAbsenceCount: (data.absenceLogs || []).filter(l => l.studentId === s.id).length });
                          setSearchQuery('');
                        }} className="w-full text-right p-4 hover:bg-blue-50 font-black border-b last:border-none flex justify-between items-center transition-colors">
                          <span>{s.name}</span>
                          <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span>
                        </button>
                      ))}
                    </div>
                  )}
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#FFF2CC]/30 p-5 rounded-3xl border-2 border-[#FFF2CC] text-center shadow-sm">
                    <label className="text-[10px] font-black text-orange-600 mb-1 block">غياب سابق</label>
                    <span className="text-3xl font-black text-slate-800">{absenceForm.prevAbsenceCount || 0}</span>
                  </div>
                  <div className="bg-purple-50 p-5 rounded-3xl border-2 border-purple-100 relative shadow-sm">
                     <label className="text-[10px] font-black text-purple-600 mb-1 block">الصف/الشعبة</label>
                     <span className="text-xl font-black text-slate-700">{absenceForm.studentName ? `${absenceForm.grade} - ${absenceForm.section}` : '---'}</span>
                     <div className="absolute left-4 bottom-4">
                       <select className="bg-white border text-[10px] font-black p-1 rounded-lg outline-none cursor-pointer" value={absenceForm.semester} onChange={e => setAbsenceForm({...absenceForm, semester: e.target.value as any})}>
                          <option value="الأول">الأول</option><option value="الثاني">الثاني</option>
                       </select>
                     </div>
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 mr-2 block">سبب الغياب</label>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {reasons.map(r => (
                      <button key={r} onClick={() => setAbsenceForm({...absenceForm, reason: r})} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${absenceForm.reason === r ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{r}</button>
                    ))}
                    <input className="px-4 py-2 rounded-xl text-[10px] font-black border outline-none bg-slate-50 w-full focus:ring-2 ring-blue-100" placeholder="سبب آخر..." value={absenceForm.reason} onChange={e => setAbsenceForm({...absenceForm, reason: e.target.value})} />
                  </div>
               </div>
            </div>
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-2">نوع التواصل</label>
                    <select className="w-full p-4 bg-white border-2 rounded-2xl font-black text-sm outline-none focus:border-blue-500 shadow-sm appearance-none" value={absenceForm.commType} onChange={e => setAbsenceForm({...absenceForm, commType: e.target.value as any})}>
                      {["هاتف", "واتساب", "رسالة", "أخرى"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-2">حالة التواصل</label>
                    <select className="w-full p-4 bg-white border-2 rounded-2xl font-black text-sm outline-none focus:border-blue-500 shadow-sm appearance-none" value={absenceForm.commStatus} onChange={e => setAbsenceForm({...absenceForm, commStatus: e.target.value as any})}>
                      {["تم التواصل", "لم يتم التواصل", "قيد المتابعة"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-2">نتيجة التواصل</label>
                    <select className="w-full p-4 bg-white border-2 rounded-2xl font-black text-sm outline-none focus:border-blue-500 shadow-sm appearance-none" value={absenceForm.result} onChange={e => setAbsenceForm({...absenceForm, result: e.target.value as any})}>
                      {["تم الرد", "لم يتم الرد", "الرقم مغلق", "سيحضر غداً"].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-2">صفة المجيب</label>
                    <select className="w-full p-4 bg-white border-2 rounded-2xl font-black text-sm outline-none focus:border-blue-500 shadow-sm appearance-none" value={absenceForm.replier} onChange={e => setAbsenceForm({...absenceForm, replier: e.target.value as any})}>
                      {["الأب", "الأم", "الأخ", "الأخت", "العم", "الخال", "غيرهم"].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-2">ملاحظات أخرى...</label>
                  <textarea className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm bg-slate-50 min-h-[120px] focus:border-blue-400 shadow-inner" placeholder="ملاحظات إضافية..." value={absenceForm.notes} onChange={e => setAbsenceForm({...absenceForm, notes: e.target.value})} />
               </div>
               <button onClick={saveLog} className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all mt-4">
                 <Save size={28}/> حفظ بيانات الغياب
               </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <FilterSection suggestions={nameSugg} values={filterValues} setValues={setFilterValues} tempNames={tempNames} setTempNames={setTempNames} appliedNames={appliedNames} setAppliedNames={setAppliedNames} nameInput={nameInput} setNameInput={setNameInput} onExportExcel={() => exportExcelFiltered('غياب_الطلاب', filtered, cols)} onExportTxt={() => exportTxtFiltered('غياب_الطلاب', filtered, cols)} onExportWA={() => shareWhatsAppRich('سجل غياب الطلاب المفلتر', filtered, cols)} />
            <div className="overflow-x-auto rounded-[2.5rem] border shadow-inner">
               <table className="w-full text-center text-sm border-collapse min-w-[1200px]">
                  <thead className="bg-[#FFD966] text-slate-800 font-black">
                     <tr>{cols.map(c => <th key={c.key} className="p-5 border-e">{c.label}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-bold">
                     {filtered.length === 0 ? (<tr><td colSpan={8} className="p-20 text-slate-300 italic text-lg font-bold">لا توجد بيانات غياب مسجلة لهذه الاختيارات حالياً.</td></tr>) : filtered.map(l => (
                       <tr key={l.id} className="hover:bg-blue-50/20 transition-colors h-12">
                          <td className="p-4 border-e">{l.studentName}</td>
                          <td className="p-4 border-e">{l.grade} / {l.section}</td>
                          <td className="p-4 border-e text-red-600 font-black text-lg">{l.prevAbsenceCount + 1}</td>
                          <td className="p-4 border-e text-xs text-slate-400">{l.date}</td>
                          <td className="p-4 border-e">{l.reason}</td>
                          <td className="p-4 border-e">{l.commStatus}</td>
                          <td className="p-4 border-e">{l.replier}</td>
                          <td className="p-4 text-xs text-slate-400">{l.notes}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // START OF CHANGE - Requirement: Lateness Log (3, 4)
  const renderLatenessModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const nameSugg = nameInput.trim() ? students.filter(s => s.name.includes(nameInput) && !tempNames.includes(s.name)) : [];
    const filtered = (data.latenessLogs || []).filter(l => {
      if (appliedNames.length > 0 && !appliedNames.includes(l.studentName)) return false;
      if (filterValues.start && l.date < filterValues.start) return false;
      if (filterValues.end && l.date > filterValues.end) return false;
      if (filterValues.semester && l.semester !== filterValues.semester) return false;
      if (filterValues.grade && l.grade !== filterValues.grade) return false;
      if (filterValues.section && l.section !== filterValues.section) return false;
      return true;
    });

    const reasons = ["مرض", "انشغال", "نوم", "لم يمر له الباص", "بلا عذر"];
    const statusOptions = [
      { id: 'recurring', label: 'تأخر متكرر', color: 'bg-orange-500' },
      { id: 'frequent', label: 'كثير التأخر', color: 'bg-slate-100' },
      { id: 'permanent', label: 'دائم التأخر', color: 'bg-slate-100' }
    ];

    const saveLog = () => {
      if (!latenessForm.studentId) return alert('يرجى اختيار طالب أولاً');
      const newLog: LatenessLog = { 
        ...latenessForm as LatenessLog, 
        id: Date.now().toString(), 
        day: getDayName(latenessForm.date || today) 
      };
      updateData({ latenessLogs: [newLog, ...(data.latenessLogs || [])] });
      setLatenessForm({ ...latenessForm, studentName: '', studentId: '', reason: '', pledge: '', notes: '' });
      alert('تم حفظ البيانات بنجاح');
    };

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'التاريخ', key: 'date' }, { label: 'السبب', key: 'reason' }, 
      { label: 'الإجراء', key: 'action' }, { label: 'البصمة', key: 'pledge' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <div className="flex gap-2">
              <button onClick={() => setShowTable(!showTable)} className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-100 transition-all flex items-center gap-2">
                {showTable ? <Plus size={18}/> : <History size={18}/>}
                {showTable ? 'رصد جديد' : 'أرشيف التأخر'}
              </button>
              <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
           </div>
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              تأخر يوم {getDayName(latenessForm.date || today)} بتاريخ {latenessForm.date} <Clock className="text-orange-500" size={24}/>
           </h2>
        </div>

        {!showTable ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
               <div className="flex flex-wrap gap-2 justify-end">
                  {statusOptions.map(opt => (
                    <button 
                      key={opt.id} 
                      onClick={() => setLatenessForm({...latenessForm, status: opt.id as any})}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${latenessForm.status === opt.id ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-105' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
               </div>
               <div className="relative">
                  <label className="text-xs font-black text-slate-400 mb-2 block mr-2">اسم الطالب</label>
                  <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-orange-500 shadow-sm transition-all">
                    <UserCircle className="text-slate-400" size={20}/>
                    <input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="ابحث عن الاسم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[100] bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-48 overflow-y-auto">
                      {suggestions.map(s => (
                        <button key={s.id} onClick={() => { 
                          setLatenessForm({ ...latenessForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevLatenessCount: (data.latenessLogs || []).filter(l => l.studentId === s.id).length });
                          setSearchQuery('');
                        }} className="w-full text-right p-4 hover:bg-blue-50 font-black border-b last:border-none flex justify-between items-center">
                          <span>{s.name}</span>
                          <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span>
                        </button>
                      ))}
                    </div>
                  )}
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#FFF2CC]/30 p-5 rounded-3xl border-2 border-[#FFF2CC] text-center shadow-sm">
                    <label className="text-[10px] font-black text-orange-600 mb-1 block">تأخر سابق</label>
                    <span className="text-3xl font-black text-slate-800">{latenessForm.prevLatenessCount || 0}</span>
                  </div>
                  <div className="bg-blue-50 p-5 rounded-3xl border-2 border-blue-100 relative shadow-sm">
                     <label className="text-[10px] font-black text-blue-600 mb-1 block">الفصل</label>
                     <select className="w-full bg-transparent text-xl font-black outline-none cursor-pointer" value={latenessForm.semester} onChange={e => setLatenessForm({...latenessForm, semester: e.target.value as any})}>
                        <option value="الأول">الأول</option><option value="الثاني">الثاني</option>
                     </select>
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 mr-2 block">سبب التأخر</label>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {reasons.map(r => (
                      <button key={r} onClick={() => setLatenessForm({...latenessForm, reason: r})} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${latenessForm.reason === r ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{r}</button>
                    ))}
                    <input className="px-4 py-2 rounded-xl text-[10px] font-black border outline-none bg-slate-50 w-full focus:ring-2 ring-blue-100" placeholder="سبب آخر..." value={latenessForm.reason} onChange={e => setLatenessForm({...latenessForm, reason: e.target.value})} />
                  </div>
               </div>
            </div>
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-2">الإجراء المتخذ</label>
                  <select className="w-full p-5 bg-white border-2 rounded-3xl font-black text-lg outline-none focus:border-orange-500 shadow-sm appearance-none" value={latenessForm.action} onChange={e => setLatenessForm({...latenessForm, action: e.target.value})}>
                    {["تنبيه 1", "تنبيه 2", "تعهد خطي", "اتصال بولي الأمر", "استدعاء ولي الأمر"].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
               </div>
               <div className="p-8 bg-[#0f172a] text-white rounded-[2.5rem] shadow-2xl space-y-4 border-4 border-slate-800 relative group overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full group-hover:scale-150 transition-all duration-700"></div>
                  <h4 className="flex items-center gap-2 font-black text-lg"><Fingerprint className="text-orange-500"/> بصمة الطالب (تعهد)</h4>
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed">أتعهد بعدم تكرار التأخر وفي حالة التكرار فللإدارة الحق في اتخاذ اللازم.</p>
                  <button onClick={() => setLatenessForm({...latenessForm, pledge: 'تم التوقيع'})} className={`w-full p-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg ${latenessForm.pledge ? 'bg-green-600 border-none' : 'bg-white text-slate-800 hover:scale-[1.02] active:scale-95'}`}>
                    {latenessForm.pledge ? <CheckCircle size={20}/> : <Zap size={18} className="text-orange-500"/>}
                    {latenessForm.pledge || 'توقيع البصمة'}
                  </button>
               </div>
               <button onClick={saveLog} className="w-full bg-[#1e293b] text-white p-6 rounded-[2rem] font-black text-xl hover:bg-black shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all mt-4">حفظ البيانات</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <FilterSection suggestions={nameSugg} values={filterValues} setValues={setFilterValues} tempNames={tempNames} setTempNames={setTempNames} appliedNames={appliedNames} setAppliedNames={setAppliedNames} nameInput={nameInput} setNameInput={setNameInput} onExportExcel={() => exportExcelFiltered('تأخر_الطلاب', filtered, cols)} onExportTxt={() => exportTxtFiltered('تأخر_الطلاب', filtered, cols)} onExportWA={() => shareWhatsAppRich('سجل تأخر الطلاب المفلتر', filtered, cols)} />
            <div className="overflow-x-auto rounded-[2.5rem] border shadow-inner">
               <table className="w-full text-center text-sm border-collapse min-w-[1000px]">
                  <thead className="bg-[#FFD966] text-slate-800 font-black">
                     <tr>{cols.map(c => <th key={c.key} className="p-5 border-e">{c.label}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-bold">
                     {filtered.length === 0 ? (<tr><td colSpan={5} className="p-20 text-slate-300 italic text-lg font-bold">لا توجد سجلات تأخر لهذه الفترة حالياً.</td></tr>) : filtered.map(l => (
                       <tr key={l.id} className="hover:bg-orange-50/20 transition-colors h-12">
                          <td className="p-4 border-e">{l.studentName}</td>
                          <td className="p-4 border-e text-xs text-slate-400">{l.date}</td>
                          <td className="p-4 border-e">{l.reason}</td>
                          <td className="p-4 border-e text-red-600">{l.action}</td>
                          <td className="p-4 text-[10px] text-green-600">{l.pledge || '---'}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // START OF CHANGE - Requirement: Student Violation (5, 6, 7)
  const renderViolationModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const nameSugg = nameInput.trim() ? students.filter(s => s.name.includes(nameInput) && !tempNames.includes(s.name)) : [];
    const filtered = (data.studentViolationLogs || []).filter(l => {
      if (appliedNames.length > 0 && !appliedNames.includes(l.studentName)) return false;
      if (filterValues.start && l.date < filterValues.start) return false;
      if (filterValues.end && l.date > filterValues.end) return false;
      if (filterValues.semester && l.semester !== filterValues.semester) return false;
      if (filterValues.grade && l.grade !== filterValues.grade) return false;
      if (filterValues.section && l.section !== filterValues.section) return false;
      return true;
    });

    const categories = [
      { id: 'behavior', label: 'قسم السلوك', color: 'border-red-500', iconColor: 'text-red-500', items: ["تأخر عن الطابور", "تأخر عن حصة", "كثير الكلام", "كثير الشغب", "عدواني", "تطاول على معلم"] },
      { id: 'duties', label: 'الواجبات والدفاتر', color: 'border-blue-500', iconColor: 'text-blue-500', items: ["تقصير في الواجبات", "تقصير في الدفاتر", "تقصير في الكتب", "عدم الكتابة بالحصة", "عدم حل التكليف"] },
      { id: 'achievement', label: 'التحصيل العلمي', color: 'border-green-500', iconColor: 'text-green-500', items: ["عدم حفظ الدرس", "عدم المشاركة", "كثير النوم", "كثير الشرود", "امتناع عن اختبار"] }
    ];

    const toggleItem = (cat: string, item: string) => {
      const field = cat === 'behavior' ? 'behaviorViolations' : cat === 'duties' ? 'dutiesViolations' : 'achievementViolations';
      const current = violationForm[field] || [];
      const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
      setViolationForm({ ...violationForm, [field]: updated });
    };

    const saveLog = () => {
      if (!violationForm.studentId) return alert('يرجى اختيار طالب أولاً');
      const total = (violationForm.behaviorViolations?.length || 0) + (violationForm.dutiesViolations?.length || 0) + (violationForm.achievementViolations?.length || 0);
      const newLog: StudentViolationLog = { ...violationForm as StudentViolationLog, id: Date.now().toString(), totalViolations: total };
      updateData({ studentViolationLogs: [newLog, ...(data.studentViolationLogs || [])] });
      setViolationForm({ ...violationForm, studentName: '', studentId: '', behaviorViolations: [], dutiesViolations: [], achievementViolations: [], notes: '', pledge: '' });
      alert('تم تسجيل المخالفة بنجاح');
    };

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'الصف / الشعبة', key: 'grade' }, { label: 'إجمالي المخالفات', key: 'totalViolations' }, 
      { label: 'تاريخ الرصد', key: 'date' }, { label: 'الحالة', key: 'status' }, { label: 'الإجراء', key: 'action' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <div className="flex gap-2">
              <button onClick={() => setShowTable(!showTable)} className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-100 transition-all flex items-center gap-2">
                {showTable ? <Plus size={18}/> : <ShieldAlert size={18}/>}
                {showTable ? 'رصد جديد' : 'جدول المخالفات'}
              </button>
              <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
           </div>
           <h2 className="text-2xl font-black text-red-600 flex items-center gap-3">سجل المخالفات الطلابية <AlertCircle size={24}/></h2>
        </div>

        {!showTable ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <div className="relative md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 mb-1 block mr-2">اسم الطالب</label>
                  <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-blue-500 shadow-sm transition-all">
                    <input type="text" className="bg-transparent w-full outline-none font-black text-sm" placeholder="ابحث عن الاسم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[100] bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-40 overflow-y-auto">
                      {suggestions.map(s => (
                        <button key={s.id} onClick={() => { 
                          setViolationForm({ ...violationForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section });
                          setSearchQuery('');
                        }} className="w-full text-right p-3 hover:bg-blue-50 font-black border-b last:border-none flex justify-between items-center text-[11px] transition-colors">
                          <span>{s.name}</span><span className="text-[9px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade}</span>
                        </button>
                      ))}
                    </div>
                  )}
               </div>
               <div className="grid grid-cols-2 gap-4 md:col-span-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2">الفصل</label>
                    <select className="w-full p-4 bg-white border-2 rounded-2xl font-black text-xs outline-none focus:border-blue-500 appearance-none shadow-sm cursor-pointer" value={violationForm.semester} onChange={e => setViolationForm({...violationForm, semester: e.target.value as any})}>
                      <option value="الأول">الأول</option><option value="الثاني">الثاني</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2">التاريخ</label>
                    <input type="date" className="w-full p-4 bg-white border-2 rounded-2xl font-black text-xs outline-none focus:border-blue-500 shadow-sm" value={violationForm.date} onChange={e => setViolationForm({...violationForm, date: e.target.value})} />
                  </div>
               </div>
               <div className="grid grid-cols-3 gap-2 md:col-span-1">
                  <div className="bg-white p-3 rounded-2xl border text-center shadow-sm"><label className="text-[8px] block text-slate-400">الصف</label><span className="font-black text-xs">{violationForm.grade || '---'}</span></div>
                  <div className="bg-white p-3 rounded-2xl border text-center shadow-sm"><label className="text-[8px] block text-slate-400">الشعبة</label><span className="font-black text-xs">{violationForm.section || '---'}</span></div>
                  <div className="bg-white p-3 rounded-2xl border border-red-100 text-center shadow-sm"><label className="text-[8px] block text-red-400">إجمالي السوابق</label><span className="font-black text-red-600 text-xs">{(data.studentViolationLogs || []).filter(l => l.studentId === violationForm.studentId).length}</span></div>
               </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
               {[{id: 'blacklist', label: 'القائمة السوداء'}, {id: 'high', label: 'كثير المخالفة'}, {id: 'medium', label: 'متوسط'}, {id: 'rare', label: 'نادر'}].map(opt => (
                 <button key={opt.id} onClick={() => setViolationForm({...violationForm, status: opt.id as any})} className={`px-8 py-3 rounded-2xl font-black text-xs border-2 transition-all ${violationForm.status === opt.id ? 'bg-red-600 border-red-600 text-white shadow-xl scale-105' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{opt.label}</button>
               ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {categories.map(cat => (
                 <div key={cat.id} className="bg-white p-6 rounded-[2.5rem] border-2 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between border-r-4 pr-3 py-1 mb-2" style={{ borderColor: cat.color.split('-')[1] }}>
                       <h3 className="font-black text-sm text-slate-800">{cat.label}</h3>
                       <button className={`p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all ${cat.iconColor}`}><Plus size={16}/></button>
                    </div>
                    <div className="space-y-2">
                       {cat.items.map(item => (
                         <button key={item} onClick={() => toggleItem(cat.id, item)} className={`w-full text-right p-3 rounded-xl text-[10px] font-black border transition-all ${ (violationForm[cat.id === 'behavior' ? 'behaviorViolations' : cat.id === 'duties' ? 'dutiesViolations' : 'achievementViolations'] || []).includes(item) ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-50 hover:bg-slate-100' }`}>{item}</button>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 border-t pt-10">
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-2">الإجراء المتخذ</label>
                    <select className="w-full p-5 bg-white border-2 rounded-3xl font-black text-lg outline-none focus:border-red-500 shadow-sm appearance-none appearance-none cursor-pointer" value={violationForm.action} onChange={e => setViolationForm({...violationForm, action: e.target.value})}>
                      {["تنبيه 1", "تنبيه 2", "تعهد خطي", "استدعاء ولي الأمر", "فصل مؤقت"].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-2">ملاحظات إضافية...</label>
                    <textarea className="w-full p-4 border-2 rounded-2xl outline-none font-black text-xs bg-slate-50 min-h-[100px] focus:border-red-400 shadow-inner" placeholder="..." value={violationForm.notes} onChange={e => setViolationForm({...violationForm, notes: e.target.value})} />
                  </div>
               </div>
               <div className="p-10 bg-red-600 text-white rounded-[3rem] shadow-2xl space-y-6 relative group overflow-hidden border-4 border-red-700">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full group-hover:scale-150 transition-all duration-1000"></div>
                  <h4 className="flex items-center gap-3 font-black text-2xl"><Fingerprint size={32}/> بصمة الطالب (تعهد)</h4>
                  <p className="text-xs font-bold leading-relaxed opacity-90">أتعهد بعدم تكرار المخالفة وفي حالة التكرار فللإدارة الحق في اتخاذ اللازم.</p>
                  <button onClick={() => setViolationForm({...violationForm, pledge: 'تم التبصيم بنجاح'})} className={`w-full p-5 rounded-2xl font-black text-xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${violationForm.pledge ? 'bg-green-500 border-none' : 'bg-white/10 border-2 border-white/20 backdrop-blur-md hover:bg-white/20'}`}>
                    {violationForm.pledge ? <CheckCircle size={24}/> : <Zap size={22}/>}
                    {violationForm.pledge || 'اعتماد التبصيم'}
                  </button>
               </div>
            </div>
            <button onClick={saveLog} className="w-full bg-red-600 text-white p-7 rounded-[2.5rem] font-black text-2xl hover:bg-red-700 shadow-2xl active:scale-[0.98] transition-all">حفظ السجل</button>
          </div>
        ) : (
          <div className="space-y-6">
            <FilterSection suggestions={nameSugg} values={filterValues} setValues={setFilterValues} tempNames={tempNames} setTempNames={setTempNames} appliedNames={appliedNames} setAppliedNames={setAppliedNames} nameInput={nameInput} setNameInput={setNameInput} onExportExcel={() => exportExcelFiltered('مخالفات_الطلاب', filtered, cols)} onExportTxt={() => exportTxtFiltered('مخالفات_الطلاب', filtered, cols)} onExportWA={() => shareWhatsAppRich('سجل مخالفات الطلاب المفلتر', filtered, cols)} />
            <div className="overflow-x-auto rounded-[3rem] border-4 border-slate-50 shadow-inner">
               <table className="w-full text-center text-sm border-collapse min-w-[1200px]">
                  <thead className="bg-[#FFD966] text-slate-800 font-black sticky top-0">
                     <tr>{cols.map(c => <th key={c.key} className="p-6 border-e border-slate-200">{c.label}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-bold">
                     {filtered.length === 0 ? (<tr><td colSpan={6} className="p-24 text-slate-300 italic text-xl font-bold">لا توجد مخالفات مسجلة في هذه الفترة حالياً.</td></tr>) : filtered.map(l => (
                       <tr key={l.id} className="hover:bg-red-50/20 transition-colors h-14">
                          <td className="p-5 border-e">{l.studentName}</td>
                          <td className="p-5 border-e">{l.grade} / {l.section}</td>
                          <td className="p-5 border-e text-red-600 font-black text-xl">{l.totalViolations}</td>
                          <td className="p-5 border-e text-xs text-slate-400">{l.date}</td>
                          <td className="p-5 border-e"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase">{l.status}</span></td>
                          <td className="p-5 text-red-700 font-black">{l.action}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // START OF CHANGE - Requirement: Student Exit (8, 9)
  const renderExitModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const nameSugg = nameInput.trim() ? students.filter(s => s.name.includes(nameInput) && !tempNames.includes(s.name)) : [];
    const filtered = (data.exitLogs || []).filter(l => {
      if (appliedNames.length > 0 && !appliedNames.includes(l.studentName)) return false;
      if (filterValues.start && l.date < filterValues.start) return false;
      if (filterValues.end && l.date > filterValues.end) return false;
      if (filterValues.semester && l.semester !== filterValues.semester) return false;
      if (filterValues.grade && l.grade !== filterValues.grade) return false;
      if (filterValues.section && l.section !== filterValues.section) return false;
      return true;
    });

    const saveLog = () => {
      if (!exitForm.studentId) return alert('يرجى اختيار طالب أولاً');
      const newLog: ExitLog = { ...exitForm as ExitLog, id: Date.now().toString(), day: getDayName(exitForm.date || today) };
      updateData({ exitLogs: [newLog, ...(data.exitLogs || [])] });
      setExitForm({ ...exitForm, studentName: '', studentId: '', notes: '', status: 'نادر الخروج', action: 'تنبيه 1' });
      alert('تم حفظ بيانات الخروج');
    };

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'الصف', key: 'grade' }, { label: 'الشعبة', key: 'section' }, 
      { label: 'عدد مرات الخروج', key: 'prevExitCount' }, { label: 'التاريخ', key: 'date' }, { label: 'حالة الخروج', key: 'status' }, 
      { label: 'نوع الإجراء', key: 'action' }, { label: 'ملاحظات أخرى', key: 'notes' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <div className="flex gap-2">
              <button onClick={() => setShowTable(!showTable)} className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-100 transition-all flex items-center gap-2 shadow-sm">
                {showTable ? <Plus size={18}/> : <LayoutList size={18}/>}
                {showTable ? 'رصد خروج جديد' : 'جدول الخروج'}
              </button>
              <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
           </div>
           <h2 className="text-2xl font-black text-blue-600 flex items-center gap-3">خروج طالب أثناء الدراسة <UserPlus size={24}/></h2>
        </div>

        {!showTable ? (
          <div className="space-y-6">
            <div className="relative">
              <label className="text-xs font-black text-slate-400 mb-2 block mr-2">ابحث عن الطالب</label>
              <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-blue-500 shadow-sm transition-all">
                <Search size={20} className="text-slate-400"/><input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="اكتب الاسم هنا..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-[100] bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto">
                  {suggestions.map(s => (
                    <button key={s.id} onClick={() => { setExitForm({ ...exitForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevExitCount: (data.exitLogs || []).filter(l => l.studentId === s.id).length }); setSearchQuery(''); }} className="w-full text-right p-4 hover:bg-blue-50 font-black border-b last:border-none flex justify-between items-center transition-colors"><span>{s.name}</span> <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span></button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border-2 shadow-sm text-center"><label className="text-[10px] block text-slate-400 mb-1">الصف</label><span className="font-black text-lg text-slate-700">{exitForm.grade || '---'}</span></div>
              <div className="bg-white p-4 rounded-2xl border-2 shadow-sm text-center"><label className="text-[10px] block text-slate-400 mb-1">الشعبة</label><span className="font-black text-lg text-slate-700">{exitForm.section || '---'}</span></div>
              <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg text-center"><label className="text-[10px] block opacity-80 mb-1">مرات الخروج</label><span className="font-black text-2xl">{exitForm.prevExitCount ?? 0}</span></div>
              <div className="bg-white p-2 rounded-2xl border-2 shadow-sm"><label className="text-[10px] block text-slate-400 mr-2 mb-1">التاريخ</label><input type="date" className="w-full p-2 text-xs font-black outline-none bg-transparent" value={exitForm.date} onChange={e => setExitForm({...exitForm, date: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2">حالة الخروج</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm bg-slate-50 focus:border-blue-400" value={exitForm.status} onChange={e => setExitForm({...exitForm, status: e.target.value})} placeholder="مثال: نادر الخروج" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2">الإجراء المتخذ</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm bg-slate-50 focus:border-blue-400" value={exitForm.action} onChange={e => setExitForm({...exitForm, action: e.target.value})} placeholder="تنبيه 1" /></div>
            </div>
            <button onClick={saveLog} className="w-full bg-[#0f172a] text-white p-6 rounded-3xl font-black text-xl hover:bg-black shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all mt-4"><Save size={24}/> حفظ بيانات الخروج</button>
          </div>
        ) : (
          <div className="space-y-8">
            <FilterSection suggestions={nameSugg} values={filterValues} setValues={setFilterValues} tempNames={tempNames} setTempNames={setTempNames} appliedNames={appliedNames} setAppliedNames={setAppliedNames} nameInput={nameInput} setNameInput={setNameInput} onExportExcel={() => exportExcelFiltered('خروج_الطلاب', filtered, cols)} onExportTxt={() => exportTxtFiltered('خروج_الطلاب', filtered, cols)} onExportWA={() => shareWhatsAppRich('سجل خروج الطلاب المفلتر', filtered, cols)} />
            <div className="overflow-x-auto rounded-[2.5rem] border shadow-inner">
              <table className="w-full text-center text-sm border-collapse min-w-[1200px]"><thead className="bg-[#FFD966] text-slate-800 font-black"><tr>{cols.map(c => <th key={c.key} className="p-5 border-e border-blue-200">{c.label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white font-bold">{filtered.length === 0 ? <tr><td colSpan={cols.length} className="p-20 text-slate-300 italic text-lg font-bold">لا توجد بيانات تطابق الفلتر.</td></tr> : filtered.map(l => <tr key={l.id} className="hover:bg-blue-50/30 transition-colors h-12"><td className="p-5 border-e border-slate-50 font-black">{l.studentName}</td><td className="p-5 border-e border-slate-50">{l.grade}</td><td className="p-5 border-e border-slate-50">{l.section}</td><td className="p-5 border-e border-slate-50 text-blue-600 text-lg">{l.prevExitCount + 1}</td><td className="p-5 border-e border-slate-50 text-slate-400 text-xs">{l.date}</td><td className="p-5 border-e border-slate-50">{l.status}</td><td className="p-5 border-e border-slate-50">{l.action}</td><td className="p-5 text-slate-400 text-xs">{l.notes}</td></tr>)}</tbody></table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // START OF CHANGE - Requirement: School Damage Log (10, 11)
  const renderDamageModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const nameSugg = nameInput.trim() ? students.filter(s => s.name.includes(nameInput) && !tempNames.includes(s.name)) : [];
    const filtered = (data.damageLogs || []).filter(l => {
      if (appliedNames.length > 0 && !appliedNames.includes(l.studentName)) return false;
      if (filterValues.start && l.date < filterValues.start) return false;
      if (filterValues.end && l.date > filterValues.end) return false;
      if (filterValues.semester && l.semester !== filterValues.semester) return false;
      if (filterValues.grade && l.grade !== filterValues.grade) return false;
      if (filterValues.section && l.section !== filterValues.section) return false;
      return true;
    });

    const saveLog = () => {
      if (!damageForm.studentId) return alert('يرجى اختيار طالب أولاً');
      const newLog: DamageLog = { ...damageForm as DamageLog, id: Date.now().toString(), day: getDayName(damageForm.date || today) };
      updateData({ damageLogs: [newLog, ...(data.damageLogs || [])] });
      setDamageForm({ ...damageForm, studentName: '', studentId: '', notes: '', description: '', action: 'تنبيه' });
      alert('تم حفظ بيانات الإتلاف');
    };

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'الصف', key: 'grade' }, { label: 'الشعبة', key: 'section' }, 
      { label: 'عدد الإتلافات', key: 'prevDamageCount' }, { label: 'التاريخ', key: 'date' }, { label: 'بيان الإتلاف', key: 'description' }, 
      { label: 'نوع الإجراء', key: 'action' }, { label: 'ملاحظات أخرى', key: 'notes' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <div className="flex gap-2">
              <button onClick={() => setShowTable(!showTable)} className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-red-100 transition-all flex items-center gap-2 shadow-sm">
                {showTable ? <Plus size={18}/> : <LayoutList size={18}/>}
                {showTable ? 'رصد إتلاف جديد' : 'جدول الإتلاف'}
              </button>
              <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
           </div>
           <h2 className="text-2xl font-black text-red-600 flex items-center gap-3">سجل الإتلاف المدرسي <Hammer size={24}/></h2>
        </div>

        {!showTable ? (
          <div className="space-y-6">
            <div className="relative">
              <label className="text-xs font-black text-slate-400 mb-2 block mr-2">ابحث عن الطالب</label>
              <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-red-500 shadow-sm transition-all">
                <Search size={20} className="text-slate-400"/><input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="اكتب الاسم هنا..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-[100] bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto">
                  {suggestions.map(s => (
                    <button key={s.id} onClick={() => { setDamageForm({ ...damageForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevDamageCount: (data.damageLogs || []).filter(l => l.studentId === s.id).length }); setSearchQuery(''); }} className="w-full text-right p-4 hover:bg-red-50 font-black border-b last:border-none flex justify-between items-center transition-colors"><span>{s.name}</span> <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span></button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border-2 shadow-sm text-center"><label className="text-[10px] block text-slate-400 mb-1">الصف</label><span className="font-black text-lg text-slate-700">{damageForm.grade || '---'}</span></div>
              <div className="bg-white p-4 rounded-2xl border-2 shadow-sm text-center"><label className="text-[10px] block text-slate-400 mb-1">الشعبة</label><span className="font-black text-lg text-slate-700">{damageForm.section || '---'}</span></div>
              <div className="bg-red-600 text-white p-4 rounded-2xl shadow-lg text-center"><label className="text-[10px] block opacity-80 mb-1">مرات الإتلاف</label><span className="font-black text-2xl">{damageForm.prevDamageCount ?? 0}</span></div>
              <div className="bg-white p-2 rounded-2xl border-2 shadow-sm"><label className="text-[10px] block text-slate-400 mr-2 mb-1">التاريخ</label><input type="date" className="w-full p-2 text-xs font-black outline-none bg-transparent" value={damageForm.date} onChange={e => setDamageForm({...damageForm, date: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2">بيان الإتلاف</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm bg-slate-50 focus:border-red-400" value={damageForm.description} onChange={e => setDamageForm({...damageForm, description: e.target.value})} placeholder="ماذا تم إتلافه؟" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2">الإجراء المتخذ</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm bg-slate-50 focus:border-red-400" value={damageForm.action} onChange={e => setDamageForm({...damageForm, action: e.target.value})} placeholder="تنبيه" /></div>
            </div>
            <button onClick={saveLog} className="w-full bg-[#0f172a] text-white p-6 rounded-3xl font-black text-xl hover:bg-black shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all mt-4"><Save size={24}/> حفظ بيانات الإتلاف</button>
          </div>
        ) : (
          <div className="space-y-8">
            <FilterSection suggestions={nameSugg} values={filterValues} setValues={setFilterValues} tempNames={tempNames} setTempNames={setTempNames} appliedNames={appliedNames} setAppliedNames={setAppliedNames} nameInput={nameInput} setNameInput={setNameInput} onExportExcel={() => exportExcelFiltered('إتلاف_المدرسة', filtered, cols)} onExportTxt={() => exportTxtFiltered('إتلاف_المدرسة', filtered, cols)} onExportWA={() => shareWhatsAppRich('سجل إتلاف المدرسة المفلتر', filtered, cols)} />
            <div className="overflow-x-auto rounded-[2.5rem] border shadow-inner">
              <table className="w-full text-center text-sm border-collapse min-w-[1200px]"><thead className="bg-[#FFD966] text-slate-800 font-black"><tr>{cols.map(c => <th key={c.key} className="p-5 border-e border-red-200">{c.label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white font-bold">{filtered.length === 0 ? <tr><td colSpan={cols.length} className="p-20 text-slate-300 italic text-lg font-bold">لا توجد بيانات تطابق الفلتر.</td></tr> : filtered.map(l => <tr key={l.id} className="hover:bg-red-50/30 transition-colors h-12"><td className="p-5 border-e border-slate-50 font-black">{l.studentName}</td><td className="p-5 border-e border-slate-50">{l.grade}</td><td className="p-5 border-e border-slate-50">{l.section}</td><td className="p-5 border-e border-slate-50 text-red-600 text-lg">{l.prevDamageCount + 1}</td><td className="p-5 border-e border-slate-50 text-slate-400 text-xs">{l.date}</td><td className="p-5 border-e border-slate-50">{l.description}</td><td className="p-5 border-e border-slate-50">{l.action}</td><td className="p-5 text-slate-400 text-xs">{l.notes}</td></tr>)}</tbody></table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // START OF CHANGE - Requirement: Parent Visit & Comm Log (12, 13, 14)
  const renderParentVisitModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const nameSugg = nameInput.trim() ? students.filter(s => s.name.includes(nameInput) && !tempNames.includes(s.name)) : [];
    const filtered = (data.parentVisitLogs || []).filter(l => {
      if (appliedNames.length > 0 && !appliedNames.includes(l.studentName)) return false;
      if (filterValues.start && l.date < filterValues.start) return false;
      if (filterValues.end && l.date > filterValues.end) return false;
      if (filterValues.semester && l.semester !== filterValues.semester) return false;
      if (filterValues.grade && l.grade !== filterValues.grade) return false;
      if (filterValues.section && l.section !== filterValues.section) return false;
      return true;
    });

    const saveLog = () => {
      if (!visitForm.studentId) return alert('يرجى اختيار طالب أولاً');
      const newLog: ParentVisitLog = { 
        ...visitForm as ParentVisitLog, 
        id: Date.now().toString(), 
        day: getDayName(visitForm.date || today) 
      };
      updateData({ parentVisitLogs: [newLog, ...(data.parentVisitLogs || [])] });
      setVisitForm({ ...visitForm, studentName: '', studentId: '', visitorName: '', reason: '', actions: '', notes: '' });
      alert('تم حفظ سجل التواصل/الزيارة');
    };

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'اسم الزائر', key: 'visitorName' }, { label: 'الصف', key: 'grade' }, 
      { label: 'الشعبة', key: 'section' }, { label: 'التاريخ', key: 'date' }, { label: 'نوع التواصل', key: 'type' }, 
      { label: 'السبب', key: 'reason' }, { label: 'الإجراءات', key: 'actions' }, { label: 'ملاحظات', key: 'notes' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <div className="flex gap-2">
              <button onClick={() => setShowTable(!showTable)} className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm">
                {showTable ? <Plus size={18}/> : <LayoutList size={18}/>}
                {showTable ? 'رصد جديد' : 'جدول السجلات'}
              </button>
              <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
           </div>
           <h2 className="text-2xl font-black text-indigo-600 flex items-center gap-3">سجل زيارات أولياء الأمور <UserPlus size={24}/></h2>
        </div>

        {!showTable ? (
          <div className="space-y-10">
            <div className="flex gap-4 p-2 bg-slate-100 rounded-3xl w-fit mx-auto shadow-inner border border-white">
              <button onClick={() => setVisitForm({...visitForm, type: 'visit'})} className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all ${visitForm.type === 'visit' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-white'}`}>
                <Users size={18}/> زيارة ولي أمر
              </button>
              <button onClick={() => setVisitForm({...visitForm, type: 'communication'})} className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all ${visitForm.type === 'communication' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-white'}`}>
                <Phone size={18}/> التواصل بولي الأمر
              </button>
            </div>
            
            <div className="space-y-6">
                <div className="relative">
                  <label className="text-xs font-black text-slate-400 mb-2 block mr-2">ابحث عن الطالب</label>
                  <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-indigo-500 shadow-sm transition-all">
                    <Search size={20} className="text-slate-400"/><input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="اكتب اسم الطالب هنا..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[100] bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto">
                      {suggestions.map(s => (
                        <button key={s.id} onClick={() => { setVisitForm({ ...visitForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevVisitCount: (data.parentVisitLogs || []).filter(l => l.studentId === s.id).length }); setSearchQuery(''); }} className="w-full text-right p-4 hover:bg-indigo-50 font-black border-b last:border-none flex justify-between items-center transition-colors"><span>{s.name}</span> <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span></button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border-2 shadow-sm text-center"><label className="text-[10px] block text-slate-400 mb-1">الصف</label><span className="font-black text-lg text-slate-700">{visitForm.grade || '---'}</span></div>
                  <div className="bg-white p-4 rounded-2xl border-2 shadow-sm text-center"><label className="text-[10px] block text-slate-400 mb-1">الشعبة</label><span className="font-black text-lg text-slate-700">{visitForm.section || '---'}</span></div>
                  <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg text-center"><label className="text-[10px] block opacity-80 mb-1">مرات التواصل</label><span className="font-black text-2xl">{visitForm.prevVisitCount ?? 0}</span></div>
                  <div className="bg-white p-2 rounded-2xl border-2 shadow-sm"><label className="text-[10px] block text-slate-400 mr-2 mb-1">التاريخ</label><input type="date" className="w-full p-2 text-xs font-black outline-none bg-transparent" value={visitForm.date} onChange={e => setVisitForm({...visitForm, date: e.target.value})} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2">السبب</label><textarea className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm bg-slate-50 focus:border-indigo-400 min-h-[80px]" value={visitForm.reason} onChange={e => setVisitForm({...visitForm, reason: e.target.value})} placeholder="..." /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2">اسم الزائر/المتواصل</label><textarea className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm bg-slate-50 focus:border-indigo-400 min-h-[80px]" value={visitForm.visitorName} onChange={e => setVisitForm({...visitForm, visitorName: e.target.value})} placeholder="..." /></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2">ملاحظات</label><textarea className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm bg-slate-50 focus:border-indigo-400 min-h-[80px]" value={visitForm.notes} onChange={e => setVisitForm({...visitForm, notes: e.target.value})} placeholder="..." /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2">الإجراءات</label><textarea className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm bg-slate-50 focus:border-indigo-400 min-h-[80px]" value={visitForm.actions} onChange={e => setVisitForm({...visitForm, actions: e.target.value})} placeholder="..." /></div>
                </div>

                <button onClick={saveLog} className="w-full bg-[#0f172a] text-white p-7 rounded-[2.5rem] font-black text-2xl hover:bg-black shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] mt-4"><Save size={32}/> حفظ السجل</button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <FilterSection suggestions={nameSugg} values={filterValues} setValues={setFilterValues} tempNames={tempNames} setTempNames={setTempNames} appliedNames={appliedNames} setAppliedNames={setAppliedNames} nameInput={nameInput} setNameInput={setNameInput} onExportExcel={() => exportExcelFiltered('زيارات_أولياء_الأمور', filtered, cols)} onExportTxt={() => exportTxtFiltered('زيارات_أولياء_الأمور', filtered, cols)} onExportWA={() => shareWhatsAppRich('سجل زيارات وتواصل أولياء الأمور المفلتر', filtered, cols)} />
            <div className="overflow-x-auto rounded-[2.5rem] border shadow-inner">
              <table className="w-full text-center text-sm border-collapse min-w-[1500px]"><thead className="bg-[#FFD966] text-slate-800 font-black"><tr>{cols.map(c => <th key={c.key} className="p-5 border-e border-indigo-200">{c.label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white font-bold">{filtered.length === 0 ? <tr><td colSpan={cols.length} className="p-20 text-slate-300 italic text-lg font-bold">لا توجد بيانات تطابق الفلتر.</td></tr> : filtered.map(l => <tr key={l.id} className="hover:bg-indigo-50/30 transition-colors h-12"><td className="p-5 border-e border-slate-50 font-black">{l.studentName}</td><td className="p-5 border-e border-slate-50">{l.visitorName}</td><td className="p-5 border-e border-slate-50">{l.grade}</td><td className="p-5 border-e border-slate-50">{l.section}</td><td className="p-5 border-e border-slate-50 text-slate-400 text-xs">{l.date}</td><td className="p-5 border-e border-slate-50">{l.type === 'visit' ? 'زيارة' : 'تواصل'}</td><td className="p-5 border-e border-slate-50 text-xs">{l.reason}</td><td className="p-5 border-e border-slate-50 text-xs">{l.actions}</td><td className="p-5 text-slate-400 text-xs">{l.notes}</td></tr>)}</tbody></table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentModule = () => {
    switch (activeSubTab) {
      case 'الغياب اليومي': return renderAbsenceModule();
      case 'التأخر': return renderLatenessModule();
      case 'المخالفات الطلابية': return renderViolationModule();
      case 'خروج طالب أثناء الدراسة': return renderExitModule();
      case 'سجل الإتلاف المدرسي': return renderDamageModule();
      case 'سجل زيارة أولياء الأمور والتواصل بهم': return renderParentVisitModule();
      default:
        return (
          <div className="bg-white p-8 rounded-[3rem] border shadow-2xl relative overflow-hidden font-arabic">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800">{activeSubTab}</h3>
                <button onClick={() => setActiveSubTab(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X/></button>
            </div>
            <div className="space-y-4">
                <p className="text-slate-500 font-bold text-right">هذا السجل ({activeSubTab}) قيد التطوير البرمجي ليكون متكاملاً مع باقي أقسام البرنامج.</p>
                <div className="bg-slate-50 p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <Database size={64} />
                    <span className="font-black text-lg">قاعدة بيانات قيد التجهيز</span>
                </div>
            </div>
          </div>
        );
    }
  };

  // Rest of the main component render
  const exportExcelFiltered = (title: string, tableData: any[], columns: { label: string, key: string }[]) => {
    const worksheet = XLSX.utils.json_to_sheet(tableData.map(row => {
      const formatted: any = {};
      columns.forEach(col => { formatted[col.label] = Array.isArray(row[col.key]) ? row[col.key].join(', ') : row[col.key]; });
      return formatted;
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${title}_Report.xlsx`);
  };

  const exportTxtFiltered = (title: string, tableData: any[], columns: { label: string, key: string }[]) => {
    let text = `${title}\n`;
    text += `التاريخ: ${new Date().toLocaleDateString('ar-EG')}\n\n`;
    tableData.forEach((row, idx) => {
      text += `بند ${idx + 1}:\n`;
      columns.forEach(col => { text += `${col.label}: ${row[col.key]}\n`; });
      text += `\n`;
    });
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.txt`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-arabic pb-20">
      {!activeSubTab ? (
        <>
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                <Sparkles className="text-blue-600 animate-pulse" />
                التقارير الخاصة والمتقدمة
              </h2>
              <p className="text-slate-500 font-bold mt-1">إدارة شاملة لجميع السجلات الإدارية والتربوية</p>
            </div>
          </header>
          <div className="flex flex-wrap gap-4">
            {Object.entries(structure).map(([key, cat]) => (
              <button key={key} onClick={() => setActiveTab(key as MainTab)} className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black text-lg transition-all shadow-sm ${activeTab === key ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-white text-slate-600 border border-slate-100 hover:bg-blue-50'}`}>
                {React.cloneElement(cat.icon as React.ReactElement, { size: 24 })} {cat.title}
              </button>
            ))}
          </div>
          <div className="bg-white p-8 rounded-[3rem] border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {structure[activeTab].items.map((item, idx) => (
                <button key={idx} onClick={() => { setActiveSubTab(item); setShowTable(false); }} className="group flex items-center justify-between p-6 rounded-[1.5rem] bg-slate-50 border-2 border-slate-50 hover:border-blue-500 hover:bg-white transition-all text-right shadow-sm hover:shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <FileText size={18} />
                    </div>
                    <span className="font-black text-slate-700 group-hover:text-blue-600 transition-colors text-xs">{item}</span>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : renderCurrentModule()}
    </div>
  );
};

export default SpecialReportsPage;
