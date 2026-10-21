export type Role = "member" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  calendar_token: string;
  created_at: string;
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  position: number;
  published: boolean;
  created_at: string;
}

export type BlockType = "text" | "prompt" | "toggle" | "file" | "link";

export interface ContentBlock {
  id: string;
  type: BlockType;
  title: string;
  body: string;
  /** Bloc fichier : chemin dans le bucket "fichiers". */
  file_path?: string;
  file_name?: string;
  file_size?: number;
  /** Bloc lien. */
  url?: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  summary: string;
  position: number;
  bunny_video_id: string | null;
  video_status: string;
  video_duration: number;
  content: ContentBlock[];
  published: boolean;
  created_at: string;
}

export interface LessonProgress {
  user_id: string;
  lesson_id: string;
  completed_at: string;
}

export type EventType = "exploration" | "lab" | "autre";

export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  zoom_url: string;
  capacity: number | null;
  replay_video_id: string | null;
  published: boolean;
  created_at: string;
}

export interface EventRegistration {
  event_id: string;
  user_id: string;
  created_at: string;
}

export interface ResourceCategory {
  id: string;
  name: string;
  description: string;
  position: number;
  created_at: string;
}

export type ResourceKind = "file" | "video" | "link";

export interface Resource {
  id: string;
  category_id: string | null;
  title: string;
  description: string;
  kind: ResourceKind;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  bunny_video_id: string | null;
  url: string | null;
  position: number;
  published: boolean;
  created_at: string;
}

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  exploration: "Exploration",
  lab: "Lab",
  autre: "Live",
};
