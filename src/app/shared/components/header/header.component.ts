import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MobileSidenavComponent } from '../mobile-sidenav/mobile-sidenav.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MobileSidenavComponent],
  template: `
    <app-mobile-sidenav 
  [isOpen]="sidenavOpen" 
  (isOpenChange)="sidenavOpen.set($event)">
</app-mobile-sidenav>
    
    <header class="header">
      <div class="logo">
        <div class="logo-icon">
          @for (i of pixelGrid; track $index) {
            <div class="pixel"></div>
          }
        </div>
        <h1>PixelForge</h1>
      </div>
      <nav class="desktop-nav">
        <ul>
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Inicio</a></li>
          <li><a routerLink="/gallery" routerLinkActive="active">Galería</a></li>
          <li><a routerLink="/editor" routerLinkActive="active">Editor</a></li>
        </ul>
      </nav>
      <button class="menu-toggle-header" (click)="toggleSidenav()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <span class="visually-hidden">Menú</span>
      </button>
    </header>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  // Array for pixel grid in logo
  pixelGrid = Array(16).fill(0);
  
  // Control sidenav visibility
  sidenavOpen = signal(false);
  
  toggleSidenav() {
    console.log('Current state:', this.sidenavOpen());
    this.sidenavOpen.update(value => !value);
  }

  
}