import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mocks for dependencies
jest.mock('../../ui/S3GalleryImage', () => ({
  S3GalleryImage: ({ path, alt, className }: any) => (
    <img data-testid="s3-image" src={path} alt={alt} className={className} />
  ),
}));

jest.mock('../../ui/CarouselDots', () => ({
  CarouselDots: ({ total, current, onDotClick }: any) => (
    <div data-testid="carousel-dots">{current}/{total}</div>
  ),
}));

jest.mock('@/hooks/useCarousel', () => ({
  useCarousel: jest.fn(),
}));

import { ProductGalleryHeader } from '../../marketplace/ProductGalleryHeader';
import { useCarousel } from '@/hooks/useCarousel';

const mockedUseCarousel = useCarousel as jest.MockedFunction<typeof useCarousel>;

describe('ProductGalleryHeader', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('1- renderiza fallback cuando no se proporciona ningún medio', () => {
    mockedUseCarousel.mockReturnValue({
      currentIndex: 0,
      isPlaying: false,
      goToNext: jest.fn(),
      goToPrevious: jest.fn(),
      goToIndex: jest.fn(),
      togglePlayPause: jest.fn(),
      pauseAutoPlay: jest.fn(),
      resumeAutoPlay: jest.fn(),
    } as any);

    render(<ProductGalleryHeader images={[]} videos={[]} />);

    expect(screen.getByText('No hay imágenes disponibles')).toBeInTheDocument();
  });

  it('2- renderiza imagen y llama a onOpenFullscreen cuando se hace clic', () => {
    const pauseAutoPlay = jest.fn();
    const resumeAutoPlay = jest.fn();

    mockedUseCarousel.mockReturnValue({
      currentIndex: 0,
      isPlaying: true,
      goToNext: jest.fn(),
      goToPrevious: jest.fn(),
      goToIndex: jest.fn(),
      togglePlayPause: jest.fn(),
      pauseAutoPlay,
      resumeAutoPlay,
    } as any);

    const onOpenFullscreen = jest.fn();

    render(
      <ProductGalleryHeader
        images={["/img/1.jpg"]}
        videos={[]}
        alt="Test"
        onOpenFullscreen={onOpenFullscreen}
      />
    );

    const img = screen.getByTestId('s3-image');
    expect(img).toHaveAttribute('src', '/img/1.jpg');
    expect(img).toHaveAttribute('alt', 'Test 1')
    fireEvent.click(img);
    expect(onOpenFullscreen).toHaveBeenCalled();
  });

  it('3- las flechas de navegación llaman a pauseAutoPlay y goToNext/goToPrevious', () => {
    const pauseAutoPlay = jest.fn();
    const goToNext = jest.fn();
    const goToPrevious = jest.fn();

    mockedUseCarousel.mockReturnValue({
      currentIndex: 0,
      isPlaying: true,
      goToNext,
      goToPrevious,
      goToIndex: jest.fn(),
      togglePlayPause: jest.fn(),
      pauseAutoPlay,
      resumeAutoPlay: jest.fn(),
    } as any);

    render(<ProductGalleryHeader images={["/img/1.jpg", "/img/2.jpg"]} videos={[]} />);

    const nextBtn = screen.getByLabelText('Imagen siguiente');
    const prevBtn = screen.getByLabelText('Imagen anterior');

    fireEvent.click(nextBtn);
    expect(pauseAutoPlay).toHaveBeenCalled();
    expect(goToNext).toHaveBeenCalled();

    fireEvent.click(prevBtn);
    expect(pauseAutoPlay).toHaveBeenCalledTimes(2);
    expect(goToPrevious).toHaveBeenCalled();
  });

  it('4- expone métodos pause y resume vía ref', () => {
    const pauseAutoPlay = jest.fn();
    const resumeAutoPlay = jest.fn();

    mockedUseCarousel.mockReturnValue({
      currentIndex: 0,
      isPlaying: true,
      goToNext: jest.fn(),
      goToPrevious: jest.fn(),
      goToIndex: jest.fn(),
      togglePlayPause: jest.fn(),
      pauseAutoPlay,
      resumeAutoPlay,
    } as any);

    const ref = React.createRef<any>();
    render(<ProductGalleryHeader ref={ref} images={["/img/1.jpg"]} videos={[]} />);

    // call imperative methods
    ref.current.pause();
    ref.current.resume();

    expect(pauseAutoPlay).toHaveBeenCalled();
    expect(resumeAutoPlay).toHaveBeenCalled();
  });

  it('5- el deslizamiento táctil hacia la izquierda activa goToNext y pauseAutoPlay', () => {
    const pauseAutoPlay = jest.fn();
    const goToNext = jest.fn();

    mockedUseCarousel.mockReturnValue({
      currentIndex: 0,
      isPlaying: true,
      goToNext,
      goToPrevious: jest.fn(),
      goToIndex: jest.fn(),
      togglePlayPause: jest.fn(),
      pauseAutoPlay,
      resumeAutoPlay: jest.fn(),
    } as any);

    const { container } = render(<ProductGalleryHeader images={["/img/1.jpg", "/img/2.jpg"]} videos={[]} />);
    const wrapper = container.querySelector('.relative.w-full.h-full.overflow-hidden') || container.firstChild;

    fireEvent.touchStart(wrapper!, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(wrapper!, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(wrapper!);

    expect(pauseAutoPlay).toHaveBeenCalled();
    expect(goToNext).toHaveBeenCalled();
  });

  it('6- el botón de reproducir/pausar llama a togglePlayPause', () => {
    const togglePlayPause = jest.fn();

    mockedUseCarousel.mockReturnValue({
      currentIndex: 0,
      isPlaying: true,
      goToNext: jest.fn(),
      goToPrevious: jest.fn(),
      goToIndex: jest.fn(),
      togglePlayPause,
      pauseAutoPlay: jest.fn(),
      resumeAutoPlay: jest.fn(),
    } as any);

    render(<ProductGalleryHeader images={["/img/1.jpg", "/img/2.jpg"]} videos={[]} />);

    const playPauseBtn = screen.getByLabelText('Pausar carrusel');
    fireEvent.click(playPauseBtn);
    expect(togglePlayPause).toHaveBeenCalled();
  });
});
