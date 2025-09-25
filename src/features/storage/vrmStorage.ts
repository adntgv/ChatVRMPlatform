/**
 * VRM File Storage Manager
 * Handles persistent storage of VRM files using IndexedDB
 */

export interface StoredVrmFile {
  id: string;
  name: string;
  data: ArrayBuffer;
  size: number;
  uploadedAt: Date;
  lastUsed: Date;
  thumbnail?: string; // Base64 encoded thumbnail
}

class VrmStorageManager {
  private dbName = 'ChatVRM_Storage';
  private dbVersion = 1;
  private storeName = 'vrm_files';
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for VRM files
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
          store.createIndex('lastUsed', 'lastUsed', { unique: false });
        }
      };
    });
  }

  async saveVrmFile(file: File): Promise<StoredVrmFile> {
    if (!this.db) {
      await this.initialize();
    }

    const arrayBuffer = await file.arrayBuffer();
    const id = `vrm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const storedFile: StoredVrmFile = {
      id,
      name: file.name,
      data: arrayBuffer,
      size: file.size,
      uploadedAt: new Date(),
      lastUsed: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(storedFile);

      request.onsuccess = () => {
        resolve(storedFile);
      };

      request.onerror = () => {
        reject(new Error('Failed to save VRM file'));
      };
    });
  }

  async loadVrmFile(id: string): Promise<StoredVrmFile | null> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Update last used timestamp
          this.updateLastUsed(id);
          resolve(result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to load VRM file'));
      };
    });
  }

  async getAllVrmFiles(): Promise<StoredVrmFile[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result || [];
        // Sort by last used, most recent first
        files.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
        resolve(files);
      };

      request.onerror = () => {
        reject(new Error('Failed to get VRM files'));
      };
    });
  }

  async deleteVrmFile(id: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete VRM file'));
      };
    });
  }

  async updateLastUsed(id: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    const file = await this.loadVrmFile(id);
    if (!file) return;

    file.lastUsed = new Date();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(file);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to update last used timestamp'));
      };
    });
  }

  async getStorageInfo(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
      };
    }
    
    // Fallback for browsers that don't support storage estimation
    return {
      used: 0,
      available: 50 * 1024 * 1024 * 1024, // Assume 50GB default
    };
  }

  async clearAllVrmFiles(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear VRM files'));
      };
    });
  }

  createObjectURL(storedFile: StoredVrmFile): string {
    const blob = new Blob([storedFile.data], { type: 'application/octet-stream' });
    return URL.createObjectURL(blob);
  }
}

// Singleton instance
export const vrmStorage = new VrmStorageManager();