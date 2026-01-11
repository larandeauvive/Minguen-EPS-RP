
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Sport, ObservationSheet, ObservationResult, ClassData } from '../types';

interface StudentInterfaceProps {
  user: { id: string; name: string; role: UserRole };
  classId: string;
  sports: Sport[];
  sheets: ObservationSheet[];
  classes: ClassData[];
  onSaveResult: (result: ObservationResult) => void;
}

const StudentInterface: React.FC<StudentInterfaceProps> = ({ user, classId, sports, sheets, classes, onSaveResult }) => {
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<ObservationSheet | null>(null);
  const [showRessources, setShowRessources] = useState(false);
  
  const [sessionData, setSessionData] = useState<Record<string, any>>({});
  const [timers, setTimers] = useState<Record<string, { start: number | null, elapsed: number }>>({});

  const selectedSport = useMemo(() => sports.find(s => s.id === selectedSportId), [sports, selectedSportId]);

  useEffect(() => {
    let interval: any;
    if (Object.keys(timers).some(id => timers[id].start !== null)) {
      interval = setInterval(() => {
        setTimers(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(id => {
            if (next[id].start !== null) next[id].elapsed = Date.now() - next[id].start!;
          });
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [timers]);

  const toggleTimer = (obsId: string) => {
    setTimers(prev => {
      const current = prev[obsId] || { start: null, elapsed: 0 };
      return { ...prev, [obsId]: { ...current, start: current.start === null ? Date.now() - current.elapsed : null } };
    });
  };

  const handleFinish = () => {
    if (!activeSheet) return;
    const finalData = { ...sessionData };
    Object.keys(timers).forEach(id => { 
      finalData[id] = Math.round(timers[id].elapsed / 1000); 
    });
    onSaveResult({
      id: `r-${Date.now()}`, studentId: user.id, classId, sheetId: activeSheet.id, sportId: activeSheet.sportId,
      date: Date.now(), data: finalData
    });
    alert('Enregistrement réussi !');
    setActiveSheet(null); setSessionData({}); setTimers({});
  };

  if (activeSheet) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-24 animate-in slide-in-from-bottom-6 duration-500">
        <div className="bg-white p-6 rounded-3xl border flex items-center justify-between shadow-sm">
           <button onClick={() => setActiveSheet(null)} className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-2xl font-black transition active:scale-90">←</button>
           <h3 className="font-black text-xl truncate px-4">{activeSheet.title}</h3>
           {selectedSport?.descriptionHtml ? (
             <button onClick={() => setShowRessources(!showRessources)} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Guide</button>
           ) : <div className="w-10"></div>}
        </div>

        {showRessources && selectedSport?.descriptionHtml && (
          <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 prose prose-sm max-w-none animate-in fade-in" dangerouslySetInnerHTML={{ __html: selectedSport.descriptionHtml }}></div>
        )}

        {activeSheet.mode === 'SESSION' ? (
          <div className="space-y-6">
            {activeSheet.phases?.map(phase => (
              <div key={phase.id} className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-4">
                <h4 className="text-xl font-black text-amber-600 uppercase tracking-tighter border-b border-amber-50 pb-2">{phase.name}</h4>
                {phase.exercises.map(ex => (
                  <button key={ex.id} onClick={() => setSessionData(p => ({ ...p, [ex.id]: !p[ex.id] }))} className={`w-full p-6 rounded-[2rem] border-2 flex items-center justify-between transition ${sessionData[ex.id] ? 'bg-amber-50 border-amber-500 shadow-inner' : 'bg-white border-slate-100'}`}>
                    <div className="text-left">
                      <div className="font-black text-slate-800 uppercase text-xs">{ex.name}</div>
                      <div className="text-[11px] font-bold text-slate-400 mt-2 flex gap-3 uppercase tracking-wider">
                        <span>{ex.sets} séries</span>
                        <span>{ex.reps} reps</span>
                        {ex.load !== '0' && <span className="text-amber-600">{ex.load} {ex.unit}</span>}
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition ${sessionData[ex.id] ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-200'}`}>{sessionData[ex.id] ? '✓' : ''}</div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {activeSheet.criteria.map(crit => (
              <div key={crit.id} className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-8">
                <h4 className="text-2xl font-black border-b pb-4 text-slate-900">{crit.label}</h4>
                {crit.observables.map(obs => (
                  <div key={obs.id} className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{obs.label}</label>
                    {obs.type === 'categorical' && (
                      <div className="grid grid-cols-2 gap-3">
                        {obs.options?.map(opt => (
                          <button key={opt} onClick={() => setSessionData(p => { const c = p[obs.id] || {}; return { ...p, [obs.id]: { ...c, [opt]: (c[opt] || 0) + 1 } }; })} className="bg-slate-50 p-6 rounded-[2rem] font-bold flex justify-between active:scale-95 transition border hover:bg-white hover:border-indigo-200">
                            <span className="text-sm truncate mr-2">{opt}</span>
                            <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-xs shadow-md">{sessionData[obs.id]?.[opt] || 0}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {obs.type === 'counter' && (
                      <div className="bg-indigo-50 p-6 rounded-[2rem] flex items-center justify-between shadow-inner">
                         <button onClick={() => setSessionData(p => ({ ...p, [obs.id]: Math.max(0, (p[obs.id] || 0) - 1) }))} className="bg-white w-14 h-14 rounded-2xl font-black text-2xl shadow-sm hover:bg-slate-50 transition active:scale-90">-</button>
                         <span className="text-5xl font-black text-indigo-700">{sessionData[obs.id] || 0}</span>
                         <button onClick={() => setSessionData(p => ({ ...p, [obs.id]: (p[obs.id] || 0) + 1 }))} className="bg-indigo-600 text-white w-14 h-14 rounded-2xl font-black text-2xl shadow-xl hover:bg-indigo-700 transition active:scale-90">+</button>
                      </div>
                    )}
                    {obs.type === 'timer' && (
                      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
                        <span className="text-4xl font-mono tracking-tighter">{( (timers[obs.id]?.elapsed || 0) / 1000).toFixed(1)}<span className="text-xl opacity-50 ml-1">s</span></span>
                        <div className="flex gap-3">
                          <button onClick={() => setTimers(p => ({ ...p, [obs.id]: { start: null, elapsed: 0 } }))} className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition active:scale-90">↺</button>
                          <button onClick={() => toggleTimer(obs.id)} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition active:scale-95 ${timers[obs.id]?.start ? 'bg-rose-600 shadow-rose-900/50 shadow-lg' : 'bg-emerald-600 shadow-emerald-900/50 shadow-lg'}`}>{timers[obs.id]?.start ? 'Pause' : 'Start'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <button onClick={handleFinish} className="w-full bg-indigo-600 text-white py-7 rounded-[2.5rem] font-black text-2xl shadow-2xl active:scale-95 transition-all hover:bg-indigo-700">VALIDER LES RÉSULTATS</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-4xl font-black text-indigo-950">Espace Fiches</h2>
        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em]">Sélectionnez une activité</p>
      </div>

      <div className="space-y-6">
        {!selectedSportId ? (
          <div className="grid grid-cols-1 gap-4">
            {sports.map(s => (
              <button key={s.id} onClick={() => setSelectedSportId(s.id)} className="bg-white p-8 rounded-[3rem] border border-slate-100 flex items-center gap-8 group transition hover:scale-[1.02] hover:shadow-xl shadow-sm active:scale-95">
                <span className="text-7xl group-hover:rotate-12 transition duration-300">{s.icon}</span>
                <div className="text-left">
                  <span className="text-3xl font-black text-slate-800 block leading-tight">{s.name}</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2 block">Cliquer pour voir les fiches</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <button onClick={() => setSelectedSportId(null)} className="text-indigo-600 font-black bg-indigo-50 px-8 py-4 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition">← Liste des sports</button>
            <div className="grid grid-cols-1 gap-4">
              {sheets.filter(s => s.sportId === selectedSportId).map(sheet => (
                <button key={sheet.id} onClick={() => setActiveSheet(sheet)} className={`bg-white p-12 rounded-[3.5rem] border shadow-sm text-left active:scale-95 transition-all hover:shadow-xl ${sheet.mode === 'SESSION' ? 'border-l-[12px] border-amber-400' : 'border-l-[12px] border-indigo-600'}`}>
                  <div className="text-[10px] font-black uppercase mb-2 tracking-[0.2em] text-slate-400">{sheet.mode === 'SESSION' ? 'SÉANCE D\'ENTRAINEMENT' : 'GRILLE D\'OBSERVATION'}</div>
                  <div className="text-4xl font-black text-slate-900 leading-tight tracking-tighter">{sheet.title}</div>
                </button>
              ))}
              {sheets.filter(s => s.sportId === selectedSportId).length === 0 && (
                <div className="text-center py-24 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 text-slate-400 font-bold italic shadow-inner">Aucune fiche publiée par l'enseignant pour ce sport.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentInterface;
