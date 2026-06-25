import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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

  quitarReaccion(idUsuario: number, idPublicacion: number): Observable<any> {
    // Buscar el id_reaccion y eliminarlo
    return this.getReaccionesPorPublicacion(idPublicacion).pipe(
      switchMap((reacciones: any[]) => {
        const reaccion = reacciones.find(r => r.id_usuario === idUsuario);
        if (reaccion) {
          return this.http.delete(`${this.apiUrl}${reaccion.id_reaccion}/`);
        }
        return new Observable(obs => { obs.next(null); obs.complete(); });
      })
    );
  }
}

