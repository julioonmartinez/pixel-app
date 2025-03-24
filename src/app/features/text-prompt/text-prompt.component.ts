// src/app/features/text-prompt/text-prompt.component.ts
import { Component, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-text-prompt',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  template: `
    <div class="prompt-container">
      <h3 class="prompt-title">Genera Pixel Art con IA</h3>
      <p class="prompt-description">
        Describe lo que quieres crear y nuestra IA generará pixel art único basado en tu descripción.
      </p>
      
      <div class="prompt-input-container">
        <textarea
          class="prompt-input"
          placeholder="Describe lo que quieres generar... p. ej. 'Un dragón rojo volando sobre un castillo medieval al atardecer'"
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
          @for (suggestion of suggestions; track suggestion) {
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
          <li>Menciona el punto de vista (frontal, vista aérea, etc.).</li>
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
          Generar Pixel Art
        </app-button>
      </div>
    </div>
  `,
  styleUrls: ['./text-prompt.component.scss']
})
export class TextPromptComponent {
  @Output() promptSubmitted = new EventEmitter<string>();
  
  // Reactive state with signals
  promptText = signal<string>('');
  isGenerating = signal<boolean>(false);
  
  // Example suggestions
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
  
  submitPrompt(): void {
    if (this.isValidPrompt()) {
      this.isGenerating.set(true);
      this.promptSubmitted.emit(this.promptText());
      
      // Reset generating state after some time (would be handled by service in real app)
      setTimeout(() => {
        this.isGenerating.set(false);
      }, 3000);
    }
  }
}