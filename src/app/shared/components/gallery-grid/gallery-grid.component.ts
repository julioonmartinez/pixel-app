// src/app/shared/components/gallery-grid/gallery-grid.component.ts
import { 
    Component, 
    Input, 
    Output, 
    EventEmitter, 
    signal, 
    computed, 
    model, 
    WritableSignal 
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { CardComponent } from '../../components/card/card.component';
  import { ButtonComponent } from '../../components/button/button.component';
  import { ImageUrlPipe } from '../../pipes/image-url.pipe';
  
  export interface PixelArtwork {
    id: string;
    name: string;
    thumbnailUrl: string;
    createdAt: string | Date;
    style?: string;
    tags?: string[];
    isAnimated?: boolean;
    animationType?: 'breathing' | 'flickering' | 'floating';
    [key: string]: any; // Para propiedades adicionales
  }
  
  export type ViewMode = 'grid' | 'list';
  export type FilterType = 'all' | 'saved' | 'recent';
  export type SortOrder = 'newest' | 'oldest' | 'name';
  
  @Component({
    selector: 'app-gallery-grid',
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      CardComponent,
      ButtonComponent,
      ImageUrlPipe
    ],
    template: `
      <div class="gallery-container">
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
                [class.active]="activeFilter() === 'all'"
                (click)="setFilter('all')"
              >
                Todos
              </button>
              <button 
                class="filter-btn" 
                [class.active]="activeFilter() === 'saved'"
                (click)="setFilter('saved')"
              >
                Guardados
              </button>
              <button 
                class="filter-btn" 
                [class.active]="activeFilter() === 'recent'"
                (click)="setFilter('recent')"
                data-testid="recent-filter"
              >
                Recientes
              </button>
            </div>
          </div>
          
          <div class="right-controls">
            <div class="view-mode-toggle">
              <button 
                class="view-mode-btn" 
                [class.active]="viewMode() === 'grid'"
                (click)="setViewMode('grid')"
                aria-label="Vista de cuadrícula"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button 
                class="view-mode-btn" 
                [class.active]="viewMode() === 'list'"
                (click)="setViewMode('list')"
                aria-label="Vista de lista"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
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
        </div>
        
        @if (isLoading()) {
          <div class="processing-indicator">
            <div class="spinner"></div>
            <p>Cargando imágenes...</p>
            <p class="processing-hint">Esto puede tardar unos milisegundos.</p>
          </div>
        } @else if (filteredArtworks().length === 0) {
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
          @if (viewMode() === 'grid') {
            <div class="gallery-grid">
              @for (art of filteredArtworks(); track art.id) {
                <app-card [clickable]="true" (click)="onArtworkClick(art)">
                  <div class="gallery-item">
                    <div class="gallery-image" [ngClass]="getAnimationClass(art)">
                      <img 
                        [src]="art.thumbnailUrl | imageUrl" 
                        [alt]="art.name || 'Pixel Art'"
                        class="image-loading"
                        (load)="onImageLoad($event)"
                      />
                    </div>
                    <div class="gallery-info">
                      <h3 class="gallery-item-title">{{ art.name || 'Sin título' }}</h3>
                      
                      <div class="gallery-meta">
                        <span class="creation-date">{{ formatDate(art.createdAt) }}</span>
                        <span class="style-badge" [ngClass]="'style-' + art.style">
                          {{ getStyleName(art.style) }}
                        </span>
                      </div>
                      
                      @if (art.tags && art.tags.length > 0) {
                        <div class="gallery-tags">
                          @for (tag of art.tags.slice(0, 3); track tag) {
                            <span class="tag">{{ tag }}</span>
                          }
                          @if (art.tags.length > 3) {
                            <span class="tag tag-more">+{{ art.tags.length - 3 }}</span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </app-card>
              }
            </div>
          } @else {
            <div class="gallery-list">
              @for (art of filteredArtworks(); track art.id) {
                <app-card [clickable]="true" (click)="onArtworkClick(art)">
                  <div class="list-item">
                    <div class="list-item-image" [ngClass]="getAnimationClass(art)">
                      <img 
                        [src]="art.thumbnailUrl | imageUrl" 
                        [alt]="art.name || 'Pixel Art'"
                        class="image-loading"
                        (load)="onImageLoad($event)"
                      />
                    </div>
                    <div class="list-item-content">
                      <h3 class="list-item-title">{{ art.name || 'Sin título' }}</h3>
                      
                      <div class="list-item-details">
                        <span class="creation-date">{{ formatDate(art.createdAt) }}</span>
                        <span class="style-badge" [ngClass]="'style-' + art.style">
                          {{ getStyleNameMobile(art.style) }}
                        </span>
                      </div>
                      
                      @if (art.tags && art.tags.length > 0) {
                        <div class="list-item-tags">
                          @for (tag of art.tags.slice(0, 2); track tag) {
                            <span class="tag">{{ tag }}</span>
                          }
                          @if (art.tags.length > 2) {
                            <span class="tag tag-more">+{{ art.tags.length - 2 }}</span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </app-card>
              }
            </div>
          }
        }
        
        @if (filteredArtworks().length > 0 && totalPages() > 1) {
          <div class="gallery-pagination">
            <app-button 
              variant="secondary" 
              [disabled]="currentPage() === 1"
              (onClick)="previousPage()"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Anterior
            </app-button>
            
            <span class="page-info">
              Página {{ currentPage() }} de {{ totalPages() }}
            </span>
            
            <app-button 
              variant="secondary" 
              [disabled]="currentPage() === totalPages()"
              (onClick)="nextPage()"
            >
              Siguiente
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </app-button>
          </div>
        }
      </div>
    `,
    styleUrls: ['./gallery-grid.component.scss']
  })
  export class GalleryGridComponent {
    // Inputs
    @Input() artworks: WritableSignal<PixelArtwork[]> = signal([]);
    @Input() isLoading: WritableSignal<boolean> = signal(false);
    @Input() defaultItemsPerPage: number = 9;
    @Input() defaultSortOrder: SortOrder = 'newest';
    @Input() defaultViewMode: ViewMode = 'grid';
    
    // Outputs
    @Output() artworkClick = new EventEmitter<PixelArtwork>();
    @Output() viewModeChange = new EventEmitter<ViewMode>();
    
    // Internal signals
    readonly searchTerm = signal<string>('');
    readonly activeFilter = signal<FilterType>('all');
    readonly sortOrder = signal<SortOrder>('newest');
    readonly currentPage = signal<number>(1);
    readonly itemsPerPage = signal<number>(9);
    readonly viewMode = model<ViewMode>('grid');
  
    // Computed signals
    readonly filteredArtworks = computed(() => {
      let filtered = [...this.artworks()];
    
      // Aplicar el filtro de búsqueda
      if (this.searchTerm().trim()) {
        const term = this.searchTerm().toLowerCase();
        filtered = filtered.filter(art => 
          (art.name?.toLowerCase().includes(term)) || 
          (art.tags && art.tags.some(tag => tag.toLowerCase().includes(term)))
        );
      }
    
      // Aplicar filtro de categoría
      if (this.activeFilter() === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(art => new Date(art.createdAt) >= oneWeekAgo);
      } else if (this.activeFilter() === 'saved') {
        // Para demo, filtramos por ID par - reemplazar con tu lógica real
        filtered = filtered.filter(art => {
          // Intenta convertir a número si es string
          const id = typeof art.id === 'string' ? parseInt(art.id, 10) : art.id;
          return isNaN(id) ? false : id % 2 === 0;
        });
      }
    
      // Aplicar ordenación
      if (this.sortOrder() === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (this.sortOrder() === 'oldest') {
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (this.sortOrder() === 'name') {
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
    
      // Aplicar paginación
      const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
      return filtered.slice(startIndex, startIndex + this.itemsPerPage());
    });
    
    readonly totalPages = computed(() => 
      Math.max(1, Math.ceil(this.countTotalFilteredItems() / this.itemsPerPage()))
    );
    
    // Helper computed para calcular el total de items antes de paginación
    private countTotalFilteredItems = computed(() => {
      let filtered = [...this.artworks()];
    
      // Aplicar el filtro de búsqueda
      if (this.searchTerm().trim()) {
        const term = this.searchTerm().toLowerCase();
        filtered = filtered.filter(art => 
          (art.name?.toLowerCase().includes(term)) || 
          (art.tags && art.tags.some(tag => tag.toLowerCase().includes(term)))
        );
      }
    
      // Aplicar filtro de categoría
      if (this.activeFilter() === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(art => new Date(art.createdAt) >= oneWeekAgo);
      } else if (this.activeFilter() === 'saved') {
        // Para demo, filtramos por ID par - reemplazar con tu lógica real
        filtered = filtered.filter(art => {
          const id = typeof art.id === 'string' ? parseInt(art.id, 10) : art.id;
          return isNaN(id) ? false : id % 2 === 0;
        });
      }
      
      return filtered.length;
    });
  
    constructor() {
      // Inicializar con valores por defecto
      this.itemsPerPage.set(this.defaultItemsPerPage);
      this.sortOrder.set(this.defaultSortOrder);
      this.viewMode.set(this.defaultViewMode);
    }
  
    // Event handlers
    onArtworkClick(artwork: PixelArtwork): void {
      this.artworkClick.emit(artwork);
    }
  
    onImageLoad(event: Event): void {
      const img = event.target as HTMLImageElement;
      if (img) {
        img.classList.add('loaded');
      }
    }
  
    // Actions
    setFilter(filter: FilterType): void {
      this.activeFilter.set(filter);
      this.currentPage.set(1); // Reset a primera página cuando cambia el filtro
    }
    
    setViewMode(mode: ViewMode): void {
      this.viewMode.set(mode);
      this.viewModeChange.emit(mode);
    }
    
    filterGallery(): void {
      // Solo actualiza la página - todo el filtrado ocurre en signals computados
      this.currentPage.set(1);
    }
    
    nextPage(): void {
      if (this.currentPage() < this.totalPages()) {
        this.currentPage.update(page => page + 1);
      }
    }
    
    previousPage(): void {
      if (this.currentPage() > 1) {
        this.currentPage.update(page => page - 1);
      }
    }
    
    resetFilters(): void {
      this.searchTerm.set('');
      this.activeFilter.set('all');
      this.sortOrder.set('newest');
      this.currentPage.set(1);
    }
    
    // Utility methods
    formatDate(date: Date | string | undefined): string {
      if (!date) return 'Fecha desconocida';
      
      try {
        const dateObj = new Date(date);
        
        // En dispositivos móviles, usar formato más compacto
        if (window.innerWidth <= 576) {
          return dateObj.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
          });
        }
        
        // En otros dispositivos, formato normal
        return dateObj.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch (e) {
        console.error('Error al formatear fecha:', e);
        return 'Fecha inválida';
      }
    }
    
    getStyleName(style: string | undefined): string {
      if (!style) return 'Estándar';
      
      switch (style.toLowerCase()) {
        case 'retro':
        case 'retro_8bit':
          return 'Retro 8-bit';
        case 'modern':
        case 'modern_16bit':
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
    
    getStyleNameMobile(style: string | undefined): string {
      if (!style) return 'Std';
      
      // Si estamos en móvil o en vista de lista, devolver nombres abreviados
      if (window.innerWidth <= 576 || this.viewMode() === 'list') {
        switch (style.toLowerCase()) {
          case 'retro':
          case 'retro_8bit':
            return 'Retro';
          case 'modern':
          case 'modern_16bit':
            return 'Modern';
          case 'minimalist':
            return 'Minim';
          case 'dithered':
            return 'Dither';
          case 'isometric':
            return 'Iso';
          default:
            return 'Std';
        }
      }
      
      // En otros dispositivos, usar el método normal
      return this.getStyleName(style);
    }
    
    getAnimationClass(art: PixelArtwork): string {
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
  }