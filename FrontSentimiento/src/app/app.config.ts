import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { provideHttpClient, withFetch } from '@angular/common/http';

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#fcf3f0',
            100: '#f8e4dc',
            200: '#f0c8b9',
            300: '#e5a58e',
            400: '#d67c5e',
            500: '#b85c38',
            600: '#ab4a2c',
            700: '#8e3a24',
            800: '#733121',
            900: '#5e2b1d',
            950: '#33150d'
        }
    }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    providePrimeNG({
        theme: {
            preset: MyPreset
        }
    })
  ]
};
