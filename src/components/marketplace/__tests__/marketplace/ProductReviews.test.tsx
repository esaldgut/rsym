import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProductReviews } from '../../ProductReviews';

describe('ProductReviews', () => {
  test('1- renderiza encabezado con calificación promedio y total de reseñas', () => {
    render(
      <ProductReviews
        productId="p1"
        reviews={[]}
        averageRating={4.2}
        totalReviews={10}
      />
    );

    expect(screen.getByText('4.2')).toBeInTheDocument();
    expect(screen.getByText(/10 reseñas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Escribir reseña/i })).toBeInTheDocument();
  });

  test('2- renderiza barras de distribución basadas en reseñas', () => {
    const reviews = [
      { id: 'r1', rating: 5, comment: 'Great', created_at: '2024-01-01T00:00:00Z' },
      { id: 'r2', rating: 4, comment: 'Good', created_at: '2024-01-02T00:00:00Z' },
      { id: 'r3', rating: 5, comment: 'Awesome', created_at: '2024-01-03T00:00:00Z' },
    ];

    render(<ProductReviews productId="p2" reviews={reviews as any} />);
    const fiveLabel = screen.getByText('5★');
    const fiveRow = fiveLabel.closest('div');
    expect(fiveRow).toBeTruthy();
    const innerBar = fiveRow!.querySelector('div[style]') || fiveRow!.querySelector('div > div');
    expect(innerBar).toBeTruthy();
    const styleAttr = innerBar ? (innerBar.getAttribute('style') || '') : '';
    expect(styleAttr).toMatch(/66(\.|,)?6/);
  });

  test('3- renderiza lista de reseñas con usuario, comentario y conteo de útiles', () => {
    const reviews = [
      {
        id: 'r1',
        rating: 5,
        comment: 'Excelente viaje',
        created_at: '2024-05-10T12:00:00Z',
        user_data: { name: 'Juan Perez', username: 'juanp', avatar_url: '' },
        helpful_count: 3,
      },
    ];

    render(<ProductReviews productId="p3" reviews={reviews as any} />);

    // User name
    expect(screen.getByText(/Juan Perez|juanp/i)).toBeInTheDocument();
    // Comment
    expect(screen.getByText(/Excelente viaje/i)).toBeInTheDocument();
    // Botón de útil con conteo
    expect(screen.getByText(/Útil \(3\)/i)).toBeInTheDocument();
  });

  test('4- muestra estado vacío cuando no hay reseñas y al hacer clic en CTA registra acción', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    render(<ProductReviews productId="p4" reviews={[]} />);

    expect(screen.getByText(/Aún no hay reseñas/i)).toBeInTheDocument();
    // elige específicamente el CTA del estado vacío 
    const btn = screen.getByRole('button', { name: /Escribir primera reseña/i });
    fireEvent.click(btn);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
