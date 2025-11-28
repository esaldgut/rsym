/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecoveryDialog } from '../RecoveryDialog';
import type { SaveMetadata } from '@/hooks/useAutoSave';

// ============================================================================
// TEST DATA
// ============================================================================

const mockDraftMetadata: SaveMetadata = {
  timestamp: new Date('2025-11-28T10:00:00.000Z').toISOString(),
  savedBy: 'auto-save',
  size: 1024000, // 1MB
  version: '1.0.0'
};

const mockManualSaveMetadata: SaveMetadata = {
  timestamp: new Date('2025-11-28T08:30:00.000Z').toISOString(),
  savedBy: 'manual',
  size: 2048000, // 2MB
  version: '1.0.0'
};

const mockRecoverySaveMetadata: SaveMetadata = {
  timestamp: new Date('2025-11-27T15:00:00.000Z').toISOString(),
  savedBy: 'recovery',
  size: 512000, // 500KB
  version: '1.0.0'
};

// ============================================================================
// TESTS
// ============================================================================

describe('RecoveryDialog', () => {
  let onRecover: jest.Mock;
  let onDiscard: jest.Mock;

  beforeEach(() => {
    onRecover = jest.fn();
    onDiscard = jest.fn();
    
    // Reset body overflow
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = 'unset';
  });

  // ==========================================================================
  // 1. RENDERIZADO BÁSICO
  // ==========================================================================

  describe('Renderizado Básico', () => {
    it('no renderiza cuando isOpen es false', () => {
      const { container } = render(
        <RecoveryDialog
          isOpen={false}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('no renderiza cuando draftMetadata es null', () => {
      const { container } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={null}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renderiza cuando isOpen es true y hay metadata', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Sesión no guardada encontrada')).toBeInTheDocument();
    });

    it('renderiza el backdrop', () => {
      const { container } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/70');
      expect(backdrop).toBeInTheDocument();
    });

    it('renderiza el título del diálogo', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Sesión no guardada encontrada')).toBeInTheDocument();
    });

    it('renderiza el mensaje descriptivo', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText(/Encontramos un borrador de tu momento anterior/)).toBeInTheDocument();
    });

    it('renderiza los botones de acción', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Descartar')).toBeInTheDocument();
      expect(screen.getByText(/Recuperar Borrador/)).toBeInTheDocument();
    });

    it('renderiza el mensaje de advertencia', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText(/Si descartas este borrador, se perderá permanentemente/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 2. METADATA - TIEMPO RELATIVO
  // ==========================================================================

  describe('Formato de Tiempo Relativo', () => {
    it('muestra "Hace un momento" para timestamps muy recientes', () => {
      const recentMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        timestamp: new Date(Date.now() - 30000).toISOString() // 30 segundos atrás
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={recentMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Hace un momento')).toBeInTheDocument();
    });

    it('muestra minutos para timestamps recientes', () => {
      const minutesAgoMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutos atrás
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={minutesAgoMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText(/Hace \d+ minutos?/)).toBeInTheDocument();
    });

    it('muestra "minuto" en singular para 1 minuto', () => {
      const oneMinuteAgoMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        timestamp: new Date(Date.now() - 60 * 1000).toISOString() // 1 minuto atrás
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={oneMinuteAgoMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Hace 1 minuto')).toBeInTheDocument();
    });

    it('muestra horas para timestamps de horas atrás', () => {
      const hoursAgoMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 horas atrás
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={hoursAgoMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText(/Hace \d+ horas?/)).toBeInTheDocument();
    });

    it('muestra "hora" en singular para 1 hora', () => {
      const oneHourAgoMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hora atrás
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={oneHourAgoMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Hace 1 hora')).toBeInTheDocument();
    });

    it('muestra días para timestamps antiguos', () => {
      const daysAgoMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 días atrás
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={daysAgoMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText(/Hace \d+ días?/)).toBeInTheDocument();
    });

    it('muestra "día" en singular para 1 día', () => {
      const oneDayAgoMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 día atrás
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={oneDayAgoMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Hace 1 día')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 3. METADATA - FECHA Y HORA
  // ==========================================================================

  describe('Formato de Fecha y Hora', () => {
    it('muestra la fecha y hora formateadas', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      // Verificar que existe algún texto que parezca una fecha formateada
      const dateTimeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(dateTimeElements.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 4. METADATA - TIPO DE GUARDADO
  // ==========================================================================

  describe('Tipo de Guardado', () => {
    it('muestra icono y label para auto-save', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Auto-guardado')).toBeInTheDocument();
      expect(screen.getByText('🔄')).toBeInTheDocument();
    });

    it('muestra icono y label para manual save', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockManualSaveMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Guardado manual')).toBeInTheDocument();
      expect(screen.getByText('💾')).toBeInTheDocument();
    });

    it('muestra icono y label para recovery save', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockRecoverySaveMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Recuperación')).toBeInTheDocument();
      expect(screen.getByText('🔁')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 5. METADATA - TAMAÑO DEL ARCHIVO
  // ==========================================================================

  describe('Formato de Tamaño de Archivo', () => {
    it('muestra tamaño en KB para archivos pequeños', () => {
      const smallMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        size: 5120 // 5KB
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={smallMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText(/5 KB/)).toBeInTheDocument();
    });

    it('muestra tamaño en MB para archivos grandes', () => {
      const largeMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        size: 5242880 // 5MB
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={largeMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText(/5 MB/)).toBeInTheDocument();
    });

    it('muestra "0 Bytes" para tamaño 0', () => {
      const zeroSizeMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        size: 0
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={zeroSizeMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('0 Bytes')).toBeInTheDocument();
    });

    it('muestra tamaño en Bytes para archivos muy pequeños', () => {
      const tinyMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        size: 512 // 512 bytes
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={tinyMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText(/512 Bytes/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 6. INTERACCIONES
  // ==========================================================================

  describe('Interacciones', () => {
    it('llama a onRecover al hacer clic en Recuperar Borrador', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const recoverButton = screen.getByText(/Recuperar Borrador/);
      fireEvent.click(recoverButton);

      expect(onRecover).toHaveBeenCalledTimes(1);
    });

    it('llama a onDiscard al hacer clic en Descartar', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const discardButton = screen.getByText('Descartar');
      fireEvent.click(discardButton);

      expect(onDiscard).toHaveBeenCalledTimes(1);
    });

    it('no llama a callbacks múltiples veces en un solo clic', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const recoverButton = screen.getByText(/Recuperar Borrador/);
      fireEvent.click(recoverButton);

      expect(onRecover).toHaveBeenCalledTimes(1);
      expect(onDiscard).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 7. BODY SCROLL LOCK
  // ==========================================================================

  describe('Body Scroll Lock', () => {
    it('bloquea el scroll del body cuando el diálogo está abierto', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restaura el scroll del body cuando el diálogo se cierra', () => {
      const { rerender } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <RecoveryDialog
          isOpen={false}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(document.body.style.overflow).toBe('unset');
    });

    it('limpia el scroll lock cuando el componente se desmonta', () => {
      const { unmount } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  // ==========================================================================
  // 8. ESTRUCTURA DEL DOM
  // ==========================================================================

  describe('Estructura del DOM', () => {
    it('renderiza el backdrop con las clases correctas', () => {
      const { container } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const backdrop = container.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass('fixed', 'inset-0', 'bg-black/70');
    });

    it('renderiza el diálogo con z-index correcto', () => {
      const { container } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const dialogContainer = container.querySelector('.z-\\[201\\]');
      expect(dialogContainer).toBeInTheDocument();
    });

    it('renderiza los iconos SVG correctamente', () => {
      const { container } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('renderiza secciones de metadata con iconos de fondo', () => {
      const { container } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      // Verificar que hay divs con clases de color de fondo para iconos
      const iconBackgrounds = container.querySelectorAll('.bg-pink-500\\/10, .bg-purple-500\\/10, .bg-blue-500\\/10');
      expect(iconBackgrounds.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 9. ACCESIBILIDAD
  // ==========================================================================

  describe('Accesibilidad', () => {
    it('el backdrop tiene aria-hidden', () => {
      const { container } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('los botones son accesibles por teclado', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const recoverButton = screen.getByText(/Recuperar Borrador/);
      const discardButton = screen.getByText('Descartar');

      expect(recoverButton.tagName).toBe('BUTTON');
      expect(discardButton.tagName).toBe('BUTTON');
    });
  });

  // ==========================================================================
  // 10. CASOS EDGE
  // ==========================================================================

  describe('Casos Edge', () => {
    it('maneja metadata con timestamp inválido', () => {
      const invalidMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        timestamp: 'invalid-date'
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={invalidMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      // No debe lanzar error
      expect(screen.getByText('Sesión no guardada encontrada')).toBeInTheDocument();
    });

    it('maneja tamaños de archivo negativos', () => {
      const negativeMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        size: -1000
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={negativeMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      // No debe lanzar error
      expect(screen.getByText('Sesión no guardada encontrada')).toBeInTheDocument();
    });

    it('maneja tamaños de archivo extremadamente grandes', () => {
      const hugeMetadata: SaveMetadata = {
        ...mockDraftMetadata,
        size: 1024 * 1024 * 1024 * 5 // 5GB
      };

      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={hugeMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText(/GB/)).toBeInTheDocument();
    });

    it('maneja cambio de metadata mientras está abierto', () => {
      const { rerender } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Auto-guardado')).toBeInTheDocument();

      rerender(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockManualSaveMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(screen.getByText('Guardado manual')).toBeInTheDocument();
    });

    it('maneja múltiples aperturas y cierres', () => {
      const { rerender } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <RecoveryDialog
          isOpen={false}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(document.body.style.overflow).toBe('unset');

      rerender(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  // ==========================================================================
  // 11. ESTILOS VISUALES
  // ==========================================================================

  describe('Estilos Visuales', () => {
    it('el botón Recuperar tiene gradiente y estilos destacados', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const recoverButton = screen.getByText(/Recuperar Borrador/);
      expect(recoverButton).toHaveClass('bg-gradient-to-r', 'from-pink-500', 'to-purple-600');
    });

    it('el botón Descartar tiene estilos secundarios', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const discardButton = screen.getByText('Descartar');
      expect(discardButton).toHaveClass('bg-white/10');
    });

    it('el banner de advertencia tiene estilos amber', () => {
      const { container } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const warningBanner = container.querySelector('.bg-amber-500\\/10');
      expect(warningBanner).toBeInTheDocument();
    });

    it('el diálogo tiene borde rosa', () => {
      const { container } = render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      const dialog = container.querySelector('.border-pink-500\\/20');
      expect(dialog).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 12. INTEGRACIÓN
  // ==========================================================================

  describe('Integración', () => {

    it('flujo completo: abrir -> ver advertencia -> descartar', () => {
      render(
        <RecoveryDialog
          isOpen={true}
          draftMetadata={mockDraftMetadata}
          onRecover={onRecover}
          onDiscard={onDiscard}
        />
      );

      // Verificar advertencia
      expect(screen.getByText(/se perderá permanentemente/)).toBeInTheDocument();

      // Descartar
      const discardButton = screen.getByText('Descartar');
      fireEvent.click(discardButton);

      expect(onDiscard).toHaveBeenCalledTimes(1);
    });
  });
});
