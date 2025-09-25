import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnimationControl } from './animationControl';

describe('AnimationControl', () => {
  const mockOnAnimationUpload = jest.fn();
  const mockOnAnimationPlay = jest.fn();
  const mockOnAnimationStop = jest.fn();
  const mockOnSpeedChange = jest.fn();
  const mockOnLoopToggle = jest.fn();
  const mockOnAnimationSelect = jest.fn();

  const defaultProps = {
    animations: [],
    currentAnimation: null,
    isPlaying: false,
    speed: 1,
    loop: false,
    onAnimationUpload: mockOnAnimationUpload,
    onAnimationPlay: mockOnAnimationPlay,
    onAnimationStop: mockOnAnimationStop,
    onSpeedChange: mockOnSpeedChange,
    onLoopToggle: mockOnLoopToggle,
    onAnimationSelect: mockOnAnimationSelect,
  };

  const mockAnimations = [
    { id: '1', name: 'Walk', url: 'walk.vrma' },
    { id: '2', name: 'Run', url: 'run.vrma' },
    { id: '3', name: 'Jump', url: 'jump.vrma' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders animation controls section', () => {
    render(<AnimationControl {...defaultProps} />);
    
    expect(screen.getByText('Animations')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload Animation')).toBeInTheDocument();
  });

  it('shows upload button when no animations', () => {
    render(<AnimationControl {...defaultProps} />);
    
    expect(screen.getByText('Upload VRMA File')).toBeInTheDocument();
    expect(screen.getByText('No animations loaded')).toBeInTheDocument();
  });

  it('lists loaded animations', () => {
    render(<AnimationControl {...defaultProps} animations={mockAnimations} />);
    
    mockAnimations.forEach(animation => {
      expect(screen.getByText(animation.name)).toBeInTheDocument();
    });
  });

  it('highlights selected animation', () => {
    render(
      <AnimationControl 
        {...defaultProps} 
        animations={mockAnimations} 
        currentAnimation={mockAnimations[1]}
      />
    );
    
    const runButton = screen.getByRole('button', { name: 'Run' });
    expect(runButton).toHaveClass('bg-primary');
  });

  it('calls onAnimationSelect when animation is clicked', () => {
    render(<AnimationControl {...defaultProps} animations={mockAnimations} />);
    
    const walkButton = screen.getByRole('button', { name: 'Walk' });
    fireEvent.click(walkButton);
    
    expect(mockOnAnimationSelect).toHaveBeenCalledWith(mockAnimations[0]);
  });

  it('shows play button when not playing', () => {
    render(
      <AnimationControl 
        {...defaultProps} 
        animations={mockAnimations}
        currentAnimation={mockAnimations[0]}
        isPlaying={false}
      />
    );
    
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
  });

  it('shows pause button when playing', () => {
    render(
      <AnimationControl 
        {...defaultProps} 
        animations={mockAnimations}
        currentAnimation={mockAnimations[0]}
        isPlaying={true}
      />
    );
    
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.queryByText('Play')).not.toBeInTheDocument();
  });

  it('calls onAnimationPlay when play is clicked', () => {
    render(
      <AnimationControl 
        {...defaultProps} 
        animations={mockAnimations}
        currentAnimation={mockAnimations[0]}
        isPlaying={false}
      />
    );
    
    const playButton = screen.getByText('Play').closest('button');
    fireEvent.click(playButton!);
    
    expect(mockOnAnimationPlay).toHaveBeenCalled();
  });

  it('calls onAnimationStop when stop is clicked', () => {
    render(
      <AnimationControl 
        {...defaultProps} 
        animations={mockAnimations}
        currentAnimation={mockAnimations[0]}
        isPlaying={true}
      />
    );
    
    const stopButton = screen.getByText('Stop').closest('button');
    fireEvent.click(stopButton!);
    
    expect(mockOnAnimationStop).toHaveBeenCalled();
  });

  it('displays and updates speed control', () => {
    render(
      <AnimationControl 
        {...defaultProps} 
        animations={mockAnimations}
        currentAnimation={mockAnimations[0]}
        speed={1.5}
      />
    );
    
    const speedSlider = screen.getByLabelText('Speed');
    expect(speedSlider).toHaveValue('1.5');
    expect(screen.getByText('Speed: 1.5x')).toBeInTheDocument();
    
    fireEvent.change(speedSlider, { target: { value: '2' } });
    expect(mockOnSpeedChange).toHaveBeenCalledWith(2);
  });

  it('displays and toggles loop control', () => {
    render(
      <AnimationControl 
        {...defaultProps} 
        animations={mockAnimations}
        currentAnimation={mockAnimations[0]}
        loop={false}
      />
    );
    
    const loopCheckbox = screen.getByLabelText('Loop');
    expect(loopCheckbox).not.toBeChecked();
    
    fireEvent.click(loopCheckbox);
    expect(mockOnLoopToggle).toHaveBeenCalledWith(true);
  });

  it('disables controls when no animation is selected', () => {
    render(<AnimationControl {...defaultProps} animations={mockAnimations} />);
    
    expect(screen.getByText('Play').closest('button')).toBeDisabled();
    expect(screen.getByText('Stop').closest('button')).toBeDisabled();
    expect(screen.getByLabelText('Speed')).toBeDisabled();
    expect(screen.getByLabelText('Loop')).toBeDisabled();
  });

  it('handles file upload', async () => {
    render(<AnimationControl {...defaultProps} />);
    
    const file = new File(['animation data'], 'dance.vrma', { type: 'application/octet-stream' });
    const input = screen.getByLabelText('Upload Animation');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnAnimationUpload).toHaveBeenCalledWith(file);
    });
  });

  it('only accepts .vrma files', () => {
    render(<AnimationControl {...defaultProps} />);
    
    const input = screen.getByLabelText('Upload Animation');
    expect(input).toHaveAttribute('accept', '.vrma');
  });

  it('applies disabled state when disabled prop is true', () => {
    render(
      <AnimationControl 
        {...defaultProps} 
        animations={mockAnimations}
        currentAnimation={mockAnimations[0]}
        disabled
      />
    );
    
    expect(screen.getByLabelText('Upload Animation')).toBeDisabled();
    expect(screen.getByText('Play').closest('button')).toBeDisabled();
    expect(screen.getByText('Stop').closest('button')).toBeDisabled();
    expect(screen.getByLabelText('Speed')).toBeDisabled();
    expect(screen.getByLabelText('Loop')).toBeDisabled();
    
    mockAnimations.forEach(animation => {
      expect(screen.getByRole('button', { name: animation.name })).toBeDisabled();
    });
  });
});