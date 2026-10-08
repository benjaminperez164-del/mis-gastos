import { emptyStores, type Database, type StoreName } from './database';

interface Row {
  store: StoreName;
  id: string;
  value: unknown;
}

export function createMemoryDatabase(initial: Row[] = []): Database {
  const rows = new Map<string, Row>(initial.map((row) => [`${row.store}:${row.id}`, row]));

  function snapshot(): Record<StoreName, unknown[]> {
    const grouped = emptyStores();
    for (const row of rows.values()) grouped[row.store].push(row.value);
    return grouped;
  }

  return {
    async readAll() {
      return snapshot();
    },
    async bulkUpsert(incoming) {
      for (const row of incoming) rows.set(`${row.store}:${row.id}`, row);
    },
    async remove(store, id) {
      rows.delete(`${store}:${id}`);
    },
    async replaceAll(incoming) {
      rows.clear();
      for (const row of incoming) rows.set(`${row.store}:${row.id}`, row);
    },
  };
}
