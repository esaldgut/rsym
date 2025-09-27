/**
 * Tests para el transformador de URLs S3
 */

import {
  extractS3PathFromUrl,
  transformUrlArrayToPaths,
  transformProductUrlsToPaths,
  transformPathsToUrls,
  validateS3UrlTransformation
} from '../s3-url-transformer';

// Mock de config para tests
jest.mock('../../../../amplify/outputs.json', () => ({
  storage: {
    bucket_name: 'yaan-provider-documents',
    aws_region: 'us-west-2'
  }
}));

describe('S3 URL Transformer', () => {
  const mockS3Url = 'https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/user123/gallery/image_1695123456_abc123.jpg';
  const mockS3Path = 'public/products/user123/gallery/image_1695123456_abc123.jpg';

  describe('extractS3PathFromUrl', () => {
    it('should extract path from S3 URL', () => {
      const result = extractS3PathFromUrl(mockS3Url);
      expect(result).toBe(mockS3Path);
    });

    it('should return path as-is if already a path', () => {
      const result = extractS3PathFromUrl(mockS3Path);
      expect(result).toBe(mockS3Path);
    });

    it('should return null for null/undefined', () => {
      expect(extractS3PathFromUrl(null)).toBeNull();
      expect(extractS3PathFromUrl(undefined)).toBeNull();
      expect(extractS3PathFromUrl('')).toBeNull();
    });
  });

  describe('transformUrlArrayToPaths', () => {
    it('should transform array of URLs to paths', () => {
      const urls = [
        mockS3Url,
        'https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/user123/gallery/image2.jpg'
      ];
      const result = transformUrlArrayToPaths(urls);
      expect(result).toEqual([
        mockS3Path,
        'public/products/user123/gallery/image2.jpg'
      ]);
    });

    it('should handle empty/null arrays', () => {
      expect(transformUrlArrayToPaths(null)).toEqual([]);
      expect(transformUrlArrayToPaths(undefined)).toEqual([]);
      expect(transformUrlArrayToPaths([])).toEqual([]);
    });
  });

  describe('transformProductUrlsToPaths', () => {
    it('should transform product URLs to paths', () => {
      const product = {
        name: 'Test Product',
        cover_image_url: mockS3Url,
        image_url: [mockS3Url, 'https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/user123/gallery/image2.jpg'],
        video_url: ['https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/user123/gallery/video1.mp4'],
        description: 'Test description'
      };

      const result = transformProductUrlsToPaths(product);

      expect(result.cover_image_url).toBe(mockS3Path);
      expect(result.image_url).toEqual([
        mockS3Path,
        'public/products/user123/gallery/image2.jpg'
      ]);
      expect(result.video_url).toEqual([
        'public/products/user123/gallery/video1.mp4'
      ]);
      expect(result.name).toBe('Test Product'); // Other fields unchanged
    });
  });

  describe('transformPathsToUrls', () => {
    it('should transform paths back to URLs', () => {
      const product = {
        cover_image_url: mockS3Path,
        image_url: [mockS3Path, 'public/products/user123/gallery/image2.jpg']
      };

      const result = transformPathsToUrls(product);

      expect(result.cover_image_url).toBe(mockS3Url);
      expect(result.image_url[0]).toBe(mockS3Url);
      expect(result.image_url[1]).toBe('https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/user123/gallery/image2.jpg');
    });

    it('should leave URLs unchanged', () => {
      const product = {
        cover_image_url: mockS3Url, // Already a URL
        image_url: [mockS3Url]
      };

      const result = transformPathsToUrls(product);

      expect(result.cover_image_url).toBe(mockS3Url);
      expect(result.image_url[0]).toBe(mockS3Url);
    });
  });

  describe('validateS3UrlTransformation', () => {
    it('should validate URL to path transformation', () => {
      const isValid = validateS3UrlTransformation(mockS3Url, mockS3Path);
      expect(isValid).toBe(true);
    });

    it('should validate path to path (no change)', () => {
      const isValid = validateS3UrlTransformation(mockS3Path, mockS3Path);
      expect(isValid).toBe(true);
    });
  });
});

describe('Integration Example', () => {
  it('should demonstrate complete flow', () => {
    // Simular datos como vienen del frontend (URLs completas)
    const frontendData = {
      name: 'Circuito Mágico',
      cover_image_url: 'https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/user123/main-image.jpg',
      image_url: [
        'https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/user123/gallery/image1.jpg',
        'https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/user123/gallery/image2.jpg'
      ],
      user_id: 'user123'
    };

    // Transformar para GraphQL (solo paths)
    const forGraphQL = transformProductUrlsToPaths(frontendData);

    expect(forGraphQL).toEqual({
      name: 'Circuito Mágico',
      cover_image_url: 'public/products/user123/main-image.jpg',
      image_url: [
        'public/products/user123/gallery/image1.jpg',
        'public/products/user123/gallery/image2.jpg'
      ],
      user_id: 'user123'
    });

    // Simular respuesta de GraphQL (paths)
    const fromGraphQL = {
      id: 'prod123',
      name: 'Circuito Mágico',
      cover_image_url: 'public/products/user123/main-image.jpg',
      image_url: [
        'public/products/user123/gallery/image1.jpg',
        'public/products/user123/gallery/image2.jpg'
      ]
    };

    // Transformar para UI (URLs completas)
    const forUI = transformPathsToUrls(fromGraphQL);

    expect(forUI.cover_image_url).toBe('https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/user123/main-image.jpg');
    expect(forUI.image_url).toEqual([
      'https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/user123/gallery/image1.jpg',
      'https://yaan-provider-documents.s3.us-west-2.amazonaws.com/public/products/user123/gallery/image2.jpg'
    ]);
  });
});