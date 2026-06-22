import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComentarioService {
  private apiUrl = 'http://localhost:8000/api/comentarios/';

  constructor(private http: HttpClient) {}

  getComentariosPorPublicacion(idPublicacion: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?id_publicacion=${idPublicacion}`);
  }

  crearComentario(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}
