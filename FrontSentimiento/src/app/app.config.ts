import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptores/auth.interceptor';

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#edf7f0',
            100: '#d4edda',
            200: '#a7e3b5',
            300: '#7ad690',
            400: '#4CAF6B',
            500: '#4CAF6B',
            600: '#3d9259',
            700: '#2e7a47',
            800: '#1f6135',
            900: '#104923',
            950: '#082d14'
        }
    }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    providePrimeNG({
        theme: {
            preset: MyPreset
        }
    })
  ]
};
