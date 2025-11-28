import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mocks 
jest.mock('../../marketplace/ProductGalleryHeader', () => {
  const React = require('react');
  return {
    ProductGalleryHeader: React.forwardRef(function MockGallery(props: any, ref: any) {
      if (React.useImperativeHandle) {
        React.useImperativeHandle(ref, () => ({ pause: jest.fn(), resume: jest.fn() }));
      }
      return React.createElement(
        'div',
        { 'data-testid': 'mock-gallery' },
        React.createElement('button', { onClick: props.onOpenFullscreen }, 'Open Fullscreen')
      );
    })
  };
});

jest.mock('../../marketplace/FullscreenGallery', () => {
  const React = require('react');
  return {
    FullscreenGallery: (props: any) => React.createElement('div', { 'data-testid': 'mock-fullscreen' }, props.isOpen ? 'open' : 'closed')
  };
});

jest.mock('../../marketplace/SeasonCard', () => {
  const React = require('react');
  return {
    SeasonCard: (props: any) => React.createElement('div', { 'data-testid': 'mock-season' }, props.season?.id)
  };
});

jest.mock('../../marketplace/ProductReviews', () => {
  const React = require('react');
  return {
    ProductReviews: () => React.createElement('div', { 'data-testid': 'mock-reviews' }, 'reviews')
  };
});

jest.mock('../../marketplace/maps/HybridProductMap', () => {
  const React = require('react');
  return {
    HybridProductMap: () => React.createElement('div', { 'data-testid': 'mock-map' }, 'map')
  };
});

jest.mock('../../ui/ProfileImage', () => {
  const React = require('react');
  return {
    ProfileImage: (props: any) => React.createElement('img', { 'data-testid': 'mock-profile', src: props.path, alt: props.alt })
  };
});

jest.mock('../../marketplace/ItineraryCard', () => {
  const React = require('react');
  return {
    ItineraryCard: (props: any) => React.createElement('div', { 'data-testid': 'mock-itinerary' }, props.itinerary)
  };
});

jest.mock('@/lib/server/url-encryption-actions', () => ({
  encryptProductUrlAction: jest.fn()
}));

jest.mock('@/hooks/useProfileCompletion', () => ({
  useProfileCompletion: jest.fn()
}));

// Mock next/router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}));

import { ProductDetailModal } from '../../ProductDetailModal';
import { encryptProductUrlAction } from '@/lib/server/url-encryption-actions';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

const mockEncrypt = encryptProductUrlAction as jest.MockedFunction<typeof encryptProductUrlAction>;
const mockUseProfileCompletion = useProfileCompletion as jest.MockedFunction<any>;

describe('ProductDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProfileCompletion.mockReturnValue({
      isComplete: true,
      isLoading: false,
      userType: 'traveler',
      requireProfileCompletion: jest.fn().mockReturnValue(false)
    });
  });

  const product = {
    id: 'p1',
    name: 'Test Product',
    description: 'A lovely product',
    product_type: 'circuit',
    published: true,
    cover_image_url: '/cover.jpg',
    image_url: ['/img1.jpg', '/img2.jpg'],
    video_url: ['/vid1.mp4'],
    min_product_price: 1234,
    preferences: ['pref1', 'pref2'],
    destination: [
      { id: 'd1', place: 'Place', coordinates: { latitude: 1, longitude: 2 } }
    ],
    seasons: [
      { id: 's1', start_date: '2025-11-01', end_date: '2025-11-30', number_of_nights: '3', product_pricing: 100 }
    ],
    itinerary: 'Day 1: do things',
    planned_hotels_or_similar: ['Hotel A'],
    user_data: { username: 'user1', name: 'User One', avatar_url: '/avatar.png' }
  } as any;

  it('1- muestra la información del producto y las secciones', () => {
    render(<ProductDetailModal product={product} onClose={jest.fn()} onReserve={jest.fn()} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Descripción/i })).toBeInTheDocument();
    expect(screen.getByTestId('mock-gallery')).toBeInTheDocument();
    expect(screen.getByText('\$1,234')).toBeInTheDocument();
  });

  it('2- navega a la reserva cuando se hace clic en Reservar ahora, el perfil está completo y la encriptación es exitosa', async () => {
    const onReserve = jest.fn();
    mockEncrypt.mockResolvedValue({ success: true, encrypted: 'abc' } as any);
    const requireProfileCompletion = jest.fn().mockReturnValue(false);
    mockUseProfileCompletion.mockReturnValue({ isComplete: true, isLoading: false, userType: 'traveler', requireProfileCompletion });

    render(<ProductDetailModal product={product} onClose={jest.fn()} onReserve={onReserve} />);

    const reserveBtn = screen.getByText('Reservar ahora');
    fireEvent.click(reserveBtn);

    await waitFor(() => expect(mockEncrypt).toHaveBeenCalledWith(product.id, product.name, product.product_type));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/marketplace/booking?product=abc'));
    expect(onReserve).toHaveBeenCalled();
  });

  it('3- no navega cuando requireProfileCompletion devuelve true', async () => {
    mockEncrypt.mockResolvedValue({ success: true, encrypted: 'abc' } as any);
    const requireProfileCompletion = jest.fn().mockReturnValue(true);
    mockUseProfileCompletion.mockReturnValue({ isComplete: false, isLoading: false, userType: 'traveler', requireProfileCompletion });

    render(<ProductDetailModal product={product} onClose={jest.fn()} onReserve={jest.fn()} />);

    const reserveBtn = screen.getByText('Reservar ahora');
    fireEvent.click(reserveBtn);

    await waitFor(() => expect(mockEncrypt).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('4- muestra alerta cuando la encriptación falla', async () => {
    const alertSpy = jest.spyOn(global, 'alert').mockImplementation(() => {});
    mockEncrypt.mockResolvedValue({ success: false, error: 'boom' } as any);

    render(<ProductDetailModal product={product} onClose={jest.fn()} onReserve={jest.fn()} />);

    const reserveBtn = screen.getByText('Reservar ahora');
    fireEvent.click(reserveBtn);

    await waitFor(() => expect(mockEncrypt).toHaveBeenCalled());
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('5- el botón Ver detalles cierra y navega', () => {
    const onClose = jest.fn();
    render(<ProductDetailModal product={product} onClose={onClose} onReserve={jest.fn()} />);

    const btn = screen.getByText('Ver detalles');
    fireEvent.click(btn);

    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(`/marketplace/booking/${product.id}`);
  });
});
