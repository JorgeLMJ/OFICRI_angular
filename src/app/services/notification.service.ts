import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, Message } from '@stomp/stompjs';
import { Notification } from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private stompClient: Client | null = null;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private apiUrl = 'http://localhost:8080/api/notifications';
  private wsUrl = 'http://localhost:8080/ws';

  private notifications: Notification[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.notifications = this.loadNotificationsFromStorage();
    this.notificationsSubject.next([...this.notifications]);
  }

  // ✅ CORREGIDO: No se pasan headers a SockJS (no soportado en navegador)
  // En su lugar, usamos el token en el encabezado de la conexión STOMP
  connect(area: string): void {
    const socket = new SockJS(this.wsUrl);

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log('STOMP: ', str);
      },
      // ✅ Aquí es donde se envía el token de autenticación
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getToken() || ''}`
      },
      onConnect: () => {
        console.log('✅ Conectado al WebSocket con autenticación');
        this.stompClient?.subscribe(`/topic/notifications/${area.toUpperCase()}`, (message: Message) => {
          try {
            const notification: Notification = JSON.parse(message.body);
            this.handleNewNotification(notification);
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        });
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
      },
      onWebSocketClose: (event) => {
        console.warn('WebSocket cerrado:', event);
        if (event.code === 1008) {
          console.error('Autenticación fallida. Verifica tu token.');
        }
      }
    });

    this.stompClient.activate();
  }

  // ... resto de tus métodos ...

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  getUnreadNotifications(area: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/area/${area}/unread`);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/${id}/read`, {});
  }

  countUnread(area: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/area/${area}/count-unread`);
  }

  private playNotificationSound(): void {
    const audio = new Audio('assets/sounds/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => console.log('Audio play failed'));
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }

  private saveNotificationsToStorage(): void {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  loadNotificationsFromStorage(): Notification[] {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  }

  private handleNewNotification(notification: Notification): void {
    this.playNotificationSound();
    this.notifications.unshift(notification);
    if (this.notifications.length > 20) {
      this.notifications.pop();
    }
    this.notificationsSubject.next([...this.notifications]);
    this.saveNotificationsToStorage();
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }
}