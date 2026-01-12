
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AuthState, UserRole, Sport, ObservationSheet, ClassData, ObservationResult, SoftwareTool } from './types';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentInterface from './components/StudentInterface';

const INITIAL_SPORTS: Sport[] = [
  { id: 's1', name: 'Athlétisme', icon: '🏃', descriptionHtml: '<h1>Vitesse & Endurance</h1><p>Consignes de sécurité pour les courses de durée.</p>' },
  { id: 's2', name: 'Basket', icon: '🏀' },
  { id: 's3', name: 'Musculation', icon: '🏋️' },
  { id: 's4', name: 'Badminton', icon: '🏸' },
  { id: 's5', name: 'Football', icon: '⚽' },
  { id: 's6', name: 'Handball', icon: '🤾' },
  { id: 's7', name: 'Natation', icon: '🏊' },
  { id: 's8', name: 'Escalade', icon: '🧗' },
  { id: 's9', name: 'Gymnastique', icon: '🤸' },
];

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, classId: null });
  
  // États synchronisés avec Firestore
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [sheets, setSheets] = useState<ObservationSheet[]>([]);
  const [results, setResults] = useState<ObservationResult[]>([]);
  const [tools, setTools] = useState<SoftwareTool[]>([]);

  // 1. Restauration de la session utilisateur locale
  useEffect(() => {
    const saved = localStorage.getItem('minguen_auth');
    if (saved) {
      try {
        setAuth(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur de restauration session", e);
      }
    }
  }, []);

  // 2. Écouteurs Firestore en temps réel (onSnapshot)
  useEffect(() => {
    // Synchronisation des classes
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as ClassData));
      setClasses(data);
    });

    // Synchronisation des sports (avec initialisation si collection vide)
    const unsubSports = onSnapshot(collection(db, 'sports'), (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Sport));
      if (data.length === 0 && snap.metadata.fromCache === false) {
        // Optionnel : Initialiser Firestore avec les sports de base si vide
        INITIAL_SPORTS.forEach(async (s) => {
          const { id, ...sportData } = s;
          await setDoc(doc(db, 'sports', id), sportData);
        });
      }
      setSports(data.length > 0 ? data : INITIAL_SPORTS);
    });

    // Synchronisation des fiches d'observation
    const unsubSheets = onSnapshot(collection(db, 'sheets'), (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as ObservationSheet));
      setSheets(data);
    });

    // Synchronisation des résultats d'observation (MAJ en temps réel des stats)
    const unsubResults = onSnapshot(collection(db, 'results'), (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as ObservationResult));
      setResults(data);
    });

    // Synchronisation des logiciels pédagogiques
    const unsubTools = onSnapshot(collection(db, 'tools'), (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as SoftwareTool));
      setTools(data);
    });

    return () => {
      unsubClasses(); unsubSports(); unsubSheets(); unsubResults(); unsubTools();
    };
  }, []);

  const handleLogin = (data: AuthState) => {
    setAuth(data);
    localStorage.setItem('minguen_auth', JSON.stringify(data));
  };

  const handleLogout = () => {
    setAuth({ user: null, classId: null });
    localStorage.removeItem('minguen_auth');
  };

  // --- Fonctions de synchronisation Firestore pour le TeacherDashboard ---

  const syncSports = async (action: React.SetStateAction<Sport[]>) => {
    const next = typeof action === 'function' ? action(sports) : action;
    
    // Cas ajout
    if (next.length > sports.length) {
      const added = next.find(n => !sports.some(s => s.id === n.id));
      if (added) {
        const { id, ...data } = added;
        await addDoc(collection(db, 'sports'), data);
      }
    } 
    // Cas suppression
    else if (next.length < sports.length) {
      const removed = sports.find(s => !next.some(n => n.id === s.id));
      if (removed) await deleteDoc(doc(db, 'sports', removed.id));
    } 
    // Cas mise à jour
    else {
      next.forEach(async (n) => {
        const old = sports.find(o => o.id === n.id);
        if (old && JSON.stringify(old) !== JSON.stringify(n)) {
          await setDoc(doc(db, 'sports', n.id), n);
        }
      });
    }
  };

  const syncSheets = async (action: React.SetStateAction<ObservationSheet[]>) => {
    const next = typeof action === 'function' ? action(sheets) : action;
    if (next.length > sheets.length) {
      const added = next.find(n => !sheets.some(s => s.id === n.id));
      if (added) {
        const { id, ...data } = added;
        await addDoc(collection(db, 'sheets'), data);
      }
    } else if (next.length < sheets.length) {
      const removed = sheets.find(s => !next.some(n => n.id === s.id));
      if (removed) await deleteDoc(doc(db, 'sheets', removed.id));
    }
  };

  const syncClasses = async (action: React.SetStateAction<ClassData[]>) => {
    const next = typeof action === 'function' ? action(classes) : action;
    if (next.length > classes.length) {
      const added = next.find(n => !classes.some(s => s.id === n.id));
      if (added) {
        const { id, ...data } = added;
        await addDoc(collection(db, 'classes'), data);
      }
    } else if (next.length < classes.length) {
      const removed = classes.find(s => !next.some(n => n.id === s.id));
      if (removed) await deleteDoc(doc(db, 'classes', removed.id));
    } else {
      // Mise à jour de la classe (ex: ajout d'élèves)
      next.forEach(async (n) => {
        const old = classes.find(o => o.id === n.id);
        if (old && JSON.stringify(old) !== JSON.stringify(n)) {
          await setDoc(doc(db, 'classes', n.id), n);
        }
      });
    }
  };

  const syncTools = async (action: React.SetStateAction<SoftwareTool[]>) => {
    const next = typeof action === 'function' ? action(tools) : action;
    if (next.length > tools.length) {
      const added = next.find(n => !tools.some(s => s.id === n.id));
      if (added) {
        const { id, ...data } = added;
        await addDoc(collection(db, 'tools'), data);
      }
    } else if (next.length < tools.length) {
      const removed = tools.find(s => !next.some(n => n.id === s.id));
      if (removed) await deleteDoc(doc(db, 'tools', removed.id));
    } else {
      next.forEach(async (n) => {
        const old = tools.find(o => o.id === n.id);
        if (old && JSON.stringify(old) !== JSON.stringify(n)) {
          await setDoc(doc(db, 'tools', n.id), n);
        }
      });
    }
  };

  const addResult = async (result: ObservationResult) => {
    const { id, ...data } = result;
    // Enregistrement dans Firestore : l'id sera généré par addDoc
    await addDoc(collection(db, 'results'), data);
  };

  if (!auth.user) {
    return <Login onLogin={handleLogin} classes={classes} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-indigo-600 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-bold text-xl tracking-tight">Minguen EPS</h1>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-black uppercase tracking-tighter leading-none">{auth.user.name}</span>
            <span className="text-[9px] opacity-60 font-bold uppercase tracking-widest">{auth.user.role === UserRole.TEACHER ? 'Enseignant' : 'Élève'}</span>
          </div>
          <button onClick={handleLogout} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition font-bold border border-white/20">Quitter</button>
        </div>
      </nav>

      <main className="container mx-auto p-4 max-w-6xl">
        {auth.user.role === UserRole.TEACHER ? (
          <TeacherDashboard 
            sports={sports} setSports={syncSports}
            sheets={sheets} setSheets={syncSheets}
            classes={classes} setClasses={syncClasses}
            results={results}
            tools={tools} setTools={syncTools}
          />
        ) : (
          <StudentInterface 
            user={auth.user as any} 
            classId={auth.classId!} 
            sports={sports} 
            sheets={sheets} 
            classes={classes}
            onSaveResult={addResult}
          />
        )}
      </main>
    </div>
  );
};

export default App;
