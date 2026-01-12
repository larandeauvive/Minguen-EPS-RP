
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
      return { main: sum, sub: null };
    }

    if (type === 'timer') {
      let total = 0;
      studentResults.forEach(r => total += (r.data[obsId] || 0));
      return { main: `${total}s`, sub: studentResults.length > 0 ? `Avg: ${(total/studentResults.length).toFixed(1)}s` : null };
    }

    if (type === 'categorical' && options) {
      let counts: Record<string, number> = {};
      options.forEach(o => counts[o] = 0);
      
      studentResults.forEach(r => {
        const obsData = r.data[obsId] || {};
        options.forEach(o => {
          counts[o] += (obsData[o] || 0);
        });
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      // On définit arbitrairement la réussite comme la première option si "Réussi" ou "But", 
      // ou on cherche des mots clés. Par défaut on prend l'option 1 vs le reste si 2 options.
      const successKey = options.find(o => 
        o.toLowerCase().includes('réussi') || 
        o.toLowerCase().includes('but') || 
        o.toLowerCase().includes('cadré') ||
        o.toLowerCase().includes('oui')
      ) || options[0];

      const successCount = counts[successKey] || 0;
      const pct = total > 0 ? Math.round((successCount / total) * 100) : 0;

      return { 
        main: `${pct}%`, 
        sub: `${successCount}/${total}`,
        details: counts 
      };
    }

    return { main: '-', sub: null };
  };

  return (
    <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      <div className="p-8 border-b bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900">📊 Statistiques de Classe</h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Analyse des performances en temps réel</p>
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
          <p className="text-slate-400 font-bold italic">Veuillez sélectionner une classe pour afficher le bilan des compétences.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-500 border-b sticky left-0 bg-slate-100 z-10">Élève</th>
                {allCriteria.map((c, i) => (
                  <th key={i} className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-500 border-b text-center min-w-[120px]">
                    <div className="text-indigo-600 mb-1">{c.sheetTitle}</div>
                    <div className="text-slate-900">{c.critLabel}</div>
                    <div className="text-[8px] opacity-60 mt-1">{c.obsLabel}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {targetClass?.students.slice().sort((a,b) => a.lastName.localeCompare(b.lastName)).map(student => (
                <tr key={student.id} className="border-b hover:bg-slate-50 transition">
                  <td className="p-6 font-black text-xs text-slate-700 sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    {student.lastName} <span className="font-medium opacity-60">{student.firstName}</span>
                  </td>
                  {allCriteria.map((c, i) => {
                    const stats = getStudentStats(student.id, c.obsId, c.type, c.options);
                    return (
                      <td key={i} className="p-6 text-center">
                        <div className="font-black text-lg text-slate-900">{stats.main}</div>
                        {stats.sub && (
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                            ({stats.sub})
                          </div>
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
