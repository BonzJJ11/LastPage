import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Publicacion {
  id_publicacion?: number;
  titulo: string;
  contenido: string;
  visibilidad: string; // 'PUBLICO' o 'ANONIMO'
  fecha_publicacion?: Date;
  activo: boolean;
  id_usuario: number;
  id_categoria: number;
  nombre_usuario?: string;
  nombre_categoria?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicacionService {
  private apiUrl = 'http://localhost:8000/api/publicaciones/';

  constructor(private http: HttpClient) {}

  getPublicaciones(idUsuario?: number): Observable<Publicacion[]> {
    const url = idUsuario ? `${this.apiUrl}?id_usuario=${idUsuario}` : this.apiUrl;
    return this.http.get<Publicacion[]>(url);
  }

  createPublicacion(publicacion: Publicacion): Observable<Publicacion> {
    return this.http.post<Publicacion>(this.apiUrl, publicacion);
  }

  updatePublicacion(id: number, publicacion: Partial<Publicacion>): Observable<Publicacion> {
    return this.http.put<Publicacion>(`${this.apiUrl}${id}/`, publicacion);
  }

  deletePublicacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }
}
