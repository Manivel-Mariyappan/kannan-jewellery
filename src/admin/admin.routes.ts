import { Routes } from '@angular/router';
import { NgbDateParserFormatter, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { provideSweetAlert2 } from '@sweetalert2/ngx-sweetalert2';
import { adminGuard } from './core/admin.guard';
import { adminStylesGuard } from './core/admin-styles';
import { AdminAlerts } from './core/alerts.service';
import { DmyDateFormatter } from './core/date-formatter';

// Lazy-loaded from app.routes.ts, so website visitors never download any of this.
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminStylesGuard],
    // NgbOffcanvas is provided again here so the offcanvas forms can inject AdminAlerts.
    providers: [
      provideSweetAlert2(),
      AdminAlerts,
      NgbOffcanvas,
      { provide: NgbDateParserFormatter, useClass: DmyDateFormatter },
    ],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
        title: 'Admin login | Kannan Jewellery',
      },
      {
        path: '',
        canActivate: [adminGuard],
        loadComponent: () => import('./layout/admin-shell').then((m) => m.AdminShell),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'products' },
          {
            path: 'products',
            loadComponent: () =>
              import('./pages/products/products-page').then((m) => m.ProductsPage),
            title: 'Products | Admin',
            data: { heading: 'Products' },
          },
          {
            path: 'categories',
            loadComponent: () =>
              import('./pages/categories/categories-page').then((m) => m.CategoriesPage),
            title: 'Categories | Admin',
            data: { heading: 'Categories' },
          },
          {
            path: 'enquiries',
            loadComponent: () =>
              import('./pages/enquiries/enquiries-page').then((m) => m.EnquiriesPage),
            title: 'Enquiries | Admin',
            data: { heading: 'Enquiries' },
          },
          {
            path: 'users',
            loadComponent: () => import('./pages/users/users-page').then((m) => m.UsersPage),
            title: 'Admin users | Admin',
            data: { heading: 'Admin users' },
          },
          {
            path: 'gold-rate',
            loadComponent: () =>
              import('./pages/gold-rate/gold-rate-page').then((m) => m.GoldRatePage),
            title: 'Gold rate | Admin',
            data: { heading: 'Gold rate' },
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./pages/settings/settings-page').then((m) => m.SettingsPage),
            title: 'Shop settings | Admin',
            data: { heading: 'Shop settings' },
          },
          {
            path: 'publish',
            loadComponent: () => import('./pages/publish/publish-page').then((m) => m.PublishPage),
            title: 'Publish | Admin',
            data: { heading: 'Publish changes' },
          },
        ],
      },
    ],
  },
];
