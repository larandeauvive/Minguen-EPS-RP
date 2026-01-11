
import React, { useState } from 'react';
import { Sport, ObservationSheet, ObservationMode, Criterion, ClassData, ObservationResult, SessionPhase, SoftwareTool, StudentRecord } from '../types';

interface TeacherDashboardProps {
  sports: Sport[];
  setSports: React.Dispatch<React.SetStateAction<Sport[]>>;
  sheets: ObservationSheet[];
  setSheets: React.Dispatch<React.SetStateAction<ObservationSheet[]>>;
  classes: ClassData[];
  setClasses: React.Dispatch<React.SetStateAction<ClassData[]>>;
  results: ObservationResult[];
  tools: SoftwareTool[];
  setTools: React.Dispatch<React.SetStateAction<SoftwareTool[]>>;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  sports, setSports, sheets, setSheets, classes, setClasses, results, tools, setTools
}) => {
  // Navigation
  const [mainTab, setMainTab] = useState<'sports' | 'classes' | 'logiciels'>('sports');
  const [view, setView] = useState<'list' | 'sport-detail' | 'create-sheet' | 'edit-sport-html' | 'tool-edit' | 'tool-run' | 'class-detail' | 'csv-mapping'>('list');
  
  // Sélections
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedTool, setSelectedTool] = useState<SoftwareTool | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [toolRunClassId, setToolRunClassId] = useState<string>('');

  // États Import CSV
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ lastName: -1, firstName: -1, gender: -1 });

  // Buffers Création Fiche
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newSheetMode, setNewSheetMode] = useState<ObservationMode>('MULTI_CRITERIA');
  const [newCriteria, setNewCriteria] = useState<Criterion[]>([]);
  const [newPhases, setNewPhases] = useState<SessionPhase[]>([]);

  // Buffers Formulaires
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newStudentFirst, setNewStudentFirst] = useState('');
  const [newStudentLast, setNewStudentLast] = useState('');
  const [htmlBuffer, setHtmlBuffer] = useState('');

  // --- LOGIQUE IMPORT CSV ---
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const delimiter = text.includes(';') ? ';' : ',';
      const lines = text.split('\n').filter(l => l.trim()).map(line => 
        line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''))
      );
      if (lines.length > 0) {
        setCsvHeaders(lines[0]);
        setCsvData(lines.slice(1));
        setView('csv-mapping');
      }
    };
    reader.readAsText(file);
  };

  const finalizeCsvImport = () => {
    if (!selectedClass || mapping.lastName === -1 || mapping.firstName === -1) {
      alert("Erreur: Vous devez mapper au moins le NOM et le PRÉNOM.");
      return;
    }
    const newStudents: StudentRecord[] = csvData.map((row, i) => ({
      id: `st-csv-${Date.now()}-${i}`,
      lastName: row[mapping.lastName] || '?',
      firstName: row[mapping.firstName] || '?',
      gender: (row[mapping.gender]?.toUpperCase().startsWith('F') ? 'F' : 'M') as 'M' | 'F'
    }));
    const updatedClass = { ...selectedClass, students: [...selectedClass.students, ...newStudents] };
    setClasses(classes.map(c => c.id === selectedClass.id ? updatedClass : c));
    setSelectedClass(updatedClass);
    setView('class-detail');
  };

  // --- LOGIQUE SÉANCES & OBSERVATIONS ---
  const handleCreateSheet = () => {
    if (!selectedSport || !newSheetTitle) return;
    const sheet: ObservationSheet = {
      id: `sheet-${Date.now()}`,
      title: newSheetTitle,
      mode: newSheetMode,
      sportId: selectedSport.id,
      active: true,
      criteria: newCriteria,
      phases: newPhases
    };
    setSheets([...sheets, sheet]);
    setView('sport-detail');
    setNewSheetTitle(''); setNewCriteria([]); setNewPhases([]);
  };

  // --- ACTIONS DIVERSES ---
  const handleAddSport = () => {
    const name = prompt("Nom de l'activité ?");
    const icon = prompt("Icône Emoji ?", "🏃");
    if (name && icon) setSports([...sports, { id: `s-${Date.now()}`, name, icon }]);
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newClassCode) return;
    setClasses([...classes, { id: `c-${Date.now()}`, name: newClassName, code: newClassCode, students: [] }]);
    setNewClassName(''); setNewClassCode('');
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newStudentFirst || !newStudentLast) return;
    const newSt: StudentRecord = { id: `st-${Date.now()}`, firstName: newStudentFirst, lastName: newStudentLast, gender: 'M' };
    const updated = { ...selectedClass, students: [...selectedClass.students, newSt] };
    setClasses(classes.map(c => c.id === selectedClass.id ? updated : c));
    setSelectedClass(updated);
    setNewStudentFirst(''); setNewStudentLast('');
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Onglets Principaux */}
      <div className="flex gap-2 bg-slate-200 p-1 rounded-2xl w-fit">
        {['sports', 'classes', 'logiciels'].map(t => (
          <button key={t} onClick={() => { setMainTab(t as any); setView('list'); }} className={`px-6 py-2 rounded-xl font-black capitalize transition ${mainTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{t}</button>
        ))}
      </div>

      {/* CONTENU : SPORTS & FICHES */}
      {mainTab === 'sports' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black">{view === 'list' ? 'Mes Activités' : selectedSport?.name}</h2>
            {view === 'list' ? (
              <button onClick={handleAddSport} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold">+ Activité</button>
            ) : (
              <button onClick={() => setView('list')} className="text-slate-400 font-bold">← Retour</button>
            )}
          </div>

          {view === 'list' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sports.map(s => (
                <button key={s.id} onClick={() => { setSelectedSport(s); setView('sport-detail'); }} className="bg-white p-6 rounded-[2.5rem] border shadow-sm text-center group hover:scale-105 transition">
                  <div className="text-5xl mb-3 group-hover:rotate-12 transition">{s.icon}</div>
                  <div className="font-black text-slate-800 text-sm truncate">{s.name}</div>
                </button>
              ))}
            </div>
          )}

          {view === 'sport-detail' && selectedSport && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="bg-white p-6 rounded-3xl border flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <h3 className="font-black text-xl">Gestion des Fiches</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setNewSheetMode('MULTI_CRITERIA'); setView('create-sheet'); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase">+ Observation</button>
                  <button onClick={() => { setNewSheetMode('SESSION'); setView('create-sheet'); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase">+ Séance</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sheets.filter(s => s.sportId === selectedSport.id).map(sheet => (
                  <div key={sheet.id} className="bg-white p-6 rounded-3xl border group shadow-sm flex flex-col justify-between">
                    <div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${sheet.mode === 'SESSION' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>{sheet.mode}</span>
                      <h4 className="font-black text-slate-800 mt-2 text-xl">{sheet.title}</h4>
                    </div>
                    <button onClick={() => setSheets(sheets.filter(s => s.id !== sheet.id))} className="text-rose-400 text-xs font-bold mt-4 opacity-0 group-hover:opacity-100 transition">Supprimer la fiche</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'create-sheet' && selectedSport && (
            <div className="bg-white p-10 rounded-[3rem] shadow-xl max-w-4xl mx-auto space-y-8 animate-in zoom-in-95">
              <h3 className="text-3xl font-black">Nouveau Support : {newSheetMode === 'SESSION' ? 'Séance' : 'Observation'}</h3>
              <input type="text" value={newSheetTitle} onChange={(e) => setNewSheetTitle(e.target.value)} className="w-full p-6 border-2 rounded-2xl font-black text-2xl outline-none focus:border-indigo-500" placeholder="Titre de la fiche..." />
              
              {newSheetMode === 'MULTI_CRITERIA' ? (
                <div className="space-y-4">
                  <button onClick={() => setNewCriteria([...newCriteria, { id: `c-${Date.now()}`, label: 'Nouveau Groupe', observables: [] }])} className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-black">+ Ajouter un Groupe de Critères</button>
                  {newCriteria.map((crit, cIdx) => (
                    <div key={crit.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
                      <div className="flex justify-between items-center">
                        <input type="text" value={crit.label} onChange={(e) => { const n = [...newCriteria]; n[cIdx].label = e.target.value; setNewCriteria(n); }} className="bg-transparent font-black text-xl border-b-2 outline-none border-indigo-200 focus:border-indigo-500" placeholder="Nom du groupe..." />
                        <button onClick={() => setNewCriteria(newCriteria.filter((_, i) => i !== cIdx))} className="text-rose-400 font-bold">✕</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {crit.observables.map((obs, oIdx) => (
                          <div key={obs.id} className="bg-white p-4 rounded-xl border space-y-3">
                             <div className="flex items-center justify-between">
                               <input type="text" value={obs.label} onChange={(e) => { const n = [...newCriteria]; n[cIdx].observables[oIdx].label = e.target.value; setNewCriteria(n); }} className="font-bold border-b outline-none text-sm w-1/2" placeholder="Nom du critère (ex: Tir)..." />
                               <select value={obs.type} onChange={(e) => { const n = [...newCriteria]; n[cIdx].observables[oIdx].type = e.target.value as any; if (e.target.value === 'categorical') n[cIdx].observables[oIdx].options = ['Raté', 'Cadré', 'Arrêté']; setNewCriteria(n); }} className="text-xs font-bold text-indigo-600 outline-none">
                                 <option value="categorical">Boutons (Choix)</option>
                                 <option value="counter">Compteur (+/-)</option>
                                 <option value="timer">Chronomètre</option>
                               </select>
                               <button onClick={() => { const n = [...newCriteria]; n[cIdx].observables.splice(oIdx, 1); setNewCriteria(n); }} className="text-rose-300">✕</button>
                             </div>
                             {obs.type === 'categorical' && (
                               <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-slate-400">Options (séparées par des virgules) :</label>
                                 <input type="text" value={obs.options?.join(', ')} onChange={(e) => { const n = [...newCriteria]; n[cIdx].observables[oIdx].options = e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''); setNewCriteria(n); }} className="w-full text-xs p-2 bg-slate-50 border rounded-lg outline-none font-bold" placeholder="Raté, Cadré, But..." />
                               </div>
                             )}
                          </div>
                        ))}
                        <button onClick={() => { const n = [...newCriteria]; n[cIdx].observables.push({ id: `o-${Date.now()}`, label: 'Nouveau critère', type: 'categorical', options: ['Réussi', 'Raté'] }); setNewCriteria(n); }} className="border-2 border-dashed rounded-xl py-4 text-slate-400 font-bold text-xs hover:bg-white transition">+ Ajouter Élément</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <button onClick={() => setNewPhases([...newPhases, { id: `p-${Date.now()}`, name: 'Échauffement', exercises: [] }])} className="bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl font-black">+ Ajouter une Phase</button>
                  {newPhases.map((phase, pIdx) => (
                    <div key={phase.id} className="bg-slate-50 p-6 rounded-[2rem] border border-amber-100 space-y-4">
                      <div className="flex justify-between items-center">
                        <input type="text" value={phase.name} onChange={(e) => { const n = [...newPhases]; n[pIdx].name = e.target.value; setNewPhases(n); }} className="bg-transparent font-black text-xl border-b-2 text-amber-600 outline-none border-amber-200 focus:border-amber-500" placeholder="Nom de la phase..." />
                        <button onClick={() => setNewPhases(newPhases.filter((_, i) => i !== pIdx))} className="text-rose-400 font-bold">✕</button>
                      </div>
                      <div className="space-y-3">
                        {phase.exercises.map((ex, eIdx) => (
                          <div key={ex.id} className="bg-white p-4 rounded-xl grid grid-cols-6 gap-2 items-center">
                            <input type="text" value={ex.name} onChange={(e) => { const n = [...newPhases]; n[pIdx].exercises[eIdx].name = e.target.value; setNewPhases(n); }} className="col-span-2 border-b font-bold text-xs outline-none" placeholder="Exercice" />
                            <input type="text" value={ex.sets} onChange={(e) => { const n = [...newPhases]; n[pIdx].exercises[eIdx].sets = e.target.value; setNewPhases(n); }} className="border-b font-bold text-xs outline-none" placeholder="Séries" title="Séries" />
                            <input type="text" value={ex.reps} onChange={(e) => { const n = [...newPhases]; n[pIdx].exercises[eIdx].reps = e.target.value; setNewPhases(n); }} className="border-b font-bold text-xs outline-none" placeholder="Reps" title="Répétitions" />
                            <div className="flex gap-1">
                              <input type="text" value={ex.load} onChange={(e) => { const n = [...newPhases]; n[pIdx].exercises[eIdx].load = e.target.value; setNewPhases(n); }} className="w-full border-b font-bold text-xs outline-none" placeholder="Ch." title="Charge" />
                              <input type="text" value={ex.unit} onChange={(e) => { const n = [...newPhases]; n[pIdx].exercises[eIdx].unit = e.target.value; setNewPhases(n); }} className="w-8 border-b font-bold text-[10px] outline-none opacity-50" placeholder="Unit." title="Unité (kg, m...)" />
                            </div>
                            <button onClick={() => { const n = [...newPhases]; n[pIdx].exercises.splice(eIdx, 1); setNewPhases(n); }} className="text-rose-300 text-right">✕</button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => { const n = [...newPhases]; n[pIdx].exercises.push({ id: `e-${Date.now()}`, name: '', sets: '3', reps: '10', load: '0', unit: 'kg' }); setNewPhases(n); }} className="w-full py-2 border-2 border-dashed rounded-xl text-slate-400 font-bold text-xs hover:bg-white transition">+ Ajouter Exercice</button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleCreateSheet} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-700 transition">Publier la fiche</button>
            </div>
          )}
        </div>
      )}

      {/* CONTENU : CLASSES & IMPORT CSV */}
      {mainTab === 'classes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black">{view === 'list' ? 'Mes Classes' : selectedClass?.name}</h2>
            {view === 'list' ? (
              <form onSubmit={handleAddClass} className="flex gap-2">
                <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-sm font-bold outline-none" placeholder="Nom (3A...)" required />
                <input type="text" value={newClassCode} onChange={(e) => setNewClassCode(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-sm font-bold w-24 outline-none" placeholder="Code" required />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">+</button>
              </form>
            ) : (
              <button onClick={() => setView('list')} className="text-slate-400 font-bold">← Retour</button>
            )}
          </div>

          {view === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classes.map(c => (
                <button key={c.id} onClick={() => { setSelectedClass(c); setView('class-detail'); }} className="bg-white p-10 rounded-[2.5rem] shadow-sm border text-left group hover:border-indigo-400 transition">
                  <div className="text-4xl font-black text-slate-800">{c.name}</div>
                  <div className="text-xs font-bold text-indigo-500 mt-2 uppercase tracking-widest">Code: {c.code} • {c.students.length} Élèves</div>
                  <button onClick={(e) => { e.stopPropagation(); setClasses(classes.filter(cl => cl.id !== c.id)); }} className="text-rose-400 text-xs mt-4 opacity-0 group-hover:opacity-100 transition">Supprimer la classe</button>
                </button>
              ))}
            </div>
          )}

          {view === 'class-detail' && selectedClass && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm space-y-10 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center border-b pb-8">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black">Listing de la classe</h3>
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Élèves inscrits : {selectedClass.students.length}</p>
                </div>
                <div className="flex gap-3">
                  <label className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black text-xs cursor-pointer flex items-center gap-2 hover:bg-emerald-100 transition shadow-sm">
                    📥 Import CSV
                    <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} />
                  </label>
                  <form onSubmit={handleAddStudent} className="flex gap-2">
                    <input type="text" value={newStudentLast} onChange={(e) => setNewStudentLast(e.target.value)} className="bg-slate-50 border rounded-xl px-4 py-2 text-sm font-bold outline-none" placeholder="NOM" required />
                    <input type="text" value={newStudentFirst} onChange={(e) => setNewStudentFirst(e.target.value)} className="bg-slate-50 border rounded-xl px-4 py-2 text-sm font-bold outline-none" placeholder="Prénom" required />
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">+</button>
                  </form>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {selectedClass.students.slice().sort((a,b) => a.lastName.localeCompare(b.lastName)).map(st => (
                  <div key={st.id} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center group border border-transparent hover:border-indigo-100 transition">
                    <div className="font-bold text-slate-700 text-xs uppercase truncate pr-2">{st.lastName} {st.firstName}</div>
                    <button onClick={() => {
                      const updated = selectedClass.students.filter(s => s.id !== st.id);
                      setClasses(classes.map(cl => cl.id === selectedClass.id ? { ...cl, students: updated } : cl));
                      setSelectedClass({ ...selectedClass, students: updated });
                    }} className="text-rose-400 opacity-0 group-hover:opacity-100 transition">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'csv-mapping' && (
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-2xl mx-auto space-y-10 animate-in zoom-in-95">
              <div className="text-center">
                <h3 className="text-4xl font-black text-indigo-900">Mapping CSV</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Associez vos colonnes pour l'import</p>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'COLONNE DES NOMS', key: 'lastName' },
                  { label: 'COLONNE DES PRÉNOMS', key: 'firstName' },
                  { label: 'COLONNE GENRE (F/M)', key: 'gender' }
                ].map(field => (
                  <div key={field.key} className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border">
                    <span className="font-black text-slate-700 text-xs">{field.label}</span>
                    <select 
                      className="bg-white border-2 border-indigo-50 p-3 rounded-xl text-xs font-bold w-1/2 outline-none focus:border-indigo-500"
                      onChange={(e) => setMapping(p => ({ ...p, [field.key]: parseInt(e.target.value) }))}
                    >
                      <option value="-1">-- Choisir --</option>
                      {csvHeaders.map((h, i) => <option key={i} value={i}>{h || `Colonne ${i+1}`}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="bg-indigo-50 p-6 rounded-3xl">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Aperçu première ligne de données :</h4>
                <div className="text-xs font-bold text-indigo-900 truncate">
                  {csvData[0]?.join(' | ')}
                </div>
              </div>
              <button onClick={finalizeCsvImport} className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl hover:bg-indigo-700 transition">Finaliser l'importation</button>
              <button onClick={() => setView('class-detail')} className="w-full text-slate-400 font-bold text-xs uppercase">Annuler</button>
            </div>
          )}
        </div>
      )}

      {/* CONTENU : LOGICIELS */}
      {mainTab === 'logiciels' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black">Logiciels Pédagogiques</h2>
            <button onClick={() => { setSelectedTool({ id: `t-${Date.now()}`, name: 'Nouveau', icon: '💻', contentHtml: '' }); setHtmlBuffer(''); setView('tool-edit'); }} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold">+ Ajouter</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tools.map(t => (
              <div key={t.id} className="bg-white p-8 rounded-[2.5rem] border shadow-sm text-center group hover:shadow-lg transition">
                <div className="text-6xl mb-4 group-hover:scale-110 transition duration-300">{t.icon}</div>
                <div className="font-black text-slate-800 text-xs mb-6 uppercase">{t.name}</div>
                <div className="space-y-2">
                  <button onClick={() => { setSelectedTool(t); setView('tool-run'); setToolRunClassId(''); }} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase shadow-md">Lancer</button>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => { setSelectedTool(t); setHtmlBuffer(t.contentHtml); setView('tool-edit'); }} className="text-indigo-400 text-[10px] font-black uppercase">Éditer</button>
                    <button onClick={() => setTools(tools.filter(to => to.id !== t.id))} className="text-rose-300 text-[10px] font-black uppercase">Suppr.</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {view === 'tool-run' && selectedTool && (
            <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col animate-in fade-in">
              <div className="bg-slate-800 p-4 flex justify-between items-center text-white border-b border-slate-700">
                <div className="flex items-center gap-6">
                  <h3 className="font-black text-xl">{selectedTool.icon} {selectedTool.name}</h3>
                  <select 
                    value={toolRunClassId} 
                    onChange={(e) => setToolRunClassId(e.target.value)}
                    className="bg-slate-700 text-white text-xs font-bold p-2 rounded-lg outline-none border border-slate-600"
                  >
                    <option value="">-- Injecter une classe --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button onClick={() => setView('list')} className="bg-rose-600 px-5 py-2 rounded-xl font-black text-xs">QUITTER ✕</button>
              </div>
              <div className="flex-1 bg-white relative">
                {toolRunClassId ? (
                  <iframe 
                    srcDoc={`<!DOCTYPE html><html><body><script>window.students = ${JSON.stringify(classes.find(c => c.id === toolRunClassId)?.students || [])};</script>${selectedTool.contentHtml}</body></html>`} 
                    className="absolute inset-0 w-full h-full border-none"
                    title="Software Runner"
                  ></iframe>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <div className="text-8xl mb-4 opacity-20">📊</div>
                    <p className="font-black uppercase tracking-widest text-sm">Sélectionnez une classe pour charger le logiciel</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'tool-edit' && selectedTool && (
            <div className="bg-white p-10 rounded-3xl shadow-xl max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center"><h3 className="text-2xl font-black">Éditeur Logiciel HTML</h3><button onClick={() => setView('list')} className="text-slate-400 font-bold">Fermer</button></div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={selectedTool.name} onChange={(e) => setSelectedTool({ ...selectedTool, name: e.target.value })} className="p-4 border rounded-xl font-bold outline-none" placeholder="Nom du logiciel" />
                <label className="bg-slate-50 border-2 border-dashed p-4 rounded-xl flex items-center justify-center cursor-pointer font-bold text-xs text-slate-400">
                  📁 Charger un .html
                  <input type="file" accept=".html" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setHtmlBuffer(ev.target?.result as string);
                      reader.readAsText(file);
                    }
                  }} />
                </label>
              </div>
              <textarea value={htmlBuffer} onChange={(e) => setHtmlBuffer(e.target.value)} className="w-full p-4 rounded-xl border font-mono text-xs bg-slate-900 text-emerald-400 outline-none h-[400px]" placeholder="Collez votre code HTML ici..." />
              <button onClick={() => { 
                const exists = tools.find(t => t.id === selectedTool.id);
                setTools(exists ? tools.map(t => t.id === selectedTool.id ? { ...selectedTool, contentHtml: htmlBuffer } : t) : [...tools, { ...selectedTool, contentHtml: htmlBuffer }]);
                setView('list');
              }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg hover:bg-indigo-700 transition">Sauvegarder le logiciel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
