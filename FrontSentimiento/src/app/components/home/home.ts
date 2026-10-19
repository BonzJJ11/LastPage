import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { BadgeModule } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { LucideAngularModule, Home as HomeIconLucide, Compass, Users, Bookmark, MessageSquare, Bell, Search, PenTool, ChevronDown, User, Settings, LogOut, Sun, Share2, MoreHorizontal, Image as ImageIcon, Tag, Smile, Lock, Heart, ShieldAlert, Globe, Trash, X, Send, MessageCircle, Menu as LucideMenu } from 'lucide-angular';
import { CategoriaService, Categoria } from '../../core/servicios/categoria.service';
import { PublicacionService } from '../../core/servicios/publicacion.service';
import { ComentarioService } from '../../core/services/comentario.service';
import { ReaccionService } from '../../core/services/reaccion.service';
import { GuardadoService } from '../../core/services/guardado.service';
import { ChatService } from '../../core/services/chat.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { AuthService } from '../../core/servicios/auth.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DialogModule,
    TextareaModule,
    BadgeModule,
    PopoverModule,
    TableModule,
    ToastModule,
    DrawerModule,
    TooltipModule,
    LucideAngularModule
  ],
  providers: [MessageService],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  
  displayEscribirDialog = false;
  tituloHistoria = '';
  contenidoHistoria = '';
  activeUsername = 'JJ'; 
  currentUserPhoto = '';
  
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
  readonly MenuIcon = LucideMenu;

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
  currentTab = 'home'; // 'home', 'guardados', 'solicitudes', 'notificaciones'
  menuVisible = false;

  // Variables para Guardados
  publicacionesGuardadas: any[] = [];
  guardadosNoVistosIds = new Set<number>();

  // Variables para Notificaciones
  notificaciones: any[] = [];
  notificacionesNoLeidas = 0;

  // Variables para Conversaciones
  conversaciones: any[] = [];
  mensajes: any[] = [];
  conversacionActiva: any = null;
  nuevoMensaje = '';

  // Usuarios de la comunidad
  usuariosComunidad: any[] = [];

  constructor(
    private router: Router, 
    private categoriaService: CategoriaService,
    private publicacionService: PublicacionService,
    private comentarioService: ComentarioService,
    private reaccionService: ReaccionService,
    private guardadoService: GuardadoService,
    private chatService: ChatService,
    private notificacionService: NotificacionService,
    private authService: AuthService,
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

      const photo = localStorage.getItem('user_photo');
      this.currentUserPhoto = photo || '';

      const idUser = localStorage.getItem('user_id');
      if (idUser && !isNaN(parseInt(idUser))) {
        this.userId = parseInt(idUser);
        this.cargarGuardadosNoVistos();
        this.authService.getUsuario(this.userId).subscribe({
          next: (user) => {
            if (user) {
              this.currentUserPhoto = user.foto_perfil || '';
              if (user.foto_perfil) {
                localStorage.setItem('user_photo', user.foto_perfil);
              } else {
                localStorage.removeItem('user_photo');
              }
              if (user.username) {
                this.activeUsername = user.username;
                localStorage.setItem('active_username', user.username);
              }
              if (user.nombre) {
                localStorage.setItem('active_nombre', user.nombre);
              } else {
                localStorage.removeItem('active_nombre');
              }
              this.cdr.detectChanges();
            }
          },
          error: () => {}
        });
      } else if (this.activeUsername) {
        this.authService.getUsuarios().subscribe({
          next: (usuarios) => {
            const found = usuarios.find((u: any) => u.username?.toLowerCase() === this.activeUsername.toLowerCase());
            if (found && found.id_usuario) {
              this.userId = found.id_usuario;
              localStorage.setItem('user_id', String(found.id_usuario));
              this.currentUserPhoto = found.foto_perfil || '';
              if (found.foto_perfil) {
                localStorage.setItem('user_photo', found.foto_perfil);
              } else {
                localStorage.removeItem('user_photo');
              }
              if (found.nombre) {
                localStorage.setItem('active_nombre', found.nombre);
              } else {
                localStorage.removeItem('active_nombre');
              }
              this.cargarGuardadosNoVistos();
              this.cdr.detectChanges();
            }
          },
          error: () => {}
        });
      }
    }
    
    this.cargarCategorias();
    this.cargarUsuariosComunidad();
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
    this.cargarUsuariosComunidad();
    if (this.currentTab === 'home') this.cargarPublicaciones();
    if (this.currentTab === 'guardados') this.cargarGuardados();
    if (this.currentTab === 'solicitudes' && !this.chatActivo) this.cargarConversaciones();
    if (this.currentTab === 'solicitudes' && this.chatActivo && this.conversacionActiva) this.cargarMensajes(this.conversacionActiva.id_conversacion);
    
    if (this.userId) {
      this.cargarNotificaciones();
    }
  }

  get conversacionesPendientes() {
    return this.conversaciones.filter(c => c.estado === 'PENDIENTE');
  }

  get conversacionesAceptadas() {
    return this.conversaciones.filter(c => c.estado === 'ACEPTADA');
  }

  cambiarTab(tab: string) {
    this.currentTab = tab;
    this.chatActivo = false;
    this.conversacionActiva = null;
    this.cerrarMenuMovil();
    if (tab === 'guardados') {
      this.limpiarGuardadosNoVistos();
    }
    this.cargarDatosGenerales();
  }

  toggleMenu() {
    this.menuVisible = !this.menuVisible;
  }

  cerrarMenuMovil() {
    this.menuVisible = false;
  }

  get guardadosNoVistos(): number {
    return this.guardadosNoVistosIds.size;
  }

  private get guardadosStorageKey(): string {
    return `guardados_no_vistos_${this.userId ?? 'anon'}`;
  }

  cargarGuardadosNoVistos() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(this.guardadosStorageKey);
      const ids = raw ? JSON.parse(raw) : [];
      this.guardadosNoVistosIds = new Set(ids.map((id: any) => Number(id)).filter(Boolean));
    } catch {
      this.guardadosNoVistosIds.clear();
    }
  }

  guardarGuardadosNoVistos() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(this.guardadosStorageKey, JSON.stringify([...this.guardadosNoVistosIds]));
  }

  agregarGuardadoNoVisto(idPublicacion: number) {
    if (this.currentTab === 'guardados') return;
    this.guardadosNoVistosIds.add(idPublicacion);
    this.guardarGuardadosNoVistos();
  }

  quitarGuardadoNoVisto(idPublicacion: number) {
    this.guardadosNoVistosIds.delete(idPublicacion);
    this.guardarGuardadosNoVistos();
  }

  limpiarGuardadosNoVistos() {
    this.guardadosNoVistosIds.clear();
    this.guardarGuardadosNoVistos();
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
        this.cdr.detectChanges();
      }
    });
  }

  manejarClickNotificacion(notif: any, opNotif: any | null = null) {
    this.marcarNotificacionLeida(notif);
    
    if (opNotif) {
      opNotif.hide();
    }
    this.menuVisible = false; // cerrar el menú principal si está abierto

    const titulo = notif.titulo.toLowerCase();
    
    // Si es un comentario o reacción, buscar la publicación
    if (titulo.includes('comentario') || titulo.includes('reacción')) {
      this.cambiarTab('home');
      
      // Parsear el título de la publicación del mensaje. 
      // Formato: "Han comentado en tu publicación: {titulo}" o "Alguien reaccionó a tu publicación: {titulo}"
      const parts = notif.mensaje.split(': ');
      if (parts.length > 1) {
        const tituloPub = parts.slice(1).join(': ').trim();
        // Buscar la publicación en el array
        const pub = this.publicaciones.find(p => p.titulo === tituloPub);
        
        if (pub) {
          // Si es comentario, abrir la sección de comentarios
          if (titulo.includes('comentario')) {
            pub.mostrarComentarios = true;
            this.cargarComentarios(pub);
          }
          
          // Scroll hacia la publicación
          setTimeout(() => {
            const el = document.getElementById('pub-' + pub.id_publicacion);
            if (el) {
              // Ajustamos la posición para que no quede tapada por el navbar fijo
              const y = el.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top: y, behavior: 'smooth' });
              
              // Añadir un efecto visual temporal para destacar
              const originalShadow = el.style.boxShadow;
              const originalBorder = el.style.borderColor;
              
              el.style.transition = 'all 0.5s ease';
              el.style.borderColor = '#b85c38';
              el.style.boxShadow = '0 0 15px rgba(184, 92, 56, 0.4)';
              
              setTimeout(() => {
                el.style.borderColor = originalBorder;
                el.style.boxShadow = originalShadow;
              }, 2500);
            }
          }, 300);
        }
      }
    } 
    // Si es una solicitud de mensaje o un mensaje nuevo
    else if (titulo.includes('solicitud') || titulo.includes('mensaje')) {
      this.cambiarTab('solicitudes');
      
      // Intentar interactuar automáticamente con la conversación
      setTimeout(() => {
        // Si es una solicitud de alguien más hacia nosotros
        if (titulo.includes('solicitud') && titulo.includes('nueva')) {
          const index = this.conversacionesPendientes.findIndex(c => !c.soy_inicio);
          if (index !== -1) {
            const cards = document.querySelectorAll('.conversacion-list .post-card');
            if (cards.length > index) {
              const el = cards[index] as HTMLElement;
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              const originalBg = el.style.backgroundColor;
              el.style.transition = 'all 0.5s ease';
              el.style.backgroundColor = '#e3f2fd';
              
              setTimeout(() => {
                el.style.backgroundColor = originalBg || '#fff';
              }, 2000);
            }
          }
        } 
        // Si es un mensaje nuevo o una solicitud que ya aceptamos, abrir el chat
        else if (titulo.includes('mensaje') || titulo.includes('aceptada')) {
          const convActiva = this.conversacionesAceptadas.length > 0 ? this.conversacionesAceptadas[0] : null;
          if (convActiva) {
            this.abrirChat(convActiva);
          }
        }
      }, 300);
    }
    // Por defecto, ir a la pestaña de notificaciones
    else {
      this.cambiarTab('notificaciones');
    }
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

  quitarGuardado(idGuardado: number, idPublicacion?: number) {
    this.guardadoService.quitarGuardado(idGuardado).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Eliminado', detail:'Publicación quitada de guardados.'});
        if (idPublicacion) {
          this.quitarGuardadoNoVisto(idPublicacion);
          this.publicaciones = this.publicaciones.map(pub => pub.id_publicacion === idPublicacion ? { ...pub, mi_guardado: false, id_guardado: null } : pub);
          this.publicacionesGuardadas = this.publicacionesGuardadas.filter(pub => pub.id_publicacion !== idPublicacion);
        }
        this.cargarGuardados();
        if (this.currentTab === 'home') {
          this.cargarPublicaciones();
        }
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

  cargarUsuariosComunidad() {
    this.authService.getUsuarios().subscribe({
      next: (data) => {
        // Filtrar al usuario actual y solo activos
        this.usuariosComunidad = data.filter(u => u.id_usuario !== this.userId && u.activo !== false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar usuarios de comunidad', err);
      }
    });
  }

  chatearConUsuario(usuario: any) {
    this.abrirChat({
      id_usuario: usuario.id_usuario,
      nombre_usuario: usuario.nombre || usuario.username
    });
  }

  abrirChat(obj: any) {
    // Si viene desde "Mensaje" en una publicación o comentario (no tiene id_conversacion)
    if (!obj.id_conversacion) {
      if (!this.userId) return;
      
      const targetUserId = obj.id_usuario;
      
      // 1. Buscar si ya existe una conversación con este usuario
      const chatExistente = this.conversaciones.find(c => 
        (c.id_usuario_inicio === this.userId && c.id_usuario_destino === targetUserId) ||
        (c.id_usuario_inicio === targetUserId && c.id_usuario_destino === this.userId)
      );

      if (chatExistente) {
        if (chatExistente.estado === 'ACEPTADA') {
          // Ya hay chat activo, simplemente lo abrimos
          this.chatActivo = true;
          this.conversacionActiva = chatExistente;
          this.cargarMensajes(chatExistente.id_conversacion);
        } else if (chatExistente.estado === 'PENDIENTE') {
          if (chatExistente.soy_inicio) {
            this.messageService.add({severity:'info', summary:'Aviso', detail:'Ya enviaste una solicitud a este usuario. Espera a que acepte.'});
          } else {
            this.messageService.add({severity:'info', summary:'Aviso', detail:'Este usuario ya te envió una solicitud. Revisa tus solicitudes.'});
            this.cambiarTab('solicitudes');
          }
        }
        return; // Detener ejecución para no crear duplicado
      }

      // 2. Si no existe ninguna, crear la solicitud
      const data = {
        id_usuario_inicio: this.userId,
        id_usuario_destino: targetUserId,
        id_publicacion: obj.id_publicacion || null
      };
      
      this.chatService.iniciarConversacion(data).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Enviada', detail:'Solicitud enviada exitosamente'});
          this.cargarConversaciones(); // Recargar para que aparezca en caso de que vayan a solicitudes
        }
      });
      return;
    }
    
    // Si es una conversacion existente de la lista
    this.chatActivo = true;
    this.conversacionActiva = obj;
    this.cargarMensajes(obj.id_conversacion);
  }

  scrollToBottomChat() {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 150);
  }

  cargarMensajes(idConversacion: number) {
    this.chatService.getMensajesPorConversacion(idConversacion).subscribe({
      next: (data) => {
        this.mensajes = data;
        this.cdr.detectChanges();
        this.scrollToBottomChat();
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
          this.tituloHistoria = '';
          this.contenidoHistoria = '';
          this.categoriaSeleccionadaId = null;
          this.editandoPublicacionId = null;
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
          this.tituloHistoria = '';
          this.contenidoHistoria = '';
          this.categoriaSeleccionadaId = null;
          this.editandoPublicacionId = null;
          this.cargarPublicaciones(); // Recargar el feed
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo crear la publicación.'});
        }
      });
    }
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

  toggleGuardarPublicacion(pub: any) {
    if (pub.mi_guardado && pub.id_guardado) {
      this.quitarGuardado(pub.id_guardado, pub.id_publicacion);
      return;
    }

    if (!this.userId) return;
    this.guardadoService.guardarPublicacion({
      id_usuario: this.userId,
      id_publicacion: pub.id_publicacion
    }).subscribe({
      next: (guardado) => {
        pub.mi_guardado = true;
        pub.id_guardado = guardado?.id_guardado ?? pub.id_guardado;
        this.agregarGuardadoNoVisto(pub.id_publicacion);
        this.messageService.add({severity:'success', summary:'Guardado', detail:'Publicación guardada.'});
        this.cargarGuardados();
      },
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
      foto_perfil: visibilidad === 'ANONIMO' ? null : this.currentUserPhoto,
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

  irAPerfil() {
    this.router.navigate(['/profile']).catch(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/profile';
      }
    });
  }

  irAPerfilTab(tab: string) {
    this.router.navigate(['/profile'], { queryParams: { tab } }).catch(() => {
      if (typeof window !== 'undefined') {
        window.location.href = `/profile?tab=${tab}`;
      }
    });
  }

  cerrarSesion() {
    this.authService.logout();
    this.currentUserPhoto = '';
    this.activeUsername = '';
    this.userId = null;
    this.router.navigate(['/login']);
  }
}
