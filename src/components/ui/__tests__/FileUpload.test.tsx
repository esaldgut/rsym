/**
 * Unit tests for FileUpload component
 *
 * Tests file upload functionality including validation, upload flow, and variants.
 * Mocks useMediaUpload hook to isolate component behavior.
 *
 * @see src/components/ui/FileUpload.tsx
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload, ImageUpload, VideoUpload } from '../FileUpload';

// Mock the useMediaUpload hook
const mockUploadFile = jest.fn();
let mockIsUploading = false;
let mockProgress = 0;

jest.mock('@/hooks/useMediaUpload', () => ({
  useMediaUpload: () => ({
    uploadFile: mockUploadFile,
    isUploading: mockIsUploading,
    progress: mockProgress
  })
}));

// Helper to create a mock file
function createMockFile(name: string, size: number, type: string): File {
  const file = new File(['x'.repeat(size)], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('FileUpload', () => {
  const defaultProps = {
    accept: '.jpg,.png',
    onUploadSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsUploading = false;
    mockProgress = 0;
    mockUploadFile.mockReset();
  });

  // ============================================================
  // RENDERING TESTS
  // ============================================================

  describe('Rendering', () => {
    it('renders label with default buttonText', () => {
      render(<FileUpload {...defaultProps} />);

      expect(screen.getByText('Subir Archivo')).toBeInTheDocument();
    });

    it('renders custom buttonText', () => {
      render(<FileUpload {...defaultProps} buttonText="Seleccionar archivo" />);

      expect(screen.getByText('Seleccionar archivo')).toBeInTheDocument();
    });

    it('applies custom buttonClassName', () => {
      render(<FileUpload {...defaultProps} buttonClassName="custom-button-class" />);

      const label = screen.getByText('Subir Archivo').closest('label');
      expect(label).toHaveClass('custom-button-class');
    });

    it('renders upload icon', () => {
      render(<FileUpload {...defaultProps} />);

      // SVG icon should be present
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('input file has accept prop', () => {
      render(<FileUpload {...defaultProps} accept=".pdf,.doc" />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', '.pdf,.doc');
    });

    it('input file is hidden', () => {
      render(<FileUpload {...defaultProps} />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveClass('hidden');
    });
  });

  // ============================================================
  // FILE SIZE VALIDATION TESTS
  // ============================================================

  describe('File Size Validation', () => {
    it('rejects file larger than maxSizeMB', async () => {
      const onUploadError = jest.fn();
      render(
        <FileUpload
          {...defaultProps}
          maxSizeMB={5}
          onUploadError={onUploadError}
        />
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createMockFile('large.jpg', 6 * 1024 * 1024, 'image/jpeg'); // 6MB

      fireEvent.change(input, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(onUploadError).toHaveBeenCalledWith(
          'El archivo es demasiado grande. Máximo permitido: 5MB'
        );
      });
      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it('accepts file equal to maxSizeMB', async () => {
      mockUploadFile.mockResolvedValue({ success: true, url: 'test-url.jpg' });

      render(<FileUpload {...defaultProps} maxSizeMB={5} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const exactFile = createMockFile('exact.jpg', 5 * 1024 * 1024, 'image/jpeg'); // Exactly 5MB

      fireEvent.change(input, { target: { files: [exactFile] } });

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });
    });

    it('accepts file smaller than maxSizeMB', async () => {
      mockUploadFile.mockResolvedValue({ success: true, url: 'test-url.jpg' });

      render(<FileUpload {...defaultProps} maxSizeMB={10} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const smallFile = createMockFile('small.jpg', 1 * 1024 * 1024, 'image/jpeg'); // 1MB

      fireEvent.change(input, { target: { files: [smallFile] } });

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });
    });

    it('defaults maxSizeMB to 10', async () => {
      const onUploadError = jest.fn();
      render(
        <FileUpload
          {...defaultProps}
          onUploadError={onUploadError}
        />
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createMockFile('large.jpg', 11 * 1024 * 1024, 'image/jpeg'); // 11MB

      fireEvent.change(input, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(onUploadError).toHaveBeenCalledWith(
          'El archivo es demasiado grande. Máximo permitido: 10MB'
        );
      });
    });
  });

  // ============================================================
  // FILE TYPE VALIDATION TESTS
  // ============================================================

  describe('File Type Validation', () => {
    it('rejects file with disallowed extension', async () => {
      const onUploadError = jest.fn();
      render(
        <FileUpload
          {...defaultProps}
          accept=".jpg,.png"
          onUploadError={onUploadError}
        />
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const pdfFile = createMockFile('document.pdf', 1024, 'application/pdf');

      fireEvent.change(input, { target: { files: [pdfFile] } });

      await waitFor(() => {
        expect(onUploadError).toHaveBeenCalledWith(
          'Tipo de archivo no permitido. Formatos aceptados: .jpg,.png'
        );
      });
    });

    it('accepts file with allowed extension', async () => {
      mockUploadFile.mockResolvedValue({ success: true, url: 'test-url.jpg' });

      render(<FileUpload {...defaultProps} accept=".jpg,.png" />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const jpgFile = createMockFile('image.jpg', 1024, 'image/jpeg');

      fireEvent.change(input, { target: { files: [jpgFile] } });

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });
    });

    it('parses multiple extensions correctly', async () => {
      mockUploadFile.mockResolvedValue({ success: true, url: 'test-url.png' });

      render(<FileUpload {...defaultProps} accept=".jpg, .png, .gif" />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const pngFile = createMockFile('image.png', 1024, 'image/png');

      fireEvent.change(input, { target: { files: [pngFile] } });

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });
    });

    it('handles case-insensitive extension matching', async () => {
      mockUploadFile.mockResolvedValue({ success: true, url: 'test-url.JPG' });

      render(<FileUpload {...defaultProps} accept=".jpg,.png" />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const upperCaseFile = createMockFile('IMAGE.JPG', 1024, 'image/jpeg');

      fireEvent.change(input, { target: { files: [upperCaseFile] } });

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });
    });
  });

  // ============================================================
  // UPLOAD FLOW TESTS
  // ============================================================

  describe('Upload Flow', () => {
    it('calls uploadFile with the selected file', async () => {
      mockUploadFile.mockResolvedValue({ success: true, url: 'uploaded-url.jpg' });

      render(<FileUpload {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledWith(expect.any(File));
      });
    });

    it('calls onUploadSuccess with url and fileName on success', async () => {
      const onUploadSuccess = jest.fn();
      mockUploadFile.mockResolvedValue({ success: true, url: 'https://example.com/image.jpg' });

      render(<FileUpload {...defaultProps} onUploadSuccess={onUploadSuccess} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('myimage.jpg', 1024, 'image/jpeg');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(onUploadSuccess).toHaveBeenCalledWith(
          'https://example.com/image.jpg',
          'myimage.jpg'
        );
      });
    });

    it('clears input value after upload', async () => {
      mockUploadFile.mockResolvedValue({ success: true, url: 'test-url.jpg' });

      render(<FileUpload {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('does not call anything when no file selected', async () => {
      render(<FileUpload {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [] } });

      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it('handles upload returning no url gracefully', async () => {
      const onUploadSuccess = jest.fn();
      mockUploadFile.mockResolvedValue({ success: true }); // No url

      render(<FileUpload {...defaultProps} onUploadSuccess={onUploadSuccess} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });

      // onUploadSuccess should not be called without url
      expect(onUploadSuccess).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // LOADING STATE TESTS
  // ============================================================

  describe('Loading State', () => {
    it('shows spinner when isUploading is true', () => {
      mockIsUploading = true;

      render(<FileUpload {...defaultProps} />);

      // Should show spinner animation
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows progress percentage when uploading', () => {
      mockIsUploading = true;
      mockProgress = 45;

      render(<FileUpload {...defaultProps} />);

      expect(screen.getByText(/Subiendo.*45%/i)).toBeInTheDocument();
    });

    it('disables label when isUploading', () => {
      mockIsUploading = true;

      render(<FileUpload {...defaultProps} />);

      const label = screen.getByText(/Subiendo/i).closest('label');
      expect(label).toHaveClass('opacity-50');
      expect(label).toHaveClass('cursor-not-allowed');
    });

    it('shows progress bar when uploading', () => {
      mockIsUploading = true;
      mockProgress = 60;

      render(<FileUpload {...defaultProps} />);

      // Progress bar should exist
      const progressBar = document.querySelector('.bg-blue-600');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '60%' });
    });

    it('disables input when isUploading', () => {
      mockIsUploading = true;

      render(<FileUpload {...defaultProps} />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toBeDisabled();
    });
  });

  // ============================================================
  // DISABLED STATE TESTS
  // ============================================================

  describe('Disabled State', () => {
    it('label has cursor-not-allowed when disabled', () => {
      render(<FileUpload {...defaultProps} disabled />);

      const label = screen.getByText('Subir Archivo').closest('label');
      expect(label).toHaveClass('cursor-not-allowed');
    });

    it('input is disabled when disabled prop is true', () => {
      render(<FileUpload {...defaultProps} disabled />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toBeDisabled();
    });

    it('applies opacity when disabled', () => {
      render(<FileUpload {...defaultProps} disabled />);

      const label = screen.getByText('Subir Archivo').closest('label');
      expect(label).toHaveClass('opacity-50');
    });
  });

  // ============================================================
  // IMAGEUPLOAD VARIANT TESTS
  // ============================================================

  describe('ImageUpload Variant', () => {
    it('uses image-specific accept types', () => {
      render(<ImageUpload onUploadSuccess={jest.fn()} />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', '.jpg,.jpeg,.png,.webp,.gif');
    });

    it('has correct buttonText', () => {
      render(<ImageUpload onUploadSuccess={jest.fn()} />);

      expect(screen.getByText('Seleccionar Imagen')).toBeInTheDocument();
    });

    it('uses green button styling', () => {
      render(<ImageUpload onUploadSuccess={jest.fn()} />);

      const label = screen.getByText('Seleccionar Imagen').closest('label');
      expect(label).toHaveClass('bg-green-500');
    });
  });

  // ============================================================
  // VIDEOUPLOAD VARIANT TESTS
  // ============================================================

  describe('VideoUpload Variant', () => {
    it('uses video-specific accept types', () => {
      render(<VideoUpload onUploadSuccess={jest.fn()} />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', '.mp4,.mov,.avi,.mkv,.webm');
    });

    it('has correct buttonText', () => {
      render(<VideoUpload onUploadSuccess={jest.fn()} />);

      expect(screen.getByText('Seleccionar Video')).toBeInTheDocument();
    });

    it('uses blue button styling', () => {
      render(<VideoUpload onUploadSuccess={jest.fn()} />);

      const label = screen.getByText('Seleccionar Video').closest('label');
      expect(label).toHaveClass('bg-blue-500');
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('handles file without extension', async () => {
      const onUploadError = jest.fn();
      render(
        <FileUpload
          {...defaultProps}
          accept=".jpg,.png"
          onUploadError={onUploadError}
        />
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const noExtFile = createMockFile('noextension', 1024, 'application/octet-stream');

      fireEvent.change(input, { target: { files: [noExtFile] } });

      await waitFor(() => {
        expect(onUploadError).toHaveBeenCalled();
      });
    });

    it('generates unique input id', () => {
      render(
        <>
          <FileUpload {...defaultProps} />
          <FileUpload {...defaultProps} />
        </>
      );

      const inputs = document.querySelectorAll('input[type="file"]');
      const id1 = inputs[0].getAttribute('id');
      const id2 = inputs[1].getAttribute('id');

      expect(id1).not.toEqual(id2);
    });

    it('handles null files gracefully', async () => {
      render(<FileUpload {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Simulate null files
      fireEvent.change(input, { target: { files: null } });

      expect(mockUploadFile).not.toHaveBeenCalled();
    });
  });
});
