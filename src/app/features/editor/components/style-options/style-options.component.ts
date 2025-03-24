import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PixelArtService } from '../../../../core/services/pixel-art.service';
import { MockDataService } from '../../../../core/services/mock-data.service';
import { PixelArtStyle, AnimationType } from '../../../../core/models/pixel-art.model';

@Component({
  selector: 'app-style-options',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="style-options">
      <h3 class="section-title">Configuración de Estilo</h3>
      
      <div class="options-grid">
        <div class="option-group">
          <label for="pixelArtStyle">Estilo de Pixel Art</label>
          <select 
            id="pixelArtStyle" 
            (change)="onStyleChange($event)"
            [value]="settings().style"
          >
            <option value="retro">Retro 8-bit</option>
            <option value="modern">Moderno 16-bit</option>
            <option value="minimalist">Minimalista</option>
            <option value="dithered">Con Dithering</option>
            <option value="isometric">Isométrico</option>
          </select>
        </div>
        
        <div class="option-group">
          <label for="pixelSize">Tamaño de Pixel</label>
          <div class="range-container">
            <input 
              type="range" 
              id="pixelSize" 
              min="2" 
              max="20" 
              [value]="settings().pixelSize"
              (input)="onPixelSizeChange($event)"
            >
            <span class="range-value">{{ settings().pixelSize }}px</span>
          </div>
        </div>
        
        <div class="option-group">
          <label for="colorPalette">Paleta de Colores</label>
          <select 
            id="colorPalette" 
            (change)="onPaletteChange($event)"
            [value]="settings().paletteId"
          >
            @for (palette of colorPalettes(); track palette.id) {
              <option [value]="palette.id">{{ palette.name }}</option>
            }
          </select>
          
          <div class="color-palette">
            @for (color of currentPaletteColors(); track color) {
              <span 
                class="palette-color" 
                [style.background-color]="color"
                [title]="color"
              ></span>
            }
          </div>
        </div>
        
        <div class="option-group">
          <label for="contrast">Contraste</label>
          <div class="range-container">
            <input 
              type="range" 
              id="contrast" 
              min="0" 
              max="100" 
              [value]="settings().contrast"
              (input)="onContrastChange($event)"
            >
            <span class="range-value">{{ settings().contrast }}%</span>
          </div>
        </div>
        
        <div class="option-group">
          <label for="sharpness">Nitidez</label>
          <div class="range-container">
            <input 
              type="range" 
              id="sharpness" 
              min="0" 
              max="100" 
              [value]="settings().sharpness"
              (input)="onSharpnessChange($event)"
            >
            <span class="range-value">{{ settings().sharpness }}%</span>
          </div>
        </div>
        
        <div class="option-group">
          <label for="animation">Animación</label>
          <select 
            id="animation" 
            (change)="onAnimationChange($event)"
            [value]="settings().animationType"
          >
            <option value="none">Sin animación</option>
            <option value="breathing">Respiración</option>
            <option value="flickering">Parpadeo</option>
            <option value="floating">Flotación</option>
          </select>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./style-options.component.scss']
})
export class StyleOptionsComponent {
  private pixelArtService = inject(PixelArtService);
  private mockDataService = inject(MockDataService);
  
  settings = this.pixelArtService.getSettings();
  colorPalettes = this.mockDataService.getPalettes();
  currentPalette = this.pixelArtService.currentPalette;
  
  // Get colors of current palette
  currentPaletteColors = computed(() => this.pixelArtService.currentPalette()?.colors || []);
  
  onStyleChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pixelArtService.updateSettings({
      style: select.value as PixelArtStyle
    });
  }
  
  onPixelSizeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pixelArtService.updateSettings({
      pixelSize: parseInt(input.value, 10)
    });
  }
  
  onPaletteChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pixelArtService.updateSettings({
      paletteId: select.value
    });
  }
  
  onContrastChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pixelArtService.updateSettings({
      contrast: parseInt(input.value, 10)
    });
  }
  
  onSharpnessChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pixelArtService.updateSettings({
      sharpness: parseInt(input.value, 10)
    });
  }
  
  onAnimationChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pixelArtService.updateSettings({
      animationType: select.value as AnimationType
    });
  }
}