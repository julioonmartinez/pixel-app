// src/app/features/editor/components/background-options/background-options.component.ts
import { Component, inject } from '@angular/core';
import { PixelArtService } from '../../../../core/services/pixel-art.service';
import { BackgroundType } from '../../../../core/models/pixel-art.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-background-options',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="background-options">
      <h3 class="section-title">Estilo de Fondo</h3>
      
      <div class="background-types">
        @for (bgType of backgroundTypes; track $index) {
          <div 
            class="bg-option" 
            [class.active]="settings().backgroundType === bgType.value"
            (click)="onBackgroundChange(bgType.value)"
          >
            <div class="bg-preview" [class]="bgType.value"></div>
            <span>{{ bgType.label }}</span>
          </div>
        }
      </div>
      
      @if (showColorPicker()) {
        <div class="bg-color-picker">
          <label>Color de Fondo</label>
          <div class="color-options">
            @for (color of backgroundColors; track $index) {
              <div 
                class="color-option"
                [style.background-color]="color"
                [class.selected]="selectedColor === color"
                (click)="selectBackgroundColor(color)"
              ></div>
            }
          </div>
        </div>
      }
      
      @if (settings().backgroundType === 'gradient') {
        <div class="gradient-options">
          <div class="gradient-direction">
            <label>Dirección del Degradado</label>
            <div class="direction-options">
              <div 
                class="direction-option" 
                [class.selected]="gradientDirection === 'to right'" 
                (click)="setGradientDirection('to right')"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
                <span>Horizontal</span>
              </div>
              <div 
                class="direction-option" 
                [class.selected]="gradientDirection === 'to bottom'" 
                (click)="setGradientDirection('to bottom')"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
                <span>Vertical</span>
              </div>
              <div 
                class="direction-option" 
                [class.selected]="gradientDirection === 'to bottom right'" 
                (click)="setGradientDirection('to bottom right')"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="7" x2="17" y2="17"></line>
                  <polyline points="17 7 17 17 7 17"></polyline>
                </svg>
                <span>Diagonal</span>
              </div>
              <div 
                class="direction-option" 
                [class.selected]="gradientDirection === 'to bottom left'" 
                (click)="setGradientDirection('to bottom left')"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="17" y1="7" x2="7" y2="17"></line>
                  <polyline points="7 7 7 17 17 17"></polyline>
                </svg>
                <span>Diagonal Inv.</span>
              </div>
            </div>
          </div>
          
          @if (showSecondColor) {
            <div class="second-color-picker">
              <label>Color Secundario</label>
              <div class="color-options">
                @for (color of backgroundColors; track color) {
                  <div 
                    class="color-option"
                    [style.background-color]="color"
                    [class.selected]="selectedSecondColor === color"
                    (click)="selectSecondColor(color)"
                  ></div>
                }
              </div>
            </div>
          }
        </div>
      }
      
      @if (settings().backgroundType === 'pattern') {
        <div class="pattern-options">
          <label>Seleccionar Patrón</label>
          <div class="pattern-list">
            @for (pattern of patternTypes; track $index) {
              <div 
                class="pattern-option" 
                [class.selected]="selectedPattern === pattern.id"
                (click)="selectPattern(pattern.id)"
              >
                <div class="pattern-preview" [class]="'pattern-' + pattern.id"></div>
                <span>{{ pattern.name }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./background-options.component.scss']
})
export class BackgroundOptionsComponent {
  private pixelArtService = inject(PixelArtService);
  
  settings = this.pixelArtService.getSettings();
  
  backgroundTypes = [
    { value: BackgroundType.TRANSPARENT, label: 'Transparente' },
    { value: BackgroundType.SOLID, label: 'Sólido' },
    { value: BackgroundType.GRADIENT, label: 'Degradado' },
    { value: BackgroundType.PATTERN, label: 'Patrón' }
  ];
  
  backgroundColors = [
    '#000000', '#333333', '#555555', '#777777', '#999999', '#BBBBBB',
    '#5e315b', '#8c3f5d', '#ba6156', '#2c2137', '#0b0630', '#000000',
    '#352b42', '#43436a', '#4b80ca', '#68c2d3', '#a2dcc7', '#ede19e',
    '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#f9004d'
  ];
  
  patternTypes = [
    { id: 'dots', name: 'Puntos' },
    { id: 'lines', name: 'Líneas' },
    { id: 'grid', name: 'Cuadrícula' },
    { id: 'diamond', name: 'Diamantes' },
    { id: 'circuit', name: 'Circuito' },
    { id: 'pixels', name: 'Píxeles' }
  ];
  
  // Estados locales
  selectedColor = '#1a1a2e';
  selectedSecondColor = '#533483';
  gradientDirection = 'to bottom right';
  selectedPattern = 'dots';
  showSecondColor = true;
  
  showColorPicker = () => this.settings().backgroundType === BackgroundType.SOLID || 
                         this.settings().backgroundType === BackgroundType.GRADIENT;
  
  onBackgroundChange(type: BackgroundType): void {
    this.pixelArtService.updateSettings({
      backgroundType: type
    });
  }
  
  selectBackgroundColor(color: string): void {
    this.selectedColor = color;
    
    // En una aplicación real, esto actualizaría el color de fondo en el servicio
    // Por ahora solo guardamos el estado localmente
    console.log(`Color principal seleccionado: ${color}`);
  }
  
  selectSecondColor(color: string): void {
    this.selectedSecondColor = color;
    
    // En una aplicación real, actualizaría el segundo color del degradado
    console.log(`Color secundario seleccionado: ${color}`);
  }
  
  setGradientDirection(direction: string): void {
    this.gradientDirection = direction;
    
    // En una aplicación real, actualizaría la dirección del degradado
    console.log(`Dirección del degradado: ${direction}`);
  }
  
  selectPattern(patternId: string): void {
    this.selectedPattern = patternId;
    
    // En una aplicación real, actualizaría el patrón seleccionado
    console.log(`Patrón seleccionado: ${patternId}`);
  }
}