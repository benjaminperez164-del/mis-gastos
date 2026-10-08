import type { Database } from './database';
import { createIndexedDatabase } from './indexeddb';

export function openDatabase(): Database {
  return createIndexedDatabase();
}
