import { Component, OnInit } from '@angular/core';
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
import { LucideAngularModule, Home as HomeIconLucide, Compass, Users, Bookmark, MessageSquare, Bell, Search, PenTool, ChevronDown, User, Settings, LogOut, Sun, Share2, MoreHorizontal, Image as ImageIcon, Tag, Smile, Lock, Heart } from 'lucide-angular';

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
    LucideAngularModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  displayEscribirDialog = false;
  tituloHistoria = '';
  contenidoHistoria = '';
  activeUsername = 'Usuario'; // Valor por defecto
  
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

  constructor(private router: Router) {}

  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedUser = localStorage.getItem('active_username');
      if (savedUser) {
        this.activeUsername = savedUser;
      }
    }
  }

  abrirEscribir() {
    this.displayEscribirDialog = true;
  }

  cerrarSesion() {
    // Aquí puedes llamar al AuthService.logout()
    this.router.navigate(['/login']);
  }
}
