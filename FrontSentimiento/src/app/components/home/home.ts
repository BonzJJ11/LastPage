import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { BadgeModule } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LucideAngularModule, Home as HomeIconLucide, Compass, Users, Bookmark, MessageSquare, Bell, Search, PenTool, ChevronDown, User, Settings, LogOut, Sun, Share2, MoreHorizontal, Image as ImageIcon, Tag, Smile, Lock, Heart, ShieldAlert, Globe, Trash, X, Send, MessageCircle } from 'lucide-angular';
import { CategoriaService, Categoria } from '../../core/servicios/categoria.service';
import { PublicacionService } from '../../core/servicios/publicacion.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DialogModule,
    TextareaModule,
    BadgeModule,
    PopoverModule,
    TableModule,
    ToastModule,
    LucideAngularModule
  ],
  providers: [MessageService],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  displayEscribirDialog = false;
  tituloHistoria = '';
  contenidoHistoria = '';
  activeUsername = 'JJ'; 
  
  // Iconos
  readonly HomeIcon = HomeIconLucide;
  readonly CompassIcon = Compass;
  readonly UsersIcon = Users;
  readonly BookmarkIcon = Bookmark;
  readonly MessageSquareIcon = MessageSquare;
  readonly BellIcon = Bell;
  readonly SearchIcon = Search;
  readonly PenIcon = PenTool;
  readonly ChevronDownIcon = ChevronDown;
  readonly UserIcon = User;
  readonly SettingsIcon = Settings;
  readonly LogOutIcon = LogOut;
  readonly SunIcon = Sun;
  readonly ShareIcon = Share2;
  readonly MoreIcon = MoreHorizontal;
  readonly ImageIcon = ImageIcon;
  readonly TagIcon = Tag;
  readonly SmileIcon = Smile;
  readonly LockIcon = Lock;
  readonly HeartIcon = Heart;
  readonly ShieldIcon = ShieldAlert;
  readonly GlobeIcon = Globe;
  readonly TrashIcon = Trash;
  readonly XIcon = X;
  readonly SendIcon = Send;
  readonly MessageCircleIcon = MessageCircle;

  isAdmin = false;
  userId: number | null = null;
  displayAdminCategorias = false;
  categorias: Categoria[] = [];
  categoriaActual: Categoria = { nombre_categoria: '', descripcion: '', activo: true };
  dialogCategoria = false;
  editMode = false;

  // Variables para publicaciones del feed
  publicaciones: any[] = [];

  // Variables para crear/editar publicación
  visibilidadPublicacion = 'PUBLICO';
  categoriaSeleccionadaId: number | null = null;
  editandoPublicacionId: number | null = null;
  listaEmojis = ['😀', '😂', '🥺', '😡', '😍', '🙏', '💪', '✨', '💔', '❤️', '🔥', '🎉', '😢', '😔', '🙌', '👍'];

  // Variables para el Chat
  chatActivo = false;
  chatUsuario: any = null;

  private refreshInterval: any;

  constructor(
    private router: Router, 
    private categoriaService: CategoriaService,
    private publicacionService: PublicacionService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedUser = localStorage.getItem('active_username');
      if (savedUser) {
        this.activeUsername = savedUser;
      }
      
      const role = localStorage.getItem('user_role');
      if (role === '2') {
        this.isAdmin = true;
      }

      const idUser = localStorage.getItem('user_id');
      if (idUser) {
        this.userId = parseInt(idUser);
      }
    }
    
    this.cargarCategorias();
    this.cargarPublicaciones();

    // Actualizar el muro automáticamente cada 5 segundos
    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.cargarPublicaciones();
      }, 5000);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  cargarPublicaciones() {
    this.publicacionService.getPublicaciones().subscribe({
      next: (data) => {
        this.publicaciones = data.map(pub => {
          return {
            ...pub,
            tiempoStr: pub.fecha_publicacion ? this.calcularTiempo(pub.fecha_publicacion.toString()) : ''
          };
        });
        this.cdr.detectChanges(); // Forzar la actualización de la vista de Angular
      },
      error: (err) => console.error('Error al cargar publicaciones', err)
    });
  }

  calcularTiempo(fechaStr: string): string {
    const fechaPub = new Date(fechaStr);
    const ahora = new Date();
    const diferenciaMs = ahora.getTime() - fechaPub.getTime();
    
    const minutos = Math.floor(diferenciaMs / 60000);
    if (minutos < 60) {
      return `hace ${minutos} min`;
    }
    
    const horas = Math.floor(minutos / 60);
    if (horas < 24) {
      return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    }
    
    const dias = Math.floor(horas / 24);
    return `hace ${dias} día${dias > 1 ? 's' : ''}`;
  }

  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => this.categorias = data,
      error: (err) => console.error('Error al cargar categorias', err)
    });
  }

  abrirAdminCategorias() {
    this.displayAdminCategorias = true;
    this.cargarCategorias();
  }

  nuevaCategoria() {
    this.categoriaActual = { nombre_categoria: '', descripcion: '', activo: true };
    this.editMode = false;
    this.dialogCategoria = true;
  }

  editarCategoria(cat: Categoria) {
    this.categoriaActual = { ...cat };
    this.editMode = true;
    this.dialogCategoria = true;
  }

  guardarCategoria() {
    if (this.editMode && this.categoriaActual.id_categoria) {
      this.categoriaService.updateCategoria(this.categoriaActual.id_categoria, this.categoriaActual).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Éxito', detail:'Categoría actualizada'});
          this.dialogCategoria = false;
          this.cargarCategorias();
        },
        error: () => this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo actualizar'})
      });
    } else {
      this.categoriaService.createCategoria(this.categoriaActual).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Éxito', detail:'Categoría creada'});
          this.dialogCategoria = false;
          this.cargarCategorias();
        },
        error: () => this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo crear'})
      });
    }
  }

  abrirEscribir() {
    this.displayEscribirDialog = true;
    this.editandoPublicacionId = null;
    this.visibilidadPublicacion = 'PUBLICO';
    this.tituloHistoria = '';
    this.contenidoHistoria = '';
    this.categoriaSeleccionadaId = null;
  }

  abrirEditarPublicacion(pub: any) {
    this.displayEscribirDialog = true;
    this.editandoPublicacionId = pub.id_publicacion;
    this.visibilidadPublicacion = pub.visibilidad;
    this.tituloHistoria = pub.titulo.replace(' (editado)', '');
    this.contenidoHistoria = pub.contenido;
    this.categoriaSeleccionadaId = pub.id_categoria;
  }

  eliminarPublicacion(id: number) {
    if (confirm('¿Estás seguro de eliminar esta publicación?')) {
      this.publicacionService.deletePublicacion(id).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Eliminada', detail:'La publicación fue eliminada.'});
          this.cargarPublicaciones();
        },
        error: () => {
          this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo eliminar la publicación.'});
        }
      });
    }
  }

  toggleAnonimo() {
    this.visibilidadPublicacion = this.visibilidadPublicacion === 'PUBLICO' ? 'ANONIMO' : 'PUBLICO';
  }

  seleccionarCategoria(id: number) {
    this.categoriaSeleccionadaId = id;
  }

  agregarEmoji(emoji: string) {
    this.contenidoHistoria += emoji;
  }

  publicarHistoria() {
    if (!this.tituloHistoria || !this.contenidoHistoria || !this.categoriaSeleccionadaId) {
      this.messageService.add({severity:'warn', summary:'Advertencia', detail:'Completa todos los campos (título, contenido, categoría).'});
      return;
    }

    if (!this.userId) {
      this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo obtener el ID de usuario. Vuelve a iniciar sesión.'});
      return;
    }

    const tituloFinal = this.editandoPublicacionId ? `${this.tituloHistoria} (editado)` : this.tituloHistoria;

    const datosPublicacion = {
      titulo: tituloFinal,
      contenido: this.contenidoHistoria,
      visibilidad: this.visibilidadPublicacion,
      activo: true,
      id_usuario: this.userId,
      id_categoria: this.categoriaSeleccionadaId
    };

    if (this.editandoPublicacionId) {
      this.publicacionService.updatePublicacion(this.editandoPublicacionId, datosPublicacion).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Éxito', detail:'Publicación actualizada.'});
          this.displayEscribirDialog = false;
          this.cargarPublicaciones();
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo actualizar la publicación.'});
        }
      });
    } else {
      this.publicacionService.createPublicacion(datosPublicacion).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Éxito', detail:'Publicación creada correctamente.'});
          this.displayEscribirDialog = false;
          this.cargarPublicaciones(); // Recargar el feed
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo crear la publicación.'});
        }
      });
    }
  }

  cerrarSesion() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_username');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
    }
    this.router.navigate(['/login']);
  }

  abrirChat(pub: any) {
    this.chatActivo = true;
    this.chatUsuario = pub;
  }

  cerrarChat() {
    this.chatActivo = false;
    this.chatUsuario = null;
  }
}
