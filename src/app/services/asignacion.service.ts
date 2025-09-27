// src/app/services/asignacion.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AsignacionDTO } from '../models/asignacion.model';

@Injectable({
  providedIn: 'root'
})
export class AsignacionService {
  private apiUrl = 'http://localhost:8080/api/asignaciones';

  constructor(private http: HttpClient) { }

  getAsignaciones(): Observable<AsignacionDTO[]> {
    return this.http.get<AsignacionDTO[]>(this.apiUrl);
  }

  getAsignacionById(id: number): Observable<AsignacionDTO> {
    return this.http.get<AsignacionDTO>(`${this.apiUrl}/${id}`);
  }

  createAsignacion(asignacion: AsignacionDTO): Observable<AsignacionDTO> {
    return this.http.post<AsignacionDTO>(this.apiUrl, asignacion);
  }

  updateAsignacion(id: number, asignacion: AsignacionDTO): Observable<AsignacionDTO> {
    return this.http.put<AsignacionDTO>(`${this.apiUrl}/${id}`, asignacion);
  }

  deleteAsignacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}