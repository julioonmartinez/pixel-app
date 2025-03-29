import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string {
    // Si la URL es nula o undefined, devolver una imagen por defecto
    if (!url) {
      return 'assets/images/placeholder.png';
    }
    
    // Si la URL ya es absoluta (comienza con http o https), la devolvemos tal cual
    if (url.startsWith('http')) {
      return url;
    }
    
    // Si estamos en desarrollo local con proxy, usamos la URL relativa
    if (environment.apiBaseUrl === '') {
      return url;
    }
    
    // En otro caso, construimos la URL absoluta
    return `${environment.apiBaseUrl}${url}`;
  }
}