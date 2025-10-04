import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AsignacionToxicologia } from '../../../models/toxicologia.model';
import { AsignacionToxicologiaService } from '../../../services/toxicologia.service';
import { Documento } from '../../../models/documento.model';
import { DocumentoService } from '../../../services/documento.service';
import { EmpleadoDTO } from '../../../models/empleado.model';
import { EmpleadoService } from '../../../services/Empleado.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-asignacion-toxicologia-registro',
  templateUrl: './asignacion-toxicologia-registro.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule]
})
export class AsignacionToxicologiaRegistroComponent implements OnInit, AfterViewInit {
  asignacionForm!: FormGroup;
  editMode = false;
  currentId: number | null = null;
  currentUserRole: string = '';

  @ViewChild('documentoModal') documentoModalEl!: ElementRef;
  @ViewChild('empleadoModal') empleadoModalEl!: ElementRef;
  
  private documentoModal: Modal | null = null;
  private empleadoModal: Modal | null = null;
  
  documentos: Documento[] = []; // ✅ Todos los documentos (pero filtrados por toxicología)
  documentosFiltrados: Documento[] = [];
  empleados: EmpleadoDTO[] = [];
  empleadosFiltrados: EmpleadoDTO[] = [];
  
  terminoBusquedaDocumento: string = '';
  terminoBusquedaEmpleado: string = '';
  
  documentoSeleccionadoInfo: string = '';
  empleadoSeleccionadoNombre: string = '';
  documentosAsignados: number[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private asignacionToxService: AsignacionToxicologiaService,
    private documentoService: DocumentoService,
    private empleadoService: EmpleadoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserRole = user?.rol || '';

    this.asignacionForm = this.fb.group({
      id: [null],
      area: ['Laboratorio de Toxicologia'],
      documentoId: [null, Validators.required],
      empleadoId: [null, Validators.required],
      estado: ['EN_PROCESO', Validators.required],
      resultados: this.fb.group({
        marihuana: [null], cocaina: [null], benzodiacepinas: [null],
        barbituricos: [null], carbamatos: [null], estricnina: [null],
        cumarinas: [null], organofosforados: [null], misoprostol: [null],
        piretrinas: [null]
      })
    });

    this.cargarDatosParaModales();

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.editMode = true;
        this.currentId = +id;
        this.cargarAsignacionParaEditar(this.currentId);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.documentoModalEl?.nativeElement) {
        this.documentoModal = new Modal(this.documentoModalEl.nativeElement);
      }
      if (this.empleadoModalEl?.nativeElement) {
        this.empleadoModal = new Modal(this.empleadoModalEl.nativeElement);
      }
    }, 0);
  }

  cargarDatosParaModales() {
    // ✅ Cargar SOLO documentos de toxicología
    this.documentoService.getDocumentos().subscribe(data => {
      this.documentos = data.filter(doc => 
        (doc.nombreDocumento || '').toLowerCase().includes('informe pericial de toxicologia') ||
        (doc.nombreDocumento || '').toLowerCase().includes('informe pericial de toxicología')
      );
      this.documentosFiltrados = [...this.documentos];
    });

    this.empleadoService.getAll().subscribe(data => {
      this.empleados = data.filter(e => {
        const cargoLower = e.cargo.toLowerCase();
        return (
          cargoLower.includes('quimico farmaceutico') ||
          cargoLower.includes('químico farmacéutico')
        );
      });
      this.empleadosFiltrados = this.empleados;
    });

    this.asignacionToxService.listar().subscribe(asignaciones => {
      this.documentosAsignados = asignaciones.map(a => a.documentoId!);
    });
  }

 cargarAsignacionParaEditar(id: number) {
  this.asignacionToxService.obtenerPorId(id).subscribe({
    next: (data) => {
      // ✅ 1. Actualizar el formulario con todos los datos
      this.asignacionForm.patchValue(data);

      // ✅ 2. Cargar el documento (si existe)
      if (data.documentoId) {
        this.documentoService.getDocumentoById(data.documentoId).subscribe({
          next: (doc) => {
            this.documentoSeleccionadoInfo = `ID ${doc.id} - Oficio ${doc.nroOficio}`;
          },
          error: (err) => {
            console.error('Error al cargar documento:', err);
            this.documentoSeleccionadoInfo = 'Error al cargar';
          }
        });
      }

      // ✅ 3. Cargar el EMPLEADO usando data.empleadoId (¡CORREGIDO!)
      if (data.empleadoId) {
        this.empleadoService.getById(data.empleadoId).subscribe({
          next: (emp: EmpleadoDTO) => {
            this.empleadoSeleccionadoNombre = `${emp.nombre} ${emp.apellido}`;
          },
          error: (err) => {
            console.error('Error al cargar empleado:', err);
            this.empleadoSeleccionadoNombre = 'Error al cargar empleado';
          }
        });
      } else {
        this.empleadoSeleccionadoNombre = '';
      }
    },
    error: (err) => {
      console.error('Error al cargar asignación:', err);
      Swal.fire('Error', 'No se pudo cargar la asignación.', 'error');
    }
  });
}

  puedeSeleccionarEntidades(): boolean {
    return !this.editMode;
  }

  openDocumentoModal() { 
    this.documentoModal?.show(); 
  }

  closeDocumentoModal() { 
    this.documentoModal?.hide(); 
  }

  openEmpleadoModal() { 
    this.empleadoModal?.show(); 
  }

  closeEmpleadoModal() { 
    this.empleadoModal?.hide(); 
  }

  isDocumentoAsignado(documentoId: number): boolean {
    if (this.editMode && this.asignacionForm.get('documentoId')?.value === documentoId) {
      return false;
    }
    return this.documentosAsignados.includes(documentoId);
  }

  filtrarDocumentos() {
    const term = this.terminoBusquedaDocumento.toLowerCase();
    this.documentosFiltrados = this.documentos.filter(doc => 
      doc.nroOficio.toLowerCase().includes(term) ||
      (doc.nombreDocumento || '').toLowerCase().includes(term) ||
      `${doc.nombres} ${doc.apellidos}`.toLowerCase().includes(term)
    );
  }

  filtrarEmpleados() {
    const term = this.terminoBusquedaEmpleado.toLowerCase();
    this.empleadosFiltrados = this.empleados.filter(emp => 
      `${emp.nombre} ${emp.apellido}`.toLowerCase().includes(term) ||
      emp.dni.toLowerCase().includes(term)
    );
  }

  seleccionarDocumento(doc: Documento) {
    this.asignacionForm.get('documentoId')?.setValue(doc.id);
    this.documentoSeleccionadoInfo = `ID ${doc.id} - Oficio ${doc.nroOficio}`;
    this.closeDocumentoModal();
  }

  seleccionarEmpleado(emp: EmpleadoDTO) {
    this.asignacionForm.get('empleadoId')?.setValue(emp.id);
    this.empleadoSeleccionadoNombre = `${emp.nombre} ${emp.apellido}`;
    this.closeEmpleadoModal();
  }

  toggleResultado(campo: string, valor: string): void {
    const control = this.asignacionForm.get(`resultados.${campo}`);
    if (control) {
      if (control.value === valor) {
        control.setValue(null);
      } else {
        control.setValue(valor);
      }
    }
  }

  onSubmit(): void {
    if (this.asignacionForm.invalid) {
      Swal.fire('Formulario inválido', 'Por favor, seleccione un documento y un empleado.', 'warning');
      return;
    }

    const formValue: AsignacionToxicologia = this.asignacionForm.getRawValue();

    const request$ = this.editMode
      ? this.asignacionToxService.actualizar(this.currentId!, formValue)
      : this.asignacionToxService.crear(formValue);

    request$.subscribe({
      next: () => {
        Swal.fire({
          title: '¡Guardado!',
          text: `La asignación de toxicología ha sido ${this.editMode ? 'actualizada' : 'creada'}.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        this.router.navigate(['/dashboard/asignaciones-toxicologia']);
      },
      error: (err) => Swal.fire('Error', `Ocurrió un error: ${err.message}`, 'error')
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboard/asignaciones-toxicologia']);
  }
}