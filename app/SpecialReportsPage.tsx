
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
  const [filterValues, setFilterValues] = useState({ 
    semester: '', 
    start: today, 
    end: today,   
    name: '', 
    grade: '', 
    section: '' 
  });
  const [tempNames, setTempNames] = useState<string[]>([]);
  const [appliedNames, setAppliedNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState('');

  const [latenessFilterValues, setLatenessFilterValues] = useState({ semester: '', start: today, end: today, grade: '', section: '' });
  const [tempLatenessNames, setTempLatenessNames] = useState<string[]>([]);
  const [appliedLatenessNames, setAppliedLatenessNames] = useState<string[]>([]);
  const [latenessNameInput, setLatenessNameInput] = useState('');

  const [violationFilterValues, setViolationFilterValues] = useState({ semester: '', start: today, end: today, grade: '', section: '' });
  const [tempViolationNames, setTempViolationNames] = useState<string[]>([]);
  const [appliedViolationNames, setAppliedViolationNames] = useState<string[]>([]);
  const [violationNameInput, setViolationNameInput] = useState('');

  const [exitFilterValues, setExitFilterValues] = useState({ semester: '', start: today, end: today, grade: '', section: '' });
  const [tempExitNames, setTempExitNames] = useState<string[]>([]);
  const [appliedExitNames, setAppliedExitNames] = useState<string[]>([]);
  const [exitNameInput, setExitNameInput] = useState('');

  const [damageFilterValues, setDamageFilterValues] = useState({ semester: '', start: today, end: today, grade: '', section: '' });
  const [tempDamageNames, setTempDamageNames] = useState<string[]>([]);
  const [appliedDamageNames, setAppliedDamageNames] = useState<string[]>([]);
  const [damageNameInput, setDamageNameInput] = useState('');

  const [visitFilterValues, setVisitFilterValues] = useState({ semester: '', start: today, end: today, grade: '', section: '' });
  const [tempVisitNames, setTempVisitNames] = useState<string[]>([]);
  const [appliedVisitNames, setAppliedVisitNames] = useState<string[]>([]);
  const [visitNameInput, setVisitNameInput] = useState('');

  // Form States
  const [absenceForm, setAbsenceForm] = useState<Partial<AbsenceLog>>({
    date: today, semester: 'الأول', status: 'expected', reason: '', commStatus: 'لم يتم التواصل', commType: 'هاتف', replier: 'الأب', result: 'لم يتم الرد', notes: ''
  });

  const [latenessForm, setLatenessForm] = useState<Partial<LatenessLog>>({
    date: today, semester: 'الأول', status: 'recurring', reason: '', action: 'تنبيه 1', pledge: '', notes: ''
  });

  const [violationForm, setViolationForm] = useState<Partial<StudentViolationLog>>({
    date: today, semester: 'الأول', behaviorViolations: [], dutiesViolations: [], achievementViolations: [], status: 'rare', action: 'تنبيه 1', pledge: '', notes: ''
  });

  const [exitForm, setExitForm] = useState<Partial<ExitLog>>({
    date: today, semester: 'الفصلين', status: 'نادر الخروج', customStatusItems: [], action: 'تنبيه 1', pledge: '', notes: ''
  });

  const [damageForm, setDamageForm] = useState<Partial<DamageLog>>({
    date: today, semester: 'الفصلين', description: '', statusTags: [], action: 'تنبيه', pledge: '', notes: ''
  });

  const [visitForm, setVisitForm] = useState<Partial<ParentVisitLog>>({
    date: today, semester: 'الفصلين', type: 'visit', status: 'نادر الزيارة', customStatusItems: [], visitorName: '', reason: '', recommendations: '', actions: '', followUpStatus: [], notes: ''
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

  // Specialized Export logic for WhatsApp
  const shareWhatsAppRich = (title: string, tableData: any[], columns: { label: string, key: string }[]) => {
    let msg = `*📋 تقرير: ${title}*\n`;
    msg += `*المدرسة:* ${data.profile.schoolName || '---'}\n`;
    msg += `*التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n`;
    msg += `----------------------------------\n\n`;

    tableData.forEach((row, idx) => {
      msg += `*🔹 البند (${idx + 1}):*\n`;
      columns.forEach(col => {
        let val = Array.isArray(row[col.key]) ? row[col.key].join('، ') : row[col.key];
        let symbol = '▪️';
        if (col.key === 'studentName' || col.key === 'name') symbol = '👤';
        if (col.key === 'grade' || col.key === 'section') symbol = '📍';
        if (col.key.includes('Count') || col.key.includes('total')) symbol = '🔢';
        if (col.key === 'date') symbol = '📅';
        if (col.key === 'status' || col.key === 'statusTags') symbol = '🏷️';
        if (col.key === 'action' || col.key === 'procedure') symbol = '🛡️';
        if (col.key === 'reason' || col.key === 'description') symbol = '📝';
        
        // Logical colors/emojis based on keywords
        const valStr = String(val);
        if (valStr.includes('تنبيه') || valStr.includes('متكرر') || valStr.includes('كثير')) symbol = '🔴';
        if (valStr.includes('نادر') || valStr.includes('ممتاز') || valStr.includes('تم')) symbol = '🟢';
        
        msg += `${symbol} *${col.label}:* ${val || '---'}\n`;
      });
      msg += `\n`;
    });
    msg += `----------------------------------\n`;
    msg += `*إعداد المستشار الإداري والتربوي إبراهيم دخان*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

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

  // --- START OF CHANGE - Reusable Filter Component ---
  const FilterSection = ({ 
    type, values, setValues, tempNames, setTempNames, appliedNames, setAppliedNames, nameInput, setNameInput, onExportExcel, onExportTxt, onExportWA, suggestions 
  }: any) => (
    <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 space-y-6 shadow-sm mb-6 animate-in slide-in-from-top-4 duration-300">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[300px] space-y-2">
          <label className="text-xs font-black text-slate-500 mr-2">فلترة بالأسماء (متعدد)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border-2 focus-within:border-blue-400 transition-all">
                <Search size={16} className="text-slate-400"/>
                <input type="text" className="text-xs font-black outline-none bg-transparent w-full" placeholder="اكتب الاسم لإضافته..." value={nameInput} onChange={e => setNameInput(e.target.value)} />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 rounded-xl shadow-xl mt-2 max-h-48 overflow-y-auto">
                  {suggestions.map((s: any) => (
                    <button key={s.id} onClick={() => { setTempNames([...tempNames, s.name]); setNameInput(''); }} className="w-full text-right p-3 text-xs font-bold hover:bg-blue-50 border-b last:border-none flex justify-between">
                      <span>{s.name}</span> <span className="text-[10px] text-slate-300">{s.grade}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setAppliedNames(tempNames)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-blue-700">موافق</button>
            <button onClick={() => { setTempNames([]); setAppliedNames([]); }} className="bg-white border-2 text-slate-400 px-4 py-2 rounded-xl font-black text-xs">تصفير</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tempNames.map((name: string) => (
              <span key={name} className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black">
                {name} <X size={10} className="cursor-pointer" onClick={() => setTempNames(tempNames.filter((n: string) => n !== name))} />
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 mr-2">نطاق التاريخ</label>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border-2">
            <Calendar size={16} className="text-slate-400"/>
            <input type="date" className="text-xs font-black outline-none bg-transparent" value={values.start} onChange={e => setValues({...values, start: e.target.value})} />
            <span className="text-slate-200">|</span>
            <input type="date" className="text-xs font-black outline-none bg-transparent" value={values.end} onChange={e => setValues({...values, end: e.target.value})} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 mr-2">الفصل</label>
          <select className="p-2.5 bg-white border-2 rounded-xl font-black text-xs outline-none" value={values.semester} onChange={e => setValues({...values, semester: e.target.value})}>
            <option value="">الكل</option><option value="الأول">الأول</option><option value="الثاني">الثاني</option><option value="الفصلين">الفصلين</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 mr-2">الصف</label>
          <select className="p-2.5 bg-white border-2 rounded-xl font-black text-xs outline-none" value={values.grade} onChange={e => setValues({...values, grade: e.target.value})}>
            <option value="">الكل</option>{gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 mr-2">الشعبة</label>
          <select className="p-2.5 bg-white border-2 rounded-xl font-black text-xs outline-none" value={values.section} onChange={e => setValues({...values, section: e.target.value})}>
            <option value="">الكل</option>{sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <button title="استيراد" className="p-3 bg-white border-2 text-blue-600 rounded-xl shadow-sm hover:bg-blue-50 transition-all"><Upload size={20}/></button>
          <button title="تصدير TXT" onClick={onExportTxt} className="p-3 bg-white border-2 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all"><FileText size={20}/></button>
          <button title="تصدير Excel" onClick={onExportExcel} className="p-3 bg-white border-2 text-green-700 rounded-xl shadow-sm hover:bg-green-50 transition-all"><FileSpreadsheet size={20}/></button>
          <button title="واتساب" onClick={onExportWA} className="p-3 bg-green-600 text-white rounded-xl shadow-xl hover:bg-green-700 transition-all"><MessageCircle size={20}/></button>
        </div>
      </div>
    </div>
  );

  // Absence logic
  const saveAbsenceLog = () => {
    if (!absenceForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: AbsenceLog = { ...absenceForm as AbsenceLog, id: Date.now().toString(), day: getDayName(absenceForm.date || today), prevAbsenceCount: (data.absenceLogs || []).filter(l => l.studentId === absenceForm.studentId).length };
    updateData({ absenceLogs: [newLog, ...(data.absenceLogs || [])] });
    setAbsenceForm({ ...absenceForm, studentName: '', studentId: '', notes: '', reason: '' });
    alert('تم حفظ الغياب');
  };

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

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'الصف', key: 'grade' }, { label: 'الشعبة', key: 'section' }, 
      { label: 'عدد الغياب', key: 'prevAbsenceCount' }, { label: 'التاريخ', key: 'date' }, { label: 'سبب الغياب', key: 'reason' }, 
      { label: 'نتيجة التواصل', key: 'result' }, { label: 'ملاحظات أخرى', key: 'notes' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
        <div className="flex justify-between items-center mb-8 border-b-2 pb-6 border-orange-50">
          <div className="flex gap-3">
            <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-2 bg-orange-50 text-orange-700 px-6 py-3 rounded-2xl font-black text-sm hover:bg-orange-100 shadow-sm transition-all active:scale-95">
              {showTable ? <Plus size={18}/> : <LayoutList size={18}/>}
              {showTable ? 'رصد غياب جديد' : 'جدول الغياب'}
            </button>
            <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
          </div>
          <h2 className="text-3xl font-black text-orange-600 flex items-center gap-3">سجل الغياب اليومي <Clock size={32}/></h2>
        </div>
        {!showTable ? (
          <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border space-y-6">
              <div className="relative">
                <label className="text-xs font-black text-slate-400 mb-2 block">ابحث عن الطالب</label>
                <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-orange-500 transition-all shadow-sm">
                  <Search size={20} className="text-slate-400"/><input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="اكتب الاسم هنا..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => { setAbsenceForm({ ...absenceForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevAbsenceCount: (data.absenceLogs || []).filter(l => l.studentId === s.id).length }); setSearchQuery(''); }} className="w-full text-right p-4 hover:bg-orange-50 font-black border-b last:border-none flex justify-between"><span>{s.name}</span> <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span></button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الصف</label><span className="font-black">{absenceForm.studentName ? absenceForm.grade : '---'}</span></div>
                <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الشعبة</label><span className="font-black">{absenceForm.studentName ? absenceForm.section : '---'}</span></div>
                <div className="bg-orange-600 text-white p-4 rounded-2xl shadow-lg text-center"><label className="text-[10px] block opacity-80">مرات الغياب</label><span className="font-black text-2xl">{absenceForm.prevAbsenceCount ?? 0}</span></div>
                <div className="bg-white p-2 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mr-2">التاريخ</label><input type="date" className="w-full p-2 text-xs font-black outline-none bg-transparent" value={absenceForm.date} onChange={e => setAbsenceForm({...absenceForm, date: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">سبب الغياب</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm" value={absenceForm.reason} onChange={e => setAbsenceForm({...absenceForm, reason: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">نتيجة التواصل</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm" value={absenceForm.result} onChange={e => setAbsenceForm({...absenceForm, result: e.target.value})} /></div>
              </div>
              <textarea className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm" placeholder="ملاحظات أخرى..." value={absenceForm.notes} onChange={e => setAbsenceForm({...absenceForm, notes: e.target.value})} />
              <button onClick={saveAbsenceLog} className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black text-xl hover:bg-black shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all"><Save size={24}/> حفظ بيانات الغياب</button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <FilterSection suggestions={nameSugg} values={filterValues} setValues={setFilterValues} tempNames={tempNames} setTempNames={setTempNames} appliedNames={appliedNames} setAppliedNames={setAppliedNames} nameInput={nameInput} setNameInput={setNameInput} onExportExcel={() => exportExcelFiltered('غياب_الطلاب', filtered, cols)} onExportTxt={() => exportTxtFiltered('غياب_الطلاب', filtered, cols)} onExportWA={() => shareWhatsAppRich('سجل غياب الطلاب المفلتر', filtered, cols)} />
            <div className="overflow-x-auto rounded-[2.5rem] border-4 border-slate-50 shadow-inner">
              <table className="w-full text-center text-sm border-collapse"><thead className="bg-[#FFD966] text-slate-800 font-black"><tr>{cols.map(c => <th key={c.key} className="p-5 border-e border-orange-200">{c.label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white font-bold">{filtered.length === 0 ? <tr><td colSpan={cols.length} className="p-20 text-slate-300 italic text-lg">لا توجد بيانات تطابق الفلتر.</td></tr> : filtered.map(l => <tr key={l.id} className="hover:bg-orange-50/30 transition-colors"><td className="p-5 border-e border-slate-50 font-black">{l.studentName}</td><td className="p-5 border-e border-slate-50">{l.grade}</td><td className="p-5 border-e border-slate-50">{l.section}</td><td className="p-5 border-e border-slate-50 text-orange-600 text-lg">{l.prevAbsenceCount + 1}</td><td className="p-5 border-e border-slate-50 text-slate-400">{l.date}</td><td className="p-5 border-e border-slate-50">{l.reason}</td><td className="p-5 border-e border-slate-50">{l.result}</td><td className="p-5 text-slate-400 text-xs">{l.notes}</td></tr>)}</tbody></table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Lateness Module
  const saveLatenessLog = () => {
    if (!latenessForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: LatenessLog = { ...latenessForm as LatenessLog, id: Date.now().toString(), day: getDayName(latenessForm.date || today), prevLatenessCount: (data.latenessLogs || []).filter(l => l.studentId === latenessForm.studentId).length };
    updateData({ latenessLogs: [newLog, ...(data.latenessLogs || [])] });
    setLatenessForm({ ...latenessForm, studentName: '', studentId: '', notes: '', reason: '' });
    alert('تم حفظ التأخر');
  };

  const renderLatenessModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const nameSugg = latenessNameInput.trim() ? students.filter(s => s.name.includes(latenessNameInput) && !tempLatenessNames.includes(s.name)) : [];
    const filtered = (data.latenessLogs || []).filter(l => {
      if (appliedLatenessNames.length > 0 && !appliedLatenessNames.includes(l.studentName)) return false;
      if (latenessFilterValues.start && l.date < latenessFilterValues.start) return false;
      if (latenessFilterValues.end && l.date > latenessFilterValues.end) return false;
      if (latenessFilterValues.semester && l.semester !== latenessFilterValues.semester) return false;
      if (latenessFilterValues.grade && l.grade !== latenessFilterValues.grade) return false;
      if (latenessFilterValues.section && l.section !== latenessFilterValues.section) return false;
      return true;
    });

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'الصف', key: 'grade' }, { label: 'الشعبة', key: 'section' }, 
      { label: 'عدد مرات التأخر', key: 'prevLatenessCount' }, { label: 'التاريخ', key: 'date' }, { label: 'سبب التأخر', key: 'reason' }, 
      { label: 'الإجراء المتخذ', key: 'action' }, { label: 'ملاحظات أخرى', key: 'notes' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
        <div className="flex justify-between items-center mb-8 border-b-2 pb-6 border-amber-50">
          <div className="flex gap-3">
            <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-2 bg-amber-50 text-amber-700 px-6 py-3 rounded-2xl font-black text-sm hover:bg-amber-100 shadow-sm transition-all active:scale-95">
              {showTable ? <Plus size={18}/> : <LayoutList size={18}/>}
              {showTable ? 'رصد تأخر جديد' : 'جدول التأخر'}
            </button>
            <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
          </div>
          <h2 className="text-3xl font-black text-amber-600 flex items-center gap-3">سجل التأخر <Clock size={32}/></h2>
        </div>
        {!showTable ? (
          <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border space-y-6">
              <div className="relative">
                <label className="text-xs font-black text-slate-400 mb-2 block">ابحث عن الطالب</label>
                <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-amber-500 shadow-sm">
                  <Search size={20} className="text-slate-400"/><input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="اكتب الاسم هنا..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => { setLatenessForm({ ...latenessForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevLatenessCount: (data.latenessLogs || []).filter(l => l.studentId === s.id).length }); setSearchQuery(''); }} className="w-full text-right p-4 hover:bg-amber-50 font-black border-b last:border-none flex justify-between"><span>{s.name}</span> <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span></button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الصف</label><span className="font-black">{latenessForm.studentName ? latenessForm.grade : '---'}</span></div>
                <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الشعبة</label><span className="font-black">{latenessForm.studentName ? latenessForm.section : '---'}</span></div>
                <div className="bg-amber-600 text-white p-4 rounded-2xl shadow-lg text-center"><label className="text-[10px] block opacity-80">مرات التأخر</label><span className="font-black text-2xl">{latenessForm.prevLatenessCount ?? 0}</span></div>
                <div className="bg-white p-2 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mr-2">التاريخ</label><input type="date" className="w-full p-2 text-xs font-black outline-none bg-transparent" value={latenessForm.date} onChange={e => setLatenessForm({...latenessForm, date: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">سبب التأخر</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm" value={latenessForm.reason} onChange={e => setLatenessForm({...latenessForm, reason: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">الإجراء المتخذ</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm" value={latenessForm.action} onChange={e => setLatenessForm({...latenessForm, action: e.target.value})} /></div>
              </div>
              <textarea className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm" placeholder="ملاحظات أخرى..." value={latenessForm.notes} onChange={e => setLatenessForm({...latenessForm, notes: e.target.value})} />
              <button onClick={saveLatenessLog} className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black text-xl hover:bg-black shadow-xl active:scale-95 transition-all"><Save size={24}/> حفظ بيانات التأخر</button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <FilterSection suggestions={nameSugg} values={latenessFilterValues} setValues={setLatenessFilterValues} tempNames={tempLatenessNames} setTempNames={setTempLatenessNames} appliedNames={appliedLatenessNames} setAppliedNames={appliedLatenessNames} nameInput={latenessNameInput} setNameInput={setLatenessNameInput} onExportExcel={() => exportExcelFiltered('تأخر_الطلاب', filtered, cols)} onExportTxt={() => exportTxtFiltered('تأخر_الطلاب', filtered, cols)} onExportWA={() => shareWhatsAppRich('سجل تأخر الطلاب المفلتر', filtered, cols)} />
            <div className="overflow-x-auto rounded-[2.5rem] border-4 border-slate-50 shadow-inner">
              <table className="w-full text-center text-sm border-collapse"><thead className="bg-[#FFD966] text-slate-800 font-black"><tr>{cols.map(c => <th key={c.key} className="p-5 border-e border-amber-200">{c.label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white font-bold">{filtered.length === 0 ? <tr><td colSpan={cols.length} className="p-20 text-slate-300 italic text-lg">لا توجد بيانات تطابق الفلتر.</td></tr> : filtered.map(l => <tr key={l.id} className="hover:bg-amber-50/30 transition-colors"><td className="p-5 border-e border-slate-50 font-black">{l.studentName}</td><td className="p-5 border-e border-slate-50">{l.grade}</td><td className="p-5 border-e border-slate-50">{l.section}</td><td className="p-5 border-e border-slate-50 text-amber-600 text-lg">{l.prevLatenessCount + 1}</td><td className="p-5 border-e border-slate-50 text-slate-400">{l.date}</td><td className="p-5 border-e border-slate-50">{l.reason}</td><td className="p-5 border-e border-slate-50">{l.action}</td><td className="p-5 text-slate-400 text-xs">{l.notes}</td></tr>)}</tbody></table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Student Violations
  const saveViolationLog = () => {
    if (!violationForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: StudentViolationLog = { ...violationForm as StudentViolationLog, id: Date.now().toString(), totalViolations: (violationForm.behaviorViolations?.length || 0) + (violationForm.dutiesViolations?.length || 0) + (violationForm.achievementViolations?.length || 0) };
    updateData({ studentViolationLogs: [newLog, ...(data.studentViolationLogs || [])] });
    setViolationForm({ ...violationForm, studentName: '', studentId: '', behaviorViolations: [], dutiesViolations: [], achievementViolations: [] });
    alert('تم تسجيل المخالفة');
  };

  const renderViolationModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const nameSugg = violationNameInput.trim() ? students.filter(s => s.name.includes(violationNameInput) && !tempViolationNames.includes(s.name)) : [];
    const filtered = (data.studentViolationLogs || []).filter(l => {
      if (appliedViolationNames.length > 0 && !appliedViolationNames.includes(l.studentName)) return false;
      if (violationFilterValues.start && l.date < violationFilterValues.start) return false;
      if (violationFilterValues.end && l.date > violationFilterValues.end) return false;
      if (violationFilterValues.semester && l.semester !== violationFilterValues.semester) return false;
      if (violationFilterValues.grade && l.grade !== violationFilterValues.grade) return false;
      if (violationFilterValues.section && l.section !== violationFilterValues.section) return false;
      return true;
    });

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'الصف', key: 'grade' }, { label: 'الشعبة', key: 'section' }, 
      { label: 'عدد المخالفات', key: 'totalViolations' }, { label: 'التاريخ', key: 'date' }, { label: 'حالة المخالفة', key: 'status' }, 
      { label: 'نوع الإجراء', key: 'action' }, { label: 'ملاحظات أخرى', key: 'notes' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
        <div className="flex justify-between items-center mb-8 border-b-2 pb-6 border-red-50">
          <div className="flex gap-3">
            <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-2 bg-red-50 text-red-700 px-6 py-3 rounded-2xl font-black text-sm hover:bg-red-100 shadow-sm transition-all active:scale-95">
              {showTable ? <Plus size={18}/> : <LayoutList size={18}/>}
              {showTable ? 'رصد مخالفة جديدة' : 'جدول المخالفات'}
            </button>
            <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
          </div>
          <h2 className="text-3xl font-black text-red-600 flex items-center gap-3">سجل المخالفات الطلابية <AlertCircle size={32}/></h2>
        </div>
        {!showTable ? (
          <div className="space-y-6">
             <div className="bg-slate-50 p-8 rounded-[2.5rem] border space-y-6">
              <div className="relative">
                <label className="text-xs font-black text-slate-400 mb-2 block">ابحث عن الطالب</label>
                <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-red-500 shadow-sm">
                  <Search size={20} className="text-slate-400"/><input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="اكتب الاسم هنا..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => { setViolationForm({ ...violationForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section }); setSearchQuery(''); }} className="w-full text-right p-4 hover:bg-red-50 font-black border-b last:border-none flex justify-between"><span>{s.name}</span> <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span></button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الصف</label><span className="font-black">{violationForm.studentName ? violationForm.grade : '---'}</span></div>
                <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الشعبة</label><span className="font-black">{violationForm.studentName ? violationForm.section : '---'}</span></div>
                <div className="bg-white p-2 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mr-2">التاريخ</label><input type="date" className="w-full p-2 text-xs font-black outline-none bg-transparent" value={violationForm.date} onChange={e => setViolationForm({...violationForm, date: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">حالة المخالفة</label><select className="w-full p-4 border-2 rounded-2xl font-black text-sm outline-none" value={violationForm.status} onChange={e => setViolationForm({...violationForm, status: e.target.value as any})}><option value="rare">نادر</option><option value="medium">متوسط</option><option value="high">كثير</option><option value="blacklist">قائمة سوداء</option></select></div>
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">الإجراء المتخذ</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm" value={violationForm.action} onChange={e => setViolationForm({...violationForm, action: e.target.value})} /></div>
              </div>
              <button onClick={saveViolationLog} className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black text-xl hover:bg-black shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all"><Save size={24}/> حفظ المخالفة</button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <FilterSection suggestions={nameSugg} values={violationFilterValues} setValues={setViolationFilterValues} tempNames={tempViolationNames} setTempNames={setTempViolationNames} appliedNames={appliedViolationNames} setAppliedNames={setAppliedViolationNames} nameInput={violationNameInput} setNameInput={setViolationNameInput} onExportExcel={() => exportExcelFiltered('مخالفات_الطلاب', filtered, cols)} onExportTxt={() => exportTxtFiltered('مخالفات_الطلاب', filtered, cols)} onExportWA={() => shareWhatsAppRich('سجل مخالفات الطلاب المفلتر', filtered, cols)} />
            <div className="overflow-x-auto rounded-[2.5rem] border-4 border-slate-50 shadow-inner">
              <table className="w-full text-center text-sm border-collapse"><thead className="bg-[#FFD966] text-slate-800 font-black"><tr>{cols.map(c => <th key={c.key} className="p-5 border-e border-red-200">{c.label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white font-bold">{filtered.length === 0 ? <tr><td colSpan={cols.length} className="p-20 text-slate-300 italic text-lg">لا توجد بيانات تطابق الفلتر.</td></tr> : filtered.map(l => <tr key={l.id} className="hover:bg-red-50/30 transition-colors"><td className="p-5 border-e border-slate-50 font-black">{l.studentName}</td><td className="p-5 border-e border-slate-50">{l.grade}</td><td className="p-5 border-e border-slate-50">{l.section}</td><td className="p-5 border-e border-slate-50 text-red-600 text-lg">{l.totalViolations}</td><td className="p-5 border-e border-slate-50 text-slate-400">{l.date}</td><td className="p-5 border-e border-slate-50">{l.status}</td><td className="p-5 border-e border-slate-50">{l.action}</td><td className="p-5 text-slate-400 text-xs">{l.notes}</td></tr>)}</tbody></table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Exit during study logic
  const saveExitLogFinal = () => {
    if (!exitForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: ExitLog = { ...exitForm as ExitLog, id: Date.now().toString(), day: getDayName(exitForm.date || today), prevExitCount: (data.exitLogs || []).filter(l => l.studentId === exitForm.studentId).length };
    updateData({ exitLogs: [newLog, ...(data.exitLogs || [])] });
    setExitForm({ ...exitForm, studentName: '', studentId: '', notes: '', pledge: '', customStatusItems: [] });
    alert('تم حفظ بيان الخروج');
  };

  const renderExitModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const nameSugg = exitNameInput.trim() ? students.filter(s => s.name.includes(exitNameInput) && !tempExitNames.includes(s.name)) : [];
    const filtered = (data.exitLogs || []).filter(l => {
      if (appliedExitNames.length > 0 && !appliedExitNames.includes(l.studentName)) return false;
      if (exitFilterValues.start && l.date < exitFilterValues.start) return false;
      if (exitFilterValues.end && l.date > exitFilterValues.end) return false;
      if (exitFilterValues.semester && l.semester !== exitFilterValues.semester) return false;
      if (exitFilterValues.grade && l.grade !== exitFilterValues.grade) return false;
      if (exitFilterValues.section && l.section !== exitFilterValues.section) return false;
      return true;
    });

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'الصف', key: 'grade' }, { label: 'الشعبة', key: 'section' }, 
      { label: 'عدد مرات الخروج', key: 'prevExitCount' }, { label: 'التاريخ', key: 'date' }, { label: 'حالة الخروج', key: 'status' }, 
      { label: 'نوع الإجراء', key: 'action' }, { label: 'ملاحظات أخرى', key: 'notes' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
        <div className="flex justify-between items-center mb-8 border-b-2 pb-6 border-blue-50">
          <div className="flex gap-3">
            <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-100 shadow-sm transition-all active:scale-95">
              {showTable ? <Plus size={18}/> : <LayoutList size={18}/>}
              {showTable ? 'رصد خروج جديد' : 'جدول الخروج'}
            </button>
            <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
          </div>
          <h2 className="text-3xl font-black text-blue-600 flex items-center gap-3">خروج طالب أثناء الدراسة <UserPlus size={32}/></h2>
        </div>
        {!showTable ? (
          <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border space-y-6">
              <div className="relative">
                <label className="text-xs font-black text-slate-400 mb-2 block">ابحث عن الطالب</label>
                <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-blue-500 shadow-sm">
                  <Search size={20} className="text-slate-400"/><input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="اكتب الاسم هنا..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => { setExitForm({ ...exitForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevExitCount: (data.exitLogs || []).filter(l => l.studentId === s.id).length }); setSearchQuery(''); }} className="w-full text-right p-4 hover:bg-blue-50 font-black border-b last:border-none flex justify-between"><span>{s.name}</span> <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span></button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الصف</label><span className="font-black">{exitForm.studentName ? exitForm.grade : '---'}</span></div>
                <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الشعبة</label><span className="font-black">{exitForm.studentName ? exitForm.section : '---'}</span></div>
                <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg text-center"><label className="text-[10px] block opacity-80">مرات الخروج</label><span className="font-black text-2xl">{exitForm.prevExitCount ?? 0}</span></div>
                <div className="bg-white p-2 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mr-2">التاريخ</label><input type="date" className="w-full p-2 text-xs font-black outline-none bg-transparent" value={exitForm.date} onChange={e => setExitForm({...exitForm, date: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">حالة الخروج</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm" value={exitForm.status} onChange={e => setExitForm({...exitForm, status: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">الإجراء المتخذ</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm" value={exitForm.action} onChange={e => setExitForm({...exitForm, action: e.target.value})} /></div>
              </div>
              <button onClick={saveExitLogFinal} className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black text-xl hover:bg-black shadow-xl active:scale-95 transition-all"><Save size={24}/> حفظ بيانات الخروج</button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <FilterSection suggestions={nameSugg} values={exitFilterValues} setValues={setExitFilterValues} tempNames={tempExitNames} setTempNames={setTempExitNames} appliedNames={appliedExitNames} setAppliedNames={setAppliedExitNames} nameInput={exitNameInput} setNameInput={setExitNameInput} onExportExcel={() => exportExcelFiltered('خروج_الطلاب', filtered, cols)} onExportTxt={() => exportTxtFiltered('خروج_الطلاب', filtered, cols)} onExportWA={() => shareWhatsAppRich('سجل خروج الطلاب المفلتر', filtered, cols)} />
            <div className="overflow-x-auto rounded-[2.5rem] border-4 border-slate-50 shadow-inner">
              <table className="w-full text-center text-sm border-collapse"><thead className="bg-[#FFD966] text-slate-800 font-black"><tr>{cols.map(c => <th key={c.key} className="p-5 border-e border-blue-200">{c.label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white font-bold">{filtered.length === 0 ? <tr><td colSpan={cols.length} className="p-20 text-slate-300 italic text-lg">لا توجد بيانات تطابق الفلتر.</td></tr> : filtered.map(l => <tr key={l.id} className="hover:bg-blue-50/30 transition-colors"><td className="p-5 border-e border-slate-50 font-black">{l.studentName}</td><td className="p-5 border-e border-slate-50">{l.grade}</td><td className="p-5 border-e border-slate-50">{l.section}</td><td className="p-5 border-e border-slate-50 text-blue-600 text-lg">{l.prevExitCount + 1}</td><td className="p-5 border-e border-slate-50 text-slate-400">{l.date}</td><td className="p-5 border-e border-slate-50">{l.status}</td><td className="p-5 border-e border-slate-50">{l.action}</td><td className="p-5 text-slate-400 text-xs">{l.notes}</td></tr>)}</tbody></table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // School Damage Log logic
  const saveDamageLogFinal = () => {
    if (!damageForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: DamageLog = { ...damageForm as DamageLog, id: Date.now().toString(), day: getDayName(damageForm.date || today), prevDamageCount: (data.damageLogs || []).filter(l => l.studentId === damageForm.studentId).length };
    updateData({ damageLogs: [newLog, ...(data.damageLogs || [])] });
    setDamageForm({ ...damageForm, studentName: '', studentId: '', notes: '', pledge: '', statusTags: [], description: '' });
    alert('تم حفظ بيان الإتلاف');
  };

  const renderDamageModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const nameSugg = damageNameInput.trim() ? students.filter(s => s.name.includes(damageNameInput) && !tempDamageNames.includes(s.name)) : [];
    const filtered = (data.damageLogs || []).filter(l => {
      if (appliedDamageNames.length > 0 && !appliedDamageNames.includes(l.studentName)) return false;
      if (damageFilterValues.start && l.date < damageFilterValues.start) return false;
      if (damageFilterValues.end && l.date > damageFilterValues.end) return false;
      if (damageFilterValues.semester && l.semester !== damageFilterValues.semester) return false;
      if (damageFilterValues.grade && l.grade !== damageFilterValues.grade) return false;
      if (damageFilterValues.section && l.section !== damageFilterValues.section) return false;
      return true;
    });

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'الصف', key: 'grade' }, { label: 'الشعبة', key: 'section' }, 
      { label: 'عدد الإتلافات', key: 'prevDamageCount' }, { label: 'التاريخ', key: 'date' }, { label: 'بيان الإتلاف', key: 'description' }, 
      { label: 'نوع الإجراء', key: 'action' }, { label: 'ملاحظات أخرى', key: 'notes' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
        <div className="flex justify-between items-center mb-8 border-b-2 pb-6 border-red-50">
          <div className="flex gap-3">
            <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-2 bg-red-50 text-red-700 px-6 py-3 rounded-2xl font-black text-sm hover:bg-red-100 shadow-sm transition-all active:scale-95">
              {showTable ? <Plus size={18}/> : <LayoutList size={18}/>}
              {showTable ? 'رصد إتلاف جديد' : 'جدول الإتلاف'}
            </button>
            <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
          </div>
          <h2 className="text-3xl font-black text-red-600 flex items-center gap-3">سجل الإتلاف المدرسي <Hammer size={32}/></h2>
        </div>
        {!showTable ? (
          <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border space-y-6">
              <div className="relative">
                <label className="text-xs font-black text-slate-400 mb-2 block">ابحث عن الطالب</label>
                <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-red-500 shadow-sm">
                  <Search size={20} className="text-slate-400"/><input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="اكتب الاسم هنا..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => { setDamageForm({ ...damageForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevDamageCount: (data.damageLogs || []).filter(l => l.studentId === s.id).length }); setSearchQuery(''); }} className="w-full text-right p-4 hover:bg-red-50 font-black border-b last:border-none flex justify-between"><span>{s.name}</span> <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span></button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الصف</label><span className="font-black">{damageForm.studentName ? damageForm.grade : '---'}</span></div>
                <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الشعبة</label><span className="font-black">{damageForm.studentName ? damageForm.section : '---'}</span></div>
                <div className="bg-red-600 text-white p-4 rounded-2xl shadow-lg text-center"><label className="text-[10px] block opacity-80">مرات الإتلاف</label><span className="font-black text-2xl">{damageForm.prevDamageCount ?? 0}</span></div>
                <div className="bg-white p-2 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mr-2">التاريخ</label><input type="date" className="w-full p-2 text-xs font-black outline-none bg-transparent" value={damageForm.date} onChange={e => setDamageForm({...damageForm, date: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">بيان الإتلاف</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm" value={damageForm.description} onChange={e => setDamageForm({...damageForm, description: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-xs font-black text-slate-400">الإجراء المتخذ</label><input className="w-full p-4 border-2 rounded-2xl outline-none font-black text-sm" value={damageForm.action} onChange={e => setDamageForm({...damageForm, action: e.target.value})} /></div>
              </div>
              <button onClick={saveDamageLogFinal} className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black text-xl hover:bg-black shadow-xl active:scale-95 transition-all"><Save size={24}/> حفظ بيانات الإتلاف</button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <FilterSection suggestions={nameSugg} values={damageFilterValues} setValues={setDamageFilterValues} tempNames={tempDamageNames} setTempNames={setTempDamageNames} appliedNames={appliedDamageNames} setAppliedNames={setAppliedDamageNames} nameInput={damageNameInput} setNameInput={setDamageNameInput} onExportExcel={() => exportExcelFiltered('إتلاف_المدرسة', filtered, cols)} onExportTxt={() => exportTxtFiltered('إتلاف_المدرسة', filtered, cols)} onExportWA={() => shareWhatsAppRich('سجل إتلاف المدرسة المفلتر', filtered, cols)} />
            <div className="overflow-x-auto rounded-[2.5rem] border-4 border-slate-50 shadow-inner">
              <table className="w-full text-center text-sm border-collapse"><thead className="bg-[#FFD966] text-slate-800 font-black"><tr>{cols.map(c => <th key={c.key} className="p-5 border-e border-red-200">{c.label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white font-bold">{filtered.length === 0 ? <tr><td colSpan={cols.length} className="p-20 text-slate-300 italic text-lg">لا توجد بيانات تطابق الفلتر.</td></tr> : filtered.map(l => <tr key={l.id} className="hover:bg-red-50/30 transition-colors"><td className="p-5 border-e border-slate-50 font-black">{l.studentName}</td><td className="p-5 border-e border-slate-50">{l.grade}</td><td className="p-5 border-e border-slate-50">{l.section}</td><td className="p-5 border-e border-slate-50 text-red-600 text-lg">{l.prevDamageCount + 1}</td><td className="p-5 border-e border-slate-50 text-slate-400">{l.date}</td><td className="p-5 border-e border-slate-50">{l.description}</td><td className="p-5 border-e border-slate-50">{l.action}</td><td className="p-5 text-slate-400 text-xs">{l.notes}</td></tr>)}</tbody></table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Parent Visit Log logic
  const saveVisitLog = () => {
    if (!visitForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: ParentVisitLog = { 
      ...visitForm as ParentVisitLog, 
      id: Date.now().toString(), 
      day: getDayName(visitForm.date || today), 
      prevVisitCount: (data.parentVisitLogs || []).filter(l => l.studentId === visitForm.studentId).length 
    };
    updateData({ parentVisitLogs: [newLog, ...(data.parentVisitLogs || [])] });
    setVisitForm({ ...visitForm, studentName: '', studentId: '', visitorName: '', reason: '', recommendations: '', actions: '', notes: '', customStatusItems: [], followUpStatus: [] });
    alert('تم حفظ سجل التواصل/الزيارة');
  };

  const renderParentVisitModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const nameSugg = visitNameInput.trim() ? students.filter(s => s.name.includes(visitNameInput) && !tempVisitNames.includes(s.name)) : [];
    const filteredLogs = (data.parentVisitLogs || []).filter(l => {
      if (appliedVisitNames.length > 0 && !appliedVisitNames.includes(l.studentName)) return false;
      if (visitFilterValues.start && l.date < visitFilterValues.start) return false;
      if (visitFilterValues.end && l.date > visitFilterValues.end) return false;
      if (visitFilterValues.semester && l.semester !== visitFilterValues.semester) return false;
      if (visitFilterValues.grade && l.grade !== visitFilterValues.grade) return false;
      if (visitFilterValues.section && l.section !== visitFilterValues.section) return false;
      return true;
    });

    const cols = [
      { label: 'اسم الطالب', key: 'studentName' }, { label: 'اسم الزائر', key: 'visitorName' }, { label: 'الصف', key: 'grade' }, 
      { label: 'الشعبة', key: 'section' }, { label: 'التاريخ', key: 'date' }, { label: 'نوع التواصل', key: 'type' }, 
      { label: 'السبب', key: 'reason' }, { label: 'الإجراءات', key: 'actions' }, { label: 'ملاحظات', key: 'notes' }
    ];

    return (
      <div className="bg-white p-8 rounded-[3rem] border-2 shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-2 h-full ${visitForm.type === 'visit' ? 'bg-indigo-500' : 'bg-green-500'}`}></div>
        <div className="flex items-center justify-between mb-8 border-b-2 border-slate-50 pb-6">
          <div className="flex gap-3">
            <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-100 shadow-sm transition-all active:scale-95">
              {showTable ? <Plus size={18}/> : <LayoutList size={18}/>}
              {showTable ? 'رصد جديد' : 'جدول السجلات'}
            </button>
            <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
          </div>
          <h2 className={`text-3xl font-black flex items-center justify-end gap-3 ${visitForm.type === 'visit' ? 'text-indigo-600' : 'text-green-600'}`}>
            سجل {visitForm.type === 'visit' ? 'زيارات أولياء الأمور' : 'التواصل بولي الأمر'} <UserPlus size={32} />
          </h2>
        </div>
        {!showTable ? (
          <div className="space-y-10">
            <div className="flex gap-4 p-2 bg-slate-100 rounded-3xl w-fit mx-auto shadow-inner border border-white">
              <button onClick={() => setVisitForm({...visitForm, type: 'visit'})} className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all ${visitForm.type === 'visit' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-white'}`}>
                <Users size={18}/> زيارة ولي أمر
              </button>
              <button onClick={() => setVisitForm({...visitForm, type: 'communication'})} className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all ${visitForm.type === 'communication' ? 'bg-green-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-white'}`}>
                <Phone size={18}/> التواصل بولي الأمر
              </button>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border space-y-6">
                <div className="relative">
                  <label className="text-xs font-black text-slate-400 mb-2 block">ابحث عن الطالب</label>
                  <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-4 focus-within:border-blue-500 shadow-sm">
                    <Search size={20} className="text-slate-400"/><input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="اكتب اسم الطالب هنا..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto">
                      {suggestions.map(s => (
                        <button key={s.id} onClick={() => { setVisitForm({ ...visitForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section }); setSearchQuery(''); }} className="w-full text-right p-4 hover:bg-blue-50 font-black border-b last:border-none flex justify-between"><span>{s.name}</span> <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span></button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الصف</label><span className="font-black">{visitForm.studentName ? visitForm.grade : '---'}</span></div>
                  <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الشعبة</label><span className="font-black">{visitForm.studentName ? visitForm.section : '---'}</span></div>
                  <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg text-center"><label className="text-[10px] block opacity-80">مرات التواصل</label><span className="font-black text-2xl">{(data.parentVisitLogs || []).filter(l => l.studentId === visitForm.studentId).length}</span></div>
                  <div className="bg-white p-2 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mr-2">التاريخ</label><input type="date" className="w-full p-2 text-xs font-black outline-none bg-transparent" value={visitForm.date} onChange={e => setVisitForm({...visitForm, date: e.target.value})} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-black text-slate-400">اسم الزائر/المتواصل</label><input type="text" className="w-full p-4 bg-white border-2 rounded-2xl font-black outline-none focus:border-blue-500 shadow-sm" value={visitForm.visitorName} onChange={e => setVisitForm({...visitForm, visitorName: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-xs font-black text-slate-400">السبب</label><input type="text" className="w-full p-4 bg-white border-2 rounded-2xl font-black outline-none focus:border-blue-500 shadow-sm" value={visitForm.reason} onChange={e => setVisitForm({...visitForm, reason: e.target.value})} /></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-black text-slate-400">الإجراءات</label><input type="text" className="w-full p-4 bg-white border-2 rounded-2xl font-black outline-none focus:border-blue-500 shadow-sm" value={visitForm.actions} onChange={e => setVisitForm({...visitForm, actions: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-xs font-black text-slate-400">ملاحظات</label><input type="text" className="w-full p-4 bg-white border-2 rounded-2xl font-black outline-none focus:border-blue-500 shadow-sm" value={visitForm.notes} onChange={e => setVisitForm({...visitForm, notes: e.target.value})} /></div>
                </div>

                <button onClick={saveVisitLog} className="w-full bg-slate-900 text-white p-7 rounded-[2.5rem] font-black text-2xl hover:bg-black shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98]"><Save size={32}/> حفظ السجل</button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <FilterSection suggestions={nameSugg} values={visitFilterValues} setValues={setVisitFilterValues} tempNames={tempVisitNames} setTempNames={setTempVisitNames} appliedNames={appliedVisitNames} setAppliedNames={setAppliedVisitNames} nameInput={visitNameInput} setNameInput={setVisitNameInput} onExportExcel={() => exportExcelFiltered('زيارات_أولياء_الأمور', filteredLogs, cols)} onExportTxt={() => exportTxtFiltered('زيارات_أولياء_الأمور', filteredLogs, cols)} onExportWA={() => shareWhatsAppRich('سجل زيارات وتواصل أولياء الأمور المفلتر', filteredLogs, cols)} />
            <div className="overflow-x-auto rounded-[2.5rem] border-4 border-slate-50 shadow-inner">
              <table className="w-full text-center text-sm border-collapse"><thead className="bg-[#FFD966] text-slate-800 font-black"><tr>{cols.map(c => <th key={c.key} className="p-6 border-e border-slate-200">{c.label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white font-bold">{filteredLogs.length === 0 ? <tr><td colSpan={cols.length} className="p-20 text-slate-300 italic text-lg">لا توجد بيانات تطابق الفلتر.</td></tr> : filteredLogs.map(l => <tr key={l.id} className="hover:bg-blue-50/30 transition-colors"><td className="p-5 border-e border-slate-50 font-black">{l.studentName}</td><td className="p-5 border-e border-slate-50">{l.visitorName}</td><td className="p-5 border-e border-slate-50">{l.grade}</td><td className="p-5 border-e border-slate-50">{l.section}</td><td className="p-5 border-e border-slate-50 text-slate-400">{l.date}</td><td className="p-5 border-e border-slate-50">{l.type === 'visit' ? 'زيارة' : 'تواصل'}</td><td className="p-5 border-e border-slate-50">{l.reason}</td><td className="p-5 border-e border-slate-50">{l.actions}</td><td className="p-5 text-slate-400 text-xs">{l.notes}</td></tr>)}</tbody></table>
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
                <Sparkles className="text-blue-600 animate-pulse" />التقارير الخاصة والمتقدمة
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
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><FileText size={18} /></div>
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