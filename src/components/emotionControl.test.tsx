import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmotionControl } from './emotionControl';

describe('EmotionControl', () => {
  const mockOnEmotionChange = jest.fn();
  const emotions = ['neutral', 'happy', 'angry', 'sad', 'relaxed'] as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all emotion buttons', () => {
    render(<EmotionControl currentEmotion="neutral" onEmotionChange={mockOnEmotionChange} />);
    
    emotions.forEach(emotion => {
      expect(screen.getByRole('button', { name: emotion })).toBeInTheDocument();
    });
  });

  it('highlights the current emotion', () => {
    render(<EmotionControl currentEmotion="happy" onEmotionChange={mockOnEmotionChange} />);
    
    const happyButton = screen.getByRole('button', { name: 'happy' });
    expect(happyButton).toHaveClass('bg-primary');
    
    const neutralButton = screen.getByRole('button', { name: 'neutral' });
    expect(neutralButton).not.toHaveClass('bg-primary');
  });

  it('calls onEmotionChange when a button is clicked', () => {
    render(<EmotionControl currentEmotion="neutral" onEmotionChange={mockOnEmotionChange} />);
    
    const happyButton = screen.getByRole('button', { name: 'happy' });
    fireEvent.click(happyButton);
    
    expect(mockOnEmotionChange).toHaveBeenCalledWith('happy');
  });

  it('does not call onEmotionChange when clicking the current emotion', () => {
    render(<EmotionControl currentEmotion="happy" onEmotionChange={mockOnEmotionChange} />);
    
    const happyButton = screen.getByRole('button', { name: 'happy' });
    fireEvent.click(happyButton);
    
    expect(mockOnEmotionChange).not.toHaveBeenCalled();
  });

  it('renders emotion icons', () => {
    render(<EmotionControl currentEmotion="neutral" onEmotionChange={mockOnEmotionChange} />);
    
    // Each emotion should have an icon
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(emotions.length);
    
    buttons.forEach(button => {
      expect(button.querySelector('svg') || button.querySelector('span')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<EmotionControl currentEmotion="neutral" onEmotionChange={mockOnEmotionChange} />);
    
    emotions.forEach(emotion => {
      const button = screen.getByRole('button', { name: emotion });
      expect(button).toHaveAttribute('aria-label', emotion);
    });
  });

  it('displays emotion labels', () => {
    render(<EmotionControl currentEmotion="neutral" onEmotionChange={mockOnEmotionChange} />);
    
    const emotionLabels = {
      neutral: 'Neutral',
      happy: 'Happy',
      angry: 'Angry',
      sad: 'Sad',
      relaxed: 'Relaxed'
    };
    
    Object.entries(emotionLabels).forEach(([emotion, label]) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('applies disabled state when disabled prop is true', () => {
    render(<EmotionControl currentEmotion="neutral" onEmotionChange={mockOnEmotionChange} disabled />);
    
    emotions.forEach(emotion => {
      const button = screen.getByRole('button', { name: emotion });
      expect(button).toBeDisabled();
    });
  });

  it('does not call onEmotionChange when disabled', () => {
    render(<EmotionControl currentEmotion="neutral" onEmotionChange={mockOnEmotionChange} disabled />);
    
    const happyButton = screen.getByRole('button', { name: 'happy' });
    fireEvent.click(happyButton);
    
    expect(mockOnEmotionChange).not.toHaveBeenCalled();
  });
});