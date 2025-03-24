// src/app/features/home/home.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { PixelArtService } from '../../core/services/pixel-art.service';
import { MockDataService } from '../../core/services/mock-data.service';
// import { NgOptimizedImage } from '@angular/common';
import { PixelateDirective } from '../../shared/directives/pixelate.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent, 


   
    PixelateDirective],
  template: `
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">Transforma Imágenes en Increíble Pixel Art</h1>
        <p class="hero-subtitle">
          Sube una imagen o describe lo que quieres crear con IA y convierte tu visión en hermoso pixel art. 
          Personaliza estilos, paletas de colores, fondos y mucho más.
        </p>
        <div class="hero-buttons">
          <app-button (onClick)="navigateTo('/editor', 'upload')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Subir Imagen
          </app-button>
          <app-button variant="secondary" (onClick)="navigateTo('/editor', 'prompt')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Crear con IA
          </app-button>
        </div>
      </div>
    </section>

    <section class="method-cards">
      <div class="method-card-container">
        <app-card [clickable]="true" (click)="navigateTo('/editor', 'upload')">
          <div class="method-card">
            <div class="method-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bb86fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <h3>Desde una Imagen</h3>
            <p>Sube una foto o imagen y transfórmala en auténtico pixel art con nuestra tecnología avanzada.</p>
            <div class="upload-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>Arrastra y suelta o haz clic para subir</span>
            </div>
          </div>
        </app-card>

        <app-card [clickable]="true" (click)="navigateTo('/editor', 'prompt')">
          <div class="method-card">
            <div class="method-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bb86fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <h3>Desde Texto</h3>
            <p>Describe lo que quieres generar y nuestra IA creará pixel art único basado en tu descripción.</p>
            <div class="prompt-example">
              <span>Por ejemplo: "Un dragón rojo volando sobre un castillo medieval al atardecer"</span>
            </div>
          </div>
        </app-card>
      </div>
    </section>

    <section class="gallery-preview">
      <h2>Explora Creaciones Recientes</h2>
      <div class="gallery-grid">
        @for (art of pixelArtExamples() ; track art.id) {
          <app-card [clickable]="true" (click)="navigateToArt(art.id)">
            <div class="gallery-item">
              <div class="gallery-image">
                <img [src]="art.thumbnailUrl" [alt]="art.name" appPixelate [pixelSize]="art.pixelSize" />
              </div>
              <div class="gallery-info">
                <h3>{{ art.name }}</h3>
                <p class="gallery-tags">
                  @for (tag of art.tags; track tag) {
                    <span class="tag">{{ tag }}</span>
                  }
                </p>
              </div>
            </div>
          </app-card>
        }
      </div>
      <div class="view-more">
        <app-button variant="secondary" (onClick)="navigateTo('/gallery')">
          Ver Más Creaciones
        </app-button>
      </div>
    </section>

    <section class="features">
      <h2>Características Especiales</h2>
      <div class="features-grid">
        <div class="feature">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0 1 12 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 0 0-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 0 1 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"></path>
              <circle cx="6.5" cy="11.5" r="1.5"></circle>
              <circle cx="9.5" cy="7.5" r="1.5"></circle>
              <circle cx="14.5" cy="7.5" r="1.5"></circle>
              <circle cx="17.5" cy="11.5" r="1.5"></circle>
            </svg>
          </div>
          <h3>Filtros Retro</h3>
          <p>Aplica filtros nostálgicos inspirados en consolas clásicas como GameBoy, NES, SNES y más.</p>
        </div>

        <div class="feature">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M17.66 7.93L12 2.27 6.34 7.93c-3.12 3.12-3.12 8.19 0 11.31C7.9 20.8 9.95 21.58 12 21.58c2.05 0 4.1-.78 5.66-2.34 3.12-3.12 3.12-8.19 0-11.31zM12 19.59c-1.6 0-3.11-.62-4.24-1.76C6.62 16.69 6 15.19 6 13.59s.62-3.11 1.76-4.24L12 5.1v14.49z"></path>
            </svg>
          </div>
          <h3>Paletas Personalizadas</h3>
          <p>Elige entre paletas clásicas predefinidas o crea la tuya propia para darle un toque único a tus creaciones.</p>
        </div>

        <div class="feature">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M15 4H5v16h14V8h-4V4zM3 2.992C3 2.444 3.447 2 3.999 2H16l5 5v13.993A1 1 0 0 1 20.007 22H3.993A1 1 0 0 1 3 21.008V2.992zM13 8V4.5L17.5 9H14a1 1 0 0 1-1-1z"></path>
            </svg>
          </div>
          <h3>Múltiples Formatos</h3>
          <p>Exporta tus creaciones en PNG, GIF animado o como sprites para tus propios proyectos de videojuegos.</p>
        </div>

        <div class="feature">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <h3>Fondos Creativos</h3>
          <p>Aplica fondos transparentes, sólidos, degradados o patrones para complementar tus obras de pixel art.</p>
        </div>
      </div>
    </section>

    <section class="cta">
      <div class="cta-content">
        <h2>¡Comienza a Crear!</h2>
        <p>Transforma tus imágenes en pixel art o genera creaciones únicas con IA ahora mismo.</p>
        <app-button (onClick)="navigateTo('/editor')">
          Ir al Editor
        </app-button>
      </div>
    </section>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  private router = inject(Router);
  private mockDataService = inject(MockDataService);
  
  pixelArtExamples = this.mockDataService.getPixelArtExamples();
  
  navigateTo(route: string, param?: string) {
    if (param) {
      this.router.navigate([route], { queryParams: { mode: param } });
    } else {
      this.router.navigate([route]);
    }
  }
  
  navigateToArt(id: string) {
    this.router.navigate(['/editor'], { queryParams: { art: id } });
  }
}