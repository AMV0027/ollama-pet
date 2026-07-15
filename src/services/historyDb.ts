import Database from '@tauri-apps/plugin-sql';
import { Message } from '../stores/usePetStore';

export interface HistoryItem {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

let dbInstance: Database | null = null;

async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:ollama_pet_history.db');
    await dbInstance.execute(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY,
        title TEXT,
        messages TEXT,
        timestamp INTEGER
      )
    `);
  }
  return dbInstance;
}

export async function saveChatSession(id: string, title: string, messages: Message[]): Promise<void> {
  try {
    const db = await getDb();
    const messagesJson = JSON.stringify(messages);
    const timestamp = Date.now();
    await db.execute(
      'INSERT OR REPLACE INTO chat_history (id, title, messages, timestamp) VALUES ($1, $2, $3, $4)',
      [id, title, messagesJson, timestamp]
    );
  } catch (e) {
    console.error('Failed to save chat session to SQLite:', e);
  }
}

export async function loadChatSessions(): Promise<HistoryItem[]> {
  try {
    const db = await getDb();
    const rows = await db.select<{ id: string; title: string; messages: string; timestamp: number }[]>(
      'SELECT id, title, messages, timestamp FROM chat_history ORDER BY timestamp DESC'
    );
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      messages: JSON.parse(row.messages),
      timestamp: row.timestamp,
    }));
  } catch (e) {
    console.error('Failed to load chat sessions from SQLite:', e);
    return [];
  }
}

export async function deleteChatSession(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.execute('DELETE FROM chat_history WHERE id = $1', [id]);
  } catch (e) {
    console.error('Failed to delete chat session from SQLite:', e);
  }
}

export async function pruneAllSessions(): Promise<void> {
  try {
    const db = await getDb();
    await db.execute('DELETE FROM chat_history');
  } catch (e) {
    console.error('Failed to prune database:', e);
  }
}
