import React, { useCallback, useRef, useState } from 'react';
import { config } from '@/config';
import { TextButton } from './textButton';
import { vrmStorage } from '@/features/storage/vrmStorage';

interface VrmUploadProps {
  onVrmLoad: (url: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  saveToStorage?: boolean;
}

export const VrmUpload: React.FC<VrmUploadProps> = ({
  onVrmLoad,
  isLoading = false,
  disabled = false,
  saveToStorage = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateVrmFile = (file: File): boolean => {
    setError(null);
    
    // Check file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'vrm') {
      setError('Incorrect file format. Please select a VRM file.');
      return false;
    }

    // Check file size (limit configured in environment)
    const maxSize = config.limits.vrmUploadMaxSizeMb * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size too large. Please select a file under ${config.limits.vrmUploadMaxSizeMb}MB.`);
      return false;
    }

    // Check MIME type if available
    if (file.type && !file.type.includes('octet-stream') && file.type !== 'model/gltf-binary') {
      setError('Incorrect file format. Please select a VRM file.');
      return false;
    }

    return true;
  };

  const processVrmFile = useCallback(async (file: File) => {
    if (!validateVrmFile(file)) {
      return;
    }

    try {
      if (saveToStorage) {
        // Save to IndexedDB and use stored version
        const storedFile = await vrmStorage.saveVrmFile(file);
        const url = vrmStorage.createObjectURL(storedFile);
        onVrmLoad(url);
      } else {
        // Use temporary blob URL
        const blob = new Blob([file], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        onVrmLoad(url);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load file.');
      console.error('VRM file processing error:', err);
    }
  }, [onVrmLoad, saveToStorage]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    processVrmFile(file);
    
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [processVrmFile]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled && !isLoading) {
      setDragOver(true);
    }
  }, [disabled, isLoading]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    if (disabled || isLoading) return;

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    processVrmFile(file);
  }, [processVrmFile, disabled, isLoading]);

  const handleButtonClick = useCallback(() => {
    if (disabled || isLoading) return;
    fileInputRef.current?.click();
  }, [disabled, isLoading]);

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          {isLoading ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Loading VRM file...</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/2"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600">
                Drag &amp; drop VRM file
              </div>
              <div className="text-xs text-gray-500">
                Or click to select file
              </div>
            </>
          )}
        </div>
      </div>

      {/* File Input Button */}
      <div className="flex justify-center">
        <TextButton 
          onClick={handleButtonClick}
          disabled={disabled || isLoading}
        >
          {isLoading ? 'Loading VRM...' : 'Select VRM File'}
        </TextButton>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* File Constraints Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>• Supported format: .vrm</div>
        <div>• Maximum file size: 50MB</div>
        <div>• VRM 1.0 format recommended</div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".vrm"
        className="hidden"
        disabled={disabled || isLoading}
      />
    </div>
  );
};