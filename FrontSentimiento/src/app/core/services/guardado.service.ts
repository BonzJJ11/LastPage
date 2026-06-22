import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GuardadoService {
  private apiUrl = 'http://localhost:8000/api/guardados/';

  constructor(private http: HttpClient) {}

  getGuardadosPorUsuario(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?id_usuario=${idUsuario}`);
  }

  guardarPublicacion(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  quitarGuardado(idGuardado: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${idGuardado}/`);
  }
}
