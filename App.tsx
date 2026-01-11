
import React, { useState, useEffect } from 'react';
import { AuthState, UserRole, Sport, ObservationSheet, ClassData, ObservationResult, SoftwareTool } from './types';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentInterface from './components/StudentInterface';

const INITIAL_SPORTS: Sport[] = [
  { id: 's1', name: 'Athlétisme', icon: '🏃', descriptionHtml: '<h1>Vitesse & Endurance</h1><p>Consignes de sécurité...</p>' },
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
  
  const [classes, setClasses] = useState<ClassData[]>(() => {
    const saved = localStorage.getItem('eps_classes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [sports, setSports] = useState<Sport[]>(() => {
    const saved = localStorage.getItem('eps_sports');
    return saved ? JSON.parse(saved) : INITIAL_SPORTS;
  });
  
  const [sheets, setSheets] = useState<ObservationSheet[]>(() => {
    const saved = localStorage.getItem('eps_sheets');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [results, setResults] = useState<ObservationResult[]>(() => {
    const saved = localStorage.getItem('eps_results');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [tools, setTools] = useState<SoftwareTool[]>(() => {
    const saved = localStorage.getItem('eps_tools');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const saved = localStorage.getItem('minguen_auth');
    if (saved) setAuth(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('eps_classes', JSON.stringify(classes));
    localStorage.setItem('eps_sports', JSON.stringify(sports));
    localStorage.setItem('eps_sheets', JSON.stringify(sheets));
    localStorage.setItem('eps_results', JSON.stringify(results));
    localStorage.setItem('eps_tools', JSON.stringify(tools));
  }, [classes, sports, sheets, results, tools]);

  const handleLogin = (data: AuthState) => {
    setAuth(data);
    localStorage.setItem('minguen_auth', JSON.stringify(data));
  };

  const handleLogout = () => {
    setAuth({ user: null, classId: null });
    localStorage.removeItem('minguen_auth');
  };

  const addResult = (result: ObservationResult) => {
    setResults(prev => [...prev, result]);
  };

  if (!auth.user) {
    return <Login onLogin={handleLogin} classes={classes} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-indigo-600 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-bold text-xl tracking-tight">Minguen EPS</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">{auth.user.name}</span>
          <button onClick={handleLogout} className="text-xs bg-indigo-700 hover:bg-indigo-800 px-3 py-1.5 rounded-lg transition">Déconnexion</button>
        </div>
      </nav>

      <main className="container mx-auto p-4 max-w-6xl">
        {auth.user.role === UserRole.TEACHER ? (
          <TeacherDashboard 
            sports={sports} setSports={setSports}
            sheets={sheets} setSheets={setSheets}
            classes={classes} setClasses={setClasses}
            results={results}
            tools={tools} setTools={setTools}
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
