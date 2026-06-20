import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Shield, Heart } from 'lucide-angular';
import { Router } from '@angular/router';
import { AuthService } from '../../core/servicios/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule, 
    RouterModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CheckboxModule,
    LucideAngularModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  username = '';
  password = '';
  rememberMe = false;
  isSubmitted = false;

  readonly ShieldIcon = Shield;
  readonly HeartIcon = Heart;

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    // Verificamos si estamos en el navegador para que el Server-Side Rendering (SSR) no falle
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedUsername = localStorage.getItem('lastpage_remembered_username');
      if (savedUsername) {
        this.username = savedUsername;
        this.rememberMe = true;
      }
    }
  }

  onSubmit(form: any) {
    this.isSubmitted = true;
    if (form.valid) {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (this.rememberMe) {
          localStorage.setItem('lastpage_remembered_username', this.username);
        } else {
          localStorage.removeItem('lastpage_remembered_username');
        }
      }
      
      console.log('Intentando iniciar sesión con:', this.username);
      
      const credenciales = { username: this.username, password: this.password };

      this.authService.login(credenciales).subscribe({
        next: (respuesta) => {
          // Guardar el token si el backend lo devuelve (ej: respuesta.token o respuesta.access)
          if (respuesta && respuesta.token) {
            this.authService.setToken(respuesta.token);
          } else if (respuesta && respuesta.access) { // para SimpleJWT
            this.authService.setToken(respuesta.access);
          }
          
          // Guardamos el usuario activo en localStorage para mostrarlo en el Home
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('active_username', this.username);
            if (respuesta && respuesta.id_rol) {
              localStorage.setItem('user_role', respuesta.id_rol.toString());
            }
            if (respuesta && respuesta.id_usuario) {
              localStorage.setItem('user_id', respuesta.id_usuario.toString());
            }
          }

          this.messageService.add({ severity: 'success', summary: 'Bienvenido', detail: 'Inicio de sesión exitoso' });
          
          // Redirigir al home tras un breve momento para ver el toast
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1000);
        },
        error: (err) => {
          console.error('Error de login', err);
          let mensajeError = 'Usuario o contraseña incorrectos.';
          
          if (err.status === 0) {
            mensajeError = 'No se pudo conectar con el servidor (Backend apagado).';
          } else if (err.error && err.error.error) {
            // Leer el error específico que enviamos desde Django
            mensajeError = err.error.error;
          }

          this.messageService.add({ severity: 'error', summary: 'Error', detail: mensajeError });
        }
      });
    }
  }
}
