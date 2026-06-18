import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Shield, Heart } from 'lucide-angular';

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
    LucideAngularModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  email = '';
  password = '';
  rememberMe = false;
  isSubmitted = false;

  readonly ShieldIcon = Shield;
  readonly HeartIcon = Heart;

  ngOnInit() {
    const savedEmail = localStorage.getItem('lastpage_remembered_email');
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
    }
  }

  onSubmit(form: any) {
    this.isSubmitted = true;
    if (form.valid) {
      if (this.rememberMe) {
        localStorage.setItem('lastpage_remembered_email', this.email);
      } else {
        localStorage.removeItem('lastpage_remembered_email');
      }
      
      console.log('Login successful for:', this.email);
      // Lógica de autenticación aquí
    }
  }
}
