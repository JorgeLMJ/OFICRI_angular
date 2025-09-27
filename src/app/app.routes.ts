
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { RegistroComponent } from './components/registro/registro.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { HomeComponent } from './components/dashboard/home/home.component';
import { EmpleadosComponent } from './components/dashboard/empleados/empleados.component';
import { EmpleadoRegistroComponent } from './components/dashboard/empleado-registro/empleado-registro.component';
import { UsuariosComponent } from './components/dashboard/usuarios/usuarios.component'; 
import { DocumentoComponent } from './components/dashboard/documento/documento.component';
import { DocumentoRegistroComponent } from './components/dashboard/documento-registro/documento-registro.component';
import { AsignacionesComponent } from './components/dashboard/asignaciones/asignaciones.component';
import { AsignacionRegistroComponent } from './components/dashboard/asignacion-registro/asignacion-registro.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'usuarios', component: UsuariosComponent },  
      { path: 'empleados', component: EmpleadosComponent },
      { path: 'empleados/empleado-registro', component: EmpleadoRegistroComponent },
      { path: 'empleados/:id/editar', component: EmpleadoRegistroComponent },
      { path: 'documento', component: DocumentoComponent },
      { path: 'documento-registro', component: DocumentoRegistroComponent },
      { path: 'documento/:id/editar', component: DocumentoRegistroComponent },
      { path: 'asignaciones', component: AsignacionesComponent },
      { path: 'asignaciones/asignacion-registro', component: AsignacionRegistroComponent },
      { path: 'asignaciones/asignacion-registro/:id', component: AsignacionRegistroComponent },
      //{ path: 'reportes', component: ReportesComponent },
    ]
  },
  { path: '**', redirectTo: '/login' }
];