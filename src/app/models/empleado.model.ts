export interface EmpleadoDTO {
  id?: number;
  nombre: string;
  apellido: string;
  dni: string;
  cargo: string;
  telefono: string;
  usuarioId: number; 
  usuarioEmail?: string;
}
