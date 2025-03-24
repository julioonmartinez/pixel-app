// src/app/shared/directives/pixelate.directive.ts
import { Directive, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ImageProcessor } from '../../core/utils/image-processor';

@Directive({
  selector: 'img[appPixelate]',
  standalone: true
})
export class PixelateDirective implements OnChanges {
  private el = inject(ElementRef<HTMLImageElement>);
  
  @Input() pixelSize = 8;
  @Input() palette: string[] = [];
  @Input() dithering = false;
  
  ngOnChanges(changes: SimpleChanges): void {
    if (this.el.nativeElement.complete) {
      this.processImage();
    } else {
      this.el.nativeElement.onload = () => this.processImage();
    }
  }
  
  private processImage(): void {
    const img = this.el.nativeElement;
    
    // Create an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply pixelation
    let processedData = ImageProcessor.pixelate(imageData, this.pixelSize);
    
    // Apply palette if provided
    if (this.palette.length > 0) {
      if (this.dithering) {
        processedData = ImageProcessor.applyDithering(processedData, this.palette);
      } else {
        processedData = ImageProcessor.applyPalette(processedData, this.palette);
      }
    }
    
    // Put the processed data back on the canvas
    ctx.putImageData(processedData, 0, 0);
    
    // Update the image source with the canvas data
    img.src = canvas.toDataURL('image/png');
    
    // Add CSS for pixelated rendering
    img.style.imageRendering = 'pixelated';
  }
}