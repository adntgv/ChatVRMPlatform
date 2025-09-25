import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VrmUpload } from '@/components/vrmUpload';

// Mock TextButton component
jest.mock('@/components/textButton', () => ({
  TextButton: ({ onClick, disabled, children }: any) => (
    <button 
      data-testid="text-button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

// Mock VRM storage
jest.mock('@/features/storage/vrmStorage', () => ({
  vrmStorage: {
    saveVrmFile: jest.fn().mockResolvedValue({
      id: 'test-id',
      name: 'test.vrm',
      data: new ArrayBuffer(100),
      size: 100,
      uploadedAt: new Date(),
      lastUsed: new Date(),
    }),
    createObjectURL: jest.fn().mockReturnValue('mock-stored-url'),
  },
}));

describe('VrmUpload', () => {
  let mockOnVrmLoad: jest.Mock;

  beforeEach(() => {
    mockOnVrmLoad = jest.fn();
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render upload area and button', () => {
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} />);

    expect(screen.getByText('Drag & drop VRM file')).toBeInTheDocument();
    expect(screen.getByText('Or click to select file')).toBeInTheDocument();
    expect(screen.getByTestId('text-button')).toHaveTextContent('Select VRM File');
  });

  it('should show loading state', () => {
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} isLoading={true} />);

    expect(screen.getByText('Loading VRM file...')).toBeInTheDocument();
    expect(screen.getByTestId('text-button')).toHaveTextContent('Loading VRM...');
    expect(screen.getByTestId('text-button')).toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} disabled={true} />);

    expect(screen.getByTestId('text-button')).toBeDisabled();
  });

  it('should handle file input change with valid VRM file', async () => {
    const user = userEvent.setup();
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} />);

    const file = new File(['vrm content'], 'test.vrm', { type: 'application/octet-stream' });
    const input = screen.getByRole('button', { hidden: true });
    
    // Find the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);

    expect(mockOnVrmLoad).toHaveBeenCalledWith('mock-stored-url');
  });

  it('should not call onVrmLoad for non-VRM files', async () => {
    const user = userEvent.setup();
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, file);

    expect(mockOnVrmLoad).not.toHaveBeenCalled();
  });

  it('should reject files larger than 50MB', async () => {
    const user = userEvent.setup();
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} />);

    // Create a large file (51MB)
    const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.vrm', { 
      type: 'application/octet-stream' 
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, largeFile);

    expect(screen.getByText('File size too large. Please select a file under 50MB.')).toBeInTheDocument();
    expect(mockOnVrmLoad).not.toHaveBeenCalled();
  });

  it('should handle drag and drop with valid VRM file', async () => {
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} />);

    const file = new File(['vrm content'], 'test.vrm', { type: 'application/octet-stream' });
    const dropZone = screen.getByText('Drag & drop VRM file').closest('div');

    // Mock drag and drop
    const dragEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        files: [file]
      }
    });

    fireEvent(dropZone!, dragEvent);

    await waitFor(() => {
      expect(mockOnVrmLoad).toHaveBeenCalledWith('mock-stored-url');
    });
  });

  it('should handle drag events', () => {
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} />);

    const dropZone = screen.getByText('Drag & drop VRM file').closest('div');
    
    // Test that drag events don't throw errors
    expect(() => {
      fireEvent.dragOver(dropZone!);
      fireEvent.dragLeave(dropZone!);
    }).not.toThrow();
  });

  it('should not handle drag events when disabled', () => {
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} disabled={true} />);

    const file = new File(['vrm content'], 'test.vrm', { type: 'application/octet-stream' });
    const dropZone = screen.getByText('Drag & drop VRM file').closest('div');

    const dragEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        files: [file]
      }
    });

    fireEvent(dropZone!, dragEvent);

    expect(mockOnVrmLoad).not.toHaveBeenCalled();
  });

  it('should handle multiple file uploads correctly', async () => {
    const user = userEvent.setup();
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // First upload invalid file
    const invalidFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, invalidFile);
    expect(mockOnVrmLoad).not.toHaveBeenCalled();

    // Then upload valid file
    const validFile = new File(['vrm content'], 'test.vrm', { type: 'application/octet-stream' });
    await user.upload(fileInput, validFile);
    expect(mockOnVrmLoad).toHaveBeenCalledWith('mock-stored-url');
  });

  it('should show file constraints information', () => {
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} />);

    expect(screen.getByText('• Supported format: .vrm')).toBeInTheDocument();
    expect(screen.getByText('• Maximum file size: 50MB')).toBeInTheDocument();
    expect(screen.getByText('• VRM 1.0 format recommended')).toBeInTheDocument();
  });

  it('should trigger file dialog when upload area is clicked', async () => {
    const user = userEvent.setup();
    render(<VrmUpload onVrmLoad={mockOnVrmLoad} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});

    const dropZone = screen.getByText('Drag & drop VRM file').closest('div');
    await user.click(dropZone!);

    expect(clickSpy).toHaveBeenCalled();
  });
});