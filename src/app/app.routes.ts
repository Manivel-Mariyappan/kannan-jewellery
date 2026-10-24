import { Routes } from '@angular/router';
import { Home } from './features/home/home';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'collections',
    loadComponent: () => import('./features/collections/collections').then((m) => m.Collections),
  },
  {
    path: 'collections/:category',
    loadComponent: () => import('./features/collections/collections').then((m) => m.Collections),
  },
  {
    path: 'jewellery/:slug',
    loadComponent: () =>
      import('./features/product-detail/product-detail').then((m) => m.ProductDetail),
  },
  { path: 'bridal', loadComponent: () => import('./features/bridal/bridal').then((m) => m.Bridal) },
  { path: 'about', loadComponent: () => import('./features/about/about').then((m) => m.About) },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'admin',
    loadChildren: () => import('../admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', loadComponent: () => import('./features/not-found').then((m) => m.NotFound) },
];
