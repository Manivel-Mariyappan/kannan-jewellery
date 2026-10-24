import { Signal, signal } from '@angular/core';

/**
 * A list of records kept in this browser's localStorage. Stands in for an API endpoint until
 * the ASP.NET Core backend exists: swap the methods for HttpClient calls and the pages that use
 * it keep working.
 */
export class LocalCollection<T extends { id: string }> {
  private readonly items = signal<T[]>([]);
  readonly all: Signal<T[]> = this.items.asReadonly();

  constructor(
    private readonly storageKey: string,
    seed: () => T[],
  ) {
    this.items.set(this.read() ?? seed());
  }

  get(id: string): T | undefined {
    return this.items().find((x) => x.id === id);
  }

  upsert(item: T): void {
    this.items.update((list) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list]));
    this.write();
  }

  remove(id: string): void {
    this.items.update((list) => list.filter((x) => x.id !== id));
    this.write();
  }

  private read(): T[] | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as T[]) : null;
    } catch {
      return null;
    }
  }

  private write(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items()));
    } catch {
      /* storage full or unavailable: changes stay in memory for this session */
    }
  }
}

export const newId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
