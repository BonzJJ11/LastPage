import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../servicios/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Si el usuario tiene un token guardado, clonamos la petición HTTP
  // y le agregamos el Token en las cabeceras (Headers)
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        // En Django, dependiendo de tu configuración (ej. simplejwt o rest_framework.authtoken),
        // puede ser 'Bearer <token>' o 'Token <token>'. Reemplaza según corresponda.
        Authorization: `Bearer ${token}` 
      }
    });
    return next(authReq);
  }

  // Si no hay token, la petición pasa normalmente sin cabeceras extra
  return next(req);
};
