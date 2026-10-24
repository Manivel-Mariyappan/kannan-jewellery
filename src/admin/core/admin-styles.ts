import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

/** The website shell (src/app/app.ts) removes this link and class when leaving /admin. */
const LINK_ID = 'kj-admin-css';
/** Built from the `admin` style bundle in angular.json (Bootstrap + ng-select + admin theme). */
const HREF = 'admin.css';

/**
 * The admin portal shares the app with the public website but must not share its styling.
 * Bootstrap is loaded only when entering /admin, and `html.kj-admin` switches off the
 * website's own component classes (see src/styles.scss).
 */
export const adminStylesGuard: CanActivateFn = () => {
  const doc = inject(DOCUMENT);
  doc.documentElement.classList.add('kj-admin');
  const existing = doc.getElementById(LINK_ID) as HTMLLinkElement | null;
  if (existing) return true;
  const link = doc.createElement('link');
  link.id = LINK_ID;
  link.rel = 'stylesheet';
  link.href = HREF;
  doc.head.appendChild(link);
  // Wait for the stylesheet so the admin never flashes unstyled; continue anyway on error.
  return new Promise<boolean>((resolve) => {
    link.onload = () => resolve(true);
    link.onerror = () => resolve(true);
  });
};

