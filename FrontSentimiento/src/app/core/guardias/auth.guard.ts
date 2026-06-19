import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../servicios/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificamos en el servicio si existe el token
  if (authService.isLoggedIn()) {
    return true; // Permite el acceso a la ruta
  }

  // Si no está logueado, lo redirigimos a la página de login y bloqueamos el paso
  router.navigate(['/login']);
  return false; 
};
