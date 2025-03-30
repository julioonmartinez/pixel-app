// src/app/features/view/view.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';

// Servicios y modelos
import { PixelArtService } from '../../core/services/pixel-art.service';
import { PixelArt } from '../../core/models/pixel-art.model';

// Componentes compartidos
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { VersionHistoryComponent } from '../pixel-art/version-history/version-history.component';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';

/**
 * Componente dedicado a la visualización de un Pixel Art específico
 * Accesible mediante la ruta /view/:id
 */
@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    VersionHistoryComponent,
    ImageUrlPipe
  ],
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit, OnDestroy {
  // Servicios inyectados
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pixelArtService = inject(PixelArtService);
  
  // Inyectar PLATFORM_ID para detectar si estamos en el navegador o en el servidor
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  
  // Subject para manejar suscripciones
  private destroy$ = new Subject<void>();
  
  // Estado del componente
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  pixelArt = signal<PixelArt | null>(null);
  showVersions = signal<boolean>(false);
  copySuccess = signal<boolean>(false);
  shareUrl = signal<string>('');
  
  // Computed properties
  hasVersionHistory = computed(() => 
    !!this.pixelArt()?.versionHistory && this.pixelArt()!.versionHistory!.length > 0
  );
  
  /**
   * Verificar si estamos en el navegador
   */
  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
  
  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    // Obtener el ID del Pixel Art desde los parámetros de la URL
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.loadPixelArt(params['id']);
        } else {
          this.handleError('No se encontró un ID válido en la URL');
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
   * Carga los datos del Pixel Art desde el servicio
   */
  private loadPixelArt(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.pixelArtService.getPixelArtById(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (art) => {
          this.pixelArt.set(art);
          
          // Solo generar URL de compartir en el navegador
          if (this.isBrowser) {
            // Crear URL usando Location API que funciona en ambos entornos
            const url = this.getShareUrl(art.id);
            this.shareUrl.set(url);
          }
        },
        error: (err) => {
          console.error('Error al cargar el Pixel Art:', err);
          this.handleError('No se pudo cargar el Pixel Art. Puede que no exista o haya sido eliminado.');
        }
      });
  }
  
  /**
   * Genera una URL para compartir que sea segura para SSR
   */
  private getShareUrl(id: string): string {
    if (!this.isBrowser) {
      return '';
    }
    
    // Usar location API para construir la URL
    const location = document.location;
    const baseUrl = `${location.protocol}//${location.host}`;
    return `${baseUrl}/view/${id}`;
  }
  
  /**
   * Maneja errores del componente
   */
  private handleError(message: string): void {
    this.error.set(message);
    this.isLoading.set(false);
  }
  
  /**
   * Alterna la visibilidad del historial de versiones
   */
  toggleVersionHistory(): void {
    this.showVersions.update(current => !current);
  }
  
  /**
   * Navega al editor para editar el Pixel Art
   */
  editPixelArt(): void {
    if (!this.pixelArt()) return;
    
    this.router.navigate(['/editor'], { 
      queryParams: { 
        art: this.pixelArt()!.id,
        mode: 'pixelArt'
      }
    });
  }
  
  /**
   * Descargar la imagen del Pixel Art
   */
  downloadImage(): void {
    if (!this.isBrowser || !this.pixelArt() || !this.pixelArt()?.imageUrl) return;
    
    try {
      fetch(this.pixelArt()!.imageUrl)
        .then(response => response.blob())
        .then(blob => {
          // Crear URL para el blob
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Crear enlace de descarga
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = `${this.pixelArt()?.name || 'pixel-art'}-${Date.now()}.png`;
          
          // Simular clic y limpiar
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          window.URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
          console.error('Error al descargar la imagen:', error);
        });
    } catch (error) {
      console.error('Error en proceso de descarga:', error);
    }
  }
  
  /**
   * Copiar URL de compartir al portapapeles
   */
  copyShareUrl(): void {
    if (!this.isBrowser) return;
    
    navigator.clipboard.writeText(this.shareUrl())
      .then(() => {
        this.copySuccess.set(true);
        setTimeout(() => {
          this.copySuccess.set(false);
        }, 3000);
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles:', err);
      });
  }
  
  /**
   * Compartir en redes sociales
   */
  shareToSocial(platform: 'twitter' | 'facebook'): void {
    if (!this.isBrowser || !this.pixelArt()) return;
    
    let shareUrl = '';
    const text = `Mira este pixel art: ${this.pixelArt()?.name || 'Pixel Art'}`;
    
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.shareUrl())}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareUrl())}`;
    }
    
    window.open(shareUrl, '_blank');
  }
  
  /**
   * Formatea una fecha para mostrar
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Fecha desconocida';
    
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
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
  getStyleName(style: string | undefined): string {
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
   * Volver a la galería
   */
  navigateToGallery(): void {
    this.router.navigate(['/gallery']);
  }
}