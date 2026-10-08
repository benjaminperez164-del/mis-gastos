import { emptyStores, STORES, type Database, type StoreName } from './database';

interface SqlRow {
  store: string;
  id: string;
  json: string;
}

export function createSqliteDatabase(): Database {
  // Solo se carga en Android/iOS. En la web, SQLite exige cabeceras que GitHub Pages no puede enviar.
  const SQLite = require('expo-sqlite') as typeof import('expo-sqlite');
  const db = SQLite.openDatabaseSync('misgastos.db');
  db.execSync(`
    CREATE TABLE IF NOT EXISTS kv (
      store TEXT NOT NULL,
      id TEXT NOT NULL,
      json TEXT NOT NULL,
      PRIMARY KEY (store, id)
    );
  `);

  function readAll(): Record<StoreName, unknown[]> {
    const grouped = emptyStores();
    const rows = db.getAllSync<SqlRow>('SELECT store, id, json FROM kv');
    for (const row of rows) {
      if (!STORES.includes(row.store as StoreName)) continue;
      grouped[row.store as StoreName].push(JSON.parse(row.json));
    }
    return grouped;
  }

  return {
    async readAll() {
      return readAll();
    },
    async bulkUpsert(rows) {
      if (rows.length === 0) return;
      db.withTransactionSync(() => {
        for (const row of rows) {
          db.runSync('INSERT OR REPLACE INTO kv (store, id, json) VALUES (?, ?, ?)', [
            row.store,
            row.id,
            JSON.stringify(row.value),
          ]);
        }
      });
    },
    async remove(store, id) {
      db.runSync('DELETE FROM kv WHERE store = ? AND id = ?', [store, id]);
    },
    async replaceAll(rows) {
      db.withTransactionSync(() => {
        db.execSync('DELETE FROM kv');
        for (const row of rows) {
          db.runSync('INSERT INTO kv (store, id, json) VALUES (?, ?, ?)', [
            row.store,
            row.id,
            JSON.stringify(row.value),
          ]);
        }
      });
    },
  };
}
