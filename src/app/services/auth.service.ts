import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface LoginResponse {
  token: string;
  nombre: string;
  email: string;
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly baseUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  // 🔑 Login
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { username, password }).pipe(
      map(response => {
        if (response.token) {
          // Guardamos toda la info en localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('userName', response.nombre);
          localStorage.setItem('userEmail', response.email);
          localStorage.setItem('userRol', response.rol);

          this.currentUserSubject.next({
            token: response.token,
            nombre: response.nombre,
            email: response.email,
            rol: response.rol
          });
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  // 📝 Registro
  registrar(nombre: string, email: string, password: string, rol: string): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/registro`, {
      nombre,
      email,
      password,
      rol
    }).pipe(catchError(this.handleError));
  }

  // 🚪 Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRol');
    this.currentUserSubject.next(null);
  }

  // 👀 Verificar autenticación
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token && !this.isTokenExpired(token);
  }

  // 🔍 Validar expiración de token
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      return now >= exp;
    } catch (e) {
      return true;
    }
  }

  // 📌 Obtener token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // 👤 Obtener usuario actual
  getCurrentUser() {
    if (!this.currentUserSubject.value) {
      // Si aún no está cargado, intentamos desde localStorage
      const nombre = localStorage.getItem('userName');
      const email = localStorage.getItem('userEmail');
      const rol = localStorage.getItem('userRol');
      const token = localStorage.getItem('token');

      if (token && nombre && email && rol) {
        this.currentUserSubject.next({ token, nombre, email, rol });
      }
    }
    return this.currentUserSubject.value;
  }

  // ⚠️ Manejo de errores
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error ${error.status}: ${error.error?.message || error.message}`;
    }
    console.error('❌ AuthService error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // 🔐 Recuperar contraseña
  forgotPassword(email: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/forgot-password`, 
      { email }, 
      { responseType: 'text' }   // 👈 aceptar texto plano
    );
  }

  // 🔐 Restablecer contraseña
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/reset-password`,
      { token, newPassword },
      { responseType: 'json' } // ✅ backend ya devuelve JSON, no texto
    );
  }
}
