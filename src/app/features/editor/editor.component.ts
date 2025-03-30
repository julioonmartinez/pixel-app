// src/app/features/editor/editor.component.ts
import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { TextPromptComponent } from '../text-prompt/text-prompt.component';
import { StyleOptionsComponent } from './components/style-options/style-options.component';
import { BackgroundOptionsComponent } from './components/background-options/background-options.component';
import { PreviewComponent } from './components/preview/preview.component';
import { PixelArtService } from '../../core/services/pixel-art.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VersionHistoryComponent } from "../pixel-art/version-history/version-history.component";
import { AnimationType } from '../../core/models/pixel-art.model';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ImageUploadComponent,
    TextPromptComponent,
    StyleOptionsComponent,
    BackgroundOptionsComponent,
    PreviewComponent,
    ButtonComponent,
    CardComponent,
    DialogComponent,
    VersionHistoryComponent
],
  template: `
    <div class="editor-container">
      <h1 class="editor-title">{{isUpdateImage() ? 'Edita tu Pixel Art' : 'Editor de Pixel Art'  }} </h1>
      @if(isUpdateImage() && resultPixelArt() ){
        <h3>{{resultPixelArt()?.name}}</h3>
      }
      <div class="editor-tabs">
      
        <button 
          class="tab-button" 
          [class.active]="activeTab() === 'pixelArt'"
          (click)="setActiveTab('pixelArt')"
        >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Grid representing pixels -->
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <!-- Pixel elements -->
            <rect x="7" y="7" width="4" height="4" stroke="currentColor"></rect>
            <rect x="13" y="7" width="4" height="4" stroke="currentColor"></rect>
            <rect x="7" y="13" width="4" height="4" stroke="currentColor"></rect>
            <rect x="13" y="13" width="4" height="4" stroke="currentColor"></rect>
        </svg>
          Editar Pixel-Art
        </button>
        
       
       <button 
          class="tab-button" 
          [class.active]="activeTab() === 'upload'"
          (click)="setActiveTab('upload')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Desde Imagen
        </button>
        <button 
          class="tab-button"
          [class.active]="activeTab() === 'prompt'"
          (click)="setActiveTab('prompt')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          Desde Texto
        </button>
      </div>
      
      <div class="editor-layout">
        <div class="editor-input">
          @if (activeTab() === 'upload') {
            <app-card>
              <app-image-upload (imageSelected)="onImageSelected($event)" />
            </app-card>
          } @else if ( (activeTab() === 'prompt') || (activeTab() === 'pixelArt' ) ) {
            <app-card>
              <app-text-prompt (promptSubmitted)="onPromptSubmitted($event)" [editMode]="isUpdateImage()" [pixelArt]="resultPixelArt()" />
            </app-card>
          }
          
          <app-card>
            <app-style-options />
          </app-card>
          
          <app-card>
            <app-background-options />
          </app-card>
        </div>
        
        <div class="editor-preview">
          <app-card>
            <app-preview />
          </app-card>
          @if(resultPixelArt()?.versionHistory ) {
              <app-version-history [pixelArt]="resultPixelArt()!" />
            }
          
          <div class="preview-actions">
            <app-button 
              variant="secondary"
              [disabled]="!hasResultImage()"
              (onClick)="downloadImage()"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Descargar
            </app-button>
            <app-button 
              variant="secondary"
              [disabled]="!hasResultImage()"
              (onClick)="showShareDialog()"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              Compartir
            </app-button>
            <app-button
              [disabled]="!hasResultImage() || isProcessing()"
              (onClick)="showSaveDialog()"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              Guardar
            </app-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Diálogo para guardar pixel art -->
    @if (showSaveDialogFlag()) {
      <app-dialog
        title="Guardar Pixel Art"
        (close)="showSaveDialogFlag.set(false)"
      >
        <div class="save-dialog-content">
          <div class="form-group">
            <label for="artName">Nombre</label>
            <input 
              type="text" 
              id="artName" 
              [(ngModel)]="saveArtName"
              placeholder="Mi pixel art"
              class="form-input"
              autocomplete="off"
            >
          </div>
          
          <div class="form-group">
            <label for="artTags">Etiquetas (separadas por comas)</label>
            <input 
              type="text" 
              id="artTags" 
              [(ngModel)]="saveArtTags"
              placeholder="pixel, retro, game"
              class="form-input"
              autocomplete="off"
            >
          </div>
          
          <div class="dialog-actions">
            <app-button 
              variant="secondary"
              (onClick)="showSaveDialogFlag.set(false)"
            >
              Cancelar
            </app-button>
            <app-button
              (onClick)="savePixelArt()"
            >
              Guardar
            </app-button>
          </div>
        </div>
      </app-dialog>
    }
    
    <!-- Diálogo para compartir pixel art -->
    @if (showShareDialogFlag()) {
      <app-dialog
        title="Compartir Pixel Art"
        (close)="showShareDialogFlag.set(false)"
      >
        <div class="share-dialog-content">
          <p>Comparte tu pixel art con otros:</p>
          
          <div class="share-preview">
            <img [src]="resultImage()" alt="Pixel Art para compartir" />
          </div>
          
          <div class="form-group">
            <label for="shareUrl">Enlace directo</label>
            <div class="share-url-container">
              <input 
                type="text" 
                id="shareUrl" 
                [value]="shareUrl"
                readonly
                class="form-input"
              >
              <app-button
                variant="secondary"
                (onClick)="copyShareUrl()"
              >
                Copiar
              </app-button>
            </div>
            @if (copySuccess()) {
              <span class="copy-success">¡Enlace copiado!</span>
            }
          </div>
          
          <div class="social-buttons">
            <button class="social-button twitter" (click)="shareToSocial('twitter')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
              Twitter
            </button>
            <button class="social-button facebook" (click)="shareToSocial('facebook')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
              Facebook
            </button>
          </div>
        </div>
      </app-dialog>
    }
  `,
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pixelArtService = inject(PixelArtService);
  
  // Uso de signals para el estado del componente
  activeTab = signal<'upload' | 'prompt' | 'pixelArt' >('prompt');
  showSaveDialogFlag = signal<boolean>(false);
  showShareDialogFlag = signal<boolean>(false);
  saveArtName = '';
  saveArtTags = '';
  shareUrl = '';
  copySuccess = signal<boolean>(false);
  isUpdateImage = signal<boolean>(false);
  // Acceso directo a signals del servicio
  resultImage = this.pixelArtService.resultImage;
  resultPixelArt = this.pixelArtService.resultPixelArt;
  isProcessing = this.pixelArtService.isProcessing;
  
  // Computed para verificar si hay imagen disponible
  hasResultImage = computed(() => !!this.resultImage());
  
  constructor() {
    // Inicializar la pestaña según los parámetros de la URL
    this.route.queryParams.subscribe(params => {
      console.log('params',  params)
      if (params['mode'] === 'upload' || params['mode'] === 'prompt' || params['mode'] === 'pixelArt' ) {
        this.activeTab.set(params['mode'] as 'upload' | 'prompt' | 'pixelArt');
        this.isUpdateImage.set(false)
      }
      
      // Cargar arte existente si se proporciona un ID
      if (params['art']) {
        this.isUpdateImage.set(true)
        // this.activeTab.set('pixelArt');
        this.loadExistingPixelArt(params['art']);
      }
    });
  }
  
  setActiveTab(tab: 'upload' | 'prompt' | 'pixelArt' ): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: tab },
      queryParamsHandling: 'merge'
    });
    if(tab === 'pixelArt' && this.resultPixelArt() && this.resultPixelArt()?.imageUrl ){
      this.pixelArtService.resultImage.set(this.resultPixelArt()?.imageUrl!)
    }
    if((tab === 'prompt') || (tab === 'upload') ){
      this.pixelArtService.resultImage.set(null);
    }
    
    
  }
  
  onImageSelected(data: {image: string, prompt?: string}): void {
    this.pixelArtService.setSourceImage(data.image);
    
    // Si hay un prompt adicional, usarlo en el procesamiento
    if (data.prompt) {
      this.pixelArtService.processImage(data.prompt);
    }
  }
  
  onPromptSubmitted(prompt: string): void {
    this.pixelArtService.setSourcePrompt(prompt);
  }
  
  downloadImage(): void {
    if (!this.resultImage()) return;
    const imageUrl = this.resultImage() as string
    
    try {
      // Método 1: Usando fetch para descargar la imagen correctamente
      fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
          // Crear un objeto URL para el blob
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Crear un elemento <a> temporal
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          
          // Establecer el nombre del archivo para la descarga
          const fileName = `pixel-art-${Date.now()}.png`;
          downloadLink.download = fileName;
          
          // Agregar el enlace al documento, hacer clic y luego eliminarlo
          document.body.appendChild(downloadLink);
          downloadLink.click();
          
          // Limpieza
          document.body.removeChild(downloadLink);
          window.URL.revokeObjectURL(blobUrl); // Liberar memoria
          
          console.log(`Descargando imagen como ${fileName}`);
        })
        .catch(error => {
          console.error('Error al descargar la imagen:', error);
        });
    } catch (error) {
      console.error('Error en proceso de descarga:', error);
    }
  }
  
  showSaveDialog(): void {
    this.saveArtName = `Pixel Art ${new Date().toLocaleDateString()}`;
    this.saveArtTags = '';
    this.showSaveDialogFlag.set(true);
  }
  
  savePixelArt(): void {
    if (!this.saveArtName.trim()) {
      this.saveArtName = `Pixel Art ${new Date().toLocaleDateString()}`;
    }
    
    const savedArt = this.pixelArtService.savePixelArt(this.saveArtName);
    this.showSaveDialogFlag.set(false);
    
    if (savedArt) {
      // Opcional: navegar a la galería o mostrar un mensaje de éxito
      console.log('Pixel art guardado:', savedArt);
    }
  }
  
  showShareDialog(): void {
    if (!this.resultImage()) return;
    
    // Generar URL para compartir
    const currentUrl = window.location.href.split('?')[0];
    // Nota: En una app real, usarías el ID real del pixel art guardado
    const artId = new Date().getTime().toString();
    this.shareUrl = `${currentUrl}?art=${artId}`;
    
    this.showShareDialogFlag.set(true);
    this.copySuccess.set(false);
  }
  
  copyShareUrl(): void {
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => {
        this.copySuccess.set(false);
      }, 3000);
    });
  }
  
  shareToSocial(platform: 'twitter' | 'facebook'): void {
    let shareUrl = '';
    const text = `Mira este pixel art que he creado: ${this.saveArtName || 'Pixel Art'}`;
    
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.shareUrl)}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareUrl)}`;
    }
    
    window.open(shareUrl, '_blank');
  }
  
  private loadExistingPixelArt(id: string): void {
    console.log(`Loading pixel art with ID: ${id}`);
    
    this.pixelArtService.getPixelArtById(id).subscribe(art => {
      if (art) {
        if(this.activeTab() === 'pixelArt'){
          this.pixelArtService.resultImage.set(art.imageUrl);
        }
        this.pixelArtService.resultPixelArt.set(art);
        
        // Actualizar los settings basados en el pixel art cargado
        this.pixelArtService.updateSettings({
          pixelSize: art.pixelSize,
          style: art.style,
          backgroundType: art.backgroundType,
          animationType: art.animationType || AnimationType.NONE,
          paletteId: art.palette.id
        });
        
        // Si hay un prompt, cargarlo en el componente de texto
        if (art.prompt) {
          this.pixelArtService.sourcePrompt.set(art.prompt);
        }
      }
    });
  }
}