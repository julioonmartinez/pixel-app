// src/app/features/gallery/gallery.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { PixelateDirective } from '../../shared/directives/pixelate.directive';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, 
    CardComponent, 
    ButtonComponent, 
    PixelateDirective,
    
  ],
  template: `
    <div class="gallery-container">
      <div class="gallery-header">
        <h1 class="gallery-title">Galería de Pixel Art</h1>
        <p class="gallery-subtitle">Explora creaciones de la comunidad o tus propios diseños guardados</p>
      </div>
      
      <div class="gallery-filters">
        <div class="filter-section">
          <div class="search-bar">
            <input 
              type="text" 
              placeholder="Buscar por nombre o etiqueta..." 
              [(ngModel)]="searchTerm"
              (input)="filterGallery()"
            >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          
          <div class="filter-buttons">
            <button 
              class="filter-btn" 
              [class.active]="activeFilter === 'all'"
              (click)="setFilter('all')"
            >
              Todos
            </button>
            <button 
              class="filter-btn" 
              [class.active]="activeFilter === 'saved'"
              (click)="setFilter('saved')"
            >
              Guardados
            </button>
            <button 
              class="filter-btn" 
              [class.active]="activeFilter === 'recent'"
              (click)="setFilter('recent')"
            >
              Recientes
            </button>
          </div>
        </div>
        
        <div class="sort-section">
          <label for="sortOrder">Ordenar por:</label>
          <select 
            id="sortOrder" 
            [(ngModel)]="sortOrder"
            (change)="filterGallery()"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="name">Nombre (A-Z)</option>
          </select>
        </div>
      </div>
      
      @if (filteredArtworks().length === 0) {
        <div class="no-results">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <p>No se encontraron resultados para tu búsqueda</p>
          <app-button variant="secondary" (onClick)="resetFilters()">
            Limpiar filtros
          </app-button>
        </div>
      } @else {
        <div class="gallery-grid">
          @for (art of filteredArtworks()(); track art.id) {
            <app-card [clickable]="true" (click)="openArtwork(art.id)">
              <div class="gallery-item">
                <div 
                  class="gallery-image"
                  [ngClass]="getAnimationClass(art)"
                >
                  <img 
                    [src]="art.thumbnailUrl" 
                    [alt]="art.name" 
                    appPixelate 
                    [pixelSize]="art.pixelSize" 
                  />
                </div>
                <div class="gallery-info">
                  <h3>{{ art.name }}</h3>
                  <div class="gallery-meta">
                    <span class="creation-date">{{ formatDate(art.createdAt) }}</span>
                    <span class="style-badge" [class]="'style-' + art.style">
                      {{ getStyleName(art.style) }}
                    </span>
                  </div>
                  <div class="gallery-tags">
                    @for (tag of art.tags; track tag) {
                      <span class="tag">{{ tag }}</span>
                    }
                  </div>
                </div>
              </div>
            </app-card>
          }
        </div>
      }
      
      <div class="gallery-pagination">
        <app-button 
          variant="secondary" 
          [disabled]="currentPage === 1"
          (onClick)="previousPage()"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Anterior
        </app-button>
        
        <span class="page-info">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        
        <app-button 
          variant="secondary" 
          [disabled]="currentPage === totalPages"
          (onClick)="nextPage()"
        >
          Siguiente
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </app-button>
      </div>
    </div>
  `,
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent {
  private mockDataService = inject(MockDataService);
  private router = inject(Router);
  
  // Reactive state
  allArtworks = this.mockDataService.getPixelArtExamples();
  filteredArtworks = this.mockDataService.getPixelArtExamples; // Start with all
  
  // Filters
  searchTerm = '';
  activeFilter: 'all' | 'saved' | 'recent' = 'all';
  sortOrder: 'newest' | 'oldest' | 'name' = 'newest';
  
  // Pagination
  itemsPerPage = 9;
  currentPage = 1;
  totalPages = Math.ceil(this.allArtworks().length / this.itemsPerPage);
  
  setFilter(filter: 'all' | 'saved' | 'recent'): void {
    this.activeFilter = filter;
    this.filterGallery();
  }
  
  filterGallery(): void {
    let filtered = [...this.allArtworks()];
  
    // Aplicar el filtro de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(art => 
        art.name.toLowerCase().includes(term) || 
        art.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
  
    // Aplicar filtro de categoría
    if (this.activeFilter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(art => art.createdAt >= oneWeekAgo);
    } else if (this.activeFilter === 'saved') {
      // Para la demo, mostramos un subconjunto
      filtered = filtered.filter(art => parseInt(art.id) % 2 === 0);
    }
  
    // Aplicar ordenación
    if (this.sortOrder === 'newest') {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (this.sortOrder === 'oldest') {
      filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else if (this.sortOrder === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
  
    // Actualizar la paginación
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = 1;
  
    // Actualizar las obras filtradas utilizando el set
        
  }
  
  paginateArtworks(artworks: any[]): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return artworks.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.filterGallery();
    }
  }
  
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.filterGallery();
    }
  }
  
  resetFilters(): void {
    this.searchTerm = '';
    this.activeFilter = 'all';
    this.sortOrder = 'newest';
    this.filterGallery();
  }
  
  formatDate(date: Date): string {
    // Format date as "DD/MM/YYYY"
    return date.toLocaleDateString();
  }
  
  getStyleName(style: string): string {
    switch (style) {
      case 'retro':
        return 'Retro 8-bit';
      case 'modern':
        return 'Moderno 16-bit';
      case 'minimalist':
        return 'Minimalista';
      case 'dithered':
        return 'Dithering';
      case 'isometric':
        return 'Isométrico';
      default:
        return 'Estándar';
    }
  }
  
  getAnimationClass(art: any): string {
    if (art.isAnimated) {
      switch (art.animationType) {
        case 'breathing':
          return 'animation-breathing';
        case 'flickering':
          return 'animation-flickering';
        case 'floating':
          return 'animation-floating';
        default:
          return '';
      }
    }
    return '';
  }
  
  openArtwork(id: string): void {
    this.router.navigate(['/editor'], { queryParams: { art: id } });
  }
}