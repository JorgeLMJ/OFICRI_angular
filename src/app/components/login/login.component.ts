import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true, 
  imports: [ReactiveFormsModule, CommonModule] 
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;

      this.authService.login(username, password).subscribe(
        response => {
          const user = this.authService.getCurrentUser();
          const rol = user?.rol;

          let redirectRoute = '/dashboard'; // por defecto (Administrador)

          // 🚀 Redirigir según rol
          if (rol === 'Jefe de Toxicologia') {
            redirectRoute = '/dashboard/toxicologia';
          } else if (rol === 'Jefe de Dosaje') {
            redirectRoute = '/dashboard/dosajes';
          } else if (rol === 'Recepcionista') {
            redirectRoute = '/dashboard/documento'; // puedes cambiarlo a '/dashboard/asignaciones'
          }

          this.router.navigate([redirectRoute]);
        },
        error => {
          this.errorMessage = 'Credenciales incorrectas';
        }
      );
    }
  }
}