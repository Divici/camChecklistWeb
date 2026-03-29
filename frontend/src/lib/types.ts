export interface User {
  id: number;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  provider: "google" | "guest";
}

export interface Project {
  id: number;
  name: string;
  status: string;
  checklists_count: number;
  items_count: number;
  completed_items_count: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Checklist {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  icon: string | null;
  position: number;
  items_count: number;
  remaining_count: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: number;
  checklist_id: number;
  text: string;
  completed: boolean;
  completed_via: string | null;
  completed_at: string | null;
  position: number;
  priority: string;
  created_at: string;
  updated_at: string;
}
