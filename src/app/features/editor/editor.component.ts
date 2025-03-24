// src/app/features/editor/editor.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { TextPromptComponent } from '../text-prompt/text-prompt.component';
import { StyleOptionsComponent } from './components/style-options/style-options.component';
import { BackgroundOptionsComponent } from './components/background-options/background-options.component';
import { PreviewComponent } from './components/preview/preview.component';
import { PixelArtService } from '../../core/services/pixel-art.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    ImageUploadComponent, 
    TextPromptComponent,
    StyleOptionsComponent,
    BackgroundOptionsComponent,
    PreviewComponent,
    ButtonComponent,
    CardComponent
  ],
  template: `
    <div class="editor-container">
      <h1 class="editor-title">Editor de Pixel Art</h1>
      
      <div class="editor-tabs">
        <button 
          class="tab-button" 
          [class.active]="activeTab === 'upload'"
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
          [class.active]="activeTab === 'prompt'"
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
          @if (activeTab === 'upload') {
            <app-card>
              <app-image-upload (imageSelected)="onImageSelected($event)" />
            </app-card>
          } @else if (activeTab === 'prompt') {
            <app-card>
              <app-text-prompt (promptSubmitted)="onPromptSubmitted($event)" />
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
          
          <div class="preview-actions">
            <app-button variant="secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Descargar
            </app-button>
            <app-button variant="secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              Compartir
            </app-button>
            <app-button>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              Guardar
            </app-button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private pixelArtService = inject(PixelArtService);
  
  activeTab: 'upload' | 'prompt' = 'upload';
  private subscription = new Subscription();
  
  ngOnInit(): void {
    // Set active tab based on query params
    this.subscription.add(
      this.route.queryParams.subscribe(params => {
        if (params['mode'] === 'upload' || params['mode'] === 'prompt') {
          this.activeTab = params['mode'];
        }
        
        // Handle loading existing pixel art
        if (params['art']) {
          this.loadExistingPixelArt(params['art']);
        }
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  setActiveTab(tab: 'upload' | 'prompt'): void {
    this.activeTab = tab;
  }
  
  onImageSelected(imageDataUrl: string): void {
    this.pixelArtService.setSourceImage(imageDataUrl);
  }
  
  onPromptSubmitted(prompt: string): void {
    this.pixelArtService.setSourcePrompt(prompt);
  }
  
  private loadExistingPixelArt(id: string): void {
    // Implementation for loading existing art would go here
    console.log(`Loading pixel art with ID: ${id}`);
  }
}
