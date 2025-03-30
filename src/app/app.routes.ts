import { Routes } from '@angular/router';
import { ViewComponent } from './features/view/view.component';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'editor',
        loadComponent: () => import('./features/editor/editor.component').then(m => m.EditorComponent)
      },
      {
        path: 'gallery',
        loadComponent: () => import('./features/gallery/gallery.component').then(m => m.GalleryComponent)
      },
      { path: 'view/:id', component: ViewComponent },
      {
        path: '**',
        redirectTo: ''
      }
  
];
