import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LucideAngularModule, Shield, PenTool, Lock } from 'lucide-angular';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    FormsModule, 
    RouterModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    LucideAngularModule
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  username = '';
  nombre = '';
  correo = '';
  password = '';
  confirmPassword = '';

  isSubmitted = false;

  readonly ShieldIcon = Shield;
  readonly PenIcon = PenTool;
  readonly LockIcon = Lock;

  constructor(private http: HttpClient, private router: Router, private messageService: MessageService) {}

  onSubmit(form: any) {
    this.isSubmitted = true;
    if (form.valid && this.password === this.confirmPassword) {
      const payload = {
        username: this.username,
        nombre: this.nombre,
        correo: this.correo,
        password: this.password,
        id_rol: 1
      };

      this.http.post('http://localhost:8000/api/usuarios/', payload).subscribe({
        next: (response) => {
          this.messageService.add({ severity: 'success', summary: '¡Éxito!', detail: 'Cuenta creada. Redirigiendo al login...' });
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Oops...', detail: 'Error al crear la cuenta. Puede que el correo o usuario ya existan.' });
        }
      });
    }
  }
}
