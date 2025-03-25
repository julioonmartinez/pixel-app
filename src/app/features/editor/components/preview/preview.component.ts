// src/app/features/editor/components/preview/preview.component.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixelArtService } from '../../../../core/services/pixel-art.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preview-container">
      <h3 class="section-title">Vista Previa</h3>
      
      @if (isProcessing()) {
        <div class="processing-indicator">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bb86fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <p>Procesando imagen...</p>
          <p class="processing-hint">
            Aplicando pixelación con los ajustes seleccionados
          </p>
        </div>
      } @else if (resultImage()) {
        <div 
          class="preview-canvas"
          [class.bg-transparent]="backgroundType() === 'transparent'"
          [class.bg-solid]="backgroundType() === 'solid'"
          [class.bg-gradient]="backgroundType() === 'gradient'"
          [class.bg-pattern]="backgroundType() === 'pattern'"
        >
          <img 
            [src]="resultImage()" 
            [alt]="'Pixel Art Preview'" 
            class="result-image"
            [class.pixel-size-8]="pixelSize() === 8"
            [class.pixel-size-4]="pixelSize() === 4"
            [class.pixel-size-2]="pixelSize() === 2"
            [class.animation-breathing]="animationType() === 'breathing'"
            [class.animation-flickering]="animationType() === 'flickering'"
            [class.animation-floating]="animationType() === 'floating'"
          />
        </div>
        
        <div class="preview-info">
          <div class="info-item">
            <span class="info-label">Estilo:</span>
            <span class="info-value">{{ styleName() }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Tamaño:</span>
            <span class="info-value">{{ pixelSize() }}px</span>
          </div>
          <div class="info-item">
            <span class="info-label">Paleta:</span>
            <span class="info-value">{{ paletteName() }}</span>
          </div>
        </div>
      } @else if (sourceImage()) {
        <div class="preview-canvas bg-transparent">
          <img [src]="sourceImage()" alt="Original Image" class="result-image" />
          <div class="overlay-hint">
            <p>Configura los ajustes y haz clic en "Pixelar Imagen"</p>
          </div>
        </div>
      } @else {
        <div class="placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6c7293" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <p>Sube una imagen o crea pixel art a partir de una descripción</p>
        </div>
      }
      
      @if (errorMessage()) {
        <div class="error-message">
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
   styleUrls: ['./preview.component.scss']
})
export class PreviewComponent {
  private pixelArtService = inject(PixelArtService);
  
  // Accedemos directamente a los signals del servicio
  sourceImage = this.pixelArtService.sourceImage;
  resultImage = this.pixelArtService.resultImage;
  isProcessing = this.pixelArtService.isProcessing;
  errorMessage = this.pixelArtService.error;
  
  // Obtenemos settings del servicio
  settings = this.pixelArtService.getSettings();
  
  // Valores computed para mostrar en la interfaz
  pixelSize = computed(() => this.settings().pixelSize);
  backgroundType = computed(() => this.settings().backgroundType);
  animationType = computed(() => this.settings().animationType);
  
  // Nombres legibles para la interfaz
  styleName = computed(() => {
    const styleMap: Record<string, string> = {
      'retro': 'Retro 8-bit',
      'modern': 'Moderno 16-bit',
      'minimalist': 'Minimalista',
      'dithered': 'Tramado',
      'isometric': 'Isométrico'
    };
    return styleMap[this.settings().style] || this.settings().style;
  });
  
  paletteName = computed(() => {
    const palette = this.pixelArtService.currentPalette();
    return palette ? palette.name : 'Personalizada';
  });
}