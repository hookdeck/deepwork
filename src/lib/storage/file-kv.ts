import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), '.kv-store.json');

function readStore() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

function writeStore(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export const fileKv = {
  get<T>(key: string): T | null {
    const store = readStore();
    return store[key] || null;
  },
  set(key: string, value: any) {
    const store = readStore();
    store[key] = value;
    writeStore(store);
  },
  del(key: string) {
    const store = readStore();
    delete store[key];
    writeStore(store);
  },
  list<T>(): T[] {
    const store = readStore();
    return Object.values(store);
  }
};