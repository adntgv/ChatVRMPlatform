import { useEffect, useCallback } from 'react';
import { vrmStorage, StoredVrmFile } from '@/features/storage/vrmStorage';

interface UseVrmPersistenceProps {
  onVrmLoad?: (url: string) => void;
  autoLoadLastUsed?: boolean;
}

export const useVrmPersistence = ({ 
  onVrmLoad, 
  autoLoadLastUsed = false 
}: UseVrmPersistenceProps = {}) => {
  const loadLastUsedVrm = useCallback(async () => {
    try {
      const files = await vrmStorage.getAllVrmFiles();
      if (files.length > 0 && onVrmLoad) {
        // Get the most recently used VRM
        const lastUsedVrm = files[0]; // Files are sorted by lastUsed in getAllVrmFiles
        const url = vrmStorage.createObjectURL(lastUsedVrm);
        onVrmLoad(url);
        await vrmStorage.updateLastUsed(lastUsedVrm.id);
        return lastUsedVrm;
      }
    } catch (error) {
      console.error('Failed to load last used VRM:', error);
    }
    return null;
  }, [onVrmLoad]);

  const getStorageStats = useCallback(async () => {
    try {
      const files = await vrmStorage.getAllVrmFiles();
      const storageInfo = await vrmStorage.getStorageInfo();
      return {
        fileCount: files.length,
        totalSize: files.reduce((total, file) => total + file.size, 0),
        storageUsed: storageInfo.used,
        storageAvailable: storageInfo.available,
        files,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        fileCount: 0,
        totalSize: 0,
        storageUsed: 0,
        storageAvailable: 0,
        files: [],
      };
    }
  }, []);

  const clearOldFiles = useCallback(async (keepCount: number = 5) => {
    try {
      const files = await vrmStorage.getAllVrmFiles();
      if (files.length > keepCount) {
        // Keep only the most recently used files
        const filesToDelete = files.slice(keepCount);
        for (const file of filesToDelete) {
          await vrmStorage.deleteVrmFile(file.id);
        }
        return filesToDelete.length;
      }
      return 0;
    } catch (error) {
      console.error('Failed to clear old VRM files:', error);
      return 0;
    }
  }, []);

  useEffect(() => {
    if (autoLoadLastUsed) {
      loadLastUsedVrm();
    }
  }, [autoLoadLastUsed, loadLastUsedVrm]);

  return {
    loadLastUsedVrm,
    getStorageStats,
    clearOldFiles,
  };
};