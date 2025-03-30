// src/app/features/pixel-art/version-history/version-history.component.ts
import { Component, Input, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixelArt, PixelArtVersion } from '../../../core/models/pixel-art.model';
import { PixelArtService } from '../../../core/services/pixel-art.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-version-history',
  standalone: true,
  imports: [CommonModule, ButtonComponent, CardComponent],
  template: `
    <app-card *ngIf="showHistory()">
      <div class="version-history-container">
        <h3 class="section-title">Historial de versiones</h3>
        
        <div class="version-info">
          <p class="version-count">
            Este pixel art ha sido modificado {{versionCount()}} 
            {{versionCount() === 1 ? 'vez' : 'veces'}}
          </p>
        </div>
        
        <div class="versions-grid">
          <!-- Versión actual -->
          <div class="version-card current-version">
            <div class="version-header">
              <span class="version-label">Versión actual</span>
              <span class="version-date">
                {{formatDate(pixelArt.updatedAt || pixelArt.createdAt)}}
              </span>
            </div>
            
            <div class="version-image">
              <img [src]="pixelArt.thumbnailUrl" [alt]="pixelArt.name" (click)="openImage(pixelArt.imageUrl)">
            </div>
            
            @if(pixelArt.prompt) {
              <div class="version-prompt">
                <span class="prompt-label">Prompt:</span>
                <p class="prompt-text">{{pixelArt.prompt}}</p>
              </div>
            }
          </div>
          
          <!-- Versiones anteriores -->
          @for(version of reversedVersionHistory(); track version.timestamp) {
            <div class="version-card">
              <div class="version-header">
                <span class="version-label">Versión anterior</span>
                <span class="version-date">{{formatDate(version.timestamp)}}</span>
              </div>
              
              <div class="version-image">
                <img [src]="version.thumbnailUrl" [alt]="'Versión anterior'" (click)="openImage(version.imageUrl)">
              </div>
              
              @if(version.prompt) {
                <div class="version-prompt">
                  <span class="prompt-label">Prompt:</span>
                  <p class="prompt-text">{{version.prompt}}</p>
                </div>
              }
              
              <div class="version-actions">
                <app-button variant="secondary" (onClick)="restoreVersion(version)" [disabled]="isProcessing()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M8 16H3v5"></path>
                  </svg>
                  Restaurar
                </app-button>
              </div>
            </div>
          }
        </div>
      </div>
    </app-card>
  `,
  styles: [`
    .version-history-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--color-text-primary);
    }
    
    .version-info {
      margin-bottom: 1rem;
    }
    
    .version-count {
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }
    
    .versions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }
    
    .version-card {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1rem;
      background-color: var(--color-background-alt);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.2s ease;
    }
    
    .version-card:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .current-version {
      border-color: var(--color-primary);
      background-color: rgba(var(--color-primary-rgb), 0.05);
    }
    
    .version-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .version-label {
      font-weight: 600;
      color: var(--color-primary);
    }
    
    .version-date {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
    }
    
    .version-image {
      position: relative;
      overflow: hidden;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .version-image img {
      width: 100%;
      height: 180px;
      object-fit: contain;
      display: block;
      transition: transform 0.3s ease;
    }
    
    .version-image img:hover {
      transform: scale(1.05);
    }
    
    .version-prompt {
      background-color: var(--color-background);
      padding: 0.75rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    
    .prompt-label {
      font-weight: 600;
      color: var(--color-text-primary);
      display: block;
      margin-bottom: 0.25rem;
    }
    
    .prompt-text {
      color: var(--color-text-secondary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .version-actions {
      margin-top: auto;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class VersionHistoryComponent {
  @Input() pixelArt!: PixelArt;
  
  private pixelArtService = inject(PixelArtService);
  
  isProcessing = this.pixelArtService.isProcessing;
  
  // Computed properties
  showHistory = computed(() => {
    return !!this.pixelArt?.versionHistory && this.pixelArt.versionHistory.length > 0;
  });
  
  versionCount = computed(() => {
    return this.pixelArt?.versionHistory?.length || 0;
  });
  
  reversedVersionHistory = computed(() => {
    if (!this.pixelArt?.versionHistory) return [];
    return [...this.pixelArt.versionHistory].reverse();
  });
  
  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  }
  
  openImage(imageUrl: string): void {
    window.open(imageUrl, '_blank');
  }
  
  restoreVersion(version: PixelArtVersion): void {
    if (confirm('¿Estás seguro de que quieres restaurar esta versión? Los cambios no guardados se perderán.')) {
      this.pixelArtService.restoreVersion(this.pixelArt.id, version);
    }
  }
}