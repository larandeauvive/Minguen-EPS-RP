
import React from 'react';
import { ClassData, ObservationResult, ObservationSheet, Sport, StudentRecord } from '../types';

interface StatsPanelProps {
  selectedSport: Sport;
  classes: ClassData[];
  sheets: ObservationSheet[];
  results: ObservationResult[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ selectedSport, classes, sheets, results }) => {
  const [selectedClassId, setSelectedClassId] = React.useState<string>('');

  const targetClass = React.useMemo(() => 
    classes.find(c => c.id === selectedClassId), 
    [classes, selectedClassId]
  );

  const sportSheets = React.useMemo(() => 
    sheets.filter(s => s.sportId === selectedSport.id && s.mode === 'MULTI_CRITERIA'), 
    [sheets, selectedSport]
  );

  const allCriteria = React.useMemo(() => {
    const list: { sheetTitle: string; critLabel: string; obsLabel: string; obsId: string; options?: string[]; type: string }[] = [];
    sportSheets.forEach(sheet => {
      sheet.criteria.forEach(crit => {
        crit.observables.forEach(obs => {
          list.push({
            sheetTitle: sheet.title,
            critLabel: crit.label,
            obsLabel: obs.label,
            obsId: obs.id,
            options: obs.options,
            type: obs.type
          });
        });
      });
    });
    return list;
  }, [sportSheets]);

  const getStudentStats = (studentId: string, obsId: string, type: string, options?: string[]) => {
    const studentResults = results.filter(r => r.studentId === studentId && r.sportId === selectedSport.id);
    
    if (type === 'counter') {
      let sum = 0;
      studentResults.forEach(r => sum += (r.data[obsId] || 0));
      return { type: 'counter', value: sum };
    }

    if (type === 'timer') {
      let total = 0;
      studentResults.forEach(r => total += (r.data[obsId] || 0));
      const avg = studentResults.length > 0 ? (total / studentResults.length).toFixed(1) : "0";
      return { type: 'timer', total, avg };
    }

    if (type === 'categorical' && options) {
      const counts: Record<string, number> = {};
      options.forEach(o => counts[o] = 0);
      
      studentResults.forEach(r => {
        const obsData = r.data[obsId] || {};
        options.forEach(o => {
          counts[o] += (obsData[o] || 0);
        });
      });

      const totalAttempts = Object.values(counts).reduce((a, b) => a + b, 0);
      
      const breakdown = options.map(opt => ({
        label: opt,
        count: counts[opt],
        pct: totalAttempts > 0 ? Math.round((counts[opt] / totalAttempts) * 100) : 0
      }));

      return { 
        type: 'categorical', 
        breakdown, 
        totalAttempts 
      };
    }

    return { type: 'none' };
  };

  return (
    <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      <div className="p-8 border-b bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900">📊 Statistiques de Classe</h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Ventilation détaillée par option et critère</p>
        </div>
        <select 
          value={selectedClassId} 
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="bg-white border-2 border-indigo-100 px-6 py-3 rounded-2xl font-black text-xs text-indigo-600 outline-none focus:border-indigo-500 shadow-sm"
        >
          <option value="">-- Choisir une classe --</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!selectedClassId ? (
        <div className="p-20 text-center">
          <div className="text-6xl mb-4 opacity-20">📈</div>
          <p className="text-slate-400 font-bold italic">Veuillez sélectionner une classe pour afficher le bilan analytique.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-500 border-b sticky left-0 bg-slate-100 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Élève</th>
                {allCriteria.map((c, i) => (
                  <th key={i} className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-500 border-b text-center min-w-[200px] border-l">
                    <div className="text-indigo-600 mb-1">{c.sheetTitle}</div>
                    <div className="text-slate-900 text-[11px] mb-1">{c.critLabel}</div>
                    <div className="text-[8px] font-medium opacity-50 bg-white inline-block px-2 py-0.5 rounded-full border">{c.obsLabel}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {targetClass?.students.slice().sort((a,b) => a.lastName.localeCompare(b.lastName)).map(student => (
                <tr key={student.id} className="border-b hover:bg-slate-50 transition">
                  <td className="p-6 font-black text-xs text-slate-700 sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10">
                    <div className="truncate w-32 uppercase">{student.lastName}</div>
                    <div className="font-medium opacity-50 capitalize text-[10px]">{student.firstName}</div>
                  </td>
                  {allCriteria.map((c, i) => {
                    const stats = getStudentStats(student.id, c.obsId, c.type, c.options);
                    
                    return (
                      <td key={i} className="p-4 border-l align-top">
                        {stats.type === 'categorical' && stats.breakdown && (
                          <div className="space-y-1.5">
                            {stats.breakdown.map((item, idx) => (
                              <div key={idx} className="flex flex-col">
                                <div className="flex justify-between items-center text-[10px] mb-0.5">
                                  <span className="font-bold text-slate-500 uppercase tracking-tighter truncate pr-1">{item.label}</span>
                                  <span className="font-black text-indigo-600 whitespace-nowrap">
                                    {item.pct}% <span className="text-slate-300 font-bold ml-0.5">({item.count})</span>
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-500 transition-all duration-500" 
                                    style={{ width: `${item.pct}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                            <div className="text-[8px] font-black text-slate-300 uppercase text-right pt-1">
                              Total: {stats.totalAttempts} actions
                            </div>
                          </div>
                        )}

                        {stats.type === 'counter' && (
                          <div className="text-center py-2">
                            <div className="text-2xl font-black text-slate-900 leading-none">{stats.value}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Actions</div>
                          </div>
                        )}

                        {stats.type === 'timer' && (
                          <div className="text-center py-2">
                            <div className="text-xl font-black text-slate-900 leading-none">{stats.total}s</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Moy: {stats.avg}s</div>
                          </div>
                        )}

                        {stats.type === 'none' && (
                          <div className="text-center py-2 text-slate-200 font-black text-xs">--</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
