import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-mobile-sidenav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div 
      class="sidenav-overlay"
      [class.active]="isOpen()"
      (click)="close()"
    ></div>
    
    <div class="sidenav" [class.open]="isOpen()">
      <div class="sidenav-header">
        <div class="logo">
          <div class="logo-icon">
            @for (i of pixelGrid; track $index) {
              <div class="pixel"></div>
            }
          </div>
          <h1>PixelForge</h1>
        </div>
        <button class="close-btn" (click)="close()">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span class="visually-hidden">Cerrar</span>
        </button>
      </div>
      
      <nav class="sidenav-nav">
        <ul>
          <li>
            <a routerLink="/" 
               routerLinkActive="active" 
               [routerLinkActiveOptions]="{exact: true}" 
               (click)="close()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Inicio</span>
            </a>
          </li>
          <li>
            <a routerLink="/gallery" 
               routerLinkActive="active"
               (click)="close()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span>Galería</span>
            </a>
          </li>
          <li>
            <a routerLink="/editor" 
               routerLinkActive="active"
               (click)="close()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                <line x1="3" y1="22" x2="21" y2="22"></line>
              </svg>
              <span>Editor</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
    
    @if(!isOpen){
        <button class="menu-toggle" (click)="toggle()">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
      <span class="visually-hidden">Menú</span>
    </button>
    }
  `,
  styleUrls: ['./mobile-sidenav.component.scss']
})
export class MobileSidenavComponent {
  @Input() isOpen = signal(false);
@Output() isOpenChange = new EventEmitter<boolean>();
  
  // Array for pixel grid in logo (same as header)
  pixelGrid = Array(16).fill(0);
  
  toggle() {
    this.isOpen.update(value => !value);
    this.isOpenChange.emit(this.isOpen());
    
    // Prevent scrolling when sidenav is open
    if (this.isOpen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  
  close() {
    this.isOpen.update(value => !value);
    document.body.style.overflow = '';
  }
}