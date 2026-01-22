import React, { useState, useMemo } from 'react';
import { useGlobal } from '../context/GlobalState';
import { Plus, Trash2, CheckCircle, FileText, FileSpreadsheet, Share2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const SubstitutionPage: React.FC = () => {
  const { lang, data, updateData } = useGlobal();

  // الحصول على قائمة المعلمين المضافين في تقارير المتابعة لمنع تكرار الإدخال اليدوي
  const teacherList = useMemo(() => {
    const names = new Set<string>();
    data.dailyReports.forEach(report => {
      report.teachersData.forEach(t => {
        if (t.teacherName) names.add(t.teacherName);
      });
    });
    return Array.from(names);
  }, [data.dailyReports]);

  const handleAddRow = () => {
    const newEntry = {
      id: Date.now().toString(),
      absentTeacher: '',
      replacementTeacher: '',
      period: '',
      class: '',
      date: new Date().toISOString().split('T')[0],
      paymentStatus: 'pending',
      // إضافة حقول الحصص من 1 إلى 7 كما في الصورة
      p1: '', p2: '', p3: '', p4: '', p5: '', p6: '', p7: '',
      signature: ''
    };
    updateData({ substitutions: [...data.substitutions, newEntry as any] });
  };

  const updateEntry = (id: string, field: string, value: string) => {
    const newList = data.substitutions.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    );
    updateData({ substitutions: newList });
  };

  const handleDelete = (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) {
      updateData({ substitutions: data.substitutions.filter(s => s.id !== id) });
    }
  };

  // --- Export Logic ---

  const generateReportText = () => {
    let text = `*📋 جدول تغطية الحصص (الاحتياط)*\n`;
    text += `*التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n`;
    text += `----------------------------------\n\n`;

    data.substitutions.forEach((row: any, i) => {
      text += `*⚠️ الغائب (${i + 1}): ${row.absentTeacher || '---'}*\n`;
      text += `📅 *الحصص الدراسية:*\n`;
      for (let n = 1; n <= 7; n++) {
        const substitute = row[`p${n}`];
        if (substitute) {
          text += `   🔹 ح${n}: ${substitute} (✅ مُغطاة)\n`;
        } else {
          text += `   🔸 ح${n}: --- (❌ لم تُغطى بعد)\n`;
        }
      }
      text += `----------------------------------\n`;
    });
    return text;
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data.substitutions.map(row => ({
      'المعلم الغائب': row.absentTeacher,
      'تاريخ الغياب': row.date,
      'حصة 1': row.p1, 'حصة 2': row.p2, 'حصة 3': row.p3, 'حصة 4': row.p4,
      'حصة 5': row.p5, 'حصة 6': row.p6, 'حصة 7': row.p7
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Substitutions");
    XLSX.writeFile(workbook, `Substitutions_${new Date().getTime()}.xlsx`);
  };

  const exportToTxt = () => {
    const text = generateReportText().replace(/\*/g, '');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Substitutions_${new Date().getTime()}.txt`;
    link.click();
  };

  const sendWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(generateReportText())}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 font-arabic">
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-xl font-black text-slate-800">تغطية الحصص</h2>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={exportToTxt} className="p-2.5 hover:bg-white text-slate-600 rounded-lg transition-all" title="TXT">
              <FileText className="w-4 h-4" />
            </button>
            <button onClick={exportToExcel} className="p-2.5 hover:bg-white text-green-600 rounded-lg transition-all" title="Excel">
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button onClick={sendWhatsApp} className="p-2.5 hover:bg-white text-green-500 rounded-lg transition-all" title="WhatsApp">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={handleAddRow}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" /> إضافة معلم غائب
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-black border-b-2 border-slate-300">
                <th rowSpan={2} className="border-e border-slate-300 p-2 w-12">م</th>
                <th rowSpan={2} className="border-e border-slate-300 p-2 w-48">الغائب</th>
                <th className="border-e border-slate-300 p-2 w-32">الحصة</th>
                <th className="border-e border-slate-300 p-2">1</th>
                <th className="border-e border-slate-300 p-2">2</th>
                <th className="border-e border-slate-300 p-2">3</th>
                <th className="border-e border-slate-300 p-2">4</th>
                <th className="border-e border-slate-300 p-2">5</th>
                <th className="border-e border-slate-300 p-2">6</th>
                <th className="border-e border-slate-300 p-2">7</th>
                <th rowSpan={2} className="p-2 w-12"></th>
              </tr>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b-2 border-slate-300">
                <th className="border-e border-slate-300 p-1 text-xs">البديل / التوقيع</th>
                <th colSpan={7} className="border-e border-slate-300 p-1 text-[10px]">تغطية الحصص الدراسية</th>
              </tr>
            </thead>
            <tbody>
              {data.substitutions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-slate-400 italic">لا توجد بيانات تغطية حالياً. اضغط على زر الإضافة للبدء.</td>
                </tr>
              ) : (
                data.substitutions.map((row: any, idx) => (
                  <React.Fragment key={row.id}>
                    {/* الصف العلوي (البديل) */}
                    <tr className="border-b border-slate-200">
                      <td rowSpan={2} className="border-e border-slate-300 font-black bg-slate-50">{idx + 1}</td>
                      <td rowSpan={2} className="border-e border-slate-300 p-0 bg-[#FFF2CC]">
                        <input 
                          list={`teachers-${row.id}`}
                          className="w-full p-3 bg-transparent text-center font-bold outline-none border-none focus:bg-white transition-colors"
                          placeholder="اسم الغائب..."
                          value={row.absentTeacher}
                          onChange={(e) => updateEntry(row.id, 'absentTeacher', e.target.value)}
                        />
                        <datalist id={`teachers-${row.id}`}>
                          {teacherList.map(name => <option key={name} value={name} />)}
                        </datalist>
                      </td>
                      <td className="border-e border-slate-300 p-2 bg-slate-50 font-black text-xs">البديل</td>
                      {[1, 2, 3, 4, 5, 6, 7].map(num => (
                        <td key={num} className="border-e border-slate-300 p-0 bg-[#E2EFDA]/30">
                          <input 
                            list={`teachers-p${num}-${row.id}`}
                            className="w-full p-2 text-center text-xs outline-none bg-transparent focus:bg-white"
                            value={row[`p${num}`] || ''}
                            onChange={(e) => updateEntry(row.id, `p${num}`, e.target.value)}
                          />
                          <datalist id={`teachers-p${num}-${row.id}`}>
                            {teacherList.map(name => <option key={name} value={name} />)}
                          </datalist>
                        </td>
                      ))}
                      <td rowSpan={2} className="p-2">
                        <button onClick={() => handleDelete(row.id)} className="text-red-300 hover:text-red-600 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                    {/* صف التوقيع */}
                    <tr className="border-b-2 border-slate-300">
                      <td className="border-e border-slate-300 p-2 bg-slate-50 font-black text-[10px]">التوقيع</td>
                      {[1, 2, 3, 4, 5, 6, 7].map(num => (
                        <td key={`sig-${num}`} className="border-e border-slate-300 p-1 bg-white">
                          {row[`sig${num}`] === 'تمت الموافقة' ? (
                            <div className="text-green-600 font-black text-[9px] flex items-center justify-center gap-1">
                              <CheckCircle className="w-3 h-3" /> تمت الموافقة
                            </div>
                          ) : (
                            <button 
                              onClick={() => updateEntry(row.id, `sig${num}`, 'تمت الموافقة')}
                              className="text-[9px] bg-slate-100 px-2 py-1 rounded border border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-all"
                            >
                              توقيع
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubstitutionPage;