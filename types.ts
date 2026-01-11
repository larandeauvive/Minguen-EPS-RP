
export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export type ObservationMode = 'MULTI_CRITERIA' | 'SESSION';

export type ObservableType = 'counter' | 'categorical' | 'timer';

export interface Observable {
  id: string;
  label: string;
  type: ObservableType;
  options?: string[]; // Pour les boutons (ex: "Raté", "Cadré", "Arrêté")
}

export interface Criterion {
  id: string;
  label: string;
  observables: Observable[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: string; // Nouveau : Nombre de séries
  reps: string;
  load: string;
  unit: string; // Nouveau : kg, m, %, etc.
}

export interface SessionPhase {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface ObservationSheet {
  id: string;
  title: string;
  mode: ObservationMode;
  sportId: string;
  active: boolean;
  criteria: Criterion[];
  phases?: SessionPhase[]; 
}

export interface Sport {
  id: string;
  name: string;
  icon: string;
  descriptionHtml?: string; 
}

export interface SoftwareTool {
  id: string;
  name: string;
  icon: string;
  contentHtml: string;
}

export interface StudentRecord {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F' | 'Autre';
}

export interface ClassData {
  id: string;
  name: string;
  code: string;
  students: StudentRecord[];
}

export interface ObservationResult {
  id: string;
  studentId: string;
  classId: string;
  sheetId: string;
  sportId: string;
  date: number;
  data: Record<string, any>; 
}

export interface AuthState {
  user: { id: string; name: string; role: UserRole; gender?: string } | null;
  classId: string | null;
}
