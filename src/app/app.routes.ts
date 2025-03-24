import { Routes } from '@angular/router';

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
    //   {
    //     path: 'tutorials',
    //     loadComponent: () => import('./features/tutorials/tutorials.component').then(m => m.TutorialsComponent)
    //   },
    //   {
    //     path: 'community',
    //     loadComponent: () => import('./features/community/community.component').then(m => m.CommunityComponent)
    //   },
      {
        path: '**',
        redirectTo: ''
      }
  
];
