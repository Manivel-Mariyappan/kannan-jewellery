import { AllCommunityModule, ICellRendererParams, ModuleRegistry, themeQuartz } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

/** Shared AG Grid look for every admin table. */
export const adminGridTheme = themeQuartz.withParams({
  accentColor: '#a8741f',
  fontFamily: 'Inter, system-ui, sans-serif',
  headerBackgroundColor: '#f7f5f1',
  headerFontWeight: 600,
  borderColor: '#ece8e1',
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

/** Edit / Delete buttons for an actions column (built with DOM APIs, no HTML strings). */
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
    wrap.append(make('Edit', 'btn-outline-primary', onEdit), make('Delete', 'btn-outline-danger', onDelete));
    return wrap;
  };
}

/** Coloured Bootstrap badge for a status value. */
export function badge(colors: Record<string, string>) {
  return (p: ICellRendererParams) => {
    if (p.value === null || p.value === undefined || p.value === '') return '';
    const span = document.createElement('span');
    span.className = `badge rounded-pill text-bg-${colors[String(p.value)] ?? 'secondary'}`;
    span.textContent = String(p.value);
    return span;
  };
}

/** 24 Oct 2026, 8:25 pm */
export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

export const formatDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
