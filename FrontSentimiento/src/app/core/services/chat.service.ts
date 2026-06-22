import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiConversacionesUrl = 'http://localhost:8000/api/conversaciones/';
  private apiMensajesUrl = 'http://localhost:8000/api/mensajes/';

  constructor(private http: HttpClient) {}

  getConversacionesPorUsuario(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiConversacionesUrl}?id_usuario=${idUsuario}`);
  }

  iniciarConversacion(data: any): Observable<any> {
    return this.http.post<any>(this.apiConversacionesUrl, data);
  }

  actualizarConversacion(idConversacion: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiConversacionesUrl}${idConversacion}/`, data);
  }

  getMensajesPorConversacion(idConversacion: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiMensajesUrl}?id_conversacion=${idConversacion}`);
  }

  enviarMensaje(data: any): Observable<any> {
    return this.http.post<any>(this.apiMensajesUrl, data);
  }
}
