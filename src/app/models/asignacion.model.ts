export interface AsignacionDTO {
    id?: number;
    area: string;
    cualitativo: string; // 'POSITIVO' / 'NEGATIVO'
    documentoSalida: string;
    fecha: string; 
    estado: string;
    documentoId: number;
    empleadoId: number;
  }