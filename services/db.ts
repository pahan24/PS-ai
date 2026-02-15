import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ChatSession, User } from '../types';

interface PSAIDB extends DBSchema {
  chats: {
    key: string;
    value: ChatSession;
    indexes: { 
        'by-date': number;
        'by-user': string; // New index
    };
  };
  user: {
    key: string;
    value: User;
  };
}

const DB_NAME = 'ps-ai-db';
const DB_VERSION = 3; // Bumped version for new schema

let dbPromise: Promise<IDBPDatabase<PSAIDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<PSAIDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create store if it doesn't exist (v1)
        if (!db.objectStoreNames.contains('chats')) {
            const store = db.createObjectStore('chats', { keyPath: 'id' });
            store.createIndex('by-date', 'updatedAt');
            store.createIndex('by-user', 'userId');
        } else {
            // Upgrade existing store (v3)
            const store = transaction.objectStore('chats');
            if (!store.indexNames.contains('by-user')) {
                store.createIndex('by-user', 'userId');
            }
        }
        
        if (!db.objectStoreNames.contains('user')) {
            db.createObjectStore('user', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

// Old function for backward compatibility (gets all)
export const getAllChats = async (): Promise<ChatSession[]> => {
  const db = await initDB();
  return db.getAllFromIndex('chats', 'by-date');
};

// New function: Get chats strictly for the logged-in user
export const getUserChats = async (userId: string): Promise<ChatSession[]> => {
    const db = await initDB();
    return db.getAllFromIndex('chats', 'by-user', userId);
};

export const saveChat = async (chat: ChatSession) => {
  const db = await initDB();
  await db.put('chats', chat);
};

export const deleteChat = async (id: string) => {
  const db = await initDB();
  await db.delete('chats', id);
};

export const clearAllChats = async () => {
  const db = await initDB();
  await db.clear('chats');
};

export const importChats = async (chats: ChatSession[]) => {
  const db = await initDB();
  const tx = db.transaction('chats', 'readwrite');
  const promises = chats.map(chat => tx.store.put(chat));
  await Promise.all([...promises, tx.done]);
};

// User persistence
export const saveUser = async (user: User) => {
    const db = await initDB();
    await db.put('user', user);
};

export const getUser = async (id: string): Promise<User | undefined> => {
    const db = await initDB();
    return db.get('user', id);
};