import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private apiUrl = 'http://localhost:8000/api/notificaciones/';

  constructor(private http: HttpClient) {}

  getNotificacionesPorUsuario(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?id_usuario=${idUsuario}`);
  }

  marcarComoLeida(idNotificacion: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}${idNotificacion}/`, { leida: true });
  }
}
