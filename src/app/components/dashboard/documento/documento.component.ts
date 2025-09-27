import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Documento } from '../../../models/documento.model';
import { DocumentoService } from '../../../services/documento.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-documento',
  templateUrl: './documento.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DocumentoComponent implements OnInit {
  documentos: Documento[] = [];
  searchTerm = '';

  // Paginación
  currentPage = 1;
  pageSize = 6;
  maxVisiblePages = 5;

  constructor(
    private documentoService: DocumentoService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDocumentos();
  }

  nuevoDocumento(): void {
    this.router.navigate(['/dashboard/documento-registro']);
  }

  editarDocumento(id: number): void {
    this.router.navigate(['/dashboard/documento', id, 'editar']);
  }

  loadDocumentos(): void {
    this.documentoService.getDocumentos().subscribe({
      next: (data) => {
        this.documentos = data ?? [];
        this.goToPage(1);
      },
      error: (err) => console.error('Error cargando documentos', err)
    });
  }

  get filteredDocumentos(): Documento[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return [...this.documentos];
    return this.documentos.filter(doc =>
      doc.nroOficio.toLowerCase().includes(q) ||
      doc.procedencia.toLowerCase().includes(q) ||
      doc.nombres.toLowerCase().includes(q) ||
      doc.apellidos.toLowerCase().includes(q) ||
      doc.dni.toLowerCase().includes(q) ||
      doc.asunto.toLowerCase().includes(q) ||
      doc.situacion.toLowerCase().includes(q) ||
      doc.tipoMuestra?.toLowerCase().includes(q) ||
      doc.personaQueConduce?.toLowerCase().includes(q) ||
      doc.cualitativo?.toLowerCase().includes(q) ||
      doc.cuantitativo?.toLowerCase().includes(q)||
      doc.nro_registro.toString().includes(q)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDocumentos.length / this.pageSize));
  }

  get paginatedDocumentos(): Documento[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDocumentos.slice(start, start + this.pageSize);
  }

  goToPage(p: number): void {
    this.currentPage = Math.min(Math.max(1, p), this.totalPages);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const half = Math.floor(this.maxVisiblePages / 2);
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + this.maxVisiblePages - 1);
    if (end - start + 1 < this.maxVisiblePages) {
      start = Math.max(1, end - this.maxVisiblePages + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackById(_: number, item: Documento): number {
    return item.id!;
  }

  trackByPage(_: number, page: number): number {
    return page;
  }

  formatDate(dateString: string): string {
    if (!dateString || !dateString.includes('-')) {
      return 'N/A';
    }
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getAnexosSeleccionados(anexos: any): string[] {
    if (!anexos) {
      return [];
    }
    const seleccionados = [];
    if (anexos.cadenaCustodia) seleccionados.push('Cadena de Custodia');
    if (anexos.rotulo) seleccionados.push('Rotulo');
    if (anexos.actaTomaMuestra) seleccionados.push('Acta de Toma de Muestra');
    if (anexos.actaConsentimiento) seleccionados.push('Acta de Consentimiento');
    if (anexos.actaDenunciaVerbal) seleccionados.push('Acta de Denuncia Verbal');
    if (anexos.actaIntervencionPolicial) seleccionados.push('Acta de Intervención Policial');
    if (anexos.copiaDniSidpol) seleccionados.push('Copia de DNI, SIDPOL');
    if (anexos.actaObtencionMuestra) seleccionados.push('Acta de Muestra de Sangre');
    return seleccionados;
  }

  vistaPrevia(doc: Documento): void {
    const formatFechaInforme = (fecha: string): string => {
      if (!fecha) return '____________';
      const d = new Date(`${fecha}T00:00:00`);
      if (isNaN(d.getTime())) return 'FECHA INVALIDA';
      const dia = d.getDate().toString().padStart(2, '0');
      const mes = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SET','OCT','NOV','DIC'][d.getMonth()];
      const anio = d.getFullYear();
      return `${dia}${mes}${anio}`;
    };

    const listaAnexos = this.getAnexosSeleccionados(doc.anexos);
    const anexosHtml = listaAnexos.length > 0
      ? listaAnexos.map(nombre => `<p style="margin: 2px 0;">- ${nombre}</p>`).join('')
      : '<p>No se especificaron anexos.</p>';

    const currentUser = this.authService.getCurrentUser();
    const nombreUsuarioActual = currentUser?.nombre || 'Usuario del Sistema';

    const fechaIncidente = formatFechaInforme(doc.fechaIncidente);
    const fechaTomaMuestra = formatFechaInforme(doc.fechaActa || doc.fechaIncidente);

    const hoy = new Date();
    const diaHoy = hoy.getDate();
    const mesHoy = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'][hoy.getMonth()];
    const anioHoy = hoy.getFullYear();

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Vista Previa - Informe Pericial</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0 auto; 
            max-width: 800px; 
            padding: 10px; 
            color: #000; 
            font-size: 12px; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 10px; 
        }
        .header img { 
            width: 150px; 
            margin-bottom: 10px; 
        }
        .header h1 { 
            margin: 2px 0; 
            font-size: 12px !important; 
            font-weight: normal; 
        }
        .title-container { 
            text-align: center; 
            margin-bottom: 30px; 
        }
        .title { 
            font-weight: bold; 
            font-size: 16px; 
            text-decoration: underline; 
            display: inline-block; 
        }
        .report-number { 
            text-align: right; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .main-content { 
            font-size: 13px; 
        }
        .section { 
            margin-bottom: 12px; 
            display: grid; 
            grid-template-columns: 200px 1fr; 
            align-items: baseline; 
        }
        .section-title { 
            font-weight: bold; 
        }
        .section-content { 
            border-bottom: 1px dotted #000; 
            padding: 1px 5px; 
        }
        .full-width-section { 
            margin-top: 15px; 
        }
        .full-width-section .section-title { 
            margin-bottom: 8px; 
            font-weight: bold; 
        }
        .full-width-section .section-content { 
            border-bottom: none; 
            text-align: justify; 
        }
        .results-table { 
            width: 40%; 
            margin: 15px auto; 
            border-collapse: collapse; 
            text-align: center; 
        }
        .results-table th, .results-table td { 
            border: 1px solid #000; 
            padding: 2px; 
        }
        .signature-area { 
            text-align: right; 
           
            padding-right: 25px;
        }
        .signature-block { 
    display: inline-block;         
    text-align: center; 
    width: 250px; /* Asegura que la fecha no se desborde */
}
.signature-block p { 
    margin: 2px 0; 
    font-size: 9px; 
    font-weight: bold;
}
.signature-line { 
    border-top: 1px dotted #000; 
    width: 100%; 
    margin: 5px auto; 
}
.date-in-signature { 
    text-align: left !important;
    margin: 0 0 70px 0 !important;
    font-size: 12px !important;
    width: 100% !important;
    display: block !important;
    padding-left: 0 !important;
}
        .print-button-container { 
            position: fixed; 
            top: 20px; 
            left: 20px; 
            z-index: 9999; 
        }
        .print-button { 
            padding: 10px 20px; 
            background-color: #198754; 
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 16px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.2); 
        }
        @media print { 
            .print-button-container { display: none; } 
        }
    </style>
</head>
<body>
    <div class="print-button-container">
        <button class="print-button" onclick="window.print()">🖨️ Imprimir</button>
    </div>

    <div class="header">
        <img src="/assets/img/logo_pnp.png" alt="Logo PNP">
        <h1>POLICIA NACIONAL DEL PERU</h1>
        <h1>Oficina de Criminalística</h1>
    </div>
    <div class="title-container">
        <span class="title">INFORME PERICIAL DE DOSAJE ETILICO</span>
    </div>
    <div class="report-number">
        Nº ${doc.nro_registro || 'S/N'}/${anioHoy}
    </div>

    <div class="main-content">
        <div class="section">
            <span class="section-title">A. PROCEDENCIA</span>
            <span class="section-content">: ${doc.procedencia || ''}</span>
        </div>
        <div class="section">
            <span class="section-title">B. ANTECEDENTE</span>
            <span class="section-content">: OFICIO. Nº ${doc.nroOficio || 'S/N'} - ${anioHoy} - ${doc.nombreOficio || ''} DEL ${fechaIncidente}</span>
        </div>
        <div class="section">
            <span class="section-title">C. DATOS DEL PERITO</span>
            <span class="section-content">: CAP. (S) PNP Javier Alexander HUAMANI CORDOVA, identificada con CIP Nº.419397 Químico 
            Farmacéutico CQFP 20289, con domicilio procesal en la calle Alcides Vigo N°133 Wanchaq - Cusco</span>
        </div>
        <div class="section">
            <span class="section-title">D. HORA DEL INCIDENTE</span>
            <span class="section-content">: ${doc.horaIncidente || ''} &nbsp;&nbsp; <b>FECHA:</b> ${fechaIncidente}</span>
        </div>
        <div class="section">
            <span class="section-title">E. HORA DE TOMA DE MUESTRA</span>
            <span class="section-content">: ${doc.horaTomaMuestra || ''} &nbsp;&nbsp; <b>FECHA:</b> ${fechaTomaMuestra} (${nombreUsuarioActual})</span>
        </div>
        <div class="section">
            <span class="section-title">F. TIPO DE MUESTRA</span>
            <span class="section-content">: ${doc.tipoMuestra || ''}</span>
        </div>
        <div class="section">
            <span class="section-title">G. PERSONA QUE CONDUCE</span>
            <span class="section-content">: ${doc.personaQueConduce || ''}</span>
        </div>
        <div class="section">
            <span class="section-title">H. EXAMINADO</span>
            <span class="section-content">: ${doc.nombres || ''} ${doc.apellidos || ''} (${doc.edad || ''}), DNI Nº:${doc.dni || ''}</span>
        </div>
        <div class="full-width-section">
            <div class="section-title">I. MOTIVACIÓN DEL EXAMEN</div>
            <div class="section-content">
                Motivo del examen ${doc.delitoInfraccion || ''}. Se procedió a efectuar el examen de dosaje etílico, empleando la prueba cualitativa y cuantitativa en aliento y sheffel modificado para la prueba cuantitativa, con el siguiente resultado:
            </div>
        </div>
        <table class="results-table">
            <tr> <th>EXAMEN</th> <th>M-1</th> </tr>
            <tr> <td>Cualitativo</td> <td><strong>${doc.cualitativo || ''}</strong></td> </tr>
            <tr> <td>Cuantitativo</td> <td><strong>${doc.cuantitativo || '0.0'} g/l</strong></td> </tr>
        </table>
        <div class="full-width-section">
            <div class="section-title">J. CONCLUSIONES</div>
            <div class="section-content">
                En la muestra M-1 (${doc.tipoMuestra || ''}) analizado dio de resultado <strong>${doc.cualitativo || ''}</strong> para examen cualitativo 
                y de alcoholemia <strong>${doc.cuantitativo || '0.0'} g/l (${this.numeroALetras(doc.cuantitativo || '0')})</strong>
                en analisis cuantitativo. La muestra procesada queda en laboratorio en calidad de custodia durante el tiempo establecido por ley (Directiva N° 18-03-27)
            </div>
        </div>
        <div class="full-width-section">
            <div class="section-title">K. ANEXOS</div>
            <div class="section-content" style="text-align: left;">
                ${anexosHtml}
            </div>
        </div>
    </div>

    <!-- Fecha encima de la firma -->
    <div class="signature-area">
        <div class="signature-block">
            <p class="date-in-signature">Cusco, ${diaHoy} de ${mesHoy} del ${anioHoy}.</p>
            <div class="signature-line"></div>
            <p>OS - 419397</p>
            <p>JAVIER ALEXANDER HUAMANI CORDOVA</p>
            <p>CAP S PNP</p>
            <p>QUIMICO FARMACÉUTICO</p>
            <p>CQFP N°20289</p>
        </div>
    </div>

</body>
</html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  }

 private numeroALetras(numStr: string): string {
  const num = parseFloat(numStr);
  if (isNaN(num)) return '';

  const [enteroStr, decimalStr] = numStr.split('.');
  let entero = parseInt(enteroStr, 10);

  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];

  function convertir(n: number): string {
    if (n < 10) return unidades[n];
    if (n < 20) return especiales[n - 10];
    if (n < 100) {
      const u = n % 10;
      const d = Math.floor(n / 10);
      return decenas[d] + (u > 0 ? ' y ' + unidades[u] : '');
    }
    return '';
  }

  // ✅ Manejo de "gramo" vs "gramos"
  let texto: string;
  if (entero === 1) {
    texto = 'un gramo';
  } else {
    const parteEntera = entero > 0 ? convertir(entero) : 'cero';
    texto = parteEntera + ' gramos';
  }

  // ✅ Manejo de decimales (centigramos)
  if (decimalStr) {
    const decimalNum = parseInt(decimalStr.padEnd(2, '0'), 10);
    if (decimalNum > 0) {
      const parteDecimal = decimalNum < 100 ? convertir(decimalNum) : '';
      texto += ' con ' + parteDecimal;
    }
  }

  // ✅ Formato final
  const resultado = texto + ' cg x l. de sangre';
  return resultado.charAt(0).toUpperCase() + resultado.slice(1);
}
}