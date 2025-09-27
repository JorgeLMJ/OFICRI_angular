// src/app/models/notification.model.ts
export interface Notification {
  id?: number;
  message: string;
  area: string;
  asignacionId: number;
  timestamp: string;
  isRead?: boolean;
}