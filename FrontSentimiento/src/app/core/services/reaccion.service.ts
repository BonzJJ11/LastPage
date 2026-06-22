import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReaccionService {
  private apiUrl = 'http://localhost:8000/api/reacciones/';

  constructor(private http: HttpClient) {}

  getReaccionesPorPublicacion(idPublicacion: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?id_publicacion=${idPublicacion}`);
  }

  reaccionar(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}
