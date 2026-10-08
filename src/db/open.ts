import type { Database } from './database';
import { createSqliteDatabase } from './sqlite';

/** Android e iOS. En la web Metro usa open.web.ts (IndexedDB). */
export function openDatabase(): Database {
  return createSqliteDatabase();
}
