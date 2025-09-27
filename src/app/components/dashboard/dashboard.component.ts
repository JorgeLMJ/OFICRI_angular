import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  isMenuOpen = true;
  isDarkMode = false;
  userName: string = '';
  currentRole: string = '';
  currentPage = 'Panel de Control';

  menuItems = [
    { title: 'Inicio', icon: 'bi-house-door', route: '/dashboard', roles: ['Administrador'] },
    { title: 'Empleados', icon: 'bi-people', route: '/dashboard/empleados', roles: ['Administrador'] },
    { title: 'Documentos', icon: 'bi-file-earmark-text', route: '/dashboard/documento', roles: ['Administrador', 'Auxiliar de Dosaje', 'Auxiliar de Toxicologia'] },
    { title: 'Asignaciones', icon: 'bi-journal-text', route: '/dashboard/asignaciones', roles: ['Administrador', 'Auxiliar de Dosaje', 'Auxiliar de Toxicologia'] },
    { title: 'Usuarios', icon: 'bi-person-gear', route: '/dashboard/usuarios', roles: ['Administrador'] },
    { title: 'Reportes', icon: 'bi-bar-chart', route: '/dashboard/reportes', roles: ['Administrador', 'Auxiliar de Dosaje', 'Auxiliar de Toxicologia'] }
  ];

  filteredMenuItems: any[] = [];
  notifications: Notification[] = [];
  unreadCount = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.nombre || 'Usuario';
    this.currentRole = user?.rol || '';

    // Filtrar menú según rol
    this.filteredMenuItems = this.menuItems.filter(item =>
      item.roles.includes(this.currentRole)
    );

    // Conectar a notificaciones según rol
    this.connectToNotifications();

    // Escuchar notificaciones en tiempo real
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
        this.updateUnreadCount();
      });

    // Cargar notificaciones no leídas al iniciar
    this.loadUnreadNotifications();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.currentPage = this.getCurrentPageTitle();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.notificationService.disconnect();
  }

  // Conectar a notificaciones según rol
  private connectToNotifications(): void {
    if (this.currentRole === 'Auxiliar de Toxicologia') {
      this.notificationService.connect('TOXICOLOGIA');
    } else if (this.currentRole === 'Auxiliar de Dosaje') {
      this.notificationService.connect('DOSAJE');
    }
  }

  // Cargar notificaciones no leídas
  private loadUnreadNotifications(): void {
    let area = '';
    if (this.currentRole === 'Auxiliar de Toxicologia') {
      area = 'TOXICOLOGIA';
    } else if (this.currentRole === 'Auxiliar de Dosaje') {
      area = 'DOSAJE';
    }

    if (area) {
      this.notificationService.getUnreadNotifications(area).subscribe({
        next: (notifications) => {
          this.notifications = [...notifications, ...this.notifications];
          this.updateUnreadCount();
        },
        error: (err) => console.error('Error cargando notificaciones', err)
      });

      this.notificationService.countUnread(area).subscribe({
        next: (count) => {
          this.unreadCount = count;
        },
        error: (err) => console.error('Error contando notificaciones', err)
      });
    }
  }

  // Actualizar contador de no leídas
  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }

  // Marcar notificación como leída
  markAsRead(notification: Notification): void {
    if (notification.id) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (updated) => {
          const index = this.notifications.findIndex(n => n.id === updated.id);
          if (index !== -1) {
            this.notifications[index] = updated;
            this.updateUnreadCount();
          }
        },
        error: (err) => console.error('Error marcando como leída', err)
      });
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onItemClick(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    target.classList.add('clicked');
    setTimeout(() => {
      target.classList.remove('clicked');
    }, 300);
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('bg-dark', this.isDarkMode);
    document.body.classList.toggle('text-white', this.isDarkMode);
  }

  getCurrentPageTitle(): string {
    const currentRoute = this.router.url;
    const menuItem = this.filteredMenuItems.find(item => currentRoute.includes(item.route));
    return menuItem ? menuItem.title : 'Panel de Control';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}