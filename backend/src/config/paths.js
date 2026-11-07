import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '../../../');
export const DATA_DIR = path.join(ROOT_DIR, 'data');
export const DB_PATH = path.join(DATA_DIR, 'chat.db');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const PUBLIC_DIR = path.join(__dirname, '../../public');

