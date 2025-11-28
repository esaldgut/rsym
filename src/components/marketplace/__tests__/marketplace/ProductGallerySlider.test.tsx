import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mocks
jest.mock('@/components/ui/ProfileImage', () => ({
  ProfileImage: ({ path, alt, className }: any) => (
    <img data-testid="profile-image" src={path} alt={alt} className={className} />
  ),
}));

import { ProductGallerySlider } from '../../ProductGallerySlider';

describe('ProductGallerySlider', () => {
  test('1- renderiza estado vacío cuando no hay medios disponibles', () => {
    const { container } = render(<ProductGallerySlider images={[]} videos={[]} /> as any);
    expect(container).toBeTruthy();
    expect(screen.getByText(/No hay imágenes disponibles/i)).toBeInTheDocument();
  });

  test('2- renderiza imagen y alterna superposición de zoom al hacer clic', () => {
    render(<ProductGallerySlider images={["/img1.jpg"]} /> as any);

    const img = screen.getByTestId('profile-image') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('/img1.jpg');

    act(() => {
      fireEvent.click(img);
    });
    expect(screen.getByLabelText('Cerrar zoom')).toBeInTheDocument();

    // Close 
    act(() => {
      fireEvent.click(screen.getByLabelText('Cerrar zoom'));
    });
    expect(screen.queryByLabelText('Cerrar zoom')).not.toBeInTheDocument();
  });

  test('3- las flechas de navegación actualizan el indicador de posición', () => {
    render(<ProductGallerySlider images={["/a.jpg", "/b.jpg"]} /> as any);

    // initial indicator 1 / 2
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    const next = screen.getByLabelText('Imagen siguiente');
    act(() => {
      fireEvent.click(next);
    });

    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    const prev = screen.getByLabelText('Imagen anterior');
    act(() => {
      fireEvent.click(prev);
    });

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  test('4- el clic en la miniatura va al índice correcto', () => {
    render(<ProductGallerySlider images={["/a.jpg", "/b.jpg", "/c.jpg"]} /> as any);

    const thumb3 = screen.getByLabelText('Ir a imagen 3');
    act(() => {
      fireEvent.click(thumb3);
    });

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  test('5- el deslizamiento táctil hacia la izquierda/derecha avanza y retrocede', () => {
    const { container } = render(<ProductGallerySlider images={["/a.jpg", "/b.jpg"]} /> as any);

    const img = screen.getByAltText(/Product image 1/i) as HTMLElement;

    act(() => {
      fireEvent.touchStart(img, { touches: [{ clientX: 200 }] });
      fireEvent.touchMove(img, { touches: [{ clientX: 50 }] });
      fireEvent.touchEnd(img);
    });
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    act(() => {
      fireEvent.touchStart(img, { touches: [{ clientX: 50 }] });
      fireEvent.touchMove(img, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(img);
    });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  test('6- renderiza video cuando se proporcionan videos', () => {
    const { container } = render(<ProductGallerySlider images={[]} videos={["/v.mp4"]} /> as any);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video!.getAttribute('src')).toBe('/v.mp4');
  });
});
