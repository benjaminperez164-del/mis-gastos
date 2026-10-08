export const STORES = [
  'types',
  'projects',
  'expenses',
  'proformas',
  'payments',
  'photos',
  'settings',
  'snapshots',
] as const;

export type StoreName = (typeof STORES)[number];

export interface Database {
  readAll(): Promise<Record<StoreName, unknown[]>>;
  bulkUpsert(rows: { store: StoreName; id: string; value: unknown }[]): Promise<void>;
  remove(store: StoreName, id: string): Promise<void>;
  replaceAll(rows: { store: StoreName; id: string; value: unknown }[]): Promise<void>;
}

export function emptyStores(): Record<StoreName, unknown[]> {
  return {
    types: [],
    projects: [],
    expenses: [],
    proformas: [],
    payments: [],
    photos: [],
    settings: [],
    snapshots: [],
  };
}
