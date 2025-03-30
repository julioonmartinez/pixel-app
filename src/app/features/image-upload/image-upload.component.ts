// src/app/features/image-upload/image-upload.component.ts
import { Component, Output, EventEmitter, inject, effect } from '@angular/core';
import { DragDropDirective } from '../../shared/directives/drag-drop.directive';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { signal, computed } from '@angular/core';
import { PixelArtService } from '../../core/services/pixel-art.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropDirective, ButtonComponent, FileSizePipe],
  template: `
    <div class="upload-container">
      <div 
        class="upload-area" 
        appDragDrop 
        (fileDropped)="onFileDropped($event)"
        (click)="fileInput.click()"
      >
        @if (!selectedFile() && !isProcessing()) {
          <div class="upload-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bb86fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>Arrastra y suelta tu imagen aquí o</p>
            <span class="upload-browse">Explorar archivos</span>
            <p class="upload-hint">Formatos soportados: JPG, PNG, GIF, BMP, WEBP</p>
          </div>
        } @else if (isProcessing()) {
          <div class="processing-indicator">
            <div class="spinner"></div>
            <p>Procesando imagen...</p>
            <p class="processing-hint">Esto puede tardar unos segundos</p>
          </div>
        } @else {
          <div class="selected-file">
            @if (previewUrl()) {
              <div class="preview-image">
                <img [src]="previewUrl()" [alt]="selectedFile()?.name" />
              </div>
            }
            <div class="file-info">
              <span class="file-name">{{ selectedFile()?.name }}</span>
              <span class="file-size">{{ selectedFile()?.size! | fileSize }}</span>
              <span 
                class="remove-file" 
                (click)="removeFile($event)"
                title="Eliminar archivo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </span>
            </div>
          </div>
        }
      </div>
      
      <input 
        type="file" 
        #fileInput
        style="display: none;"
        accept="image/*"
        (change)="onFileSelected($event)"
      />
      
      @if (errorMessage()) {
        <div class="error-message">
          {{ errorMessage() }}
        </div>
      }
      
      <!-- Campo de prompt adicional para guiar el procesamiento -->
      @if (selectedFile() && !isProcessing()) {
        <div class="prompt-container">
          <label for="additionalPrompt" class="prompt-label">Prompt adicional (opcional):</label>
          <textarea
            id="additionalPrompt"
            class="prompt-input"
            placeholder="Describe ajustes adicionales para la imagen... p. ej. 'Estilo más pixelado, colores vibrantes'"
            [(ngModel)]="additionalPrompt"
            rows="3"
          ></textarea>
        </div>
      }
      
      <div class="upload-actions">
        <app-button 
          [disabled]="!selectedFile() || isProcessing()"
          (onClick)="processImage()"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <rect x="7" y="7" width="3" height="3"></rect>
            <rect x="14" y="7" width="3" height="3"></rect>
            <rect x="7" y="14" width="3" height="3"></rect>
            <rect x="14" y="14" width="3" height="3"></rect>
          </svg>
          {{ isProcessing() ? 'Procesando...' : 'Pixelar Imagen' }}
        </app-button>
      </div>
    </div>
  `,
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent {
  @Output() imageSelected = new EventEmitter<{image: string, prompt?: string}>();
  
  private pixelArtService = inject(PixelArtService);
  
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  additionalPrompt = signal<string>('');

  // En Angular 19, podemos usar directamente los signals del servicio
  isProcessing = this.pixelArtService.isProcessing;
  
  // Usamos effect() para reaccionar a cambios en los signals del servicio
  constructor() {
    // Monitor de errores
    effect(() => {
      // Actualiza nuestro errorMessage local cuando cambia el error en el servicio
      const serviceError = this.pixelArtService.error();
      if (serviceError) {
        this.errorMessage.set(serviceError);
      }
    });
  }
  
  onFileDropped(files: FileList): void {
    this.handleFiles(files);
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFiles(input.files);
    }
  }
  
  private handleFiles(files: FileList): void {
    if (files.length > 0) {
      const file = files[0];
      
      // Check if the file is an image
      if (!file.type.match(/image\/(jpeg|png|gif|bmp|webp)/)) {
        this.errorMessage.set('Por favor, selecciona un archivo de imagen válido.');
        return;
      }
      
      this.selectedFile.set(file);
      this.createImagePreview(file);
      this.errorMessage.set(null);
    }
  }
  
  private createImagePreview(file: File): void {
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.previewUrl.set(e.target?.result as string);
    };
    
    reader.readAsDataURL(file);
  }
  
  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.errorMessage.set(null);
    this.additionalPrompt.set('');
  }
  
  processImage(): void {
    if (this.previewUrl()) {
      // Pasamos la imagen y el prompt opcional
      this.imageSelected.emit({
        image: this.previewUrl()!,
        prompt: this.additionalPrompt().trim() || undefined
      });
    }
  }
}