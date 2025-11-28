import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mocks for child components and hooks
jest.mock('@/components/ui/S3GalleryImage', () => ({
  S3GalleryImage: ({ path, alt }: any) => (
    // Render a simple img so we can assert on it
    <img data-testid="s3-image" src={path} alt={alt} />
  ),
}));

jest.mock('@/components/ui/CarouselDots', () => ({
  CarouselDots: ({ total, current, onDotClick }: any) => (
    <div data-testid="carousel-dots">dots</div>
  ),
}));

// We'll mock the hook and change its return value per test
const mockUseCarousel = jest.fn();
jest.mock('@/hooks/useCarousel', () => ({
  useCarousel: (...args: any[]) => mockUseCarousel(...args),
}));

import { FullscreenGallery } from '../../FullscreenGallery';
import { useCarousel } from '@/hooks/useCarousel';

describe('FullscreenGallery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default mock implementation
    mockUseCarousel.mockReturnValue({
      currentIndex: 0,
      isPlaying: true,
      goToNext: jest.fn(),
      goToPrevious: jest.fn(),
      goToIndex: jest.fn(),
      togglePlayPause: jest.fn(),
      pauseAutoPlay: jest.fn(),
      resumeAutoPlay: jest.fn(),
    });
  });

  test('1- devuelve null cuando está cerrado o cuando no hay medios', () => {
    const { container, rerender } = render(
      <FullscreenGallery images={['/a.jpg']} isOpen={false} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
    rerender(<FullscreenGallery images={[]} isOpen={true} onClose={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  test('2- renderiza imagen cuando está abierto y hay imágenes disponibles', () => {
    render(<FullscreenGallery images={["/img1.jpg"]} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByTestId('s3-image')).toBeInTheDocument();
    expect((screen.getByTestId('s3-image') as HTMLImageElement).src).toContain('/img1.jpg');
  });

  test('3- renderiza video y llama a los manejadores de pausa/reanudación en play/ended', () => {
    const pauseAutoPlay = jest.fn();
    const resumeAutoPlay = jest.fn();
    const carouselGoToNext = jest.fn();

    mockUseCarousel.mockReturnValueOnce({
      currentIndex: 0,
      isPlaying: true,
      goToNext: carouselGoToNext,
      goToPrevious: jest.fn(),
      goToIndex: jest.fn(),
      togglePlayPause: jest.fn(),
      pauseAutoPlay,
      resumeAutoPlay,
    });

    const { container } = render(
      <FullscreenGallery images={[]} videos={["/video.mp4"]} isOpen={true} onClose={jest.fn()} />
    );

    const video = container.querySelector('video') as HTMLVideoElement | null;
    expect(video).toBeTruthy();
    expect(video!.getAttribute('src')).toBe('/video.mp4');

    act(() => {
      fireEvent.play(video!);
    });
    expect(pauseAutoPlay).toHaveBeenCalled();

    act(() => {
      fireEvent.ended(video!);
    });
    expect(resumeAutoPlay).toHaveBeenCalled();
    expect(carouselGoToNext).toHaveBeenCalled();
  });

  test('4- eventos de teclado: Escape llama a onClose, las flechas navegan', () => {
    const onClose = jest.fn();
    const goPrev = jest.fn();
    const goNext = jest.fn();

    mockUseCarousel.mockReturnValueOnce({
      currentIndex: 0,
      isPlaying: true,
      goToNext: goNext,
      goToPrevious: goPrev,
      goToIndex: jest.fn(),
      togglePlayPause: jest.fn(),
      pauseAutoPlay: jest.fn(),
      resumeAutoPlay: jest.fn(),
    });

    render(<FullscreenGallery images={["/a.jpg", "/b.jpg"]} isOpen={true} onClose={onClose} />);

    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(goPrev).toHaveBeenCalled();
    expect(goNext).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
