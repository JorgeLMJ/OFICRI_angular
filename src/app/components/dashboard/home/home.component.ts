// src/app/components/dashboard/home/home.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';
import { EmpleadoService } from '../../../services/Empleado.service';
import { DocumentoService } from '../../../services/documento.service';
import { AsignacionService } from '../../../services/asignacion.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class HomeComponent implements OnInit {
  userName: string = '';
  stats = {
    usuarios: 0,
    empleados: 0,
    documentos: 0,
    asignaciones: 0,
    dosajes: 0,
    toxicologia: 0
  };
  
  recentActivities = [
    { type: 'create', title: 'Nuevo Documento Creado', description: 'Documento #DOC-2024-001', time: 'Hace 2 horas' },
    { type: 'update', title: 'Empleado Actualizado', description: 'Carlos Gómez - Recepcionista', time: 'Hace 4 horas' },
    { type: 'delete', title: 'Dosaje Eliminado', description: 'Registro #DOS-2024-045', time: 'Hace 1 día' },
    { type: 'create', title: 'Nuevo Reporte de Toxicología', description: 'Reporte #TOX-2024-012', time: 'Hace 2 días' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private empleadoService: EmpleadoService,
    private documentoService: DocumentoService,
    private asignacionService: AsignacionService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.nombre || 'Usuario';
    this.loadStats();
  }

  loadStats(): void {
    // Cargar estadísticas de todas las tablas
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => this.stats.usuarios = data.length,
      error: (err) => console.error('Error cargando usuarios', err)
    });

    this.empleadoService.getAll().subscribe({
      next: (data) => this.stats.empleados = data.length,
      error: (err) => console.error('Error cargando empleados', err)
    });

    this.documentoService.getDocumentos().subscribe({
      next: (data) => this.stats.documentos = data.length,
      error: (err) => console.error('Error cargando documentos', err)
    });

    this.asignacionService.getAsignaciones().subscribe({
      next: (data) => this.stats.asignaciones = data.length,
      error: (err) => console.error('Error cargando asignaciones', err)
    });
  }

  refreshStats(): void {
    this.loadStats();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'create': return 'bi-plus-circle';
      case 'update': return 'bi-pencil-square';
      case 'delete': return 'bi-trash';
      default: return 'bi-activity';
    }
  }

  getActivityIconBgClass(type: string): string {
    switch (type) {
      case 'create': return 'bg-success rounded-circle p-2';
      case 'update': return 'bg-warning rounded-circle p-2';
      case 'delete': return 'bg-danger rounded-circle p-2';
      default: return 'bg-primary rounded-circle p-2';
    }
  }
}