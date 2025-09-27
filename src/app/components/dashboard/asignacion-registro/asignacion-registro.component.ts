import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AsignacionDTO } from '../../../models/asignacion.model';
import { AsignacionService } from '../../../services/asignacion.service';
import { Documento } from '../../../models/documento.model';
import { DocumentoService } from '../../../services/documento.service';
import { EmpleadoDTO } from '../../../models/empleado.model';
import { EmpleadoService } from '../../../services/Empleado.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-asignacion-registro',
  templateUrl: './asignacion-registro.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule]
})
export class AsignacionRegistroComponent implements OnInit {
  asignacionForm!: FormGroup;
  editMode = false;
  currentUserRole: string = '';

  documentos: Documento[] = [];
  documentosFiltrados: Documento[] = [];
  terminoBusqueda: string = '';
  documentoSeleccionadoOficio: string = '';
  documentosAsignados: number[] = [];

  empleados: EmpleadoDTO[] = [];
  empleadosFiltrados: EmpleadoDTO[] = [];
  terminoBusquedaEmpleado: string = '';
  empleadoSeleccionadoNombre: string = '';

  esRolLimitado: boolean = false;
  puedeEditarEstado: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private asignacionService: AsignacionService,
    private documentoService: DocumentoService,
    private empleadoService: EmpleadoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserRole = user?.rol || '';

    // Roles que tienen edición limitada en ciertos campos
    this.esRolLimitado = ['Auxiliar de Toxicologia'].includes(this.currentUserRole);
    // Roles que pueden cambiar el estado
    this.puedeEditarEstado = ['Administrador', 'Auxiliar de Dosaje'].includes(this.currentUserRole);

    this.asignacionForm = this.fb.group({
      id: [null],
      area: [''],
      cualitativo: [''], // ← Ahora almacena el valor cuantitativo (ej: "0.85")
      documentoSalida: [''],
      fecha: [''],
      estado: [''],
      documentoId: [null],
      empleadoId: [null]
    });

    // Cargar documentos
    this.documentoService.getDocumentos().subscribe({
      next: (data: Documento[]) => {
        this.documentos = data;
        this.documentosFiltrados = [...this.documentos];
      },
      error: (err: any) => console.error('Error cargando documentos', err)
    });

    // ✅ Cargar SOLO empleados Químico Farmacéutico
    this.empleadoService.getAll().subscribe({
      next: (data: EmpleadoDTO[]) => {
        this.empleados = data.filter(emp => 
          emp.cargo.toLowerCase().includes('químico farmacéutico') ||
          emp.cargo.toLowerCase().includes('quimico farmaceutico')
        );
        this.empleadosFiltrados = [...this.empleados];
      },
      error: (err: any) => console.error('Error cargando empleados', err)
    });

    // Cargar asignaciones para bloquear documentos ya asignados
    this.asignacionService.getAsignaciones().subscribe({
      next: (asignaciones: AsignacionDTO[]) => {
        this.documentosAsignados = asignaciones
          .filter(a => a.documentoId !== null)
          .map(a => a.documentoId!);

        if (this.editMode) {
          const currentDocId = this.asignacionForm.get('documentoId')?.value;
          if (currentDocId) {
            this.documentosAsignados = this.documentosAsignados.filter(id => id !== currentDocId);
          }
        }

        this.filtrarDocumentos();
      },
      error: (err: any) => console.error('Error cargando asignaciones', err)
    });

    // Modo edición
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.editMode = true;
        this.asignacionService.getAsignacionById(id).subscribe((asignacion: AsignacionDTO) => {
          this.asignacionForm.patchValue({
            id: asignacion.id,
            area: asignacion.area,
            cualitativo: asignacion.cualitativo,
            documentoSalida: asignacion.documentoSalida,
            fecha: asignacion.fecha,
            estado: asignacion.estado,
            documentoId: asignacion.documentoId,
            empleadoId: asignacion.empleadoId
          }, { emitEvent: false });

          if (asignacion.documentoId) {
            this.documentoService.getDocumentoById(asignacion.documentoId).subscribe({
              next: (doc: Documento) => {
                this.documentoSeleccionadoOficio = doc.nroOficio;
              },
              error: () => {
                this.documentoSeleccionadoOficio = 'No disponible';
              }
            });
          }

          if (asignacion.empleadoId) {
            this.empleadoService.getById(asignacion.empleadoId).subscribe({
              next: (emp: EmpleadoDTO) => {
                this.empleadoSeleccionadoNombre = `${emp.nombre} ${emp.apellido}`;
              },
              error: () => {
                this.empleadoSeleccionadoNombre = 'No disponible';
              }
            });
          }
        });
      }
    });
  }

  filtrarDocumentos(): void {
    const term = this.terminoBusqueda.toLowerCase().trim();
    this.documentosFiltrados = this.documentos.filter(doc =>
      doc.nroOficio.toLowerCase().includes(term) ||
      doc.procedencia.toLowerCase().includes(term) ||
      (doc.nombres + ' ' + doc.apellidos).toLowerCase().includes(term)
    );
  }

  isDocumentoAsignado(documentoId: number): boolean {
    return this.documentosAsignados.includes(documentoId);
  }

  seleccionarDocumento(documento: Documento): void {
    if (this.esRolLimitado || this.isDocumentoAsignado(documento.id!)) return;
    this.asignacionForm.patchValue({ documentoId: documento.id });
    this.documentoSeleccionadoOficio = documento.nroOficio;
  }

  filtrarEmpleados(): void {
    const term = this.terminoBusquedaEmpleado.toLowerCase().trim();
    this.empleadosFiltrados = this.empleados.filter(emp =>
      emp.nombre.toLowerCase().includes(term) ||
      emp.apellido.toLowerCase().includes(term) ||
      emp.dni.includes(term)
    );
  }

  seleccionarEmpleado(empleado: EmpleadoDTO): void {
    if (this.esRolLimitado) return;
    this.asignacionForm.patchValue({ empleadoId: empleado.id });
    this.empleadoSeleccionadoNombre = `${empleado.nombre} ${empleado.apellido}`;
  }

  // ✅ Nueva función: permiso para editar resultado cuantitativo
  puedeEditarResultadoCuantitativo(): boolean {
    return ['Químico Farmacéutico', 'Auxiliar de Toxicologia', 'Administrador'].includes(this.currentUserRole);
  }

  puedeEditarEstadoCampo(): boolean {
    return this.puedeEditarEstado;
  }

  puedeSeleccionarEntidades(): boolean {
    return !this.esRolLimitado;
  }

  onSubmit(): void {
    if (this.asignacionForm.valid) {
      const formValue = this.asignacionForm.getRawValue();
      const asignacion: AsignacionDTO = { ...formValue };

      const req$ = this.editMode && asignacion.id
        ? this.asignacionService.updateAsignacion(asignacion.id, asignacion)
        : this.asignacionService.createAsignacion(asignacion);

      req$.subscribe({
        next: () => this.router.navigate(['/dashboard/asignaciones']),
        error: (err: any) => {
          console.error('Error guardando asignación', err);
          alert('❌ Error al guardar la asignación.');
        }
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/dashboard/asignaciones']);
  }
}