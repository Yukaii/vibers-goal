export type Priority = 'low' | 'medium' | 'high';

export type ReminderType = 'once' | 'recurring';

export type ReminderFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface Reminder {
  type: ReminderType;
  date?: string; // ISO string for specific date reminders
  time: string; // HH:MM format
  frequency?: ReminderFrequency; // For recurring reminders
  enabled: boolean;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
  reminder?: Reminder;
  subTasks: SubTask[];
}
