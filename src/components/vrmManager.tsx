import React, { useEffect, useState, useCallback } from 'react';
import { StoredVrmFile, vrmStorage } from '@/features/storage/vrmStorage';
import { TextButton } from './textButton';

interface VrmManagerProps {
  onVrmSelect: (url: string) => void;
  onClose: () => void;
}

export const VrmManager: React.FC<VrmManagerProps> = ({ onVrmSelect, onClose }) => {
  const [vrmFiles, setVrmFiles] = useState<StoredVrmFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<{ used: number; available: number } | null>(null);

  const loadVrmFiles = useCallback(async () => {
    try {
      setLoading(true);
      const files = await vrmStorage.getAllVrmFiles();
      const info = await vrmStorage.getStorageInfo();
      setVrmFiles(files);
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to load VRM files:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVrmFiles();
  }, [loadVrmFiles]);

  const handleSelectVrm = useCallback(async (file: StoredVrmFile) => {
    try {
      const url = vrmStorage.createObjectURL(file);
      onVrmSelect(url);
      await vrmStorage.updateLastUsed(file.id);
      onClose();
    } catch (error) {
      console.error('Failed to select VRM file:', error);
    }
  }, [onVrmSelect, onClose]);

  const handleDeleteVrm = useCallback(async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('このVRMファイルを削除しますか？')) {
      return;
    }

    try {
      await vrmStorage.deleteVrmFile(id);
      await loadVrmFiles();
    } catch (error) {
      console.error('Failed to delete VRM file:', error);
    }
  }, [loadVrmFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-lg font-semibold mb-4">VRMファイルを読み込み中...</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">保存されたVRMファイル</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Storage Info */}
        {storageInfo && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              ストレージ使用量: {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.available)}
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ 
                  width: `${Math.min((storageInfo.used / storageInfo.available) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        {vrmFiles.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📁</div>
            <div className="text-gray-600 mb-4">保存されたVRMファイルがありません</div>
            <div className="text-sm text-gray-500">
              VRMファイルをアップロードすると、ここに表示されます
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {vrmFiles.map((file) => (
              <div
                key={file.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleSelectVrm(file)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {file.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      サイズ: {formatFileSize(file.size)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      アップロード: {formatDate(file.uploadedAt)}
                    </div>
                    <div className="text-xs text-gray-400">
                      最終使用: {formatDate(file.lastUsed)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => handleDeleteVrm(file.id, e)}
                      className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded border border-red-300 hover:border-red-500"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <TextButton onClick={onClose}>
            閉じる
          </TextButton>
        </div>
      </div>
    </div>
  );
};