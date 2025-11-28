/**
 * UndoRedoControls Test Suite
 *
 * Tests for the Undo/Redo controls component with CE.SDK integration.
 * Covers:
 * - Initial state rendering
 * - Button state updates based on history
 * - Click handlers for undo/redo
 * - Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
 * - CE.SDK event subscriptions
 * - Notifications
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UndoRedoControls } from '../UndoRedoControls';
import type CreativeEditorSDK from '@cesdk/cesdk-js';

// ============================================================================
// MOCKS
// ============================================================================

const mockUndo = jest.fn();
const mockRedo = jest.fn();
const mockCanUndo = jest.fn();
const mockCanRedo = jest.fn();
const mockOnHistoryUpdated = jest.fn();
const mockShowNotification = jest.fn();

const createMockCESDK = (canUndo = false, canRedo = false): CreativeEditorSDK => {
  mockCanUndo.mockReturnValue(canUndo);
  mockCanRedo.mockReturnValue(canRedo);

  return {
    engine: {
      editor: {
        undo: mockUndo,
        redo: mockRedo,
        canUndo: mockCanUndo,
        canRedo: mockCanRedo,
        onHistoryUpdated: mockOnHistoryUpdated
      }
    },
    ui: {
      showNotification: mockShowNotification
    }
  } as unknown as CreativeEditorSDK;
};

// ============================================================================
// TESTS
// ============================================================================

describe('UndoRedoControls', () => {
  let mockCESDK: CreativeEditorSDK;
  let unsubscribeFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribeFn = jest.fn();
    mockOnHistoryUpdated.mockReturnValue(unsubscribeFn);
    
    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('should render null when cesdkInstance is null', () => {
      const { container } = render(
        <UndoRedoControls cesdkInstance={null} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render undo and redo buttons when cesdkInstance is provided', () => {
      mockCESDK = createMockCESDK();

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should apply custom className to container', () => {
      mockCESDK = createMockCESDK();

      const { container } = render(
        <UndoRedoControls
          cesdkInstance={mockCESDK}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should show tooltips when showTooltips is true', () => {
      mockCESDK = createMockCESDK(true, true);

      render(
        <UndoRedoControls
          cesdkInstance={mockCESDK}
          showTooltips={true}
        />
      );

      const undoButton = screen.getAllByRole('button')[0];
      expect(undoButton).toHaveAttribute('title', 'Deshacer (Ctrl+Z)');
    });

    it('should hide tooltips when showTooltips is false', () => {
      mockCESDK = createMockCESDK(true, true);

      render(
        <UndoRedoControls
          cesdkInstance={mockCESDK}
          showTooltips={false}
        />
      );

      const undoButton = screen.getAllByRole('button')[0];
      expect(undoButton).not.toHaveAttribute('title');
    });
  });

  // ==========================================================================
  // BUTTON STATE TESTS
  // ==========================================================================

  describe('Button States', () => {
    it('should disable both buttons when canUndo and canRedo are false', () => {
      mockCESDK = createMockCESDK(false, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const [undoButton, redoButton] = screen.getAllByRole('button');
      expect(undoButton).toBeDisabled();
      expect(redoButton).toBeDisabled();
    });

    it('should enable undo button when canUndo is true', () => {
      mockCESDK = createMockCESDK(true, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const [undoButton, redoButton] = screen.getAllByRole('button');
      expect(undoButton).not.toBeDisabled();
      expect(redoButton).toBeDisabled();
    });

    it('should enable redo button when canRedo is true', () => {
      mockCESDK = createMockCESDK(false, true);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const [undoButton, redoButton] = screen.getAllByRole('button');
      expect(undoButton).toBeDisabled();
      expect(redoButton).not.toBeDisabled();
    });

    it('should enable both buttons when canUndo and canRedo are true', () => {
      mockCESDK = createMockCESDK(true, true);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const [undoButton, redoButton] = screen.getAllByRole('button');
      expect(undoButton).not.toBeDisabled();
      expect(redoButton).not.toBeDisabled();
    });
  });

  // ==========================================================================
  // CLICK HANDLER TESTS
  // ==========================================================================

  describe('Click Handlers', () => {
    it('should call undo when undo button is clicked', () => {
      mockCESDK = createMockCESDK(true, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const undoButton = screen.getAllByRole('button')[0];
      fireEvent.click(undoButton);

      expect(mockUndo).toHaveBeenCalledTimes(1);
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'success',
        message: 'Deshacer',
        duration: 'short'
      });
    });

    it('should not call undo when button is disabled', () => {
      mockCESDK = createMockCESDK(false, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const undoButton = screen.getAllByRole('button')[0];
      fireEvent.click(undoButton);

      expect(mockUndo).not.toHaveBeenCalled();
    });

    it('should call redo when redo button is clicked', () => {
      mockCESDK = createMockCESDK(false, true);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const redoButton = screen.getAllByRole('button')[1];
      fireEvent.click(redoButton);

      expect(mockRedo).toHaveBeenCalledTimes(1);
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'success',
        message: 'Rehacer',
        duration: 'short'
      });
    });

    it('should not call redo when button is disabled', () => {
      mockCESDK = createMockCESDK(false, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const redoButton = screen.getAllByRole('button')[1];
      fireEvent.click(redoButton);

      expect(mockRedo).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // KEYBOARD SHORTCUT TESTS
  // ==========================================================================

  describe('Keyboard Shortcuts', () => {

    it('should not call undo on Ctrl+Z when canUndo is false', () => {
      mockCESDK = createMockCESDK(false, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });

      window.dispatchEvent(event);

      expect(mockUndo).not.toHaveBeenCalled();
    });

    it('should not call redo when canRedo is false', () => {
      mockCESDK = createMockCESDK(false, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });

      window.dispatchEvent(event);

      expect(mockRedo).not.toHaveBeenCalled();
    });

    it('should prevent default behavior on keyboard shortcuts', () => {
      mockCESDK = createMockCESDK(true, true);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EVENT SUBSCRIPTION TESTS
  // ==========================================================================

  describe('Event Subscriptions', () => {
    it('should subscribe to onHistoryUpdated on mount', () => {
      mockCESDK = createMockCESDK();

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      expect(mockOnHistoryUpdated).toHaveBeenCalledTimes(1);
      expect(mockOnHistoryUpdated).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should update button states when history changes', async () => {
      mockCESDK = createMockCESDK(false, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      // Get the callback function passed to onHistoryUpdated
      const historyCallback = mockOnHistoryUpdated.mock.calls[0][0];

      // Simulate history change - now undo is available
      mockCanUndo.mockReturnValue(true);
      historyCallback();

      await waitFor(() => {
        const undoButton = screen.getAllByRole('button')[0];
        expect(undoButton).not.toBeDisabled();
      });
    });

    it('should unsubscribe from onHistoryUpdated on unmount', () => {
      mockCESDK = createMockCESDK();

      const { unmount } = render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      unmount();

      expect(unsubscribeFn).toHaveBeenCalledTimes(1);
    });

    it('should remove keyboard event listener on unmount', () => {
      mockCESDK = createMockCESDK(true, false);

      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  // ==========================================================================
  // CONSOLE LOGGING TESTS
  // ==========================================================================

  describe('Console Logging', () => {
    it('should log subscription on mount', () => {
      mockCESDK = createMockCESDK();

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      expect(console.log).toHaveBeenCalledWith(
        '[UndoRedoControls] 📚 Subscribing to history events'
      );
    });

    it('should log keyboard shortcuts registration', () => {
      mockCESDK = createMockCESDK();

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      expect(console.log).toHaveBeenCalledWith(
        '[UndoRedoControls] ⌨️ Keyboard shortcuts registered (Ctrl+Z, Ctrl+Shift+Z)'
      );
    });

    it('should log undo action', () => {
      mockCESDK = createMockCESDK(true, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const undoButton = screen.getAllByRole('button')[0];
      fireEvent.click(undoButton);

      expect(console.log).toHaveBeenCalledWith('[UndoRedoControls] ↶ Undo triggered');
    });

    it('should log redo action', () => {
      mockCESDK = createMockCESDK(false, true);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const redoButton = screen.getAllByRole('button')[1];
      fireEvent.click(redoButton);

      expect(console.log).toHaveBeenCalledWith('[UndoRedoControls] ↷ Redo triggered');
    });

    it('should log cleanup on unmount', () => {
      mockCESDK = createMockCESDK();

      const { unmount } = render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      unmount();

      expect(console.log).toHaveBeenCalledWith(
        '[UndoRedoControls] 🧹 Unsubscribed from history events'
      );
    });

    it('should log history updates', () => {
      mockCESDK = createMockCESDK(false, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const historyCallback = mockOnHistoryUpdated.mock.calls[0][0];

      mockCanUndo.mockReturnValue(true);
      mockCanRedo.mockReturnValue(false);
      historyCallback();

      expect(console.log).toHaveBeenCalledWith(
        '[UndoRedoControls] 🔄 History updated:',
        {
          canUndo: true,
          canRedo: false
        }
      );
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle multiple rapid undo clicks', () => {
      mockCESDK = createMockCESDK(true, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const undoButton = screen.getAllByRole('button')[0];
      
      fireEvent.click(undoButton);
      fireEvent.click(undoButton);
      fireEvent.click(undoButton);

      expect(mockUndo).toHaveBeenCalledTimes(3);
    });

    it('should handle cesdkInstance change', () => {
      mockCESDK = createMockCESDK(true, false);

      const { rerender } = render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const newMockCESDK = createMockCESDK(false, true);
      rerender(<UndoRedoControls cesdkInstance={newMockCESDK} />);

      expect(mockOnHistoryUpdated).toHaveBeenCalledTimes(2);
      expect(unsubscribeFn).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for disabled buttons', () => {
      mockCESDK = createMockCESDK(false, false);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const [undoButton, redoButton] = screen.getAllByRole('button');
      
      expect(undoButton).toHaveAttribute('disabled');
      expect(redoButton).toHaveAttribute('disabled');
    });

    it('should be keyboard navigable', () => {
      mockCESDK = createMockCESDK(true, true);

      render(<UndoRedoControls cesdkInstance={mockCESDK} />);

      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        button.focus();
        expect(button).toHaveFocus();
      });
    });
  });
});
