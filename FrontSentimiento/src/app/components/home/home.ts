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
import { ComentarioService } from '../../core/services/comentario.service';
import { ReaccionService } from '../../core/services/reaccion.service';
import { GuardadoService } from '../../core/services/guardado.service';
import { ChatService } from '../../core/services/chat.service';
import { NotificacionService } from '../../core/services/notificacion.service';


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

  // Manejo de Interacciones en UI
  publicacionSeleccionada: any = null;
  nuevoComentario = '';
  visibilidadComentario = 'PUBLICO';
  
  private refreshInterval: any;

  // Variables para vistas internas (tabs)
  currentTab = 'home'; // 'home', 'guardados', 'mensajes', 'notificaciones'

  // Variables para Guardados
  publicacionesGuardadas: any[] = [];

  // Variables para Notificaciones
  notificaciones: any[] = [];
  notificacionesNoLeidas = 0;

  // Variables para Conversaciones
  conversaciones: any[] = [];
  mensajes: any[] = [];
  conversacionActiva: any = null;
  nuevoMensaje = '';

  constructor(
    private router: Router, 
    private categoriaService: CategoriaService,
    private publicacionService: PublicacionService,
    private comentarioService: ComentarioService,
    private reaccionService: ReaccionService,
    private guardadoService: GuardadoService,
    private chatService: ChatService,
    private notificacionService: NotificacionService,
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
    this.cargarDatosGenerales();

    // Actualizar datos automáticamente cada 5 segundos
    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.cargarDatosGenerales();
      }, 5000);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  cargarDatosGenerales() {
    if (this.currentTab === 'home') this.cargarPublicaciones();
    if (this.currentTab === 'guardados') this.cargarGuardados();
    if (this.currentTab === 'mensajes' && !this.chatActivo) this.cargarConversaciones();
    if (this.currentTab === 'mensajes' && this.chatActivo && this.conversacionActiva) this.cargarMensajes(this.conversacionActiva.id_conversacion);
    
    if (this.userId) {
      this.cargarNotificaciones();
    }
  }

  cambiarTab(tab: string) {
    this.currentTab = tab;
    this.chatActivo = false;
    this.conversacionActiva = null;
    this.cargarDatosGenerales();
  }

  cargarNotificaciones() {
    if (!this.userId) return;
    this.notificacionService.getNotificacionesPorUsuario(this.userId).subscribe({
      next: (data) => {
        this.notificaciones = data;
        this.notificacionesNoLeidas = data.filter(n => !n.leida).length;
        this.cdr.detectChanges();
      }
    });
  }

  marcarNotificacionLeida(notif: any) {
    if (notif.leida) return;
    this.notificacionService.marcarComoLeida(notif.id_notificacion).subscribe({
      next: () => {
        notif.leida = true;
        this.notificacionesNoLeidas--;
      }
    });
  }

  cargarGuardados() {
    if (!this.userId) return;
    this.guardadoService.getGuardadosPorUsuario(this.userId).subscribe({
      next: (data) => {
        this.publicacionesGuardadas = data.map(g => {
          return {
            ...g.publicacion, // Extraemos la publicación
            id_guardado: g.id_guardado,
            tiempoStr: g.publicacion.fecha_publicacion ? this.calcularTiempo(g.publicacion.fecha_publicacion.toString()) : ''
          };
        });
        this.cdr.detectChanges();
      }
    });
  }

  quitarGuardado(idGuardado: number) {
    this.guardadoService.quitarGuardado(idGuardado).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Eliminado', detail:'Publicación quitada de guardados.'});
        this.cargarGuardados();
      }
    });
  }

  cargarConversaciones() {
    if (!this.userId) return;
    this.chatService.getConversacionesPorUsuario(this.userId).subscribe({
      next: (data) => {
        this.conversaciones = data.map(conv => {
          // Determinar qué nombre y foto mostrar (yo soy inicio o destino)
          const soyInicio = conv.id_usuario_inicio === this.userId;
          return {
            ...conv,
            nombre_mostrar: soyInicio ? conv.nombre_destino : conv.nombre_inicio,
            foto_mostrar: soyInicio ? conv.foto_destino : conv.foto_inicio,
            soy_inicio: soyInicio
          };
        });
        
        // Si hay una conversacion activa, actualizar su referencia para reflejar el estado
        if (this.conversacionActiva) {
          const updated = this.conversaciones.find(c => c.id_conversacion === this.conversacionActiva.id_conversacion);
          if (updated) {
            this.conversacionActiva = updated;
          }
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  aceptarConversacion(conv: any) {
    this.chatService.actualizarConversacion(conv.id_conversacion, { estado: 'ACEPTADA' }).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Aceptada', detail:'Conversación aceptada.'});
        this.cargarConversaciones();
      }
    });
  }

  rechazarConversacion(conv: any) {
    this.chatService.actualizarConversacion(conv.id_conversacion, { estado: 'RECHAZADA' }).subscribe({
      next: () => {
        this.messageService.add({severity:'warn', summary:'Rechazada', detail:'Conversación rechazada.'});
        this.cargarConversaciones();
      }
    });
  }

  abrirChat(conv: any) {
    // Si viene desde "Mensaje" en una publicación, se simula o crea
    if (!conv.id_conversacion) {
      if (!this.userId) return;
      const data = {
        id_usuario_inicio: this.userId,
        id_usuario_destino: conv.id_usuario,
        id_publicacion: conv.id_publicacion
      };
      this.chatService.iniciarConversacion(data).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Enviada', detail:'Solicitud enviada'});
        }
      });
      return;
    }
    
    this.chatActivo = true;
    this.conversacionActiva = conv;
    this.cargarMensajes(conv.id_conversacion);
  }

  cargarMensajes(idConversacion: number) {
    this.chatService.getMensajesPorConversacion(idConversacion).subscribe({
      next: (data) => {
        this.mensajes = data;
        this.cdr.detectChanges();
      }
    });
  }

  enviarMensaje() {
    if (!this.userId || !this.conversacionActiva || !this.nuevoMensaje) return;
    
    this.chatService.enviarMensaje({
      contenido: this.nuevoMensaje,
      id_conversacion: this.conversacionActiva.id_conversacion,
      id_usuario: this.userId
    }).subscribe({
      next: () => {
        this.nuevoMensaje = '';
        this.cargarMensajes(this.conversacionActiva.id_conversacion);
      }
    });
  }

  cargarPublicaciones() {
    this.publicacionService.getPublicaciones(this.userId ?? undefined).subscribe({
      next: (data) => {
        this.publicaciones = data.map(pub => {
          // Mantener comentarios locales si la publicacion ya estaba abierta
          const pubExistente = this.publicaciones.find(p => p.id_publicacion === pub.id_publicacion);
          
          return {
            ...pub,
            tiempoStr: pub.fecha_publicacion ? this.calcularTiempo(pub.fecha_publicacion.toString()) : '',
            mostrarComentarios: pubExistente ? pubExistente.mostrarComentarios : false,
            comentariosList: pubExistente ? pubExistente.comentariosList : [],
            nuevoComentario: pubExistente ? pubExistente.nuevoComentario : '',
            visibilidadComentario: pubExistente && pubExistente.visibilidadComentario ? pubExistente.visibilidadComentario : 'PUBLICO'
          };
        });
        this.cdr.detectChanges();
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
      next: (data) => {
        this.categorias = data;
        this.cdr.detectChanges();
      },
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

  // (abrirChat removido por duplicidad)
  cerrarChat() {
    this.chatActivo = false;
    this.conversacionActiva = null;
  }

  // ---- NUEVAS FUNCIONES ----

  reaccionar(pub: any, tipo: string) {
    if (!this.userId) return;
    // Si el usuario ya tiene esta misma reacción activa, la quitamos
    if (pub.mi_reaccion === tipo) {
      this.reaccionService.quitarReaccion(this.userId, pub.id_publicacion).subscribe({
        next: () => {
          pub.mi_reaccion = null;
          this.cargarPublicaciones();
        }
      });
      return;
    }
    this.reaccionService.reaccionar({
      id_usuario: this.userId,
      id_publicacion: pub.id_publicacion,
      tipo_reaccion: tipo
    }).subscribe({
      next: () => {
        pub.mi_reaccion = tipo;
        this.cargarPublicaciones();
      }
    });
  }

  guardarPublicacion(pub: any) {
    if (!this.userId) return;
    this.guardadoService.guardarPublicacion({
      id_usuario: this.userId,
      id_publicacion: pub.id_publicacion
    }).subscribe({
      next: () => this.messageService.add({severity:'success', summary:'Guardado', detail:'Publicación guardada.'}),
      error: () => this.messageService.add({severity:'warn', summary:'Aviso', detail:'Ya tienes esta publicación guardada o hubo un error.'})
    });
  }

  // ── trackBy para ngFor: evita que Angular destruya el DOM al refrescar ──
  trackByPubId(_index: number, pub: any): number {
    return pub.id_publicacion;
  }

  trackByComId(_index: number, com: any): number {
    return com.id_comentario ?? Math.random();
  }

  toggleComentarios(pub: any) {
    pub.mostrarComentarios = !pub.mostrarComentarios;
    if (pub.mostrarComentarios) {
      this.cargarComentarios(pub);
    }
  }

  cargarComentarios(pub: any) {
    this.comentarioService.getComentariosPorPublicacion(pub.id_publicacion).subscribe({
      next: (data) => {
        pub.comentariosList = data;
        this.cdr.detectChanges();
      }
    });
  }

  enviarComentario(pub: any) {
    if (!this.userId || !pub.nuevoComentario?.trim()) return;

    const contenido = pub.nuevoComentario.trim();
    const visibilidad = pub.visibilidadComentario || 'PUBLICO';

    // ── Optimistic update: mostrar el comentario inmediatamente ──
    const comentarioTemporal = {
      contenido,
      visibilidad,
      nombre_usuario: visibilidad === 'ANONIMO' ? 'Anónimo' : this.activeUsername,
      _enviando: true  // marca para saber que está en vuelo
    };
    if (!pub.comentariosList) pub.comentariosList = [];
    pub.comentariosList = [...pub.comentariosList, comentarioTemporal];
    pub.nuevoComentario = '';
    pub.visibilidadComentario = 'PUBLICO';
    this.cdr.detectChanges();

    this.comentarioService.crearComentario({
      contenido,
      visibilidad,
      id_usuario: this.userId,
      id_publicacion: pub.id_publicacion
    }).subscribe({
      next: () => {
        // Reemplazar el comentario temporal con los datos reales del servidor
        this.cargarComentarios(pub);
      },
      error: () => {
        // Revertir si falla
        pub.comentariosList = pub.comentariosList.filter((c: any) => !c._enviando);
        pub.nuevoComentario = contenido;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el comentario.' });
        this.cdr.detectChanges();
      }
    });
  }
}
