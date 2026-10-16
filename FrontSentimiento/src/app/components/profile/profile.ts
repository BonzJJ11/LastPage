import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { 
  LucideAngularModule, 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  PenTool, 
  Trash, 
  ShieldAlert, 
  Check, 
  X, 
  Camera, 
  Save, 
  LogOut, 
  Heart, 
  Bookmark, 
  Sparkles, 
  Lock, 
  Shield,
  MessageSquare,
  Share2
} from 'lucide-angular';
import { AuthService } from '../../core/servicios/auth.service';
import { PublicacionService } from '../../core/servicios/publicacion.service';
import { GuardadoService } from '../../core/services/guardado.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    DialogModule,
    TooltipModule,
    BadgeModule,
    TagModule,
    LucideAngularModule
  ],
  providers: [MessageService],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  userId: number | null = null;
  usuario: any = null;
  loading = true;
  guardando = false;

  // Tabs
  activeTab: 'historias' | 'editar' | 'seguridad' = 'historias';

  // Estadísticas y contenido
  misHistorias: any[] = [];
  totalGuardados = 0;

  // Formulario de edición
  editNombre = '';
  editBiografia = '';
  editFotoPerfil = '';
  
  // Cambio de contraseña
  nuevaPassword = '';
  confirmarPassword = '';

  // Eliminación de cuenta
  displayDeleteDialog = false;
  confirmacionUsername = '';
  isDeleting = false;

  // Avatares predefinidos sugeridos
  avataresSugeridos: string[] = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  ];

  // Iconos Lucide
  readonly ArrowLeftIcon = ArrowLeft;
  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly CalendarIcon = Calendar;
  readonly ClockIcon = Clock;
  readonly PenIcon = PenTool;
  readonly TrashIcon = Trash;
  readonly ShieldAlertIcon = ShieldAlert;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly CameraIcon = Camera;
  readonly SaveIcon = Save;
  readonly LogOutIcon = LogOut;
  readonly HeartIcon = Heart;
  readonly BookmarkIcon = Bookmark;
  readonly SparklesIcon = Sparkles;
  readonly LockIcon = Lock;
  readonly ShieldIcon = Shield;
  readonly MessageSquareIcon = MessageSquare;
  readonly ShareIcon = Share2;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private publicacionService: PublicacionService,
    private guardadoService: GuardadoService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedId = localStorage.getItem('user_id');
      if (storedId && !isNaN(Number(storedId))) {
        this.userId = Number(storedId);
      }
    }

    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['historias', 'editar', 'seguridad'].includes(params['tab'])) {
        this.activeTab = params['tab'];
      }
    });

    if (!this.userId) {
      const activeUser = typeof window !== 'undefined' ? localStorage.getItem('active_username') : null;
      if (activeUser) {
        this.loading = true;
        this.authService.getUsuarios().subscribe({
          next: (usuarios) => {
            const found = usuarios.find((u: any) => u.username?.toLowerCase() === activeUser.toLowerCase());
            if (found && found.id_usuario) {
              this.userId = found.id_usuario;
              if (typeof window !== 'undefined') {
                localStorage.setItem('user_id', String(found.id_usuario));
              }
              this.cargarDatosPerfil();
              this.cargarMisHistorias();
              this.cargarEstadisticas();
            } else {
              this.router.navigate(['/login']);
            }
          },
          error: () => this.router.navigate(['/login'])
        });
        return;
      } else {
        this.router.navigate(['/login']);
        return;
      }
    }

    this.cargarDatosPerfil();
    this.cargarMisHistorias();
    this.cargarEstadisticas();
  }

  cargarDatosPerfil(): void {
    if (!this.userId) return;
    this.loading = true;
    this.authService.getUsuario(this.userId).subscribe({
      next: (data) => {
        this.usuario = data;
        this.editNombre = data.nombre || '';
        this.editBiografia = data.biografia || '';
        this.editFotoPerfil = data.foto_perfil || '';
        this.loading = false;

        if (typeof window !== 'undefined' && window.localStorage) {
          if (data.foto_perfil) localStorage.setItem('user_photo', data.foto_perfil);
          if (data.username) localStorage.setItem('active_username', data.username);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del usuario.'
        });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarMisHistorias(): void {
    if (!this.userId) return;
    this.publicacionService.getPublicaciones(this.userId).subscribe({
      next: (data) => {
        this.misHistorias = data.filter((p: any) => p.id_usuario === this.userId);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar historias:', err)
    });
  }

  cargarEstadisticas(): void {
    if (!this.userId) return;
    this.guardadoService.getGuardadosPorUsuario(this.userId).subscribe({
      next: (data) => {
        this.totalGuardados = data.length;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  seleccionarAvatar(url: string): void {
    this.editFotoPerfil = url;
  }

  guardarPerfil(): void {
    if (!this.userId) return;
    if (!this.editNombre.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'El nombre no puede estar vacío.'
      });
      return;
    }

    this.guardando = true;
    const datosActualizados: any = {
      nombre: this.editNombre.trim(),
      biografia: this.editBiografia.trim(),
      foto_perfil: this.editFotoPerfil.trim()
    };

    this.authService.updateUsuario(this.userId, datosActualizados).subscribe({
      next: (res) => {
        this.guardando = false;
        this.usuario = { ...this.usuario, ...res };

        if (typeof window !== 'undefined' && window.localStorage) {
          if (res.foto_perfil !== undefined) localStorage.setItem('user_photo', res.foto_perfil || '');
          if (res.nombre) localStorage.setItem('active_nombre', res.nombre);
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Perfil actualizado',
          detail: 'Tus cambios han sido guardados exitosamente.'
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardando = false;
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el perfil.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  cambiarPassword(): void {
    if (!this.userId) return;
    if (!this.nuevaPassword || this.nuevaPassword.length < 6) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Contraseña muy corta',
        detail: 'La contraseña debe tener al menos 6 caracteres.'
      });
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'No coinciden',
        detail: 'Las contraseñas no coinciden.'
      });
      return;
    }

    this.guardando = true;
    this.authService.updateUsuario(this.userId, { password: this.nuevaPassword }).subscribe({
      next: () => {
        this.guardando = false;
        this.nuevaPassword = '';
        this.confirmarPassword = '';
        this.messageService.add({
          severity: 'success',
          summary: 'Contraseña actualizada',
          detail: 'Tu contraseña ha sido cambiada correctamente.'
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar la contraseña.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  eliminarHistoria(id: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta historia?')) return;
    this.publicacionService.deletePublicacion(id).subscribe({
      next: () => {
        this.misHistorias = this.misHistorias.filter(h => h.id_publicacion !== id);
        this.messageService.add({
          severity: 'success',
          summary: 'Historia eliminada',
          detail: 'La historia fue eliminada correctamente.'
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la historia.'
        });
      }
    });
  }

  abrirDialogoEliminar(): void {
    this.confirmacionUsername = '';
    this.displayDeleteDialog = true;
  }

  confirmarEliminarCuenta(): void {
    if (!this.userId || !this.usuario) return;

    if (this.confirmacionUsername.trim().toLowerCase() !== this.usuario.username.toLowerCase()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Verificación fallida',
        detail: 'El nombre de usuario escrito no coincide.'
      });
      return;
    }

    this.isDeleting = true;
    this.authService.deleteUsuario(this.userId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.displayDeleteDialog = false;

        // Limpiar sesión local
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('token');
          localStorage.removeItem('active_username');
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_id');
        }

        this.messageService.add({
          severity: 'info',
          summary: 'Cuenta eliminada',
          detail: 'Tu perfil y datos han sido eliminados de LastPage.'
        });

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.isDeleting = false;
        console.error('Error al eliminar cuenta:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la cuenta. Intenta nuevamente.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  volverAHome(): void {
    this.router.navigate(['/home']).catch(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/home';
      }
    });
  }

  cerrarSesion(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
      localStorage.removeItem('active_username');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
    }
    this.router.navigate(['/login']);
  }

  formatearFecha(fechaStr?: string): string {
    if (!fechaStr) return 'No disponible';
    const f = new Date(fechaStr);
    return f.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatearUltimoAcceso(fechaStr?: string): string {
    if (!fechaStr) return 'Reciente';
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    const diffMin = Math.floor((ahora.getTime() - fecha.getTime()) / 60000);

    if (diffMin < 2) return 'En línea ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `Hace ${diffHoras} horas`;
    return this.formatearFecha(fechaStr);
  }
}
