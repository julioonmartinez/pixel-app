// src/app/features/editor/editor.component.ts
import { Component, inject, computed, signal, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, finalize, debounceTime } from 'rxjs';

// Servicios y modelos
import { PixelArtService } from '../../core/services/pixel-art.service';
import { AnimationType, PixelArt } from '../../core/models/pixel-art.model';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { StyleOptionsComponent } from './components/style-options/style-options.component';
import { TextPromptComponent } from '../text-prompt/text-prompt.component';
import { BackgroundOptionsComponent } from './components/background-options/background-options.component';
import { PixelArtGridComponent } from '../../shared/components/pixel-art-grid/pixel-art-grid.component';
import { PreviewComponent } from './components/preview/preview.component';
import { VersionHistoryComponent } from '../pixel-art/version-history/version-history.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { FormsModule } from '@angular/forms';

// Tipo para las pestañas disponibles
export type TabType = 'upload' | 'prompt' | 'pixelArt';

/**
 * Componente principal para el editor de Pixel Art
 * 
 * Este componente maneja tres modos principales:
 * - Creación desde imagen subida
 * - Creación desde prompt de texto
 * - Edición de pixel arts existentes
 */
@Component({
  selector: 'app-editor',
  standalone: true,
  imports:[
    ButtonComponent,
    CardComponent,
    ImageUploadComponent,
    StyleOptionsComponent,
    TextPromptComponent,
    BackgroundOptionsComponent,
    PixelArtGridComponent,
    PreviewComponent,
    VersionHistoryComponent,
    DialogComponent,
    FormsModule
  ],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy {
  // Referencia al elemento de URL compartida para poder seleccionarlo fácilmente
  @ViewChild('shareUrlInput') shareUrlInput!: ElementRef<HTMLInputElement>;
  
  // Servicios inyectados
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pixelArtService = inject(PixelArtService);
  
  // Subject para manejo de suscripciones
  private destroy$ = new Subject<void>();
  
  // Signals para el estado del componente
  activeTab = signal<TabType>('prompt');
  isUpdateImage = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  pixelArts = signal<PixelArt[] | null>(null);

  // Signals para los diálogos
  showSaveDialogFlag = signal<boolean>(false);
  showShareDialogFlag = signal<boolean>(false);
  copySuccess = signal<boolean>(false);

  // Formularios para diálogos
  saveArtName = '';
  saveArtTags = '';
  shareUrl = '';

  // Signals del servicio
  resultImage = this.pixelArtService.resultImage;
  resultPixelArt = this.pixelArtService.resultPixelArt;
  isProcessing = this.pixelArtService.isProcessing;
  
  // Computed properties para estado derivado
  hasResultImage = computed(() => !!this.resultImage());
  
  // Determina si se debe mostrar la vista previa
  shouldShowPreview = computed(() => 
    (this.activeTab() === 'upload' || this.activeTab() === 'prompt') || 
    (this.activeTab() === 'pixelArt' && !!this.resultPixelArt())
  );

  // Computed property para determinar si estamos en modo edición
  readonly isEditMode = computed(() => 
    this.isUpdateImage() && !!this.resultPixelArt()
  );
  
  // Determina qué píxel art mostrar en el historial de versiones (si alguno)
  readonly activeVersionHistory = computed(() => {
    if (this.activeTab() === 'pixelArt' && this.resultPixelArt()) {
      return this.resultPixelArt();
    }
    // En otras pestañas no mostramos historial de versiones
    return null;
  });
  
  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    // Inicializar con base en parámetros de URL
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(50) // Debounce para evitar múltiples cambios rápidos
      )
      .subscribe(params => {
        this.handleQueryParams(params);
      });

    // Monitorear cambios en el resultPixelArt para depuración
    // this.pixelArtService.resultPixelArt.subscribe(art => {
    //   if (art) {
    //     console.log('📋 resultPixelArt actualizado en EditorComponent:', art.id);
    //   }
    // });
  }
  
  /**
   * Limpieza al destruir el componente
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Procesa los parámetros de la URL
   */
  private handleQueryParams(params: any): void {
    console.log('📍 Parámetros URL recibidos:', params);
    
    // Configurar pestaña activa
    if (params['mode'] && this.isValidTab(params['mode'])) {
      this.setActiveTab(params['mode'] as TabType, false);
      // No reseteamos isUpdateImage aquí para mantener el modo de edición
    }
    
    // Cargar arte existente si se proporciona un ID
    if (params['art']) {
      this.isUpdateImage.set(true);
      this.loadExistingPixelArt(params['art']);
    } else {
      this.isUpdateImage.set(false);
    }
  }

  /**
   * Verifica si el valor de pestaña es válido
   */
  private isValidTab(tab: string): boolean {
    return ['upload', 'prompt', 'pixelArt'].includes(tab);
  }
  
  /**
   * Cambiar a la pestaña seleccionada
   * @param tab Tab a activar
   * @param updateUrl Si se debe actualizar la URL
   */
  setActiveTab(tab: TabType, updateUrl = true): void {
    const previousTab = this.activeTab();
    this.activeTab.set(tab);
    
    console.log(`🔄 Cambiando de tab ${previousTab} → ${tab}, updateUrl=${updateUrl}`);
    
    // Actualizar la URL
    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { mode: tab },
        queryParamsHandling: 'merge'
      });
    }
    
    // Manejar el cambio de contexto según la pestaña
    if (tab === 'pixelArt') {
      this.handlePixelArtTab();
    } else {
      // En las pestañas de upload y prompt, siempre limpiamos la imagen resultado
      // pero mantenemos el pixel art de referencia por si necesitamos sus datos
      this.pixelArtService.resultImage.set(null);
    }
  }
  
  /**
   * Manejar la activación de la pestaña de Pixel Art
   */
  private handlePixelArtTab(): void {
    // Si hay un pixel art cargado, mostrar su imagen
    if (this.resultPixelArt() && this.resultPixelArt()?.imageUrl) {
      this.pixelArtService.resultImage.set(this.resultPixelArt()?.imageUrl!);
    }
    
    // Cargar la lista de pixel arts si no está cargada
    if (!this.pixelArts()) {
      this.loadPixelArtList();
    }
  }
  
  /**
   * Cargar la lista de pixel arts
   */
  private loadPixelArtList(): void {
    this.isLoading.set(true);
    this.pixelArtService.getPixelArtList().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (arts) => {
        console.log(`📊 Lista cargada: ${arts.length} pixel arts`);
        this.pixelArts.set(this.pixelArtService.getPixelArts());
      },
      error: (error) => {
        console.error('❌ Error al cargar la lista de pixel arts:', error);
      }
    });
  }
  
  /**
   * Manejar selección de pixel art de la galería
   */
  onArtworkSelect(art: PixelArt): void {
    console.log('🖱️ Pixel art seleccionado:', art.id);
    this.router.navigate([], { 
      relativeTo: this.route,
      queryParams: { art: art.id, mode: 'pixelArt' },
      queryParamsHandling: 'merge'
    });
  }
  
  /**
   * Cargar pixel art existente por ID
   */
  private loadExistingPixelArt(id: string): void {
    console.log(`🔍 Cargando pixel art con ID: ${id}`);
    
    // Indicar explícitamente que estamos en modo edición
    this.isUpdateImage.set(true);
    
    this.pixelArtService.getPixelArtById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (art) => {
        if (art) {
          console.log('✅ Pixel art cargado correctamente:', art.id);
          
          // Actualizar el resultPixelArt en el servicio
          this.pixelArtService.resultPixelArt.set(art);
          
          // Actualizar la imagen según la pestaña activa
          if (this.activeTab() === 'pixelArt') {
            this.pixelArtService.resultImage.set(art.imageUrl);
          }
          
          // Actualizar settings
          this.pixelArtService.updateSettings({
            pixelSize: art.pixelSize,
            style: art.style,
            backgroundType: art.backgroundType,
            animationType: art.animationType || AnimationType.NONE,
            paletteId: art.palette.id
          });
          
          // Cargar prompt
          if (art.prompt) {
            this.pixelArtService.sourcePrompt.set(art.prompt);
          }
        }
      },
      error: (error) => {
        console.error(`❌ Error al cargar pixel art con ID ${id}:`, error);
        this.isUpdateImage.set(false); // Revertir al modo normal si hay error
      }
    });
  }
  
  /**
   * Manejar selección de imagen en la pestaña de carga
   */
  onImageSelected(data: {image: string, prompt?: string}): void {
    console.log('📸 Imagen seleccionada', data.prompt ? 'con prompt' : 'sin prompt');
    this.pixelArtService.setSourceImage(data.image, false);
    
    // Procesar inmediatamente con prompt adicional si se proporciona
    this.pixelArtService.processImage(data.prompt).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        if (result) {
          console.log('✅ Imagen procesada correctamente');
        }
      },
      error: (error) => {
        console.error('❌ Error al procesar imagen:', error);
      }
    });
  }
  
  /**
   * Maneja las acciones de prompt, tanto nuevas como actualizaciones
   */
  onPromptAction(data: string | {id: string, prompt: string}): void {
    console.log('📢 Acción de prompt recibida:', typeof data === 'string' ? 'Nuevo prompt' : `Actualización de ${data.id}`);
    
    if (typeof data === 'string') {
      // Es un prompt simple para generar nuevo pixel art
      this.onPromptSubmitted(data);
    } else {
      // Es una actualización, actualizar pixel art existente
      this.onPromptUpdate(data);
    }
  }
  
  /**
   * Manejar envío de prompt en la pestaña de texto para crear nuevo pixel art
   */
  onPromptSubmitted(prompt: string): void {
    console.log('📝 Prompt recibido para generación:', prompt);
    
    if (this.isUpdateImage() && this.resultPixelArt()) {
      // Si estamos en modo edición y tenemos un pixelArt disponible
      console.log('🔄 Redirigiendo a actualización por estar en modo edición');
      this.onPromptUpdate({
        id: this.resultPixelArt()!.id,
        prompt: prompt
      });
    } else {
      // Modo normal de generación
      this.pixelArtService.setSourcePrompt(prompt);
      
      // Verificar si necesitamos suscribirnos manualmente para asegurar la ejecución
      if (prompt.length <= 10) {
        console.log('🚀 Ejecutando generación manualmente por prompt corto');
        this.pixelArtService.generateFromPrompt().pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (result) => {
            if (result) {
              console.log('✅ Pixel art generado exitosamente');
            }
          },
          error: (error) => {
            console.error('❌ Error al generar pixel art:', error);
          }
        });
      }
    }
  }
  
  /**
   * Manejar actualización de un pixel art existente
   */
  onPromptUpdate(data: {id: string, prompt: string}): void {
    console.log(`🔄 Actualizando pixel art ${data.id} con nuevo prompt: ${data.prompt}`);
    
    // Llamar al método updatePixelArtWithPrompt del servicio
    this.pixelArtService.updatePixelArtWithPrompt(data.id, data.prompt)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedArt) => {
          if (updatedArt) {
            console.log('✅ Pixel art actualizado exitosamente');
          } else {
            console.warn('⚠️ No se recibió respuesta al actualizar el pixel art');
          }
        },
        error: (error) => {
          console.error('❌ Error al actualizar el pixel art:', error);
        }
      });
  }
  
  /**
   * Descargar la imagen generada
   */
  downloadImage(): void {
    if (!this.resultImage()) return;
    
    try {
      fetch(this.resultImage()!)
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
        })
        .catch(error => {
          console.error('Error al descargar la imagen:', error);
        });
    } catch (error) {
      console.error('Error en proceso de descarga:', error);
    }
  }
  
  /**
   * Mostrar diálogo para guardar pixel art
   */
  showSaveDialog(): void {
    this.saveArtName = `Pixel Art ${new Date().toLocaleDateString()}`;
    this.saveArtTags = '';
    this.showSaveDialogFlag.set(true);
  }
  
  /**
   * Cerrar diálogo de guardado
   */
  closeSaveDialog(): void {
    this.showSaveDialogFlag.set(false);
  }
  
  /**
   * Guardar pixel art
   */
  savePixelArt(): void {
    if (!this.saveArtName.trim()) {
      this.saveArtName = `Pixel Art ${new Date().toLocaleDateString()}`;
    }
    
    // Convertir tags a array
    const tags = this.saveArtTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    console.log('💾 Guardando pixel art:', this.saveArtName, tags);
    const savedArt = this.pixelArtService.savePixelArt(this.saveArtName, tags);
    this.closeSaveDialog();
    
    if (savedArt) {
      console.log('✅ Pixel art guardado exitosamente:', savedArt.id);
    } else {
      console.warn('⚠️ No se pudo guardar el pixel art');
    }
  }
  
  /**
   * Mostrar diálogo para compartir pixel art
   */
  showShareDialog(): void {
    if (!this.resultImage()) return;
    
    // Generar URL para compartir
    const currentUrl = window.location.href.split('?')[0];
    const artId = this.resultPixelArt()?.id || new Date().getTime().toString();
    this.shareUrl = `${currentUrl}?art=${artId}`;
    
    console.log('🔗 URL de compartir generada:', this.shareUrl);
    this.showShareDialogFlag.set(true);
    this.copySuccess.set(false);
  }
  
  /**
   * Cerrar diálogo de compartir
   */
  closeShareDialog(): void {
    this.showShareDialogFlag.set(false);
  }
  
  /**
   * Copiar URL de compartir al portapapeles
   */
  copyShareUrl(): void {
    if (this.shareUrlInput) {
      // Seleccionar el texto del input
      this.shareUrlInput.nativeElement.select();
      
      // Copiar al portapapeles
      navigator.clipboard.writeText(this.shareUrl)
        .then(() => {
          console.log('📋 URL copiada al portapapeles');
          this.copySuccess.set(true);
          setTimeout(() => {
            this.copySuccess.set(false);
          }, 3000);
        })
        .catch(err => {
          console.error('❌ Error al copiar al portapapeles:', err);
        });
    } else {
      // Fallback si la referencia no está disponible
      navigator.clipboard.writeText(this.shareUrl).then(() => {
        this.copySuccess.set(true);
        setTimeout(() => {
          this.copySuccess.set(false);
        }, 3000);
      });
    }
  }
  
  /**
   * Compartir en redes sociales
   */
  shareToSocial(platform: 'twitter' | 'facebook'): void {
    let shareUrl = '';
    const text = `Mira este pixel art que he creado: ${this.saveArtName || 'Pixel Art'}`;
    
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.shareUrl)}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareUrl)}`;
    }
    
    console.log(`🌐 Compartiendo en ${platform}`);
    window.open(shareUrl, '_blank');
  }
}