
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
  Hammer
} from 'lucide-react';
import { AbsenceLog, LatenessLog, StudentViolationLog, StudentReport, ExitLog, DamageLog } from '../types';
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

  // Lateness Filter States
  const [latenessFilterDates, setLatenessFilterDates] = useState({ start: today, end: today });
  const [tempLatenessNames, setTempLatenessNames] = useState<string[]>([]);
  const [appliedLatenessNames, setAppliedLatenessNames] = useState<string[]>([]);
  const [latenessNameInput, setLatenessNameInput] = useState('');

  // Exit Module States
  const [exitForm, setExitForm] = useState<Partial<ExitLog>>({
    date: today,
    semester: 'الفصلين',
    status: 'نادر الخروج',
    customStatusItems: [],
    action: 'تنبيه 1',
    pledge: '',
    notes: ''
  });
  const [exitFilterValues, setExitFilterValues] = useState({
    semester: '',
    start: today,
    end: today,
    grade: '',
    section: ''
  });
  const [tempExitNames, setTempExitNames] = useState<string[]>([]);
  const [appliedExitNames, setAppliedExitNames] = useState<string[]>([]);
  const [exitNameInput, setExitNameInput] = useState('');

  // Damage Module States
  const [damageForm, setDamageForm] = useState<Partial<DamageLog>>({
    date: today,
    semester: 'الفصلين',
    description: '',
    statusTags: [],
    action: 'تنبيه',
    pledge: '',
    notes: ''
  });
  const [damageFilterValues, setDamageFilterValues] = useState({
    semester: '',
    start: today,
    end: today,
    grade: '',
    section: ''
  });
  const [tempDamageNames, setTempDamageNames] = useState<string[]>([]);
  const [appliedDamageNames, setAppliedDamageNames] = useState<string[]>([]);
  const [damageNameInput, setDamageNameInput] = useState('');

  // Moved Form States to top of component to fix "Cannot find name" errors in render functions
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

  const [latenessForm, setLatenessForm] = useState<Partial<LatenessLog>>({
    date: new Date().toISOString().split('T')[0],
    semester: 'الأول',
    status: 'recurring',
    reason: '',
    action: 'تنبيه 1',
    pledge: '',
    notes: ''
  });

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

  const saveAbsence = () => {
    if (!absenceForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: AbsenceLog = {
      ...absenceForm as AbsenceLog,
      id: Date.now().toString(),
      day: getDayName(absenceForm.date || '')
    };
    const currentLogs = data.absenceLogs || [];
    updateData({ absenceLogs: [newLog, ...currentLogs] });
    const updatedStudents = students.map(s => s.id === newLog.studentId ? { ...s, totalAbsences: (s.totalAbsences || 0) + 1 } : s);
    updateData({ studentReports: updatedStudents });
    alert('تم حفظ بيانات الغياب بنجاح');
    setAbsenceForm({ ...absenceForm, studentName: '', studentId: '', notes: '', reason: '' });
  };

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

  const saveViolation = () => {
    if (!violationForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: StudentViolationLog = {
      ...violationForm as StudentViolationLog,
      id: Date.now().toString(),
      totalViolations: (violationForm.behaviorViolations?.length || 0) + (violationForm.dutiesViolations?.length || 0) + (violationForm.achievementViolations?.length || 0)
    };
    const currentLogs = data.studentViolationLogs || [];
    updateData({ studentViolationLogs: [newLog, ...currentLogs] });
    alert('تم تسجيل المخالفة بنجاح');
    setViolationForm({ ...violationForm, studentName: '', studentId: '', behaviorViolations: [], dutiesViolations: [], achievementViolations: [] });
  };

  const saveExitLog = () => {
    if (!exitForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: ExitLog = {
      ...exitForm as ExitLog,
      id: Date.now().toString(),
      day: getDayName(exitForm.date || today)
    };
    const currentLogs = data.exitLogs || [];
    updateData({ exitLogs: [newLog, ...currentLogs] });
    alert('تم حفظ بيان الخروج بنجاح');
    setExitForm({ ...exitForm, studentName: '', studentId: '', grade: '', section: '', notes: '', pledge: '', customStatusItems: [] });
  };

  const saveDamageLog = () => {
    if (!damageForm.studentId) return alert('يرجى اختيار طالب أولاً');
    const newLog: DamageLog = {
      ...damageForm as DamageLog,
      id: Date.now().toString(),
      day: getDayName(damageForm.date || today)
    };
    const currentLogs = data.damageLogs || [];
    updateData({ damageLogs: [newLog, ...currentLogs] });
    alert('تم حفظ سجل الإتلاف بنجاح');
    setDamageForm({ ...damageForm, studentName: '', studentId: '', grade: '', section: '', description: '', notes: '', pledge: '', statusTags: [] });
  };

  const togglePinnedDamageStudent = (studentName: string) => {
    const pinned = data.pinnedDamageStudents || [];
    const updated = pinned.includes(studentName) ? pinned.filter(n => n !== studentName) : [...pinned, studentName];
    updateData({ pinnedDamageStudents: updated });
  };

  const addCustomDamageItem = () => {
    const val = prompt('أدخل وصفاً جديداً لحالة الإتلاف:');
    if (!val) return;
    const customs = data.customDamageItems || [];
    updateData({ customDamageItems: [...customs, val] });
  };

  const toggleDamageStatusTag = (val: string) => {
    const current = damageForm.statusTags || [];
    const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    setDamageForm({ ...damageForm, statusTags: updated });
  };

  const togglePinnedStudent = (studentName: string) => {
    const pinned = data.pinnedExitStudents || [];
    const updated = pinned.includes(studentName) ? pinned.filter(n => n !== studentName) : [...pinned, studentName];
    updateData({ pinnedExitStudents: updated });
  };

  const addCustomExitStatus = () => {
    const val = prompt('أدخل وصفاً لحالة الخروج الجديدة:');
    if (!val) return;
    const customs = data.customExitItems || [];
    updateData({ customExitItems: [...customs, val] });
  };

  const toggleExitStatusItem = (val: string) => {
    const current = exitForm.customStatusItems || [];
    const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    setExitForm({ ...exitForm, customStatusItems: updated });
  };

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

  const exportToWhatsApp = (title: string, tableData: any[], columns: { label: string, key: string }[]) => {
    let msg = `*📋 ${title}*\n`;
    msg += `*التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n`;
    msg += `----------------------------------\n\n`;
    tableData.forEach((row, idx) => {
      msg += `*🔹 البند (${idx + 1}):*\n`;
      columns.forEach(col => {
        let val = Array.isArray(row[col.key]) ? row[col.key].join('، ') : row[col.key];
        let symbol = '▪️';
        if (col.key === 'studentName' || col.key === 'name') symbol = '👤';
        if (col.key === 'grade') symbol = '📍';
        if (col.key === 'prevExitCount' || col.key === 'prevDamageCount') symbol = '🔢';
        if (col.key === 'date') symbol = '📅';
        if (col.key === 'statusTags' || col.key === 'status') symbol = '🏷️';
        if (col.key === 'action') symbol = '🛡️';
        if (col.key === 'description') symbol = '🔨';
        if (col.key === 'notes') symbol = '📝';
        msg += `${symbol} *${col.label}:* ${val || '---'}\n`;
      });
      msg += `\n`;
    });
    msg += `----------------------------------\n`;
    msg += `*إعداد المستشار الإداري والتربوي إبراهيم دخان*`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // --- Implementation of missing render functions to fix errors ---

  const renderAbsenceModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const filteredLogs = (data.absenceLogs || []).filter(l => {
       if (appliedNames.length > 0 && !appliedNames.includes(l.studentName)) return false;
       return true;
    });

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <div className="flex gap-2">
              <button onClick={() => setShowTable(!showTable)} className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-bold text-xs">{showTable ? 'رصد جديد' : 'جدول الغياب'}</button>
              <button onClick={() => setActiveSubTab(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
           </div>
           <h3 className="text-2xl font-black text-orange-600">سجل الغياب اليومي</h3>
        </div>
        {!showTable ? (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
               <div className="relative">
                  <label className="text-xs font-black text-slate-400 mb-1 block">بحث عن الطالب</label>
                  <input type="text" className="w-full p-4 border-2 rounded-2xl outline-none" placeholder="اكتب اسم الطالب..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-xl shadow-xl mt-1">
                      {suggestions.map(s => (
                        <button key={s.id} onClick={() => { 
                          setAbsenceForm({...absenceForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section});
                          setSearchQuery('');
                        }} className="w-full text-right p-3 hover:bg-orange-50 border-b last:border-none font-bold">{s.name}</button>
                      ))}
                    </div>
                  )}
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white border rounded-xl"><label className="text-[10px] block text-slate-400">الصف</label><span className="font-bold">{absenceForm.studentName ? absenceForm.grade : '---'}</span></div>
                  <div className="p-3 bg-white border rounded-xl"><label className="text-[10px] block text-slate-400">الشعبة</label><span className="font-bold">{absenceForm.studentName ? absenceForm.section : '---'}</span></div>
                  <input type="date" className="p-3 border rounded-xl font-bold" value={absenceForm.date} onChange={e => setAbsenceForm({...absenceForm, date: e.target.value})} />
                  <select className="p-3 border rounded-xl font-bold" value={absenceForm.status} onChange={e => setAbsenceForm({...absenceForm, status: e.target.value as any})}>
                     <option value="expected">غياب متوقع</option>
                     <option value="recurring">غياب متكرر</option>
                     <option value="disconnected">منقطع</option>
                  </select>
               </div>
               <textarea className="w-full p-4 border-2 rounded-2xl font-bold" placeholder="سبب الغياب..." value={absenceForm.reason} onChange={e => setAbsenceForm({...absenceForm, reason: e.target.value})} />
               <button onClick={saveAbsence} className="w-full bg-orange-600 text-white p-4 rounded-2xl font-black text-lg">حفظ الغياب</button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border">
             <table className="w-full text-center text-sm">
                <thead className="bg-orange-50 text-orange-800">
                   <tr>
                      <th className="p-4 border-b">الطالب</th>
                      <th className="p-4 border-b">الصف</th>
                      <th className="p-4 border-b">التاريخ</th>
                      <th className="p-4 border-b">السبب</th>
                      <th className="p-4 border-b">تواصل</th>
                   </tr>
                </thead>
                <tbody>
                   {filteredLogs.map(l => (
                      <tr key={l.id} className="border-b">
                         <td className="p-4 font-bold">{l.studentName}</td>
                         <td className="p-4">{l.grade} - {l.section}</td>
                         <td className="p-4">{l.date}</td>
                         <td className="p-4">{l.reason}</td>
                         <td className="p-4">{l.commStatus}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    );
  };

  const renderLatenessModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const filteredLogs = (data.latenessLogs || []).filter(l => appliedNames.length === 0 || appliedNames.includes(l.studentName));
    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <div className="flex gap-2">
              <button onClick={() => setShowTable(!showTable)} className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl font-bold text-xs">{showTable ? 'رصد جديد' : 'جدول التأخر'}</button>
              <button onClick={() => setActiveSubTab(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
           </div>
           <h3 className="text-2xl font-black text-amber-600">سجل تأخر الطلاب</h3>
        </div>
        {!showTable ? (
          <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
             <div className="relative">
                <label className="text-xs font-black text-slate-400 mb-1 block">البحث عن طالب</label>
                <input type="text" className="w-full p-4 border-2 rounded-2xl outline-none" placeholder="اكتب اسم الطالب..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-xl shadow-xl mt-1">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => { 
                        setLatenessForm({...latenessForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section});
                        setSearchQuery('');
                      }} className="w-full text-right p-3 hover:bg-amber-50 border-b last:border-none font-bold">{s.name}</button>
                    ))}
                  </div>
                )}
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white border rounded-xl"><label className="text-[10px] block text-slate-400">الصف</label><span className="font-bold">{latenessForm.studentName ? latenessForm.grade : '---'}</span></div>
                <div className="p-3 bg-white border rounded-xl"><label className="text-[10px] block text-slate-400">الشعبة</label><span className="font-bold">{latenessForm.studentName ? latenessForm.section : '---'}</span></div>
                <input type="date" className="p-3 border rounded-xl font-bold" value={latenessForm.date} onChange={e => setLatenessForm({...latenessForm, date: e.target.value})} />
                <select className="p-3 border rounded-xl font-bold" value={latenessForm.status} onChange={e => setLatenessForm({...latenessForm, status: e.target.value as any})}>
                   <option value="recurring">تأخر متكرر</option>
                   <option value="frequent">تأخر معتاد</option>
                </select>
             </div>
             <textarea className="w-full p-4 border-2 rounded-2xl font-bold" placeholder="سبب التأخر والإجراء..." value={latenessForm.reason} onChange={e => setLatenessForm({...latenessForm, reason: e.target.value})} />
             <button onClick={saveLateness} className="w-full bg-amber-600 text-white p-4 rounded-2xl font-black text-lg">حفظ التأخر</button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border">
             <table className="w-full text-center text-sm">
                <thead className="bg-amber-50 text-amber-800">
                   <tr>
                      <th className="p-4 border-b">الطالب</th>
                      <th className="p-4 border-b">التاريخ</th>
                      <th className="p-4 border-b">السبب</th>
                      <th className="p-4 border-b">الإجراء</th>
                   </tr>
                </thead>
                <tbody>
                   {filteredLogs.map(l => (
                      <tr key={l.id} className="border-b">
                         <td className="p-4 font-bold">{l.studentName}</td>
                         <td className="p-4">{l.date}</td>
                         <td className="p-4">{l.reason}</td>
                         <td className="p-4">{l.action}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    );
  };

  const renderViolationModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const filteredLogs = (data.studentViolationLogs || []).filter(l => appliedNames.length === 0 || appliedNames.includes(l.studentName));
    const customs = data.customViolationElements || { behavior: [], duties: [], achievement: [] };

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <div className="flex gap-2">
              <button onClick={() => setShowTable(!showTable)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold text-xs">{showTable ? 'رصد جديد' : 'جدول المخالفات'}</button>
              <button onClick={() => setActiveSubTab(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
           </div>
           <h3 className="text-2xl font-black text-red-600">المخالفات الطلابية</h3>
        </div>
        {!showTable ? (
          <div className="bg-slate-50 p-6 rounded-3xl space-y-6">
             <div className="relative">
                <label className="text-xs font-black text-slate-400 mb-1 block">البحث عن طالب</label>
                <input type="text" className="w-full p-4 border-2 rounded-2xl outline-none" placeholder="اكتب اسم الطالب..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-xl shadow-xl mt-1">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => { 
                        setViolationForm({...violationForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section});
                        setSearchQuery('');
                      }} className="w-full text-right p-3 hover:bg-red-50 border-b last:border-none font-bold">{s.name}</button>
                    ))}
                  </div>
                )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['behavior', 'duties', 'achievement'].map(cat => (
                  <div key={cat} className="bg-white p-4 rounded-2xl border shadow-sm space-y-2">
                    <h4 className="font-black text-xs border-b pb-1 mb-2">{cat === 'behavior' ? 'مخالفات سلوكية' : cat === 'duties' ? 'مخالفات واجبات' : 'مخالفات تحصيلية'}</h4>
                    <div className="flex flex-wrap gap-1">
                      {(customs[cat as keyof typeof customs] || []).map(v => (
                        <button key={v} onClick={() => toggleViolationType(cat as any, v)} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${violationForm[cat === 'behavior' ? 'behaviorViolations' : cat === 'duties' ? 'dutiesViolations' : 'achievementViolations']?.includes(v) ? 'bg-red-600 text-white' : 'bg-slate-50'}`}>{v}</button>
                      ))}
                      <button onClick={() => addCustomViolationElement(cat as any)} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600">+</button>
                    </div>
                  </div>
                ))}
             </div>
             <button onClick={saveViolation} className="w-full bg-red-600 text-white p-4 rounded-2xl font-black text-lg">تسجيل المخالفة</button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border">
             <table className="w-full text-center text-sm">
                <thead className="bg-red-50 text-red-800">
                   <tr>
                      <th className="p-4 border-b">الطالب</th>
                      <th className="p-4 border-b">التاريخ</th>
                      <th className="p-4 border-b">نوع المخالفة</th>
                      <th className="p-4 border-b">العدد</th>
                   </tr>
                </thead>
                <tbody>
                   {filteredLogs.map(l => (
                      <tr key={l.id} className="border-b">
                         <td className="p-4 font-bold">{l.studentName}</td>
                         <td className="p-4">{l.date}</td>
                         <td className="p-4 text-xs">{[...(l.behaviorViolations || []), ...(l.dutiesViolations || []), ...(l.achievementViolations || [])].join(', ')}</td>
                         <td className="p-4 font-bold">{l.totalViolations}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    );
  };

  const renderExitModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const filteredLogs = (data.exitLogs || []).filter(l => appliedNames.length === 0 || appliedNames.includes(l.studentName));
    const customs = data.customExitItems || [];
    const pinned = data.pinnedExitStudents || [];

    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <div className="flex gap-2">
              <button onClick={() => setShowTable(!showTable)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-xs">{showTable ? 'رصد جديد' : 'جدول الخروج'}</button>
              <button onClick={() => setActiveSubTab(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
           </div>
           <h3 className="text-2xl font-black text-blue-600">خروج طالب أثناء الدراسة</h3>
        </div>
        {!showTable ? (
          <div className="bg-slate-50 p-6 rounded-3xl space-y-6">
             <div className="relative">
                <label className="text-xs font-black text-slate-400 mb-1 block">بحث عن طالب</label>
                <input type="text" className="w-full p-4 border-2 rounded-2xl outline-none" placeholder="اكتب اسم الطالب..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-xl shadow-xl mt-1">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => { 
                        setExitForm({...exitForm, studentId: s.id, studentName: s.name, grade: s.grade, section: s.section, prevExitCount: (data.exitLogs || []).filter(l => l.studentId === s.id).length});
                        setSearchQuery('');
                      }} className="w-full text-right p-3 hover:bg-blue-50 border-b last:border-none font-bold">{s.name}</button>
                    ))}
                  </div>
                )}
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white border rounded-xl"><label className="text-[10px] block text-slate-400">الصف</label><span className="font-bold">{exitForm.studentName ? exitForm.grade : '---'}</span></div>
                <div className="p-3 bg-white border rounded-xl"><label className="text-[10px] block text-slate-400">الشعبة</label><span className="font-bold">{exitForm.studentName ? exitForm.section : '---'}</span></div>
                <div className="p-3 bg-blue-600 text-white rounded-xl text-center"><label className="text-[10px] block">مرات الخروج</label><span className="font-black text-xl">{exitForm.prevExitCount || 0}</span></div>
                <input type="date" className="p-3 border rounded-xl font-bold" value={exitForm.date} onChange={e => setExitForm({...exitForm, date: e.target.value})} />
             </div>
             <div className="bg-white p-4 rounded-2xl border shadow-sm">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="font-black text-xs">حالة الخروج</h4>
                   <button onClick={addCustomExitStatus} className="text-blue-600 font-bold">+</button>
                </div>
                <div className="flex flex-wrap gap-1">
                   {['موعد طبي', 'حالة عائلية', 'تعب', 'إذن خاص'].concat(customs).map(st => (
                      <button key={st} onClick={() => toggleExitStatusItem(st)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${exitForm.customStatusItems?.includes(st) ? 'bg-blue-600 text-white' : 'bg-slate-50'}`}>{st}</button>
                   ))}
                </div>
             </div>
             <button onClick={saveExitLog} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-lg">حفظ بيان الخروج</button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border">
             <table className="w-full text-center text-sm">
                <thead className="bg-blue-50 text-blue-800">
                   <tr>
                      <th className="p-4 border-b">الطالب</th>
                      <th className="p-4 border-b">التاريخ</th>
                      <th className="p-4 border-b">الحالة</th>
                      <th className="p-4 border-b">الإجراء</th>
                   </tr>
                </thead>
                <tbody>
                   {filteredLogs.map(l => (
                      <tr key={l.id} className="border-b">
                         <td className="p-4 font-bold">{l.studentName}</td>
                         <td className="p-4">{l.date}</td>
                         <td className="p-4 text-xs">{l.customStatusItems?.join(', ')}</td>
                         <td className="p-4">{l.action}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    );
  };

  const renderDamageModule = () => {
    const suggestions = searchQuery.trim() ? students.filter(s => s.name.includes(searchQuery)) : [];
    const customs = data.customDamageItems || [];
    const pinned = data.pinnedDamageStudents || [];
    
    const filteredLogs = (data.damageLogs || []).filter(l => {
      if (appliedDamageNames.length > 0 && !appliedDamageNames.includes(l.studentName)) return false;
      if (damageFilterValues.start && l.date < damageFilterValues.start) return false;
      if (damageFilterValues.end && l.date > damageFilterValues.end) return false;
      if (damageFilterValues.semester && l.semester !== damageFilterValues.semester) return false;
      if (damageFilterValues.grade && l.grade !== damageFilterValues.grade) return false;
      if (damageFilterValues.section && l.section !== damageFilterValues.section) return false;
      return true;
    });

    const dNameSuggestions = damageNameInput.trim() ? students.filter(s => s.name.includes(damageNameInput) && !tempDamageNames.includes(s.name)) : [];

    return (
      <div className="bg-white p-8 rounded-[3rem] border-2 shadow-2xl animate-in fade-in zoom-in duration-300 font-arabic text-right relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
        
        <div className="flex items-center justify-between mb-8 border-b-2 border-red-50 pb-6">
          <div className="flex gap-3">
            <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-2 bg-red-50 text-red-700 px-6 py-3 rounded-2xl font-black text-sm hover:bg-red-100 shadow-sm transition-all active:scale-95">
              {showTable ? <Plus size={18}/> : <LayoutList size={18}/>}
              {showTable ? 'رصد إتلاف جديد' : 'جدول الإتلاف'}
            </button>
            <button onClick={() => setActiveSubTab(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={20}/></button>
          </div>
          <div className="text-left">
            <h2 className="text-3xl font-black text-red-600 flex items-center justify-end gap-3">
               سجل الإتلاف المدرسي <Hammer size={32} />
            </h2>
            <p className="text-slate-400 font-bold mt-1">تاريخ اليوم: {getDayName(today)} {today}</p>
          </div>
        </div>

        {!showTable ? (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Part A: Student Data */}
              <div className="lg:col-span-2 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-r-4 border-red-500 pr-3">بيانات الطالب والإتلاف</h3>
                
                <div className="relative">
                  <label className="text-xs font-black text-slate-400 mb-2 block mr-2">اسم الطالب</label>
                  <div className="flex items-center gap-2 bg-white border-2 rounded-2xl p-4 focus-within:border-red-500 shadow-sm transition-all">
                    <Search className="text-slate-400" size={20}/>
                    <input type="text" className="bg-transparent w-full outline-none font-black text-lg" placeholder="ابحث عن الطالب لإضافته..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    {damageForm.studentName && (
                      <button onClick={() => togglePinnedDamageStudent(damageForm.studentName!)} className="p-2 hover:bg-red-50 rounded-xl transition-colors">
                        <Star className={`w-6 h-6 ${pinned.includes(damageForm.studentName!) ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                      </button>
                    )}
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto">
                      {suggestions.map(s => (
                        <button key={s.id} onClick={() => { 
                          setDamageForm({ 
                            ...damageForm, 
                            studentId: s.id, 
                            studentName: s.name, 
                            grade: s.grade, 
                            section: s.section, 
                            prevDamageCount: (data.damageLogs || []).filter(l => l.studentId === s.id).length 
                          });
                          setSearchQuery('');
                        }} className="w-full text-right p-4 hover:bg-red-50 font-black border-b last:border-none flex justify-between items-center">
                          <span>{s.name}</span>
                          <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg">{s.grade} - {s.section}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الصف</label><span className="font-black text-red-700">{damageForm.grade || '---'}</span></div>
                  <div className="bg-white p-4 rounded-2xl border shadow-sm"><label className="text-[10px] block text-slate-400 mb-1">الشعبة</label><span className="font-black text-red-700">{damageForm.section || '---'}</span></div>
                  <div className="bg-red-600 text-white p-4 rounded-2xl border shadow-sm text-center">
                    <label className="text-[10px] block text-red-100 mb-1">عدد الإتلافات</label>
                    <span className="font-black text-2xl">{damageForm.prevDamageCount ?? 0}</span>
                  </div>
                  <div className="bg-white p-2 rounded-2xl border shadow-sm">
                    <label className="text-[10px] block text-slate-400 mb-1 mr-2">تاريخ الإتلاف</label>
                    <input type="date" className="w-full p-2 text-xs font-black outline-none bg-transparent" value={damageForm.date} onChange={e => setDamageForm({...damageForm, date: e.target.value})}/>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 mb-2 block mr-2">الفصل الدراسي</label>
                    <div className="flex gap-2">
                      {['الفصلين', 'الأول', 'الثاني'].map(sem => (
                        <button key={sem} onClick={() => setDamageForm({...damageForm, semester: sem as any})} className={`flex-1 p-3 rounded-xl font-black text-sm border-2 transition-all ${damageForm.semester === sem ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}>{sem}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 mb-2 block mr-2">بيان الإتلاف</label>
                    <textarea className="w-full p-3 bg-white border-2 rounded-xl font-black text-xs outline-none focus:border-red-500 min-h-[60px]" placeholder="ماذا تم إتلافه؟" value={damageForm.description} onChange={e => setDamageForm({...damageForm, description: e.target.value})}></textarea>
                  </div>
                </div>
              </div>

              {/* Part B: Damage Status */}
              <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6 flex flex-col">
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-black text-slate-800 border-r-4 border-blue-500 pr-3">حالة الإتلاف</h3>
                    <button onClick={addCustomDamageItem} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95"><Plus size={16}/></button>
                 </div>

                 <div className="space-y-4 flex-1">
                    <div className="flex gap-2 flex-wrap">
                      {['كثير الإتلاف', 'متوسط الإتلاف', 'نادر الإتلاف', 'عمد', 'خطأ', 'وحده', 'مع غيره'].map(tag => (
                        <button key={tag} onClick={() => toggleDamageStatusTag(tag)} className={`px-4 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${damageForm.statusTags?.includes(tag) ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
                          {tag}
                        </button>
                      ))}
                    </div>

                    <div className="bg-white/50 p-4 rounded-[2rem] border-2 border-dashed border-slate-200 min-h-[140px] flex flex-wrap gap-2 content-start shadow-inner">
                       {customs.length === 0 && <p className="text-[10px] text-slate-400 w-full text-center mt-8 italic">لا توجد عناصر مضافة..</p>}
                       {customs.map(c => (
                         <button key={c} onClick={() => toggleDamageStatusTag(c)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${damageForm.statusTags?.includes(c) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-500'}`}>{c}</button>
                       ))}
                    </div>
                 </div>
              </div>
            </div>

            {/* Part C: Procedure and Pledge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-2 border-slate-50 pt-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 mr-2">الإجراء المتخذ</label>
                  <select className="w-full p-5 bg-white border-2 border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:border-red-500 shadow-sm" value={damageForm.action} onChange={e => setDamageForm({...damageForm, action: e.target.value})}>
                    {['تنبيه', 'تعهد', 'إلزامه بإصلاح الإتلاف', 'اتصال بولي الأمر', 'توقيف جزئي', 'الرفع به إلى جهة إدارية عليا', 'غيرها'].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 mr-2">ملاحظات عامة</label>
                  <textarea className="w-full p-5 bg-white border-2 border-slate-100 rounded-3xl font-black text-sm outline-none focus:border-red-500 shadow-sm min-h-[120px]" placeholder="تفاصيل الملاحظات..." value={damageForm.notes} onChange={e => setDamageForm({...damageForm, notes: e.target.value})}></textarea>
                </div>
              </div>

              <div className="p-8 bg-red-600 text-white rounded-[3rem] shadow-2xl space-y-6 relative group overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <h4 className="flex items-center gap-3 font-black text-xl"><Fingerprint className="text-red-200" size={28}/> بصمة الطالب الرقمية</h4>
                <div className="p-6 bg-red-700/50 rounded-2xl border-2 border-red-400/30">
                  <p className="text-sm font-bold leading-relaxed opacity-95">
                    أتعهد بعدم تكرار المخالفة وفي حالة التكرار فللإدارة الحق في اتخاذ اللازم.
                  </p>
                </div>
                <button 
                  onClick={() => setDamageForm({...damageForm, pledge: 'تم التبصيم بنجاح'})} 
                  className={`w-full p-5 rounded-[1.5rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${damageForm.pledge ? 'bg-green-500 text-white border-green-500' : 'bg-white text-red-700 hover:scale-105 active:scale-95 border-none'}`}
                >
                  {damageForm.pledge ? <CheckCircle size={24}/> : <Zap size={24}/>}
                  {damageForm.pledge || 'اعتماد بصمة التعهد'}
                </button>
              </div>
            </div>

            <button onClick={saveDamageLog} className="w-full bg-slate-900 text-white p-7 rounded-[2.5rem] font-black text-2xl hover:bg-black shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98]">
               <Save size={32}/> حفظ سجل الإتلاف
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
            {/* Table View with Filters (Part H) */}
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 space-y-6 shadow-sm">
                <div className="flex flex-wrap gap-6 items-end">
                    <div className="flex-1 min-w-[350px] space-y-2">
                        <label className="text-sm font-black text-slate-500 mr-2">فلترة بالأسماء</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border-2 focus-within:border-red-400 transition-all shadow-sm">
                                    <Search size={18} className="text-slate-400"/>
                                    <input 
                                        type="text" 
                                        className="text-sm font-black outline-none bg-transparent w-full" 
                                        placeholder="اكتب اسم الطالب..." 
                                        value={damageNameInput} 
                                        onChange={e => setDamageNameInput(e.target.value)} 
                                    />
                                </div>
                                {dNameSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-[70] bg-white border-2 rounded-2xl shadow-2xl mt-2 max-h-56 overflow-y-auto">
                                        {dNameSuggestions.map(s => (
                                            <button key={s.id} onClick={() => { setTempDamageNames([...tempDamageNames, s.name]); setDamageNameInput(''); }} className="w-full text-right p-4 text-xs font-black hover:bg-red-50 border-b last:border-none">
                                                {s.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setAppliedDamageNames(tempDamageNames)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-red-700 shadow-md">موافق</button>
                            <button onClick={() => { setTempDamageNames([]); setAppliedDamageNames([]); }} className="bg-white text-slate-400 border-2 px-5 py-3 rounded-2xl font-black text-xs">إعادة ضبط</button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tempDamageNames.map(name => (
                                <span key={name} className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-xl text-[10px] font-black border border-red-200">
                                    {name} <button onClick={() => setTempDamageNames(tempDamageNames.filter(n => n !== name))}><X size={12}/></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-500 mr-2">نطاق التاريخ</label>
                        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border-2 shadow-sm">
                            <Calendar size={18} className="text-slate-400"/>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-300">من:</span>
                                <input type="date" className="text-xs font-black outline-none bg-transparent" value={damageFilterValues.start} onChange={e => setDamageFilterValues({...damageFilterValues, start: e.target.value})} />
                            </div>
                            <span className="mx-4 text-slate-200">|</span>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-300">إلى:</span>
                                <input type="date" className="text-xs font-black outline-none bg-transparent" value={damageFilterValues.end} onChange={e => setDamageFilterValues({...damageFilterValues, end: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pb-1">
                        <button title="استيراد" className="p-4 bg-white border-2 text-blue-600 rounded-2xl shadow-sm"><FileUp size={22}/></button>
                        <button title="تصدير TXT" className="p-4 bg-white border-2 text-slate-600 rounded-2xl shadow-sm"><FileText size={22}/></button>
                        <button 
                            title="تصدير Excel" 
                            onClick={() => {
                              const worksheet = XLSX.utils.json_to_sheet(filteredLogs.map(l => ({
                                'اسم الطالب': l.studentName, 'الصف': l.grade, 'مرات الإتلاف': l.prevDamageCount, 'التاريخ': l.date, 'بيان الإتلاف': l.description, 'الإجراء': l.action
                              })));
                              const workbook = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(workbook, worksheet, "Damages");
                              XLSX.writeFile(workbook, `Damages_Report.xlsx`);
                            }}
                            className="p-4 bg-white border-2 text-green-700 rounded-2xl shadow-sm"
                        >
                            <FileSpreadsheet size={22}/>
                        </button>
                        <button 
                            title="إرسال واتساب"
                            onClick={() => exportToWhatsApp('تقرير الإتلاف المدرسي المفلتر', filteredLogs, [
                                { label: 'اسم الطالب', key: 'studentName' },
                                { label: 'الصف', key: 'grade' },
                                { label: 'عدد الإتلافات', key: 'prevDamageCount' },
                                { label: 'التاريخ', key: 'date' },
                                { label: 'بيان الإتلاف', key: 'description' },
                                { label: 'حالة الإتلاف', key: 'statusTags' },
                                { label: 'الإجراء', key: 'action' },
                                { label: 'ملاحظات', key: 'notes' }
                            ])} 
                            className="p-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 shadow-xl"
                        >
                            <MessageCircle size={22}/>
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-[2.5rem] border-4 border-slate-50">
                <table className="w-full text-center text-sm border-collapse">
                    <thead className="bg-[#FFD966] text-slate-800 font-black">
                        <tr>
                            <th className="p-6 border-e border-red-200">اسم الطالب</th>
                            <th className="p-6 border-e border-red-200">الصف / الشعبة</th>
                            <th className="p-6 border-e border-red-200">إجمالي الإتلاف</th>
                            <th className="p-6 border-e border-red-200">التاريخ</th>
                            <th className="p-6 border-e border-red-200">بيان الإتلاف</th>
                            <th className="p-6 border-e border-red-200">حالة الإتلاف</th>
                            <th className="p-6 border-e border-red-200">نوع الإجراء</th>
                            <th className="p-6">ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-bold">
                        {filteredLogs.length === 0 ? (
                            <tr><td colSpan={8} className="p-20 text-slate-300 italic text-lg font-bold">لا توجد سجلات مطابقة.</td></tr>
                        ) : (
                            filteredLogs.map(l => (
                                <tr key={l.id} className="hover:bg-red-50/30 transition-colors">
                                    <td className="p-5 border-e border-slate-50 font-black">{l.studentName}</td>
                                    <td className="p-5 border-e border-slate-50">{l.grade} / {l.section}</td>
                                    <td className="p-5 border-e border-slate-50 text-red-600 font-black text-lg">{l.prevDamageCount + 1}</td>
                                    <td className="p-5 border-e border-slate-50">{l.date}</td>
                                    <td className="p-5 border-e border-slate-50 text-xs">{l.description}</td>
                                    <td className="p-5 border-e border-slate-50">
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {l.statusTags?.map(t => (
                                                <span key={t} className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[8px] font-black">{t}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-5 border-e border-slate-50 text-red-600">{l.action}</td>
                                    <td className="p-5 text-slate-400 text-xs">{l.notes}</td>
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

  const renderCurrentModule = () => {
    switch (activeSubTab) {
      case 'الغياب اليومي': return renderAbsenceModule();
      case 'التأخر': return renderLatenessModule();
      case 'المخالفات الطلابية': return renderViolationModule();
      case 'خروج طالب أثناء الدراسة': return renderExitModule();
      case 'سجل الإتلاف المدرسي': return renderDamageModule();
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
