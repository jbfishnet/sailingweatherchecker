import Database from 'better-sqlite3';
import { schema } from './schema.js';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'sailing.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db: Database.Database = new Database(dbPath);
db.exec(schema);

export default db;
