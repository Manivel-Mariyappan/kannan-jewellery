import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./admin-login').then((m) => m.AdminLogin), title: 'Admin login | Kannan Jewellery' },
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      { path: 'products', loadComponent: () => import('./admin-products').then((m) => m.AdminProducts), title: 'Products | Admin' },
      { path: 'products/new', loadComponent: () => import('./admin-product-form').then((m) => m.AdminProductForm), title: 'New product | Admin' },
      { path: 'products/:id', loadComponent: () => import('./admin-product-form').then((m) => m.AdminProductForm), title: 'Edit product | Admin' },
      { path: 'gold-rate', loadComponent: () => import('./admin-gold-rate').then((m) => m.AdminGoldRate), title: 'Gold rate | Admin' },
      { path: 'settings', loadComponent: () => import('./admin-settings').then((m) => m.AdminSettings), title: 'Shop settings | Admin' },
      { path: 'publish', loadComponent: () => import('./admin-publish').then((m) => m.AdminPublish), title: 'Publish | Admin' },
    ],
  },
];
