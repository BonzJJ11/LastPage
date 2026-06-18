import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';

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
  readonly demoCode = '847291';

  currentStep: number = 1;
  email = '';
  enteredCode = '';
  password = '';
  confirmPassword = '';

  isSubmitted = false;
  codeError = '';
  passwordError = '';
  resendSeconds = 57;
  private redirectTimer?: ReturnType<typeof setTimeout>;
  private resendTimer?: ReturnType<typeof setInterval>;

  constructor(private router: Router) {}

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

    if (form.invalid) {
      return;
    }

    this.currentStep = 2;
    this.isSubmitted = false;
    this.codeError = '';
    this.startResendCountdown();
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

    if (codeStr !== this.demoCode) {
      this.codeError = 'El código no coincide. Usa el código demo 847291.';
      return;
    }

    this.currentStep = 3;
    this.codeError = '';
    this.isSubmitted = false;
  }

  changeEmail() {
    this.currentStep = 1;
    this.isSubmitted = false;
    this.enteredCode = '';
    this.codeError = '';
  }

  resendCode() {
    if (!this.canResendCode) {
      return;
    }

    this.enteredCode = '';
    this.codeError = '';
    this.startResendCountdown();
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

    this.currentStep = 4;
    this.redirectTimer = setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1800);
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

    this.resendSeconds = 57;
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
