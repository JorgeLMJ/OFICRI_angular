// src/app/components/dashboard/asignaciones/asignaciones.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AsignacionDTO } from '../../../models/asignacion.model';
import { AsignacionService } from '../../../services/asignacion.service';
import { AuthService } from '../../../services/auth.service'; // ✅ Importar AuthService
import Swal from 'sweetalert2';

@Component({
  selector: 'app-asignaciones',
  templateUrl: './asignaciones.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AsignacionesComponent implements OnInit {
  asignaciones: AsignacionDTO[] = [];
  searchTerm = '';
  asignacionesFiltradas: AsignacionDTO[] = [];
  currentUserRole: string = ''; // ✅ Rol del usuario actual

  constructor(
    private asignacionService: AsignacionService,
    private router: Router,
    private authService: AuthService // ✅ Inyectar AuthService
  ) {}

  ngOnInit(): void {
    // Obtener rol del usuario
    const user = this.authService.getCurrentUser();
    this.currentUserRole = user?.rol || '';

    this.loadAsignaciones();
  }

  // ✅ Nueva función: ¿Puede eliminar asignaciones?
  puedeEliminarAsignacion(): boolean {
    // Solo Recepcionista y Administrador pueden eliminar
    return ['Recepcionista', 'Administrador'].includes(this.currentUserRole);
  }

  loadAsignaciones(): void {
    this.asignacionService.getAsignaciones().subscribe({
      next: (data) => {
        this.asignaciones = data;
        this.applyFilter();
      },
      error: (err) => {
        console.error('Error cargando asignaciones', err);
        Swal.fire('❌ Error', 'No se pudieron cargar las asignaciones', 'error');
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.asignacionesFiltradas = [...this.asignaciones];
      return;
    }
    this.asignacionesFiltradas = this.asignaciones.filter(asignacion =>
      asignacion.area.toLowerCase().includes(term) ||
      asignacion.estado.toLowerCase().includes(term) ||
      asignacion.cualitativo?.toLowerCase().includes(term) ||
      asignacion.documentoSalida?.toLowerCase().includes(term)
    );
  }

  nuevaAsignacion(): void {
    this.router.navigate(['/dashboard/asignaciones/asignacion-registro']);
  }

  editarAsignacion(id: number): void {
    this.router.navigate(['/dashboard/asignaciones/asignacion-registro', id]);
  }

  eliminarAsignacion(id: number): void {
    if (!this.puedeEliminarAsignacion()) {
      Swal.fire('🔒 Acceso denegado', 'No tienes permisos para eliminar asignaciones.', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta asignación será eliminada permanentemente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.asignacionService.deleteAsignacion(id).subscribe({
          next: () => {
            this.loadAsignaciones();
            Swal.fire('✅ Eliminado', 'Asignación eliminada correctamente', 'success');
          },
          error: () => {
            Swal.fire('❌ Error', 'No se pudo eliminar la asignación', 'error');
          }
        });
      }
    });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}