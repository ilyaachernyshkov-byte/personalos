export interface Project {
  id: string;
  name: string;
  direction: string;
  status: string;
  priority: string;
  progress: number;
  current: string;
  next: string;
  start: string;
  deadline: string;
  lastActivity: string;
  idleDays: number;
  health: string;
  blocker: string;
  nextStep: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export interface Milestone {
  id: string;
  projectId: string;
  project: string;
  order: number;
  name: string;
  checkpoint: number;
  status: string;
  plannedDate: string;
  completedDate: string;
  criteria: string;
  result: string;
  notes: string;
}
export interface Task {
  id: string;
  name: string;
  type: string;
  projectId: string;
  project: string;
  processId: string;
  process: string;
  milestoneId: string;
  milestone: string;
  status: string;
  priority: string;
  plannedDate: string;
  plannedMinutes: number;
  deadline: string;
  completedDate: string;
  source: string;
  owner: string;
  result: string;
  blocker: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export interface Process {
  id: string;
  name: string;
  category: string;
  frequency: string;
  rule: string;
  time: string;
  plannedMinutes: number;
  active: boolean;
  projectId: string;
  project: string;
  nextDate: string;
  lastDate: string;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export interface PlanItem {
  id: string;
  date: string;
  start: string;
  end: string;
  minutes: number;
  type: string;
  sourceId: string;
  name: string;
  projectId: string;
  project: string;
  status: string;
  actualMinutes: number;
  deviation: number;
  source: string;
  calendarId: string;
  calendarEventId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export interface Activity {
  id: string;
  date: string;
  start: string;
  end: string;
  minutes: number;
  type: string;
  name: string;
  projectId: string;
  project: string;
  taskId: string;
  processId: string;
  planId: string;
  classification: "План" | "Внеплан";
  result: string;
  nextStep: string;
  blocker: string;
  source: string;
  notes: string;
  createdAt: string;
}
export interface Snapshot {
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  processes: Process[];
  plans: PlanItem[];
  activities: Activity[];
}
export interface PersonalOsRepository {
  mode: "demo" | "google";
  read(): Promise<Snapshot>;
}
