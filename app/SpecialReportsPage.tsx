
import React, { useState, useMemo, useEffect } from 'react';
import { useGlobal } from '../context/GlobalState';
import { 
  Briefcase, Users, FileText, GraduationCap, 
  ChevronRight, Calendar, Plus, Save, Share2, 
  Trash2, FileSpreadsheet, Download, Search, 
  CheckCircle, AlertCircle, Phone, MessageSquare, 
  UserCircle, Star, Filter, Clock, ShieldAlert, X,
  FileSearch, Archive, CheckSquare, PencilLine, Zap,
  Sparkles, Database, FileUp, FileDown, MessageCircle,
  Activity, Fingerprint, History, RefreshCw, Upload
} from 'lucide-react';
import { AbsenceLog, LatenessLog, StudentViolationLog, StudentReport } from '../types';
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
  const [filterValues, setFilterValues] = useState({ 
    semester: '', 
    start: today, 
    end: today,   
    name: '', 
    grade: '', 
    section: '' 
  });

  // State for multi-name selection logic in filtering
  const [tempNames, setTempNames] = useState<string[]>([]);
  const [appliedNames, setAppliedNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState('');

  // Violation Filter states
  const [violationFilterDates, setViolationFilterDates] = useState({ start: today, end: today });
  const [tempViolationNames, setTempViolationNames] = useState<string[]>([]);
  const [appliedViolationNames, setAppliedViolationNames] = useState<string[]>([]);
  const [violationNameInput, setViolationNameInput] = useState('');

  // START OF CHANGE - Lateness Filter States (Requirement 1 & 2)
  const [latenessFilterDates, setLatenessFilterDates] = useState({ start: today, end: today });
  const [tempLatenessNames, setTempLatenessNames] = useState<string[]>([]);
  const [appliedLatenessNames, setAppliedLatenessNames] = useState<string[]>([]);
  const [latenessNameInput, setLatenessNameInput] = useState('');
  // END OF CHANGE

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

  // --- Specialized Modules Logic ---

  // 1. Absence Module
  const [absenceForm, setAbsenceForm] = useState<Partial<AbsenceLog>>({
    date: new Date().toISOString().split('T')[0],
    semester: 'الأول',
    status: 'expected',
    reason: '',
    commStatus: 'لم يتم التواصل',
    commType: 'هاتف',
    replier: 'الأب',
    result: 'لم يتم الرد',
    notes: ''
  });

  const saveAbsence = () => {
    if (!absenceForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: AbsenceLog = {
      ...absenceForm as AbsenceLog,
      id: Date.now().toString(),
      day: getDayName(absenceForm.date || '')
    };
    const currentLogs = data.absenceLogs || [];
    updateData({ absenceLogs: [newLog, ...currentLogs] });
    
    // Update student report history count
    const updatedStudents = students.map(s => 
      s.id === newLog.studentId ? { ...s, totalAbsences: (s.totalAbsences || 0) + 1 } : s
    );
    updateData({ studentReports: updatedStudents });
    
    alert('تم حفظ بيانات الغياب بنجاح');
    setAbsenceForm({ ...absenceForm, studentName: '', studentId: '', notes: '', reason: '' });
  };

  // 2. Lateness Module
  const [latenessForm, setLatenessForm] = useState<Partial<LatenessLog>>({
    date: new Date().toISOString().split('T')[0],
    semester: 'الأول',
    status: 'recurring',
    reason: '',
    action: 'تنبيه 1',
    pledge: '',
    notes: ''
  });

  const saveLateness = () => {
    if (!latenessForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: LatenessLog = {
      ...latenessForm as LatenessLog,
      id: Date.now().toString(),
      day: getDayName(latenessForm.date || '')
    };
    const currentLogs = data.latenessLogs || [];
    updateData({ latenessLogs: [newLog, ...currentLogs] });
    alert('تم حفظ بيانات التأخر بنجاح');
    setLatenessForm({ ...latenessForm, studentName: '', studentId: '', notes: '', reason: '', pledge: '' });
  };

  // 3. Violation Module
  const [violationForm, setViolationForm] = useState<Partial<StudentViolationLog>>({
    date: new Date().toISOString().split('T')[0],
    semester: 'الأول',
    behaviorViolations: [],
    dutiesViolations: [],
    achievementViolations: [],
    status: 'rare',
    action: 'تنبيه 1',
    pledge: '',
    notes: ''
  });

  const toggleViolationType = (category: 'behavior' | 'duties' | 'achievement', value: string) => {
    const field = category === 'behavior' ? 'behaviorViolations' : category === 'duties' ? 'dutiesViolations' : 'achievementViolations';
    const current = violationForm[field] || [];
    const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    setViolationForm({ ...violationForm, [field]: updated });
  };

  const addCustomViolationElement = (category: 'behavior' | 'duties' | 'achievement') => {
    const val = prompt('أدخل اسم المخالفة الجديدة:');
    if (!val) return;
    const customs = data.customViolationElements || { behavior: [], duties: [], achievement: [] };
    const updated = { ...customs, [category]: [...customs[category], val] };
    updateData({ customViolationElements: updated });
  };

  const saveViolation = () => {
    if (!violationForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: StudentViolationLog = {
      ...violationForm as StudentViolationLog,
      id: Date.now().toString(),
      totalViolations: (violationForm.behaviorViolations?.length || 0) + 
                       (violationForm.dutiesViolations?.length || 0) + 
                       (violationForm.achievementViolations?.length || 0)
    };
    const currentLogs = data.studentViolationLogs || [];
    updateData({ studentViolationLogs: [newLog, ...currentLogs] });
    alert('تم تسجيل المخالفة بنجاح');
    setViolationForm({ ...violationForm, studentName: '', studentId: '', behaviorViolations: [], dutiesViolations: [], achievementViolations: [] });
  };

  // Generic Export/Share
  const exportToWhatsApp = (title: string, tableData: any[], columns: { label: string, key: string }[]) => {
    let msg = `*📋 ${title}*\n`;
    msg += `*التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n`;
    msg += `----------------------------------\n\n`;
    tableData.forEach((row, idx) => {
      msg += `*🔹 البند (${idx + 1}):*\n`;
      columns.forEach(col => {
        let val = Array.isArray(row[col.key]) ? row[col.key].join('، ') : row[col.key];
        let symbol = '▪️';
        
        // Dynamic Symbols for Visuals (Requirement L)
        if (col.key === 'studentName' || col.key === 'name') symbol = '👤';
        if (col.key === 'grade') symbol = '📍';
        if (col.key === 'totalViolations' || col.key === 'prevLatenessCount') symbol = '🔢';
        if (col.key === 'date') symbol = '📅';
        if (col.key === 'status') symbol = '🏷️';
        if (col.key === 'action' || col.key === 'procedure') symbol = '🛡️';
        if (col.key === 'reason') symbol = '❓';
        if (col.key === 'pledge') symbol = '✍️';
        
        // Color coding logic using WhatsApp emojis (Requirement L)
        if (val?.toString().includes('تنبيه') || val?.toString().includes('ضعيف') || val?.toString().includes('متكرر')) symbol = '⚠️';
        if (val?.toString().includes('blacklist') || val?.toString().includes('كثير المخالفة') || val?.toString().includes('دائم')) symbol = '🔴';
        if (val?.toString().includes('نادر') || val?.toString().includes('ممتاز') || val?.toString().includes('تم التوقيع')) symbol = '🟢';
        
        msg += `${symbol} *${col.label}:* ${val || '---'}\n`;
      });
      msg += `\n`;
    });
    msg += `----------------------------------\n`;
    msg += `*إعداد المستشار الإداري والتربوي إبراهيم دخان*`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // --- Component Views ---

  const renderAbsenceModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    
    const filteredLogs = (data.absenceLogs || []).filter(l => {
      if (appliedNames.length > 0 && !appliedNames.includes(l.studentName)) return false;
      if (filterValues.start && l.date < filterValues.start) return false;
      if (filterValues.end && l.date > filterValues.end) return false;
      if (filterValues.semester && l.semester !== filterValues.semester) return false;
      return true;
    });

    const nameSuggestions = nameInput.trim() ? students.filter(s => s.name.includes(nameInput) && !tempNames.includes(s.name)) : [];

    return (
      <div className="bg-white p-6 rounded-[2.5rem] border-2 shadow-xl animate-in fade-in duration-300 font-arabic text-right">
        <div className="flex items-center justify-between mb-8 border-b pb-4">
          <div className="flex gap-2">
            <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-black text-sm hover:bg-blue-100 transition-all">
              {showTable ? <Plus size={16}/> : <Archive size={16}/>}
              {showTable ? 'تسجيل جديد' : 'جدول الغائبين'}
            </button>
            <button onClick={() => setActiveSubTab(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"><X/></button>
          </div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Clock className="text-blue-600" />
            غياب يوم {getDayName(absenceForm.date || '')} بتاريخ {absenceForm.date}
          </h2>
        </div>

        {!showTable ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {['expected', 'recurring', 'week1', 'week2', 'most', 'disconnected'].map(st => (
                  <button key={st} onClick={() => setAbsenceForm({...absenceForm, status: st as any})} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${absenceForm.status === st ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                    {st === 'expected' ? 'غياب متوقع' : st === 'recurring' ? 'غياب متكرر' : st === 'week1' ? 'أكثر من أسبوع' : st === 'week2' ? 'أكثر من أسبوعين' : st === 'most' ? 'الأكثر غياباً' : 'المنقطع'}
                  </button>
                ))}
              </div>

              <div className="relative">
                <label className="text-xs font-black text-slate-400 mb-1 block">اسم الطالب</label>
                <div className="flex items-center gap-2 bg-slate-50 border-2 rounded-2xl p-4 focus-within:border-blue-500 transition-all">
                  <Search className="text-slate-400" size={18}/>
                  <input type="text" className="bg-transparent w-full outline-none font-black" placeholder="ابحث عن الاسم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-2xl shadow-2xl mt-1 max-h-60 overflow-y-auto">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => { 
                        setAbsenceForm({ ...absenceForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevAbsenceCount: (data.absenceLogs || []).filter(l => l.studentId === s.id).length });
                        setSearchQuery('');
                      }} className="w-full text-right p-4 hover:bg-blue-50 font-black border-b last:border-none">{s.name}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl border">
                  <label className="text-[10px] text-blue-500 font-black block">الفصل</label>
                  <select className="bg-transparent font-black w-full" value={absenceForm.semester} onChange={e => setAbsenceForm({...absenceForm, semester: e.target.value as any})}>
                    <option value="الأول">الأول</option><option value="الثاني">الثاني</option>
                  </select>
                </div>
                <div className="bg-purple-50 p-4 rounded-2xl border">
                  <label className="text-[10px] text-purple-500 font-black block">الصف/الشعبة</label>
                  <div className="font-black">{absenceForm.studentName ? `${absenceForm.grade}/${absenceForm.section}` : '---'}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl border text-center">
                  <label className="text-[10px] text-orange-500 font-black block">غياب سابق</label>
                  <div className="font-black text-xl">{absenceForm.prevAbsenceCount ?? 0}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400">سبب الغياب</label>
                <div className="flex flex-wrap gap-2">
                  {['مرض', 'انشغال', 'تأخر', 'لم يمر له الباص', 'سفر'].map(r => (
                    <button key={r} onClick={() => setAbsenceForm({...absenceForm, reason: r})} className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${absenceForm.reason === r ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500'}`}>{r}</button>
                  ))}
                  <input type="text" className="flex-1 p-2 border rounded-lg text-xs font-black" placeholder="سبب آخر..." value={absenceForm.reason} onChange={e => setAbsenceForm({...absenceForm, reason: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400">حالة التواصل</label>
                  <select className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black" value={absenceForm.commStatus} onChange={e => setAbsenceForm({...absenceForm, commStatus: e.target.value as any})}>
                    <option value="تم التواصل">تم التواصل</option><option value="لم يتم التواصل">لم يتم التواصل</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400">نوع التواصل</label>
                  <select className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black" value={absenceForm.commType} onChange={e => setAbsenceForm({...absenceForm, commType: e.target.value as any})}>
                    <option value="هاتف">هاتف</option><option value="رسالة sms">رسالة SMS</option><option value="رسالة واتس">واتساب</option><option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400">صفة المجيب</label>
                  <select className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black" value={absenceForm.replier} onChange={e => setAbsenceForm({...absenceForm, replier: e.target.value as any})}>
                    <option value="الأب">الأب</option><option value="الأم">الأم</option><option value="الجد">الجد</option><option value="غيرهم">غيرهم</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400">نتيجة التواصل</label>
                  <select className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black" value={absenceForm.result} onChange={e => setAbsenceForm({...absenceForm, result: e.target.value})}>
                    <option value="تم الرد">تم الرد</option><option value="لم يتم الرد">لم يتم الرد</option>
                  </select>
                </div>
              </div>

              <textarea className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black min-h-[100px]" placeholder="ملاحظات أخرى..." value={absenceForm.notes} onChange={e => setAbsenceForm({...absenceForm, notes: e.target.value})}></textarea>

              <button onClick={saveAbsence} className="w-full bg-blue-600 text-white p-5 rounded-3xl font-black text-xl hover:bg-blue-700 shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                <Save size={24}/> حفظ بيانات الغياب
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border space-y-4">
               <div className="flex flex-wrap gap-4 items-end">
                 <div className="flex-1 min-w-[300px] space-y-2">
                   <label className="text-xs font-black text-slate-400">فلترة حسب الاسم</label>
                   <div className="flex gap-2">
                     <div className="relative flex-1">
                       <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border focus-within:ring-2 ring-blue-100 transition-all">
                         <Search size={14} className="text-slate-400"/>
                         <input 
                           type="text" 
                           className="text-xs font-bold outline-none bg-transparent w-full" 
                           placeholder="اكتب اسم الطالب لإضافته..." 
                           value={nameInput} 
                           onChange={e => setNameInput(e.target.value)} 
                         />
                       </div>
                       {nameSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-[60] bg-white border rounded-xl shadow-xl mt-1 max-h-40 overflow-y-auto">
                           {nameSuggestions.map(s => (
                             <button key={s.id} onClick={() => { setTempNames([...tempNames, s.name]); setNameInput(''); }} className="w-full text-right p-2 text-[10px] font-black hover:bg-blue-50 border-b last:border-none">
                               {s.name}
                             </button>
                           ))}
                        </div>
                       )}
                     </div>
                     <button 
                       onClick={() => { setAppliedNames(tempNames); }}
                       className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                     >
                       موافق
                     </button>
                     <button 
                       onClick={() => { setTempNames([]); setAppliedNames([]); }}
                       className="bg-slate-200 text-slate-600 px-3 py-2 rounded-xl font-black text-[10px] hover:bg-slate-300"
                     >
                       إعادة ضبط
                     </button>
                   </div>
                   <div className="flex flex-wrap gap-1">
                      {tempNames.map(name => (
                        <span key={name} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-black">
                          {name}
                          <button onClick={() => setTempNames(tempNames.filter(n => n !== name))}><X size={10}/></button>
                        </span>
                      ))}
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400">الفترة الزمنية</label>
                   <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border">
                     <Calendar size={14} className="text-slate-400"/>
                     <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-400">من:</span>
                       <input type="date" className="text-xs font-bold outline-none bg-transparent" value={filterValues.start} onChange={e => setFilterValues({...filterValues, start: e.target.value})} />
                     </div>
                     <span className="mx-2 text-slate-300">|</span>
                     <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-400">إلى:</span>
                       <input type="date" className="text-xs font-bold outline-none bg-transparent" value={filterValues.end} onChange={e => setFilterValues({...filterValues, end: e.target.value})} />
                     </div>
                   </div>
                 </div>

                 <div className="flex gap-2 pb-1">
                    <button onClick={() => exportToWhatsApp('جدول الغياب المفلتر', filteredLogs, [
                      { label: 'الاسم', key: 'studentName' },
                      { label: 'الصف', key: 'grade' },
                      { label: 'التاريخ', key: 'date' },
                      { label: 'الحالة', key: 'status' },
                      { label: 'السبب', key: 'reason' },
                      { label: 'النتيجة', key: 'result' }
                    ])} className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-md"><MessageCircle size={20}/></button>
                    <button className="p-3 bg-slate-800 text-white rounded-xl hover:bg-black transition-all shadow-md"><FileSpreadsheet size={20}/></button>
                 </div>
               </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border-2">
              <table className="w-full text-center text-sm">
                <thead className="bg-[#FFD966] text-slate-800 font-black">
                  <tr>
                    <th className="p-4 border-e">اسم الطالب</th>
                    <th className="p-4 border-e">الصف / الشعبة</th>
                    <th className="p-4 border-e">عدد الغياب</th>
                    <th className="p-4 border-e">التاريخ</th>
                    <th className="p-4 border-e">السبب</th>
                    <th className="p-4 border-e">حالة التواصل</th>
                    <th className="p-4 border-e">المجيب</th>
                    <th className="p-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-slate-400 italic">لا توجد بيانات غياب مسجلة لهذه الاختيارات حالياً.</td>
                    </tr>
                  ) : (
                    filteredLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50 font-bold transition-colors">
                        <td className="p-4 border-e font-black">{l.studentName}</td>
                        <td className="p-4 border-e">{l.grade} / {l.section}</td>
                        <td className="p-4 border-e font-black text-red-600">{l.prevAbsenceCount + 1}</td>
                        <td className="p-4 border-e">{l.date}</td>
                        <td className="p-4 border-e">{l.reason}</td>
                        <td className="p-4 border-e">{l.commStatus}</td>
                        <td className="p-4 border-e">{l.replier}</td>
                        <td className="p-4 text-xs">{l.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLatenessModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    
    // START OF CHANGE - Requirement 1, 2: Filtering logic for Lateness module
    const filteredLogs = (data.latenessLogs || []).filter(l => {
      // Filter by multiple names (Requirement 2)
      if (appliedLatenessNames.length > 0 && !appliedLatenessNames.includes(l.studentName)) return false;
      
      // Filter by Date Range (Requirement 1)
      if (latenessFilterDates.start && l.date < latenessFilterDates.start) return false;
      if (latenessFilterDates.end && l.date > latenessFilterDates.end) return false;
      
      return true;
    });

    const lNameSuggestions = latenessNameInput.trim() ? students.filter(s => s.name.includes(latenessNameInput) && !tempLatenessNames.includes(s.name)) : [];
    // END OF CHANGE

    return (
      <div className="bg-white p-6 rounded-[2.5rem] border-2 shadow-xl animate-in fade-in duration-300 font-arabic text-right">
        <div className="flex items-center justify-between mb-8 border-b pb-4">
          <div className="flex gap-2">
            <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-black text-sm hover:bg-blue-100 transition-all">
              {showTable ? <Plus size={16}/> : <History size={16}/>}
              {showTable ? 'تسجيل جديد' : 'أرشيف التأخر'}
            </button>
            <button onClick={() => setActiveSubTab(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"><X/></button>
          </div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Clock className="text-orange-500" />
            تأخر يوم {getDayName(latenessForm.date || '')} بتاريخ {latenessForm.date}
          </h2>
        </div>

        {!showTable ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {['recurring', 'frequent', 'permanent'].map(st => (
                  <button key={st} onClick={() => setLatenessForm({...latenessForm, status: st as any})} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${latenessForm.status === st ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                    {st === 'recurring' ? 'تأخر متكرر' : st === 'frequent' ? 'كثير التأخر' : 'دائم التأخر'}
                  </button>
                ))}
              </div>

              <div className="relative">
                <label className="text-xs font-black text-slate-400 mb-1 block">اسم الطالب</label>
                <div className="flex items-center gap-2 bg-slate-50 border-2 rounded-2xl p-4 focus-within:border-blue-500 transition-all">
                  <UserCircle className="text-slate-400" size={18}/>
                  <input type="text" className="bg-transparent w-full outline-none font-black" placeholder="ابحث عن الاسم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-2xl shadow-2xl mt-1">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => { 
                        setLatenessForm({ ...latenessForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevLatenessCount: (data.latenessLogs || []).filter(l => l.studentId === s.id).length });
                        setSearchQuery('');
                      }} className="w-full text-right p-4 hover:bg-blue-50 font-black border-b last:border-none">{s.name}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl border">
                  <label className="text-[10px] text-blue-500 font-black block">الفصل</label>
                  <select className="bg-transparent font-black w-full" value={latenessForm.semester} onChange={e => setLatenessForm({...latenessForm, semester: e.target.value as any})}>
                    <option value="الأول">الأول</option><option value="الثاني">الثاني</option>
                  </select>
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl border text-center">
                  <label className="text-[10px] text-orange-500 font-black block">تأخر سابق</label>
                  <div className="font-black text-xl">{latenessForm.prevLatenessCount ?? 0}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400">سبب التأخر</label>
                <div className="flex flex-wrap gap-2">
                  {['مرض', 'انشغال', 'نوم', 'لم يمر له الباص', 'بلا عذر'].map(r => (
                    <button key={r} onClick={() => setLatenessForm({...latenessForm, reason: r})} className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${latenessForm.reason === r ? 'bg-orange-500 text-white' : 'bg-white text-slate-500'}`}>{r}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400">الإجراء المتخذ</label>
                <select className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black" value={latenessForm.action} onChange={e => setLatenessForm({...latenessForm, action: e.target.value})}>
                  {['تنبيه 1', 'تنبيه 2', 'تعهد', 'اتصال بولي الأمر', 'توقيف جزئي', 'الرفع لجهة عليا'].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-4">
                <h4 className="flex items-center gap-2 font-black text-sm"><Fingerprint className="text-orange-400"/> بصمة الطالب (تعهد)</h4>
                <div className="text-xs font-bold leading-relaxed opacity-80">
                  أتعهد بعدم تكرار التأخر وفي حالة التكرار فللإدارة الحق في اتخاذ اللازم.
                </div>
                <button onClick={() => setLatenessForm({...latenessForm, pledge: 'تم التوقيع'})} className={`w-full p-3 rounded-xl font-black text-sm transition-all ${latenessForm.pledge ? 'bg-green-600' : 'bg-white text-slate-900'}`}>
                  {latenessForm.pledge || 'توقيع البصمة'}
                </button>
              </div>

              <button onClick={saveLateness} className="w-full bg-slate-800 text-white p-5 rounded-3xl font-black text-xl hover:bg-black shadow-xl active:scale-95 transition-all">حفظ البيانات</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* START OF CHANGE - Requirement 1, 2 & 3: Filter bar and Actions for Lateness module */}
            <div className="bg-slate-50 p-6 rounded-3xl border space-y-4 shadow-sm">
                <div className="flex flex-wrap gap-4 items-end">
                    {/* Multi-Name selection (Requirement 2) */}
                    <div className="flex-1 min-w-[300px] space-y-2">
                        <label className="text-xs font-black text-slate-400">فلترة بأسماء الطلاب المتأخرين</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border focus-within:ring-2 ring-orange-100 transition-all">
                                    <Search size={14} className="text-slate-400"/>
                                    <input 
                                        type="text" 
                                        className="text-xs font-bold outline-none bg-transparent w-full" 
                                        placeholder="اكتب اسم الطالب..." 
                                        value={latenessNameInput} 
                                        onChange={e => setLatenessNameInput(e.target.value)} 
                                    />
                                </div>
                                {lNameSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-[70] bg-white border rounded-xl shadow-xl mt-1 max-h-40 overflow-y-auto">
                                        {lNameSuggestions.map(s => (
                                            <button key={s.id} onClick={() => { setTempLatenessNames([...tempLatenessNames, s.name]); setLatenessNameInput(''); }} className="w-full text-right p-2 text-[10px] font-black hover:bg-orange-50 border-b last:border-none">
                                                {s.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => setAppliedLatenessNames(tempLatenessNames)}
                                className="bg-orange-600 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-orange-700 shadow-sm transition-all active:scale-95"
                            >
                                موافق
                            </button>
                            <button 
                                onClick={() => { setTempLatenessNames([]); setAppliedLatenessNames([]); }}
                                className="bg-slate-200 text-slate-600 px-3 py-2 rounded-xl font-black text-[10px] hover:bg-slate-300"
                            >
                                إعادة ضبط
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {tempLatenessNames.map(name => (
                                <span key={name} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-[10px] font-black">
                                    {name}
                                    <button onClick={() => setTempLatenessNames(tempLatenessNames.filter(n => n !== name))}><X size={10}/></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Date Range Selection (Requirement 1) */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400">تاريخ التأخر</label>
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border">
                            <Calendar size={14} className="text-slate-400"/>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400">من:</span>
                                <input type="date" className="text-xs font-bold outline-none bg-transparent" value={latenessFilterDates.start} onChange={e => setLatenessFilterDates({...latenessFilterDates, start: e.target.value})} />
                            </div>
                            <span className="mx-2 text-slate-300">|</span>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400">إلى:</span>
                                <input type="date" className="text-xs font-bold outline-none bg-transparent" value={latenessFilterDates.end} onChange={e => setLatenessFilterDates({...latenessFilterDates, end: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons (Requirement 3) */}
                    <div className="flex gap-2 pb-1">
                        <button title="استيراد" className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"><Upload size={20}/></button>
                        <button title="تصدير TXT" className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"><FileText size={20}/></button>
                        <button title="تصدير Excel" className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100"><FileSpreadsheet size={20}/></button>
                        <button 
                            title="إرسال واتساب"
                            onClick={() => exportToWhatsApp('سجل التأخر المفلتر', filteredLogs, [
                                { label: 'اسم الطالب', key: 'studentName' },
                                { label: 'التاريخ', key: 'date' },
                                { label: 'السبب', key: 'reason' },
                                { label: 'الإجراء المتخذ', key: 'action' },
                                { label: 'البصمة', key: 'pledge' }
                            ])} 
                            className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-md transition-all active:scale-95"
                        >
                            <MessageCircle size={20}/>
                        </button>
                    </div>
                </div>
            </div>
            {/* END OF CHANGE */}

             <div className="overflow-x-auto rounded-3xl border-2">
              <table className="w-full text-center text-sm">
                <thead className="bg-[#FFD966] text-slate-800 font-black">
                  <tr>
                    <th className="p-4 border-e">اسم الطالب</th>
                    <th className="p-4 border-e">التاريخ</th>
                    <th className="p-4 border-e">السبب</th>
                    <th className="p-4 border-e">الإجراء</th>
                    <th className="p-4">البصمة</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-slate-400 italic">لا توجد سجلات تأخر لهذه الفترة حالياً.</td>
                    </tr>
                  ) : (
                    filteredLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50 font-bold transition-colors">
                        <td className="p-4 border-e font-black">{l.studentName}</td>
                        <td className="p-4 border-e">{l.date}</td>
                        <td className="p-4 border-e">{l.reason}</td>
                        <td className="p-4 border-e text-orange-600 font-black">{l.action}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] ${l.pledge ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                {l.pledge || 'لم يوقع'}
                            </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderViolationModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const customs = data.customViolationElements || { behavior: [], duties: [], achievement: [] };
    
    const filteredLogs = (data.studentViolationLogs || []).filter(l => {
        if (appliedViolationNames.length > 0 && !appliedViolationNames.includes(l.studentName)) return false;
        if (violationFilterDates.start && l.date < violationFilterDates.start) return false;
        if (violationFilterDates.end && l.date > violationFilterDates.end) return false;
        return true;
    });

    const vNameSuggestions = violationNameInput.trim() ? students.filter(s => s.name.includes(violationNameInput) && !tempViolationNames.includes(s.name)) : [];

    const behaviorItems = ["تأخر عن الطابور", "تأخر عن حصة", "كثير الكلام", "كثير الشغب", "عدواني", "تطاول على معلم", "اعتداء جسدي", "اعتداء لفظي", "أخذ أدوات الغير", "إتلاف ممتلكات", ...customs.behavior];
    const dutiesItems = ["تقصير في الواجبات", "تقصير في الدفاتر", "تقصير في الكتب", "عدم الكتابة بالحصة", "عدم حل التكليف", ...customs.duties];
    const achievementItems = ["عدم حفظ الدرس", "عدم المشاركة", "كثير النوم", "كثير الشرود", "امتناع عن اختبار", ...customs.achievement];

    return (
      <div className="bg-white p-6 rounded-[2.5rem] border-2 shadow-xl animate-in fade-in duration-300 font-arabic text-right">
        <div className="flex items-center justify-between mb-8 border-b pb-4">
          <div className="flex gap-2">
            <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-black text-sm hover:bg-blue-100 transition-all">
              {showTable ? <Plus size={16}/> : <ShieldAlert size={16}/>}
              {showTable ? 'رصد جديد' : 'جدول المخالفات'}
            </button>
            <button onClick={() => setActiveSubTab(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"><X/></button>
          </div>
          <h2 className="text-2xl font-black text-red-600 flex items-center gap-2">
            <AlertCircle /> سجل المخالفات الطلابية
          </h2>
        </div>

        {!showTable ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-[2.5rem]">
              <div className="space-y-4">
                <div className="relative">
                    <label className="text-xs font-black text-slate-400 mb-1 block">اسم الطالب</label>
                    <input type="text" className="w-full p-4 bg-white border-2 rounded-2xl font-black outline-none focus:border-red-500" placeholder="ابحث عن الاسم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-2xl shadow-2xl mt-1">
                        {suggestions.map(s => (
                          <button key={s.id} onClick={() => { 
                            setViolationForm({ ...violationForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, totalViolations: (data.studentViolationLogs || []).filter(l => l.studentId === s.id).length });
                            setSearchQuery('');
                          }} className="w-full text-right p-4 hover:bg-red-50 font-black border-b last:border-none">{s.name}</button>
                        ))}
                      </div>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-3 rounded-xl text-center"><label className="text-[10px] block text-slate-400">الصف</label><span className="font-black">{violationForm.grade || '---'}</span></div>
                    <div className="bg-white p-3 rounded-xl text-center"><label className="text-[10px] block text-slate-400">الشعبة</label><span className="font-black">{violationForm.section || '---'}</span></div>
                    <div className="bg-white p-3 rounded-xl text-center"><label className="text-[10px] block text-slate-400">إجمالي السوابق</label><span className="font-black text-red-600">{violationForm.totalViolations || 0}</span></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-black block mb-1">الفصل</label><select className="w-full p-4 bg-white border rounded-2xl" value={violationForm.semester} onChange={e => setViolationForm({...violationForm, semester: e.target.value as any})}><option value="الأول">الأول</option><option value="الثاني">الثاني</option></select></div>
                    <div><label className="text-xs font-black block mb-1">التاريخ</label><input type="date" className="w-full p-4 bg-white border rounded-2xl" value={violationForm.date} onChange={e => setViolationForm({...violationForm, date: e.target.value})}/></div>
                </div>
                <div>
                    <label className="text-xs font-black block mb-1">حالة المخالفة</label>
                    <div className="flex gap-2">
                        {['blacklist', 'high', 'medium', 'rare'].map(st => (
                            <button key={st} onClick={() => setViolationForm({...violationForm, status: st as any})} className={`flex-1 p-2 rounded-xl text-[10px] font-black border ${violationForm.status === st ? 'bg-red-600 text-white' : 'bg-white'}`}>
                                {st === 'blacklist' ? 'القائمة السوداء' : st === 'high' ? 'كثير المخالفة' : st === 'medium' ? 'متوسط' : 'نادر'}
                            </button>
                        ))}
                    </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between"><h4 className="font-black text-sm border-r-4 border-red-500 pr-2">قسم السلوك</h4><button onClick={() => addCustomViolationElement('behavior')} className="p-1 bg-red-50 text-red-600 rounded-lg"><Plus size={14}/></button></div>
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto p-2 bg-slate-50 rounded-2xl shadow-inner">
                        {behaviorItems.map(v => (
                            <button key={v} onClick={() => toggleViolationType('behavior', v)} className={`p-3 text-right text-xs font-bold rounded-xl border transition-all ${violationForm.behaviorViolations?.includes(v) ? 'bg-red-500 text-white' : 'bg-white text-slate-500'}`}>{v}</button>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between"><h4 className="font-black text-sm border-r-4 border-blue-500 pr-2">الواجبات والدفاتر</h4><button onClick={() => addCustomViolationElement('duties')} className="p-1 bg-blue-50 text-blue-600 rounded-lg"><Plus size={14}/></button></div>
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto p-2 bg-slate-50 rounded-2xl shadow-inner">
                        {dutiesItems.map(v => (
                            <button key={v} onClick={() => toggleViolationType('duties', v)} className={`p-3 text-right text-xs font-bold rounded-xl border transition-all ${violationForm.dutiesViolations?.includes(v) ? 'bg-blue-500 text-white' : 'bg-white text-slate-500'}`}>{v}</button>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between"><h4 className="font-black text-sm border-r-4 border-green-500 pr-2">التحصيل العلمي</h4><button onClick={() => addCustomViolationElement('achievement')} className="p-1 bg-green-50 text-green-600 rounded-lg"><Plus size={14}/></button></div>
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto p-2 bg-slate-50 rounded-2xl shadow-inner">
                        {achievementItems.map(v => (
                            <button key={v} onClick={() => toggleViolationType('achievement', v)} className={`p-3 text-right text-xs font-bold rounded-xl border transition-all ${violationForm.achievementViolations?.includes(v) ? 'bg-green-500 text-white' : 'bg-white text-slate-500'}`}>{v}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8">
                <div className="space-y-4">
                    <label className="text-xs font-black block">الإجراء المتخذ</label>
                    <select className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black" value={violationForm.action} onChange={e => setViolationForm({...violationForm, action: e.target.value})}>
                        {['تنبيه 1', 'تنبيه 2', 'تعهد', 'اتصال بولي الأمر', 'توقيف جزئي', 'الرفع لجهة عليا'].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <textarea className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black min-h-[80px]" placeholder="ملاحظات إضافية..." value={violationForm.notes} onChange={e => setViolationForm({...violationForm, notes: e.target.value})}></textarea>
                </div>
                <div className="p-6 bg-red-600 text-white rounded-[2.5rem] shadow-xl space-y-4">
                    <h4 className="flex items-center gap-2 font-black text-sm"><Fingerprint className="text-red-200"/> بصمة الطالب (تعهد)</h4>
                    <p className="text-[10px] font-bold opacity-90 leading-relaxed">أتعهد بعدم تكرار المخالفة وفي حالة التكرار فللإدارة الحق في اتخاذ اللازم.</p>
                    <button onClick={() => setViolationForm({...violationForm, pledge: 'تم التبصيم'})} className={`w-full p-4 rounded-2xl font-black transition-all ${violationForm.pledge ? 'bg-white text-red-600' : 'bg-red-800 text-white'}`}>{violationForm.pledge || 'اعتماد التبصيم'}</button>
                </div>
            </div>
            <button onClick={saveViolation} className="w-full bg-red-600 text-white p-6 rounded-3xl font-black text-xl hover:bg-red-700 shadow-2xl transition-all active:scale-95">حفظ السجل</button>
          </div>
        ) : (
            <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-3xl border space-y-4 shadow-sm">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[300px] space-y-2">
                            <label className="text-xs font-black text-slate-400">فلترة بأسماء الطلاب</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border focus-within:ring-2 ring-red-100 transition-all">
                                        <Search size={14} className="text-slate-400"/>
                                        <input 
                                            type="text" 
                                            className="text-xs font-bold outline-none bg-transparent w-full" 
                                            placeholder="اكتب الاسم لإضافته..." 
                                            value={violationNameInput} 
                                            onChange={e => setViolationNameInput(e.target.value)} 
                                        />
                                    </div>
                                    {vNameSuggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-[70] bg-white border rounded-xl shadow-xl mt-1 max-h-40 overflow-y-auto">
                                            {vNameSuggestions.map(s => (
                                                <button key={s.id} onClick={() => { setTempViolationNames([...tempViolationNames, s.name]); setViolationNameInput(''); }} className="w-full text-right p-2 text-[10px] font-black hover:bg-red-50 border-b last:border-none">
                                                    {s.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setAppliedViolationNames(tempViolationNames)}
                                    className="bg-red-600 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-red-700 shadow-sm transition-all active:scale-95"
                                >
                                    موافق
                                </button>
                                <button 
                                    onClick={() => { setTempViolationNames([]); setAppliedViolationNames([]); }}
                                    className="bg-slate-200 text-slate-600 px-3 py-2 rounded-xl font-black text-[10px] hover:bg-slate-300"
                                >
                                    إعادة ضبط
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {tempViolationNames.map(name => (
                                    <span key={name} className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-lg text-[10px] font-black">
                                        {name}
                                        <button onClick={() => setTempViolationNames(tempViolationNames.filter(n => n !== name))}><X size={10}/></button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400">تاريخ المخالفة</label>
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border">
                                <Calendar size={14} className="text-slate-400"/>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400">من:</span>
                                    <input type="date" className="text-xs font-bold outline-none bg-transparent" value={violationFilterDates.start} onChange={e => setViolationFilterDates({...violationFilterDates, start: e.target.value})} />
                                </div>
                                <span className="mx-2 text-slate-300">|</span>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400">إلى:</span>
                                    <input type="date" className="text-xs font-bold outline-none bg-transparent" value={violationFilterDates.end} onChange={e => setViolationFilterDates({...violationFilterDates, end: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pb-1">
                            <button title="استيراد" className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"><Upload size={20}/></button>
                            <button title="تصدير TXT" className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"><FileText size={20}/></button>
                            <button title="تصدير Excel" className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100"><FileSpreadsheet size={20}/></button>
                            <button 
                                title="إرسال واتساب"
                                onClick={() => exportToWhatsApp('سجل المخالفات المفلتر', filteredLogs, [
                                    { label: 'اسم الطالب', key: 'studentName' },
                                    { label: 'الصف', key: 'grade' },
                                    { label: 'إجمالي المخالفات', key: 'totalViolations' },
                                    { label: 'التاريخ', key: 'date' },
                                    { label: 'الحالة', key: 'status' },
                                    { label: 'الإجراء', key: 'action' }
                                ])} 
                                className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-md transition-all active:scale-95"
                            >
                                <MessageCircle size={20}/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-3xl border-2">
                    <table className="w-full text-center text-sm">
                        <thead className="bg-[#FFD966] text-slate-800 font-black">
                            <tr>
                                <th className="p-4 border-e">اسم الطالب</th>
                                <th className="p-4 border-e">الصف</th>
                                <th className="p-4 border-e">إجمالي المخالفات</th>
                                <th className="p-4 border-e">تاريخ الرصد</th>
                                <th className="p-4 border-e">الحالة</th>
                                <th className="p-4">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-slate-400 italic">لا توجد مخالفات مسجلة في هذه الفترة حالياً.</td>
                                </tr>
                            ) : (
                                filteredLogs.map(l => (
                                    <tr key={l.id} className="hover:bg-slate-50 font-bold transition-colors">
                                        <td className="p-4 border-e font-black">{l.studentName}</td>
                                        <td className="p-4 border-e">{l.grade}/{l.section}</td>
                                        <td className="p-4 border-e text-red-600 font-black">{l.totalViolations}</td>
                                        <td className="p-4 border-e">{l.date}</td>
                                        <td className="p-4 border-e">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] ${l.status === 'blacklist' ? 'bg-black text-white' : l.status === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {l.status === 'blacklist' ? 'قائمة سوداء' : l.status === 'high' ? 'كثير المخالفة' : l.status === 'medium' ? 'متوسط' : 'نادر'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-red-600">{l.action}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    );
  };

  // --- Main View Entry ---

  const renderCurrentModule = () => {
    switch (activeSubTab) {
      case 'الغياب اليومي': return renderAbsenceModule();
      case 'التأخر': return renderLatenessModule();
      case 'المخالفات الطلابية': return renderViolationModule();
      default:
        return (
          <div className="bg-white p-8 rounded-[3rem] border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800">{activeSubTab}</h3>
                <button onClick={() => setActiveSubTab(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X/></button>
            </div>
            <div className="space-y-4">
                <p className="text-slate-500 font-bold">سيتم تطوير نموذج البيانات الاحترافي الخاص بـ ({activeSubTab}) قريباً ليتناسب مع كافة تطلعاتك ومعاييرك الدقيقة.</p>
                <div className="bg-slate-50 p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <Database size={64} />
                    <span className="font-black text-lg">قاعدة بيانات فارغة حالياً</span>
                </div>
            </div>
          </div>
        );
    }
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
              <button 
                key={key} 
                onClick={() => setActiveTab(key as MainTab)}
                className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black text-lg transition-all shadow-sm ${activeTab === key ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-white text-slate-600 border border-slate-100 hover:bg-blue-50'}`}
              >
                {React.cloneElement(cat.icon as React.ReactElement, { size: 24 })}
                {cat.title}
              </button>
            ))}
          </div>

          <div className="bg-white p-8 rounded-[3rem] border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {structure[activeTab].items.map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveSubTab(item)}
                  className="group flex items-center justify-between p-6 rounded-[1.5rem] bg-slate-50 border-2 border-slate-50 hover:border-blue-500 hover:bg-white transition-all text-right shadow-sm hover:shadow-xl"
                >
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
      ) : (
        renderCurrentModule()
      )}
    </div>
  );
};

export default SpecialReportsPage;
