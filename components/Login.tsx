
import React, { useState, useMemo } from 'react';
import { AuthState, UserRole, ClassData } from '../types';

interface LoginProps {
  onLogin: (data: AuthState) => void;
  classes: ClassData[];
}

const Login: React.FC<LoginProps> = ({ onLogin, classes }) => {
  const [tab, setTab] = useState<UserRole>(UserRole.STUDENT);
  const [teacherId, setTeacherId] = useState('');
  const [teacherPass, setTeacherPass] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classCodeInput, setClassCodeInput] = useState('');

  const targetClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherId.toUpperCase() === 'EPS' && teacherPass === '1234') {
      onLogin({ user: { id: 'p1', name: 'Professeur EPS', role: UserRole.TEACHER }, classId: null });
    } else {
      alert('Identifiant: EPS / Pass: 1234');
    }
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClass) return;
    if (targetClass.code === classCodeInput) {
      onLogin({
        user: { 
          id: `observer-${selectedClassId}`, 
          name: `Observateur ${targetClass.name}`, 
          role: UserRole.STUDENT 
        },
        classId: selectedClassId
      });
    } else alert("Code de classe invalide.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-900 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="flex border-b bg-slate-50">
          <button className={`flex-1 py-5 font-black uppercase text-xs tracking-widest ${tab === UserRole.STUDENT ? 'bg-white text-indigo-600' : 'text-slate-400'}`} onClick={() => setTab(UserRole.STUDENT)}>Élève</button>
          <button className={`flex-1 py-5 font-black uppercase text-xs tracking-widest ${tab === UserRole.TEACHER ? 'bg-white text-indigo-600' : 'text-slate-400'}`} onClick={() => setTab(UserRole.TEACHER)}>Enseignant</button>
        </div>

        <div className="p-10 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">MINGUEN EPS</h2>
            <p className="text-slate-400 font-bold text-xs uppercase mt-1 tracking-[0.3em]">Accès Session</p>
          </div>

          {tab === UserRole.TEACHER ? (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <input type="text" value={teacherId} onChange={e => setTeacherId(e.target.value)} className="w-full px-6 py-4 rounded-2xl border bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="Identifiant" required />
              <input type="password" value={teacherPass} onChange={e => setTeacherPass(e.target.value)} className="w-full px-6 py-4 rounded-2xl border bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="Mot de passe" required />
              <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition">CONNEXION</button>
            </form>
          ) : (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full px-6 py-4 rounded-2xl border bg-slate-50 outline-none font-bold" required>
                <option value="">-- Choisir ta classe --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              {selectedClassId && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                  <input type="text" value={classCodeInput} onChange={e => setClassCodeInput(e.target.value)} className="w-full px-6 py-4 rounded-2xl border bg-slate-50 outline-none font-bold" placeholder="Code secret de classe" required />
                  <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition">ACCÉDER AUX FICHES</button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
