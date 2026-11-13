import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';
import { AuthService } from '../../core/servicios/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    InputOtpModule
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword implements OnDestroy {
  currentStep: number = 1;
  email = '';
  enteredCode = '';
  password = '';
  confirmPassword = '';

  isSubmitted = false;
  isLoading = false;
  emailError = '';
  codeError = '';
  passwordError = '';
  resendSeconds = 60;
  private redirectTimer?: ReturnType<typeof setTimeout>;
  private resendTimer?: ReturnType<typeof setInterval>;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}


  get maskedEmail() {
    if (!this.email.includes('@')) {
      return this.email;
    }

    const [name, domain] = this.email.split('@');
    const visibleName = name.length <= 2 ? name : `${name[0]}${'*'.repeat(name.length - 2)}${name.at(-1)}`;
    return `${visibleName}@${domain}`;
  }

  get canResendCode() {
    return this.resendSeconds === 0;
  }

  sendRecoveryCode(form: NgForm) {
    this.isSubmitted = true;
    this.emailError = '';

    if (form.invalid) {
      return;
    }

    this.isLoading = true;
    const correoLimpio = this.email.trim().toLowerCase();

    this.authService.solicitarOtpPassword(correoLimpio).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentStep = 2;
        this.isSubmitted = false;
        this.codeError = '';
        this.startResendCountdown();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.emailError = err.error?.error || 'No se pudo enviar el código. Verifica el correo e inténtalo de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  verifyCode() {
    let codeStr = '';
    if (Array.isArray(this.enteredCode)) {
      codeStr = this.enteredCode.join('');
    } else {
      codeStr = String(this.enteredCode || '');
    }

    if (codeStr.length < 6) {
      this.codeError = 'Ingresa los 6 dígitos del código.';
      return;
    }

    this.isLoading = true;
    this.codeError = '';
    const correoLimpio = this.email.trim().toLowerCase();

    this.authService.verificarOtpPassword(correoLimpio, codeStr).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentStep = 3;
        this.codeError = '';
        this.isSubmitted = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.codeError = err.error?.error || 'El código ingresado es incorrecto o ha expirado.';
        this.cdr.detectChanges();
      }
    });
  }

  changeEmail() {
    this.currentStep = 1;
    this.isSubmitted = false;
    this.enteredCode = '';
    this.codeError = '';
    this.emailError = '';
    this.cdr.detectChanges();
  }

  resendCode() {
    if (!this.canResendCode || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.codeError = '';
    const correoLimpio = this.email.trim().toLowerCase();

    this.authService.solicitarOtpPassword(correoLimpio).subscribe({
      next: () => {
        this.isLoading = false;
        this.enteredCode = '';
        this.startResendCountdown();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.codeError = err.error?.error || 'No se pudo reenviar el código. Inténtalo de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  saveNewPassword(form: NgForm) {
    this.isSubmitted = true;
    this.passwordError = '';

    if (form.invalid) {
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden.';
      return;
    }

    let codeStr = '';
    if (Array.isArray(this.enteredCode)) {
      codeStr = this.enteredCode.join('');
    } else {
      codeStr = String(this.enteredCode || '');
    }

    this.isLoading = true;
    const correoLimpio = this.email.trim().toLowerCase();

    this.authService.restablecerPassword({
      correo: correoLimpio,
      codigo: codeStr,
      nueva_password: this.password,
      confirmar_password: this.confirmPassword
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentStep = 4;
        this.cdr.detectChanges();
        this.redirectTimer = setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2200);
      },
      error: (err) => {
        this.isLoading = false;
        this.passwordError = err.error?.error || 'No se pudo restablecer la contraseña. Inténtalo de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  goToLogin() {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }

    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }

    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  private startResendCountdown() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }

    this.resendSeconds = 60;
    this.resendTimer = setInterval(() => {
      this.resendSeconds -= 1;

      if (this.resendSeconds <= 0) {
        this.resendSeconds = 0;
        if (this.resendTimer) {
          clearInterval(this.resendTimer);
        }
      }
    }, 1000);
  }
}

