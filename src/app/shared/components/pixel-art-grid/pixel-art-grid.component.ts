// src/app/shared/components/pixel-art-grid/pixel-art-grid.component.ts
import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';

export type PixelArtGridMode = 'grid' | 'list';

@Component({
  selector: 'app-pixel-art-grid',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ImageUrlPipe
  ],
  template: `
    <div class="pixel-art-grid-container">
      <div class="view-mode-toggle">
        <button 
          class="view-mode-btn"
          [class.active]="viewMode() === 'grid'"
          (click)="setViewMode('grid')"
          aria-label="Ver en cuadrícula"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </button>
        <button 
          class="view-mode-btn"
          [class.active]="viewMode() === 'list'"
          (click)="setViewMode('list')"
          aria-label="Ver en lista"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      @if (isLoading) {
        <div class="processing-indicator">
          <div class="spinner"></div>
          <p>Cargando imágenes...</p>
          <p class="processing-hint">Esto puede tardar unos milisegundos.</p>
        </div>
      } @else if (artworks.length === 0) {
        <div class="no-results">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <p>No hay diseños de pixel art para mostrar</p>
        </div>
      } @else {
        <div 
          class="pixel-art-container" 
          [class.grid-view]="viewMode() === 'grid'"
          [class.list-view]="viewMode() === 'list'"
        >
          @for (art of artworks; track art.id) {
            @if (viewMode() === 'grid') {
              <app-card [clickable]="true" (click)="onArtworkSelect(art)">
                <div class="artwork-grid-item">
                  <div class="artwork-image" [ngClass]="getAnimationClass(art)">
                    <img 
                      [src]="art.thumbnailUrl | imageUrl" 
                      [alt]="art.name || 'Pixel Art'"
                      class="image-loading"
                      (load)="onImageLoad($event)"
                    />
                  </div>
                  <div class="artwork-info">
                    <h3 class="artwork-title">{{ art.name || 'Sin título' }}</h3>
                    
                    <div class="artwork-meta">
                      <span class="creation-date">{{ formatDate(art.createdAt) }}</span>
                      <span class="style-badge" [ngClass]="'style-' + art.style">
                        {{ getStyleName(art.style) }}
                      </span>
                    </div>
                    
                    @if (art.tags && art.tags.length > 0) {
                      <div class="artwork-tags">
                        @for (tag of art.tags.slice(0, 3); track tag) {
                          <span class="tag">{{ tag }}</span>
                        }
                        @if (art.tags.length > 3) {
                          <span class="tag tag-more">+{{ art.tags.length - 3 }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              </app-card>
            } @else {
              <app-card [clickable]="true" (click)="onArtworkSelect(art)">
                <div class="artwork-list-item">
                  <div class="artwork-list-image" [ngClass]="getAnimationClass(art)">
                    <img 
                      [src]="art.thumbnailUrl | imageUrl" 
                      [alt]="art.name || 'Pixel Art'"
                      class="image-loading"
                      (load)="onImageLoad($event)"
                    />
                  </div>
                  <div class="artwork-list-info">
                    <h3 class="artwork-title">{{ art.name || 'Sin título' }}</h3>
                    
                    <div class="artwork-details">
                      <div class="artwork-meta">
                        <span class="creation-date">{{ formatDate(art.createdAt) }}</span>
                        <span class="style-badge" [ngClass]="'style-' + art.style">
                          {{ getStyleName(art.style) }}
                        </span>
                      </div>
                      
                      @if (art.tags && art.tags.length > 0) {
                        <div class="artwork-tags">
                          @for (tag of art.tags.slice(0, 3); track tag) {
                            <span class="tag">{{ tag }}</span>
                          }
                          @if (art.tags.length > 3) {
                            <span class="tag tag-more">+{{ art.tags.length - 3 }}</span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </app-card>
            }
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./pixel-art-grid.component.scss']
})
export class PixelArtGridComponent {
  @Input() artworks: any[] = [];
  @Input() isLoading = false;
  @Input() defaultMode: PixelArtGridMode = 'grid';
  
  @Output() artworkSelect = new EventEmitter<any>();

  readonly viewMode = signal<PixelArtGridMode>('grid');

  constructor() {}

  ngOnInit() {
    this.viewMode.set(this.defaultMode);
  }

  setViewMode(mode: PixelArtGridMode): void {
    this.viewMode.set(mode);
  }

  onArtworkSelect(artwork: any): void {
    this.artworkSelect.emit(artwork);
  }

  getAnimationClass(art: any): string {
    if (art.isAnimated) {
      switch (art.animationType) {
        case 'breathing':
          return 'animation-breathing';
        case 'flickering':
          return 'animation-flickering';
        case 'floating':
          return 'animation-floating';
        default:
          return '';
      }
    }
    return '';
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.classList.add('loaded');
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Fecha desconocida';
    
    try {
      const dateObj = new Date(date);
      
      // En dispositivos móviles, usar formato más compacto
      if (window.innerWidth <= 576) {
        return dateObj.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short'
        });
      }
      
      // En otros dispositivos, formato normal
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return 'Fecha inválida';
    }
  }

  getStyleName(style: string): string {
    switch (style) {
      case 'retro':
        return 'Retro 8-bit';
      case 'modern':
        return 'Moderno 16-bit';
      case 'minimalist':
        return 'Minimalista';
      case 'dithered':
        return 'Dithering';
      case 'isometric':
        return 'Isométrico';
      default:
        return 'Estándar';
    }
  }
}