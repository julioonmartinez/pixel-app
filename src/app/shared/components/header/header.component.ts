import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="logo">
        <div class="logo-icon">
          @for (i of pixelGrid; track $index) {
            <div class="pixel"></div>
          }
        </div>
        <h1>PixelForge</h1>
      </div>
      <nav>
        <ul>
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Inicio</a></li>
          <li><a routerLink="/gallery" routerLinkActive="active">Galería</a></li>
          <li><a routerLink="/editor" routerLinkActive="active">Editor</a></li>
          <li><a routerLink="/tutorials" routerLinkActive="active">Tutoriales</a></li>
        </ul>
      </nav>
    </header>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  // Array for pixel grid in logo
  pixelGrid = Array(16).fill(0);
}