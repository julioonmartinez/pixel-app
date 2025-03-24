// src/app/features/editor/components/preview/preview.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixelArtService } from '../../../../core/services/pixel-art.service';
import { PixelateDirective } from '../../../../shared/directives/pixelate.directive';
import { BackgroundType, AnimationType } from '../../../../core/models/pixel-art.model';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, PixelateDirective],
  template: `
    <div class="preview-container">
      <h3 class="section-title">Vista Previa</h3>
      
      <div 
        class="preview-canvas"
        [class]="getBackgroundClass()"
        [ngClass]="getAnimationClass()"
      >
        @if (isProcessing()) {
          <div class="processing-indicator">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bb86fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
            <p>Procesando imagen...</p>
          </div>
        } @else if (resultImage()) {
          <img 
            [src]="resultImage()" 
            class="result-image"
            [ngClass]="'pixel-size-' + settings().pixelSize"
            appPixelate
            [pixelSize]="settings().pixelSize"
            [palette]="currentPalette()?.colors ||  []"
            [dithering]="settings().style === 'dithered'"
            alt="Pixel Art Result"
          />
        } @else {
          <div class="placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p>Sube una imagen o genera con IA para ver el resultado</p>
          </div>
        }
      </div>
      
      <div class="preview-info">
        <div class="info-item">
          <span class="info-label">Estilo:</span>
          <span class="info-value">{{ getStyleName() }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Tamaño de Pixel:</span>
          <span class="info-value">{{ settings().pixelSize }}px</span>
        </div>
        <div class="info-item">
          <span class="info-label">Paleta:</span>
          <span class="info-value">{{ currentPalette()?.name || 'Personalizada' }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent {
  private pixelArtService = inject(PixelArtService);
  
  settings = this.pixelArtService.getSettings();
  resultImage = this.pixelArtService.resultImage;
  isProcessing = this.pixelArtService.isProcessing;
  currentPalette = this.pixelArtService.currentPalette;
  
  getBackgroundClass(): string {
    switch (this.settings().backgroundType) {
      case BackgroundType.TRANSPARENT:
        return 'bg-transparent';
      case BackgroundType.SOLID:
        return 'bg-solid';
      case BackgroundType.GRADIENT:
        return 'bg-gradient';
      case BackgroundType.PATTERN:
        return 'bg-pattern';
      default:
        return 'bg-transparent';
    }
  }
  
  getAnimationClass(): string {
    switch (this.settings().animationType) {
      case AnimationType.BREATHING:
        return 'animation-breathing';
      case AnimationType.FLICKERING:
        return 'animation-flickering';
      case AnimationType.FLOATING:
        return 'animation-floating';
      default:
        return '';
    }
  }
  
  getStyleName(): string {
    switch (this.settings().style) {
      case 'retro':
        return 'Retro 8-bit';
      case 'modern':
        return 'Moderno 16-bit';
      case 'minimalist':
        return 'Minimalista';
      case 'dithered':
        return 'Con Dithering';
      case 'isometric':
        return 'Isométrico';
      default:
        return 'Estándar';
    }
  }
}