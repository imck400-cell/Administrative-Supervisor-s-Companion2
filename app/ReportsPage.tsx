import React, { useState, useMemo, useRef, useEffect, memo } from 'react';
import { useGlobal } from '../context/GlobalState';
import { 
  Plus, Search, Trash2, Filter, ChevronDown, Check, Calendar, Percent, User, Users, Target, Settings2, AlertCircle, X, ChevronRight, Zap, CheckCircle, FilePlus, FolderOpen, Save, ListOrdered, ArrowUpDown, ArrowUp, ArrowDown, SortAsc, Book, School, Type, Sparkles, FilterIcon, BarChart3, LayoutList, Upload, Download, Phone, UserCircle, Activity, Star, FileText, FileSpreadsheet, Share2, Edit, ChevronLeft, UserCheck, GraduationCap, MessageCircle
} from 'lucide-react';
import { TeacherFollowUp, DailyReportContainer, StudentReport } from '../types';
import DynamicTable from '../components/DynamicTable';
import * as XLSX from 'xlsx';

// Constants moved outside to optimize performance and prevent re-renders
const optionsAr = {
  gender: ["ذكر", "أنثى"],
  workOutside: ["لا يعمل", "يعمل"],
  health: ["ممتاز", "مريض"],
  level: ["ممتاز", "متوسط", "جيد", "ضعيف", "ضعيف جداً"],
  behavior: ["ممتاز", "متوسط", "جيد", "جيد جدا", "مقبول", "ضعيف", "ضعيف جدا"],
  mainNotes: ["ممتاز", "كثير الكلام", "كثير الشغب", "عدواني", "تطاول على معلم", "اعتداء على طالب جسدياً", "اعتداء على طالب لفظيا", "أخذ أدوات الغير دون أذنهم", "إتلاف ممتلكات طالب", "إتلاف ممتلكات المدرسة"],
  eduStatus: ["متعلم", "ضعيف", "أمي"],
  followUp: ["ممتازة", "متوسطة", "ضعيفة"],
  cooperation: ["ممتازة", "متوسطة", "ضعيفة", "متذمر", "كثير النقد", "عدواني"],
  grades: ["تمهيدي", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  sections: ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"]
};

const optionsEn = {
  gender: ["Male", "Female"],
  workOutside: ["Doesn't Work", "Works"],
  health: ["Excellent", "Ill"],
  level: ["Excellent", "Average", "Good", "Weak", "Very Weak"],
  behavior: ["Excellent", "Average", "Good", "Very Good", "Acceptable", "Weak", "Very Weak"],
  mainNotes: ["Excellent", "Talkative", "Riotous", "Aggressive", "Teacher Assault", "Physical Assault", "Verbal Assault", "Stealing", "Property Damage", "School Damage"],
  eduStatus: ["Educated", "Weak", "Illiterate"],
  followUp: ["Excellent", "Average", "Weak"],
  cooperation: ["Excellent", "Average", "Weak", "Complaining", "Critical", "Aggressive"],
  grades: ["Pre-K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"],
  sections: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
};

const waFieldOptions = [
  { key: 'all', label: 'جميع البيانات' },
  { key: 'name', label: 'اسم الطالب' },
  { key: 'grade', label: 'الصف' },
  { key: 'section', label: 'الشعبة' },
  { key: 'gender', label: 'النوع' },
  { key: 'address_work', label: 'السكن/ العمل' },
  { key: 'health', label: 'الحالة الصحية' },
  { key: 'guardian', label: 'ولي الأمر (الاسم، الهاتف)' },
  { key: 'academic', label: 'المستوى العلمي (قراءة، كتابة، مشاركة)' },
  { key: 'behavior', label: 'المستوى السلوكي' },
  { key: 'main_notes', label: 'الملاحظات الأساسية' },
  { key: 'guardian_followup', label: 'ولي الأمر المتابع (تعليم، متابعة، تعاون)' },
  { key: 'other_notes', label: 'ملاحظات أخرى' },
];

const detailFieldConfigs = [
  { key: 'name', label: 'اسم الطالب', color: 'border-blue-500' },
  { key: 'grade', label: 'الصف', color: 'border-indigo-500' },
  { key: 'section', label: 'الشعبة', color: 'border-purple-500' },
  { key: 'gender', label: 'النوع', color: 'border-pink-500' },
  { key: 'address', label: 'السكن/ العمل', color: 'border-orange-500' },
  { key: 'healthStatus', label: 'الحالة الصحية', color: 'border-red-500' },
  { key: 'guardianInfo', label: 'ولي الأمر', color: 'border-emerald-500' },
  { key: 'academic', label: 'المستوى العلمي', color: 'border-yellow-500' },
  { key: 'behaviorLevel', label: 'المستوى السلوكي', color: 'border-teal-500' },
  { key: 'mainNotes', label: 'الملاحظات الأساسية', color: 'border-rose-500' },
  { key: 'guardianFollowUp', label: 'ولي الأمر المتابع', color: 'border-cyan-500' },
  { key: 'notes', label: 'ملاحظات أخرى', color: 'border-slate-500' },
];

type FilterMode = 'all' | 'student' | 'percent' | 'metric' | 'grade' | 'section' | 'specific' | 'blacklist' | 'excellence' | 'date';
type SortCriteria = 'manual' | 'name' | 'subject' | 'class';
type SortDirection = 'asc' | 'desc';

// --- Teachers Follow-up Page (DailyReportsPage) ---
export const DailyReportsPage: React.FC = () => {
  const { lang, data, updateData } = useGlobal();
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [showMetricPicker, setShowMetricPicker] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ criteria: SortCriteria, direction: SortDirection }>({ criteria: 'manual', direction: 'asc' });
  const [violationModal, setViolationModal] = useState<{ id: string, notes: string[] } | null>(null);
  const [activeTeacherFilter, setActiveTeacherFilter] = useState<string>('');

  const reports = data.dailyReports || [];
  
  useEffect(() => {
    if (!activeReportId && reports.length > 0) {
      setActiveReportId(reports[reports.length - 1].id);
    }
  }, [reports, activeReportId]);

  const currentReport = reports.find(r => r.id === activeReportId);
  const subjectOrder = ["القرآن الكريم", "التربية الإسلامية", "اللغة العربية", "اللغة الإنجليزية", "الرياضيات", "العلوم", "الكيمياء", "الفيزياء", "الأحياء", "الاجتماعيات", "الحاسوب", "المكتبة", "الفنية", "المختص الاجتماعي", "الأنشطة", "غيرها"];
  
  const teachers = useMemo(() => {
    let list = currentReport ? [...currentReport.teachersData] : [];
    if (filterMode === 'student' && activeTeacherFilter) {
      list = list.filter(t => t.teacherName.includes(activeTeacherFilter));
    }
    list.sort((a, b) => {
      let res = 0;
      if (sortConfig.criteria === 'name') res = a.teacherName.localeCompare(b.teacherName);
      else if (sortConfig.criteria === 'subject') {
        const idxA = subjectOrder.indexOf(a.subjectCode);
        const idxB = subjectOrder.indexOf(b.subjectCode);
        if (idxA !== -1 && idxB !== -1) res = idxA - idxB;
        else if (idxA !== -1) res = -1;
        else if (idxB !== -1) res = 1;
        else res = a.subjectCode.localeCompare(b.subjectCode);
      } else if (sortConfig.criteria === 'class') res = a.className.localeCompare(b.className);
      else if (sortConfig.criteria === 'manual') res = (a.order || 0) - (b.order || 0);
      return sortConfig.direction === 'asc' ? res : -res;
    });
    return list;
  }, [currentReport, sortConfig, filterMode, activeTeacherFilter]);

  const metricsConfig = [
    { key: 'attendance', label: 'الحضور', max: data.maxGrades.attendance || 5 },
    { key: 'appearance', label: 'المظهر', max: data.maxGrades.appearance || 5 },
    { key: 'preparation', label: 'التحضير', max: data.maxGrades.preparation || 10 },
    { key: 'supervision_queue', label: 'طابور', max: data.maxGrades.supervision_queue || 5 },
    { key: 'supervision_rest', label: 'راحة', max: data.maxGrades.supervision_rest || 5 },
    { key: 'supervision_end', label: 'نهاية', max: data.maxGrades.supervision_end || 5 },
    { key: 'correction_books', label: 'كتب', max: data.maxGrades.correction_books || 10 },
    { key: 'correction_notebooks', label: 'دفاتر', max: data.maxGrades.correction_notebooks || 10 },
    { key: 'correction_followup', label: 'متابعة تصحيح', max: data.maxGrades.correction_followup || 10 },
    { key: 'teaching_aids', label: 'وسائل تعليمية', max: data.maxGrades.teaching_aids || 10 },
    { key: 'extra_activities', label: 'أنشطة لا صفية', max: data.maxGrades.extra_activities || 10 },
    { key: 'radio', label: 'إذاعة', max: data.maxGrades.radio || 5 },
    { key: 'creativity', label: 'إبداع', max: data.maxGrades.creativity || 5 },
    { key: 'zero_period', label: 'حصة صفرية', max: data.maxGrades.zero_period || 5 },
  ];

  const subjects = ["القرآن الكريم", "التربية الإسلامية", "اللغة العربية", "الرياضيات", "العلوم", "الكيمياء", "الفيزياء", "الأحياء", "الاجتماعيات", "الحاسوب", "المكتبة", "الفنية", "المختص الاجتماعي", "الأنشطة", "غيرها"];
  const grades = ["تمهيدي", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const violationTypes = ["تأخر عن طابور", "تأخر عن حصة", "خروج من الحصة", "الإفراط في العقاب", "رفض القرارات الإدارية", "عدم تسليم ما كلف به"];

  const displayedMetrics = filterMode === 'metric' && selectedMetrics.length > 0 
    ? metricsConfig.filter(m => selectedMetrics.includes(m.key))
    : metricsConfig;

  const getMetricColor = (key: string) => {
    if (key === 'attendance' || key === 'appearance') return 'bg-[#E2EFDA]';
    if (key === 'preparation') return 'bg-white';
    if (key.startsWith('supervision')) return 'bg-[#FCE4D6]';
    return 'bg-[#DDEBF7]';
  };

  const updateTeacher = (teacherId: string, field: string, value: any) => {
    if (!activeReportId) return;
    const updatedReports = reports.map(r => r.id === activeReportId ? { ...r, teachersData: r.teachersData.map(t => t.id === teacherId ? { ...t, [field]: value } : t) } : r);
    updateData({ dailyReports: updatedReports });
  };

  const calculateTotal = (t: TeacherFollowUp) => {
    let sum = metricsConfig.reduce((acc, m) => acc + (Number((t as any)[m.key]) || 0), 0);
    return Math.max(0, sum - (t.violations_score || 0));
  };

  return (
    <div className="space-y-4 font-arabic">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => {}} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all text-xs sm:text-sm"><FilePlus size={16}/> إضافة جدول جديد</button>
          <button onClick={() => setShowArchive(true)} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-all text-xs sm:text-sm"><FolderOpen size={16}/> فتح تقرير</button>
          <button onClick={() => {}} className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold border border-purple-200 hover:bg-purple-100 transition-all text-xs sm:text-sm"><UserCircle size={16}/> إضافة معلم</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSortModal(true)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 hover:bg-white"><ListOrdered size={18}/></button>
          {currentReport && (
             <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl border border-blue-100">
                <Calendar size={16}/>
                <span className="text-xs font-black">{currentReport.dayName} {currentReport.dateStr}</span>
             </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className={`w-full text-center border-collapse min-w-[1400px]`}>
            <thead>
              <tr className="border-b border-slate-300">
                <th rowSpan={2} className="p-2 border-e border-slate-300 w-10 sticky right-0 bg-[#FFD966] z-20">م</th>
                <th rowSpan={2} className={`p-2 border-e border-slate-300 sticky right-10 bg-[#FFD966] z-20 w-48`}>اسم المعلم</th>
                <th rowSpan={2} className="p-2 border-e border-slate-300 w-28 bg-[#FFD966]">المادة</th>
                <th rowSpan={2} className="p-2 border-e border-slate-300 w-24 bg-[#FFD966]">الصف</th>
                <th colSpan={displayedMetrics.length} className="p-2 border-b border-slate-300 font-black text-sm bg-[#FFD966]">مجالات تقييم المعلمين</th>
                <th rowSpan={2} className="p-2 border-e border-slate-300 w-24 bg-[#C6E0B4]">المخالفات</th>
                <th rowSpan={2} className="p-2 border-e border-slate-300 w-20 bg-[#C6E0B4]">المجموع</th>
                <th rowSpan={2} className="p-2 w-20 bg-[#FFD966]">النسبة</th>
              </tr>
              <tr className="text-[10px]">
                {displayedMetrics.map(m => (
                  <th key={m.key} className={`p-1 border-e border-slate-300 min-w-[70px] align-bottom ${getMetricColor(m.key)}`}>{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, idx) => (
                <tr key={t.id} className="border-b hover:bg-slate-50 transition-colors h-10">
                  <td className="p-1 border-e sticky right-0 bg-white font-bold text-xs">{idx + 1}</td>
                  <td className="p-1 border-e sticky right-10 bg-white"><input className="w-full text-right font-bold outline-none bg-transparent text-xs" value={t.teacherName} onChange={e => updateTeacher(t.id, 'teacherName', e.target.value)} /></td>
                  <td className="p-1 border-e">{t.subjectCode}</td>
                  <td className="p-1 border-e">{t.className}</td>
                  {displayedMetrics.map(m => (
                    <td key={m.key} className="p-1 border-e">{(t as any)[m.key]}</td>
                  ))}
                  <td className="p-1 border-e">{t.violations_score}</td>
                  <td className="p-1 border-e font-black text-blue-600 text-xs">{calculateTotal(t)}</td>
                  <td className="p-1 font-black text-slate-800 text-xs">{((calculateTotal(t) / 100) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showArchive && <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200"><h3 className="text-xl font-black mb-4 text-right">أرشيف التقارير</h3><div className="space-y-2 max-h-80 overflow-y-auto">{reports.map(r => (<button key={r.id} onClick={() => { setActiveReportId(r.id); setShowArchive(false); }} className={`w-full flex justify-between p-4 rounded-xl font-bold border transition-all ${activeReportId === r.id ? 'bg-blue-600 text-white' : 'bg-slate-50'}`}><span>{r.dateStr}</span><span>{r.dayName}</span></button>))}</div><button onClick={() => setShowArchive(false)} className="w-full mt-4 p-3 bg-slate-100 rounded-xl font-bold">إغلاق</button></div></div>}
      {showSortModal && <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"><div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"><h3 className="text-xl font-black text-center mb-4">ترتيب المعلمين</h3><button onClick={() => setShowSortModal(false)} className="w-full p-3 bg-slate-800 text-white rounded-xl font-black">تم</button></div></div>}
    </div>
  );
};

export const ViolationsPage: React.FC = () => {
  const { lang, data, updateData } = useGlobal();
  const [activeMode, setActiveMode] = useState<'students' | 'teachers'>('students');
  const today = new Date().toISOString().split('T')[0];
  const [filterValues, setFilterValues] = useState({ start: today, end: today });
  const [appliedNames, setAppliedNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const studentList = data.studentReports || [];

  const filteredData = useMemo(() => {
    return data.violations.filter(v => v.type === activeMode);
  }, [data.violations, activeMode]);

  return (
    <div className="space-y-6 font-arabic text-right pb-20">
      <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-4">
          <button onClick={() => setActiveMode('students')} className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeMode === 'students' ? 'bg-blue-600 text-white' : 'bg-slate-50'}`}><GraduationCap size={20} /> تعهدات الطلاب</button>
          <button onClick={() => setActiveMode('teachers')} className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeMode === 'teachers' ? 'bg-emerald-600 text-white' : 'bg-slate-50'}`}><UserCheck size={20} /> تعهدات المعلمين</button>
        </div>
        <button onClick={() => setShowFilter(!showFilter)} className={`p-3 rounded-2xl border ${showFilter ? 'bg-slate-800 text-white' : 'bg-white'}`}><Filter size={20} /></button>
      </div>
      <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm border-collapse min-w-[1200px]">
            <thead className="bg-[#FFD966] text-slate-800 font-black"><tr><th className="p-4 border-e border-slate-300 w-12">م</th><th className="p-4 border-e border-slate-300">الاسم</th><th className="p-4 border-e border-slate-300">التاريخ</th><th className="p-4 border-e border-slate-300">المخالفة</th><th className="p-4">الإجراء</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{filteredData.map((v, idx) => (<tr key={v.id} className="hover:bg-slate-50 transition-colors font-bold"><td className="p-4 border-e border-slate-100">{idx + 1}</td><td className="p-2 border-e border-slate-100">{v.studentName || v.teacherName}</td><td className="p-2 border-e border-slate-100">{v.date}</td><td className="p-2 border-e border-slate-100">{v.violation}</td><td className="p-2">{v.procedure}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Memoized Row with Optimized Selectors and instantaneous highlight trigger
const StudentRow = memo(({ s, lang, updateStudent, setShowNotesModal, toggleStar, isSelected, onSelect }: any) => {
  // START OF CHANGE: Instant response logic
  const triggerSelect = () => onSelect(s.id);
  
  return (
    <tr 
      onMouseDown={triggerSelect} // Use onMouseDown instead of onClick for immediate trigger
      className={`hover:bg-blue-50/20 h-10 group cursor-pointer ${isSelected ? 'bg-orange-50' : 'transition-colors'}`}
    >
      <td className={`p-1 border-e border-slate-100 sticky right-0 z-10 group-hover:bg-blue-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)] ${isSelected ? 'bg-orange-50' : 'bg-white transition-colors'}`}>
        <div className="flex items-center gap-1 h-full">
          <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); toggleStar(s.id, 'isExcellent'); }}><Star className={`w-3.5 h-3.5 ${s.isExcellent ? 'fill-green-500 text-green-500' : 'text-slate-300'}`} /></button>
          <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); toggleStar(s.id, 'isBlacklisted'); }}><Star className={`w-3.5 h-3.5 ${s.isBlacklisted ? 'fill-slate-900 text-slate-900' : 'text-slate-300'}`} /></button>
          <input 
            onMouseDown={triggerSelect} // Trigger on mouse down for the name field specifically
            onFocus={triggerSelect} 
            className="flex-1 bg-transparent border-none outline-none font-bold text-[10px] text-right" 
            value={s.name} 
            onChange={(e) => updateStudent(s.id, 'name', e.target.value)} 
          />
        </div>
      </td>
      {/* END OF CHANGE */}
      <td className="p-1 border-e border-slate-100">
        <select onFocus={triggerSelect} className="bg-transparent font-bold text-[9px] outline-none w-full appearance-none text-center" value={s.grade} onChange={(e) => updateStudent(s.id, 'grade', e.target.value)}>
          {optionsAr.grades.map(o => <option key={o} value={o}>{lang === 'ar' ? o : o}</option>)}
        </select>
      </td>
      <td className="p-1 border-e border-slate-100">
        <select onFocus={triggerSelect} className="bg-transparent font-bold text-[9px] outline-none w-full appearance-none text-center" value={s.section} onChange={(e) => updateStudent(s.id, 'section', e.target.value)}>
          {optionsAr.sections.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </td>
      <td className="p-1 border-e border-slate-100">
        <select onFocus={triggerSelect} className="bg-transparent font-bold text-[9px] outline-none w-full appearance-none text-center" value={s.gender} onChange={(e) => updateStudent(s.id, 'gender', e.target.value)}>
          {optionsAr.gender.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </td>
      <td className="p-1 border-e border-slate-100">
        <div className="flex flex-col gap-0.5">
          <input onFocus={triggerSelect} className="w-full text-[9px] text-right bg-transparent outline-none" value={s.address} onChange={(e) => updateStudent(s.id, 'address', e.target.value)} placeholder="..." />
          <select onFocus={triggerSelect} className="text-[8px] bg-slate-50/50 appearance-none text-center" value={s.workOutside} onChange={(e) => updateStudent(s.id, 'workOutside', e.target.value)}>
            {optionsAr.workOutside.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </td>
      <td className="p-1 border-e border-slate-100">
        <div className="flex flex-col gap-0.5">
          <select onFocus={triggerSelect} className={`text-[9px] font-bold appearance-none text-center outline-none bg-transparent ${s.healthStatus === 'مريض' ? 'text-red-600' : ''}`} value={s.healthStatus} onChange={(e) => updateStudent(s.id, 'healthStatus', e.target.value)}>
            {optionsAr.health.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {s.healthStatus === 'مريض' && <input onFocus={triggerSelect} className="text-[8px] text-center border-b outline-none text-red-500" value={s.healthDetails} onChange={(e) => updateStudent(s.id, 'healthDetails', e.target.value)} />}
        </div>
      </td>
      <td className="p-1 border-e border-slate-100">
        <div className="flex flex-col gap-0.5">
          <input onFocus={triggerSelect} className="text-[9px] font-bold text-right outline-none bg-transparent" value={s.guardianName} onChange={(e) => updateStudent(s.id, 'guardianName', e.target.value)} />
          {s.guardianPhones.map((p: any, i: any) => (
            <input key={i} onFocus={triggerSelect} className="text-[8px] w-full text-center bg-slate-50/50 outline-none" value={p} onChange={(e) => { const newP = [...s.guardianPhones]; newP[i] = e.target.value; updateStudent(s.id, 'guardianPhones', newP); }} />
          ))}
        </div>
      </td>
      <td className="p-1 border-e border-slate-100 bg-[#FFF2CC]/5">
        <select onFocus={triggerSelect} className="text-[9px] w-full text-center outline-none bg-transparent" value={s.academicReading} onChange={(e) => updateStudent(s.id, 'academicReading', e.target.value)}>{optionsAr.level.map(o => <option key={o} value={o}>{o}</option>)}</select>
      </td>
      <td className="p-1 border-e border-slate-100 bg-[#FFF2CC]/5">
        <select onFocus={triggerSelect} className="text-[9px] w-full text-center outline-none bg-transparent" value={s.academicWriting} onChange={(e) => updateStudent(s.id, 'academicWriting', e.target.value)}>{optionsAr.level.map(o => <option key={o} value={o}>{o}</option>)}</select>
      </td>
      <td className="p-1 border-e border-slate-100 bg-[#FFF2CC]/5">
        <select onFocus={triggerSelect} className="text-[9px] w-full text-center outline-none bg-transparent" value={s.academicParticipation} onChange={(e) => updateStudent(s.id, 'academicParticipation', e.target.value)}>{optionsAr.level.map(o => <option key={o} value={o}>{o}</option>)}</select>
      </td>
      <td className="p-1 border-e border-slate-100">
        <select onFocus={triggerSelect} className="text-[9px] font-bold w-full text-center outline-none bg-transparent" value={s.behaviorLevel} onChange={(e) => updateStudent(s.id, 'behaviorLevel', e.target.value)}>{optionsAr.behavior.map(o => <option key={o} value={o}>{o}</option>)}</select>
      </td>
      <td className="p-1 border-e border-slate-100">
        <div className="flex flex-wrap gap-0.5 justify-center max-w-[180px]">
          {optionsAr.mainNotes.map(n => (
            <button key={n} onClick={(e) => { e.stopPropagation(); const newN = s.mainNotes.includes(n) ? s.mainNotes.filter((x: any) => x !== n) : [...s.mainNotes, n]; updateStudent(s.id, 'mainNotes', newN); triggerSelect(); }} className={`text-[7px] px-1 py-0.5 rounded border ${s.mainNotes.includes(n) ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-400'}`}>{n}</button>
          ))}
          <input onFocus={triggerSelect} className="text-[8px] border-b w-full mt-0.5 text-center outline-none" value={s.otherNotesText} onChange={(e) => updateStudent(s.id, 'otherNotesText', e.target.value)} />
        </div>
      </td>
      <td className="p-1 border-e border-slate-100 bg-[#DDEBF7]/5">
        <select onFocus={triggerSelect} className="text-[8px] w-full text-center outline-none bg-transparent" value={s.guardianEducation} onChange={(e) => updateStudent(s.id, 'guardianEducation', e.target.value)}>{optionsAr.eduStatus.map(o => <option key={o} value={o}>{o}</option>)}</select>
      </td>
      <td className="p-1 border-e border-slate-100 bg-[#DDEBF7]/5">
        <select onFocus={triggerSelect} className="text-[8px] w-full text-center outline-none bg-transparent" value={s.guardianFollowUp} onChange={(e) => updateStudent(s.id, 'guardianFollowUp', e.target.value)}>{optionsAr.followUp.map(o => <option key={o} value={o}>{o}</option>)}</select>
      </td>
      <td className="p-1 border-e border-slate-100 bg-[#DDEBF7]/5">
        <select onFocus={triggerSelect} className="text-[8px] w-full text-center outline-none bg-transparent" value={s.guardianCooperation} onChange={(e) => updateStudent(s.id, 'guardianCooperation', e.target.value)}>{optionsAr.cooperation.map(o => <option key={o} value={o}>{o}</option>)}</select>
      </td>
      <td className="p-1 text-center">
        <button onClick={(e) => { e.stopPropagation(); setShowNotesModal({id: s.id, text: s.notes}); triggerSelect(); }} className="p-1.5 bg-slate-100 hover:bg-blue-100 rounded-lg transition-all mx-auto block">
          {s.notes ? <CheckCircle size={14} className="text-green-500" /> : <Settings2 size={14} className="text-slate-400" />}
        </button>
      </td>
    </tr>
  );
});

export const StudentsReportsPage: React.FC = () => {
  const { data, updateData, lang } = useGlobal();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [filterValue, setFilterValue] = useState('');
  const [selectedStudentNames, setSelectedStudentNames] = useState<string[]>([]);
  const [studentInput, setStudentInput] = useState('');
  const [activeMetricFilter, setActiveMetricFilter] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState<{id: string, text: string} | null>(null);
  const [metricFilterMode, setMetricFilterMode] = useState(false);
  const [showSpecificFilterModal, setShowSpecificFilterModal] = useState(false);
  const [selectedSpecifics, setSelectedSpecifics] = useState<string[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [showIndividualReportModal, setShowIndividualReportModal] = useState(false);
  const [detailModalSearch, setDetailModalSearch] = useState('');
  const [currentDetailStudent, setCurrentDetailStudent] = useState<StudentReport | null>(null);
  const [activeDetailFields, setActiveDetailFields] = useState<string[]>(['name', 'grade', 'section', 'gender', 'healthStatus', 'guardianInfo', 'academic', 'behaviorLevel', 'mainNotes', 'guardianFollowUp', 'notes']);
  const [waSelector, setWaSelector] = useState<{ type: 'bulk' | 'single', student?: StudentReport } | null>(null);
  const [waSelectedFields, setWaSelectedFields] = useState<string[]>(['all']);
  const [showListModal, setShowListModal] = useState<'blacklist' | 'excellence' | null>(null);
  const [listSearch, setListSearch] = useState('');
  const [tempListSelected, setTempListSelected] = useState<string[]>([]);

  const studentData = data.studentReports || [];

  const updateStudent = (id: string, field: string, value: any) => {
    updateData({ studentReports: studentData.map(s => s.id === id ? { ...s, [field]: value } : s) });
  };

  const filteredData = useMemo(() => {
    let result = [...studentData];
    if (filterMode === 'student') result = result.filter(s => selectedStudentNames.some(name => s.name.includes(name)));
    else if (filterMode === 'grade' && filterValue) result = result.filter(s => s.grade === filterValue);
    else if (filterMode === 'section' && filterValue) result = result.filter(s => s.section === filterValue);
    return result;
  }, [studentData, filterMode, filterValue, selectedStudentNames]);

  return (
    <div className="space-y-4 font-arabic animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => {}} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700 shadow-md">
            <Plus className="w-4 h-4" /> {lang === 'ar' ? 'إضافة طالب' : 'Add Student'}
          </button>
          <button onClick={() => setShowIndividualReportModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-sm">
            <FileText className="w-4 h-4" /> تقرير طالب
          </button>
          <button onClick={() => {}} className="flex items-center gap-2 bg-slate-50 border px-4 py-2.5 rounded-xl font-bold text-sm"><Upload className="w-4 h-4" /> استيراد ملف</button>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-right">
          <button onClick={() => setShowListModal('excellence')} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-black text-sm shadow-sm"><Star className="w-4 h-4 fill-white" /> قائمة التميز</button>
          <button onClick={() => setShowListModal('blacklist')} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-black text-sm shadow-sm"><AlertCircle className="w-4 h-4" /> القائمة السوداء</button>
          <button onClick={() => setShowFilterModal(!showFilterModal)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm ${showFilterModal ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}><Filter className="w-4 h-4" /> فلترة</button>
        </div>
      </div>
      <div className="bg-white rounded-[1.5rem] shadow-xl border border-slate-100 overflow-hidden h-[70vh]">
        <div className="overflow-auto h-full scroll-smooth">
          <table className={`w-full text-center border-collapse table-auto min-w-[1600px]`}>
            <thead className="bg-[#FFD966] text-slate-800 sticky top-0 z-[40] shadow-sm">
              <tr className="border-b border-slate-300 h-12">
                <th rowSpan={2} className="px-3 border-e border-slate-300 w-[160px] text-xs font-black sticky right-0 bg-[#FFD966] z-[50] top-0">اسم الطالب</th>
                <th rowSpan={2} className="px-1 border-e border-slate-300 w-20 text-xs font-black bg-[#FFD966] sticky top-0">الصف</th>
                <th rowSpan={2} className="px-1 border-e border-slate-300 w-16 text-xs font-black bg-[#FFD966] sticky top-0">الشعبة</th>
                <th rowSpan={2} className="px-1 border-e border-slate-300 w-16 text-xs font-black bg-[#FFD966] sticky top-0">النوع</th>
                <th rowSpan={2} className="px-2 border-e border-slate-300 w-24 text-xs font-black bg-[#FFD966] sticky top-0">السكن / العمل</th>
                <th rowSpan={2} className="px-2 border-e border-slate-300 w-24 text-xs font-black bg-[#FFD966] sticky top-0">الحالة الصحية</th>
                <th rowSpan={2} className="px-2 border-e border-slate-300 w-32 text-xs font-black bg-[#FFD966] sticky top-0">ولي الأمر (الاسم/الهاتف)</th>
                <th colSpan={3} className="px-1 border-e border-slate-300 bg-[#FFF2CC] text-xs font-black sticky top-0">المستوى العلمي</th>
                <th rowSpan={2} className="px-2 border-e border-slate-300 w-24 text-xs font-black bg-[#FFD966] sticky top-0">المستوى السلوكي</th>
                <th rowSpan={2} className="px-2 border-e border-slate-300 w-44 text-xs font-black bg-[#FFD966] sticky top-0">الملاحظات الأساسية</th>
                <th colSpan={3} className="px-1 border-e border-slate-300 bg-[#DDEBF7] text-xs font-black sticky top-0">ولي الأمر المتابع</th>
                <th rowSpan={2} className="px-2 w-10 text-xs font-black bg-[#FFD966] sticky top-0">ملاحظات</th>
              </tr>
              <tr className="bg-[#F2F2F2] text-[9px] h-8">
                <th className="border-e border-slate-300 bg-[#FFF2CC] sticky top-12 z-[40]">قراءة</th>
                <th className="border-e border-slate-300 bg-[#FFF2CC] sticky top-12 z-[40]">كتابة</th>
                <th className="border-e border-slate-300 bg-[#FFF2CC] sticky top-12 z-[40]">مشاركة</th>
                <th className="border-e border-slate-300 bg-[#DDEBF7] sticky top-12 z-[40]">تعليم</th>
                <th className="border-e border-slate-300 bg-[#DDEBF7] sticky top-12 z-[40]">متابعة</th>
                <th className="border-e border-slate-300 bg-[#DDEBF7] sticky top-12 z-[40]">تعاون</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((s, idx) => (
                <StudentRow key={s.id} s={s} lang={lang} updateStudent={updateStudent} setShowNotesModal={setShowNotesModal} toggleStar={() => {}} isSelected={selectedRowId === s.id} onSelect={setSelectedRowId} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showNotesModal && <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-right"><h3 className="font-black text-slate-800">ملاحظات إضافية</h3><textarea className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold h-48 text-right" value={showNotesModal.text} onChange={(e) => setShowNotesModal({...showNotesModal, text: e.target.value})} /><div className="flex gap-2"><button onClick={() => setShowNotesModal(null)} className="flex-1 bg-blue-600 text-white p-3 rounded-2xl font-black">موافق</button></div></div></div>}
    </div>
  );
};