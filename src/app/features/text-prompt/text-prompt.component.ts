// src/app/features/text-prompt/text-prompt.component.ts
import { Component, Output, EventEmitter, signal, inject, computed, Input, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { PixelArtService } from '../../core/services/pixel-art.service';
import { PixelArt } from '../../core/models/pixel-art.model';

@Component({
  selector: 'app-text-prompt',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  template: `
    <div class="prompt-container">
      <h3 class="prompt-title">{{editMode() ? 'Modifica tu Pixel Art con IA' : 'Genera Pixel Art con IA'}}</h3>
      <p class="prompt-description">
        {{editMode() ? 
          'Describe los cambios que quieres realizar en tu imagen y nuestra IA los aplicará manteniendo el estilo pixel art.' : 
          'Describe lo que quieres crear y nuestra IA generará pixel art único basado en tu descripción.'
        }}
      </p>
      
      <div class="prompt-input-container">
        <textarea
          class="prompt-input"
          [placeholder]="getPlaceholderText()"
          [(ngModel)]="promptText"
          (ngModelChange)="updatePrompt($event)"
          rows="5"
        ></textarea>
        
        <div class="char-counter" [class.warning]="promptText().length > 200">
          {{ promptText().length }}/300
        </div>
      </div>
      
      <div class="prompt-suggestions">
        <h4>Sugerencias</h4>
        <div class="suggestion-tags">
          @for (suggestion of editMode() ? editSuggestions : suggestions; track suggestion) {
            <span 
              class="suggestion-tag"
              (click)="usePromptSuggestion(suggestion)"
            >
              {{ suggestion }}
            </span>
          }
        </div>
      </div>
      
      <div class="prompt-tips">
        <h4>Tips para mejores resultados</h4>
        <ul>
          <li>Sé específico con los colores, estilos y detalles que deseas.</li>
          <li>Menciona elementos que quieres añadir o modificar claramente.</li>
          <li>Incluye referencias a estilos de pixel art (8-bit, 16-bit, etc.).</li>
          <li>Describe la iluminación y el ambiente.</li>
        </ul>
      </div>
      
      <div class="prompt-actions">
        <app-button 
          [disabled]="!isValidPrompt()"
          (onClick)="submitPrompt()"
          [loading]="isGenerating()"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          {{ editMode() ? 'Aplicar Cambios' : 'Generar Pixel Art' }}
        </app-button>
      </div>
    </div>
  `,
  styleUrls: ['./text-prompt.component.scss']
})
export class TextPromptComponent {
  // En TextPromptComponent
@Output() promptUpdate = new EventEmitter<{id: string, prompt: string}>();
  @Output() promptSubmitted = new EventEmitter<string>();
  
  @Input() set pixelArt(value: PixelArt | null) {
    if (value) {
      this._pixelArt.set(value);
      if (value.prompt) {
        this.promptText.set(value.prompt);
      }
    }
  }
  
  private pixelArtService = inject(PixelArtService);
  
  // Reactive state with signals
  _pixelArt = signal<PixelArt | null>(null);
  promptText = signal<string>('');
  isGenerating = this.pixelArtService.isProcessing;
  
  // Determinar si estamos en modo edición
  editMode = input<boolean>(false)
  
  // Sugerencias para generación
  suggestions: string[] = [
    'Personaje de juego retro',
    'Paisaje fantástico',
    'Criatura mágica',
    'Ciudad cyberpunk',
    'Escena de bosque',
    'Nave espacial',
    'Mascota pixel art',
    'Escena de batalla'
  ];
  
  // Sugerencias para edición
  editSuggestions: string[] = [
    'Añadir un sombrero',
    'Cambiar el fondo',
    'Añadir efectos de luz',
    'Añadir un personaje',
    'Cambiar colores a tonos más cálidos',
    'Agregar nubes en el cielo',
    'Añadir efectos de lluvia',
    'Cambiar estilo a cyberpunk'
  ];
  
  // Método para obtener el texto del placeholder
  getPlaceholderText(): string {
    if (this.editMode()) {
      return "Describe qué cambios quieres realizar... p. ej. 'Añadir un sombrero rojo al personaje, cambiar el fondo a un bosque'";
    } else {
      return "Describe lo que quieres generar... p. ej. 'Un dragón rojo volando sobre un castillo medieval al atardecer'";
    }
  }
  private getValidPixelArt(): PixelArt | null {
    // Intentar obtener el pixelArt desde la propiedad local
    let art = this._pixelArt();
    
    // Si no tenemos pixelArt local pero estamos en modo edición, 
    // puede ser que aún no se haya propagado la entrada
    if (!art && this.editMode()) {
      console.warn('No hay pixelArt disponible pero estamos en modo edición');
    }
    
    return art;
  }
  
  updatePrompt(text: string): void {
    this.promptText.set(text);
  }
  
  usePromptSuggestion(suggestion: string): void {
    this.promptText.update(current => 
      current ? `${current}, ${suggestion.toLowerCase()}` : suggestion
    );
  }
  
  isValidPrompt(): boolean {
    return this.promptText().trim().length >= 5 && this.promptText().length <= 300;
  }
  
  // En el método submitPrompt()
  submitPrompt(): void {
    console.log(this.promptText())
    if (this.isValidPrompt()) {
      if (this.editMode()) {
        const pixelArt = this.getValidPixelArt();
        if (pixelArt && pixelArt.id) {
          console.log('Emitiendo promptUpdate con ID:', pixelArt.id);
          this.promptUpdate.emit({
            id: pixelArt.id,
            prompt: this.promptText()
          });
        } else {
          // Fallback para cuando estamos en modo edición pero no tenemos pixelArt
          console.warn('En modo edición pero sin pixelArt válido, emitiendo sólo el prompt');
          this.promptSubmitted.emit(this.promptText());
        }
      } else {
        this.promptSubmitted.emit(this.promptText());
      }
    }
  }
}