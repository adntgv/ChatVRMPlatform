import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceSelection } from '@/components/voiceSelection';
import { KoeiroParam, VOICE_PRESETS } from '@/features/constants/koeiroParam';
import { useConfigStore } from '@/store/configStore';

// Mock the config store
jest.mock('@/store/configStore', () => ({
  useConfigStore: jest.fn()
}));

describe('VoiceSelection', () => {
  const mockOnVoiceChange = jest.fn();
  const mockOnCustomParamsChange = jest.fn();
  const mockSetSelectedVoicePresetId = jest.fn();
  
  const defaultParams: KoeiroParam = {
    speakerX: 3,
    speakerY: 3
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock store implementation
    (useConfigStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        selectedVoicePresetId: 'casual',
        setSelectedVoicePresetId: mockSetSelectedVoicePresetId
      };
      return selector ? selector(state) : state;
    });
  });

  it('should render voice selection component', () => {
    render(
      <VoiceSelection
        currentParams={defaultParams}
        onVoiceChange={mockOnVoiceChange}
      />
    );

    expect(screen.getByText('Voice Selection')).toBeInTheDocument();
  });

  it('should display category tabs', () => {
    render(
      <VoiceSelection
        currentParams={defaultParams}
        onVoiceChange={mockOnVoiceChange}
      />
    );

    expect(screen.getByText('Emotional')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Casual')).toBeInTheDocument();
    expect(screen.getByText('Character')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('should show presets for selected category', () => {
    render(
      <VoiceSelection
        currentParams={defaultParams}
        onVoiceChange={mockOnVoiceChange}
      />
    );

    // Click on emotional category
    fireEvent.click(screen.getByText('Emotional'));

    // Check that emotional presets are shown
    expect(screen.getByText('Cute')).toBeInTheDocument();
    expect(screen.getByText('Happy')).toBeInTheDocument();
    expect(screen.getByText('Gentle')).toBeInTheDocument();
  });

  it('should call onVoiceChange when preset is selected', () => {
    render(
      <VoiceSelection
        currentParams={defaultParams}
        onVoiceChange={mockOnVoiceChange}
      />
    );

    // Click on a preset
    const cutePreset = VOICE_PRESETS.find(p => p.id === 'cute')!;
    fireEvent.click(screen.getByText('Cute'));

    expect(mockOnVoiceChange).toHaveBeenCalledWith(
      cutePreset.params.speakerX,
      cutePreset.params.speakerY
    );
    expect(mockSetSelectedVoicePresetId).toHaveBeenCalledWith('cute');
  });

  it('should show custom controls when Custom tab is clicked', () => {
    render(
      <VoiceSelection
        currentParams={defaultParams}
        onVoiceChange={mockOnVoiceChange}
      />
    );

    fireEvent.click(screen.getByText('Custom'));

    expect(screen.getByText(/Pitch \(X\):/)).toBeInTheDocument();
    expect(screen.getByText(/Energy \(Y\):/)).toBeInTheDocument();
    // Should have 2 sliders for X and Y
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);
  });

  it('should update custom parameters when sliders are moved', () => {
    render(
      <VoiceSelection
        currentParams={defaultParams}
        onVoiceChange={mockOnVoiceChange}
      />
    );

    fireEvent.click(screen.getByText('Custom'));

    const sliders = screen.getAllByRole('slider');
    
    // Change X value
    fireEvent.change(sliders[0], { target: { value: '5' } });
    expect(mockOnVoiceChange).toHaveBeenCalledWith(5, defaultParams.speakerY);

    // Change Y value
    fireEvent.change(sliders[1], { target: { value: '-3' } });
    expect(mockOnVoiceChange).toHaveBeenCalledWith(5, -3);
  });

  it('should highlight active preset', () => {
    const cuteParams = VOICE_PRESETS.find(p => p.id === 'cute')!.params;
    
    (useConfigStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        selectedVoicePresetId: 'cute',
        setSelectedVoicePresetId: mockSetSelectedVoicePresetId
      };
      return selector ? selector(state) : state;
    });

    render(
      <VoiceSelection
        currentParams={cuteParams}
        onVoiceChange={mockOnVoiceChange}
      />
    );

    fireEvent.click(screen.getByText('Emotional'));
    
    const cuteCard = screen.getByText('Cute').closest('.voice-preset-card');
    expect(cuteCard).toHaveClass('bg-primary');
  });

  it('should display current voice parameters', () => {
    const customParams: KoeiroParam = {
      speakerX: 2.5,
      speakerY: -4.3
    };

    render(
      <VoiceSelection
        currentParams={customParams}
        onVoiceChange={mockOnVoiceChange}
      />
    );

    expect(screen.getByText('X: 2.5')).toBeInTheDocument();
    expect(screen.getByText('Y: -4.3')).toBeInTheDocument();
  });

  it('should switch categories correctly', () => {
    render(
      <VoiceSelection
        currentParams={defaultParams}
        onVoiceChange={mockOnVoiceChange}
      />
    );

    // Switch to Professional
    fireEvent.click(screen.getByText('Professional'));
    expect(screen.getByText('Announcer')).toBeInTheDocument();

    // Switch to Character
    fireEvent.click(screen.getByText('Character'));
    expect(screen.getByText('Robotic')).toBeInTheDocument();
    expect(screen.getByText('Whisper')).toBeInTheDocument();
  });

  it('should hide advanced controls when showAdvanced is false', () => {
    render(
      <VoiceSelection
        currentParams={defaultParams}
        onVoiceChange={mockOnVoiceChange}
        showAdvanced={false}
      />
    );

    // Custom tab should not be shown
    expect(screen.queryByText('Custom')).not.toBeInTheDocument();
  });

  it('should call onCustomParamsChange when provided', () => {
    render(
      <VoiceSelection
        currentParams={defaultParams}
        onVoiceChange={mockOnVoiceChange}
        onCustomParamsChange={mockOnCustomParamsChange}
      />
    );

    fireEvent.click(screen.getByText('Custom'));

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '7' } });

    expect(mockOnCustomParamsChange).toHaveBeenCalledWith(7, defaultParams.speakerY);
    expect(mockOnVoiceChange).not.toHaveBeenCalled();
  });

  it('should set selectedVoicePresetId to null when entering custom mode', () => {
    render(
      <VoiceSelection
        currentParams={defaultParams}
        onVoiceChange={mockOnVoiceChange}
      />
    );

    fireEvent.click(screen.getByText('Custom'));

    expect(mockSetSelectedVoicePresetId).toHaveBeenCalledWith(null);
  });

  it('should auto-detect matching preset on mount', async () => {
    const coolPreset = VOICE_PRESETS.find(p => p.id === 'cool')!;
    
    render(
      <VoiceSelection
        currentParams={coolPreset.params}
        onVoiceChange={mockOnVoiceChange}
      />
    );

    await waitFor(() => {
      expect(mockSetSelectedVoicePresetId).toHaveBeenCalledWith('cool');
    });
  });
});