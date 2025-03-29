// src/app/features/gallery/pixel-art-detail/pixel-art-detail.component.ts
import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-pixel-art-detail',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ImageUrlPipe],
  template: `
    <div class="pixel-art-detail">
      <div class="pixel-art-preview">
        <img [src]="pixelArt()?.imageUrl | imageUrl" [alt]="pixelArt()?.name" class="pixel-art-image" />
      </div>
      
      <div class="pixel-art-info">
        <h3 class="pixel-art-name">{{ pixelArt()?.name }}</h3>
        
        <div class="pixel-art-metadata">
          <div class="metadata-item">
            <span class="metadata-label">Creado:</span>
            <span class="metadata-value">{{ formatDate(pixelArt()?.createdAt) }}</span>
          </div>
          
          <div class="metadata-item">
            <span class="metadata-label">Tamaño:</span>
            <span class="metadata-value">{{ pixelArt()?.width }}x{{ pixelArt()?.height }} px</span>
          </div>
          
          <div class="metadata-item">
            <span class="metadata-label">Estilo:</span>
            <span class="metadata-value">{{ getStyleName(pixelArt()?.style) }}</span>
          </div>
          
          @if (pixelArt()?.tags && pixelArt()?.tags.length > 0) {
            <div class="metadata-item">
              <span class="metadata-label">Etiquetas:</span>
              <div class="tags-container">
                @for (tag of pixelArt()?.tags; track tag) {
                  <span class="tag">{{ tag }}</span>
                }
              </div>
            </div>
          }
        </div>
        
        <div class="pixel-art-actions">
          <app-button variant="primary" (onClick)="editPixelArt.emit(pixelArt()?.id)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Editar
          </app-button>
          
          <app-button variant="secondary" (onClick)="downloadPixelArt.emit(pixelArt()?.imageUrl)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Descargar
          </app-button>
          
          <app-button variant="secondary" (onClick)="sharePixelArt.emit(pixelArt()?.id)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            Compartir
          </app-button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./pixel-art-detail.component.scss']
})
export class PixelArtDetailComponent {
  @Input({ required: true }) pixelArt = signal<any | null>(null);
  
  @Output() editPixelArt = new EventEmitter<string>();
  @Output() downloadPixelArt = new EventEmitter<string>();
  @Output() sharePixelArt = new EventEmitter<string>();
  
  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }
  
  getStyleName(style: string | undefined): string {
    if (!style) return 'Estándar';
    
    switch (style) {
      case 'retro':
      case 'RETRO_8BIT':
        return 'Retro 8-bit';
      case 'modern':
      case 'MODERN_16BIT':
        return 'Moderno 16-bit';
      case 'minimalist':
      case 'MINIMALIST':
        return 'Minimalista';
      case 'dithered':
      case 'DITHERED':
        return 'Dithering';
      case 'isometric':
      case 'ISOMETRIC':
        return 'Isométrico';
      default:
        return 'Estándar';
    }
  }
}