// src/app/features/gallery/gallery.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Servicios y modelos
import { MockDataService } from '../../core/services/mock-data.service';
import { PixelArtService } from '../../core/services/pixel-art.service';
import { PixelArt } from '../../core/models/pixel-art.model';

// Componentes e imports de Angular
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Componentes compartidos
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { PixelArtDetailComponent } from './pixel-art-detail/pixel-art-detail.component';

/**
 * Componente de galería que muestra y filtra pixel arts
 */
@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, 
    CardComponent, 
    ButtonComponent, 
    ModalComponent,
    PixelArtDetailComponent,
    ImageUrlPipe
  ],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit, OnDestroy {
  // Servicios inyectados
  private mockDataService = inject(MockDataService);
  private pixelArtService = inject(PixelArtService);
  private router = inject(Router);
  
  // Subject para gestionar suscripciones
  private destroy$ = new Subject<void>();

  // Estado de carga desde el servicio
  isLoadingList = this.pixelArtService.isLoadingList;
  
  // Signals para el estado local
  readonly allArtworks = signal<PixelArt[]>([]);
  readonly searchTerm = signal<string>('');
  readonly activeFilter = signal<'all' | 'saved' | 'recent'>('all');
  readonly sortOrder = signal<'newest' | 'oldest' | 'name'>('newest');
  readonly itemsPerPage = signal<number>(9);
  readonly currentPage = signal<number>(1);

  // Signals para el modal
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedPixelArt = signal<PixelArt | null>(null);
  
  // Computed signals para datos derivados
  readonly filteredArtworks = computed<PixelArt[]>(() => {
    let filtered = [...this.allArtworks()];
  
    // Aplicar el filtro de búsqueda
    if (this.searchTerm().trim()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(art => 
        (art.name?.toLowerCase().includes(term) || false) || 
        this.tagsIncludeTerm(art.tags, term)
      );
    }
  
    // Aplicar filtro de categoría
    if (this.activeFilter() === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(art => new Date(art.createdAt) >= oneWeekAgo);
    } else if (this.activeFilter() === 'saved') {
      // Para la demo, mostramos un subconjunto
      filtered = filtered.filter(art => parseInt(art.id) % 2 === 0);
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
  
  // Helper computed para calcular el total de items antes de la paginación
  private countTotalFilteredItems = computed(() => {
    let filtered = [...this.allArtworks()];
  
    // Aplicar el filtro de búsqueda
    if (this.searchTerm().trim()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(art => 
        (art.name?.toLowerCase().includes(term) || false) || 
        this.tagsIncludeTerm(art.tags, term)
      );
    }
  
    // Aplicar filtro de categoría
    if (this.activeFilter() === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(art => new Date(art.createdAt) >= oneWeekAgo);
    } else if (this.activeFilter() === 'saved') {
      filtered = filtered.filter(art => parseInt(art.id) % 2 === 0);
    }
    
    return filtered.length;
  });
  
  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    // Cargar datos iniciales
    this.loadPixelArts();
    
    // Efecto para actualizar artworks cuando cambia savedPixelArts
    effect(() => {
      const arts = this.pixelArtService.savedPixelArts();
      if (arts && Array.isArray(arts)) {
        this.allArtworks.set(arts);
      }
    });
  }

  /**
   * Limpieza al destruir el componente
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista de pixel arts
   */
  private loadPixelArts(): void {
    this.pixelArtService.getPixelArtList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (arts) => {
          this.allArtworks.set(arts);
        },
        error: (error) => {
          console.error('Error al cargar la lista de pixel arts:', error);
        }
      });
  }
  
  /**
   * Comprueba si un array de tags incluye un término
   */
  private tagsIncludeTerm(tags: string[] | undefined, term: string): boolean {
    if (!tags || !Array.isArray(tags)) return false;
    return tags.some(tag => tag.toLowerCase().includes(term));
  }

  /**
   * Abre el modal de detalles para un pixel art
   */
  openPixelArtDetail(artwork: PixelArt): void {
    this.selectedPixelArt.set(artwork);
    this.isModalOpen.set(true);
  }
  
  /**
   * Cierra el modal de detalles
   */
  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedPixelArt.set(null);
  }

  /**
   * Navega al editor para editar un pixel art
   */
  editPixelArt(id: string): void {
    this.closeModal();
    this.router.navigate(['/editor'], { 
      queryParams: { art: id, mode: 'pixelArt' } 
    });
  }
  
  /**
   * Maneja el evento de carga de imágenes
   */
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.classList.add('loaded');
    }
  }

  /**
   * Descarga un pixel art
   */
  downloadPixelArt(imageUrl: string): void {
    if (!imageUrl) {
      console.error('URL de imagen indefinida');
      return;
    }
    
    try {
      fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
          // Crear URL para el blob
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Crear enlace de descarga
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = `pixel-art-${Date.now()}.png`;
          
          // Simular clic y limpiar
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          window.URL.revokeObjectURL(blobUrl);
          
          console.log(`Descargando imagen como ${downloadLink.download}`);
        })
        .catch(error => {
          console.error('Error al descargar la imagen:', error);
        });
    } catch (error) {
      console.error('Error en proceso de descarga:', error);
    }
  }

  /**
   * Comparte un pixel art
   */
  sharePixelArt(id: string): void {
    const shareUrl = `${window.location.origin}/view/${id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        console.log('Enlace copiado al portapapeles:', shareUrl);
        // Aquí podríamos mostrar una notificación de éxito
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles:', err);
      });
  }
  
  /**
   * Establece el filtro activo
   */
  setFilter(filter: 'all' | 'saved' | 'recent'): void {
    this.activeFilter.set(filter);
    this.currentPage.set(1); // Volver a la primera página al cambiar el filtro
  }
  
  /**
   * Aplica filtros y reinicia la paginación
   */
  filterGallery(): void {
    this.currentPage.set(1);
  }
  
  /**
   * Avanza a la siguiente página
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
    }
  }
  
  /**
   * Retrocede a la página anterior
   */
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }
  
  /**
   * Resetea todos los filtros
   */
  resetFilters(): void {
    this.searchTerm.set('');
    this.activeFilter.set('all');
    this.sortOrder.set('newest');
    this.currentPage.set(1);
  }
  
  /**
   * Formatea una fecha para mostrar
   */
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
  
  /**
   * Obtiene el nombre del estilo para mostrar
   */
  getStyleName(style: string): string {
    // Usar el método optimizado para evitar recálculos
    return this.getStyleNameOptimized(style);
  }
  
  /**
   * Obtiene la clase CSS para animaciones
   */
  getAnimationClass(art: PixelArt): string {
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
  
  /**
   * Cierra el modal al hacer clic en el backdrop
   */
  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  /**
   * Versión optimizada de getStyleName
   */
  getStyleNameOptimized(style: string | undefined): string {
    if (!style) return 'Estándar';
    
    // Usar un mapa para evitar múltiples condiciones switch
    const styleMap: Record<string, string> = {
      'retro': 'Retro 8-bit',
      'RETRO_8BIT': 'Retro 8-bit',
      'modern': 'Moderno 16-bit',
      'MODERN_16BIT': 'Moderno 16-bit',
      'minimalist': 'Minimalista',
      'MINIMALIST': 'Minimalista',
      'dithered': 'Dithering',
      'DITHERED': 'Dithering',
      'isometric': 'Isométrico',
      'ISOMETRIC': 'Isométrico'
    };
    
    return styleMap[style] || 'Estándar';
  }

  /**
   * Versión móvil del nombre de estilo
   */
  getStyleNameMobile(style: string | undefined): string {
    if (!style) return 'Std';
    
    // Si estamos en móvil, devolvemos nombres abreviados
    if (window.innerWidth <= 576) {
      const mobileStyleMap: Record<string, string> = {
        'retro': 'Retro',
        'RETRO_8BIT': 'Retro',
        'modern': 'Modern',
        'MODERN_16BIT': 'Modern',
        'minimalist': 'Minim',
        'MINIMALIST': 'Minim',
        'dithered': 'Dither',
        'DITHERED': 'Dither',
        'isometric': 'Iso',
        'ISOMETRIC': 'Iso'
      };
      
      return mobileStyleMap[style] || 'Std';
    }
    
    // En otros dispositivos, usar el método normal
    return this.getStyleName(style);
  }
}