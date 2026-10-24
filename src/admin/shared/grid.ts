import {
  AllCommunityModule,
  ICellRendererParams,
  ModuleRegistry,
  themeQuartz,
} from 'ag-grid-community';
import { assetUrl } from '../../app/core/utils/url';

ModuleRegistry.registerModules([AllCommunityModule]);

export const adminGridTheme = themeQuartz.withParams({
  accentColor: '#a8741f',
  fontFamily: 'Inter, system-ui, sans-serif',
  headerBackgroundColor: '#f7f5f1',
  headerFontWeight: 600,
  borderColor: '#ece8e1',
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

// Edit / Delete buttons for the actions column.
export function actionButtons<T>(onEdit: (row: T) => void, onDelete: (row: T) => void) {
  return (p: ICellRendererParams<T>) => {
    const wrap = document.createElement('div');
    wrap.className = 'd-flex gap-1 align-items-center h-100';
    const make = (label: string, cls: string, fn: (row: T) => void) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `btn btn-sm ${cls}`;
      b.textContent = label;
      b.onclick = () => p.data && fn(p.data);
      return b;
    };
    wrap.append(
      make('Edit', 'btn-outline-primary', onEdit),
      make('Delete', 'btn-outline-danger', onDelete),
    );
    return wrap;
  };
}

export function thumbnail(shape: 'square' | 'round' = 'square') {
  return (p: ICellRendererParams) => {
    const img = document.createElement('img');
    img.src = p.value ? assetUrl(String(p.value)) : '';
    img.alt = '';
    img.loading = 'lazy';
    img.className = shape === 'round' ? 'grid-thumb rounded-circle' : 'grid-thumb';
    return img;
  };
}

// On phones a pinned column takes too much room, so only pin on wider screens.
export function pinRightOnWideScreens(): 'right' | null {
  return matchMedia('(min-width: 768px)').matches ? 'right' : null;
}

export function badge(colors: Record<string, string>) {
  return (p: ICellRendererParams) => {
    if (p.value === null || p.value === undefined || p.value === '') return '';
    const span = document.createElement('span');
    span.className = `badge rounded-pill text-bg-${colors[String(p.value)] ?? 'secondary'}`;
    span.textContent = String(p.value);
    return span;
  };
}

// e.g. 24 Oct 2026, 8:25 pm
export const formatDateTime = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

export const formatDate = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
