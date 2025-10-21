'use client';

import { useState, useEffect, useCallback } from 'react';

export type ProductDetailTab = 'descripcion' | 'itinerario' | 'temporadas' | 'alojamiento' | 'mapa' | 'galeria';

interface UseProductDetailProps {
  onClose?: () => void;
  initialTab?: ProductDetailTab;
}

export function useProductDetail({ onClose, initialTab = 'descripcion' }: UseProductDetailProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductDetailTab>(initialTab);
  const [isAnimating, setIsAnimating] = useState(false);

  // Open modal
  const open = useCallback(() => {
    setIsOpen(true);
    setIsAnimating(true);

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Delay animation flag reset
    setTimeout(() => setIsAnimating(false), 400);
  }, []);

  // Close modal
  const close = useCallback(() => {
    setIsAnimating(true);

    // Unlock body scroll
    document.body.style.overflow = 'unset';

    // Delay modal close for animation
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
      setActiveTab(initialTab);
      onClose?.();
    }, 300);
  }, [initialTab, onClose]);

  // Toggle modal
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Change active tab
  const changeTab = useCallback((tab: ProductDetailTab) => {
    setActiveTab(tab);

    // Scroll to top of modal content when changing tabs
    const modalContent = document.getElementById('product-detail-content');
    if (modalContent) {
      modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, close]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return {
    isOpen,
    activeTab,
    isAnimating,
    open,
    close,
    toggle,
    changeTab
  };
}
