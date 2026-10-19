import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Ajusta esta URL a la de tu backend en Django (por ejemplo, el puerto puede variar)
  private apiUrl = 'http://localhost:8000/api'; 

  constructor(private http: HttpClient) {}

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/`, credentials);
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, userData);
  }

  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios/`);
  }

  getUsuario(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/usuarios/${id}/`);
  }

  updateUsuario(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/usuarios/${id}/`, data);
  }

  deleteUsuario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/usuarios/${id}/`);
  }

  uploadAvatar(file: File, idUsuario?: number): Observable<any> {
    const formData = new FormData();
    formData.append('foto', file);
    if (idUsuario) {
      formData.append('id_usuario', idUsuario.toString());
    }
    return this.http.post<any>(`${this.apiUrl}/upload-avatar/`, formData);
  }

  // Métodos para manejar el token (se guarda en localStorage)
  setToken(token: string): void {
    // Verificamos window para evitar errores con Server-Side Rendering (SSR)
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
      localStorage.removeItem('active_username');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_photo');
      localStorage.removeItem('active_nombre');
    }
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
}
