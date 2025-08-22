'use client';

import { useState } from 'react';
import Image from 'next/image';

interface MediaFile {
  url: string;
  name: string;
  type: 'image' | 'video';
}

interface MediaPreviewProps {
  files: MediaFile[];
  onRemove: (index: number) => void;
  title?: string;
}

export function MediaPreview({ files, onRemove, title = "Archivos Multimedia" }: MediaPreviewProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMediaClick = (file: MediaFile) => {
    setSelectedMedia(file);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMedia(null);
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title} ({files.length} archivos)</h4>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {files.map((file, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square relative overflow-hidden rounded-lg border border-gray-200 bg-white">
              {file.type === 'image' ? (
                <Image
                  src={file.url}
                  alt={file.name}
                  fill
                  className="object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => handleMediaClick(file)}
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                />
              ) : (
                <div 
                  className="w-full h-full flex flex-col items-center justify-center bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleMediaClick(file)}
                >
                  <svg 
                    className="w-12 h-12 text-gray-400 mb-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  <span className="text-xs text-gray-500 px-2 text-center truncate w-full">
                    {file.name.length > 15 ? `${file.name.substring(0, 12)}...` : file.name}
                  </span>
                </div>
              )}
              
              {/* Botón de eliminar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                aria-label={`Eliminar ${file.name}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Nombre del archivo (tooltip) */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="truncate text-center">{file.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para vista ampliada */}
      {isModalOpen && selectedMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={closeModal}
        >
          <div className="relative max-w-6xl max-h-[90vh] mx-4">
            <button
              onClick={closeModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {selectedMedia.type === 'image' ? (
              <div className="relative">
                <Image
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-[85vh] object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                />
                <p className="text-white text-center mt-2">{selectedMedia.name}</p>
              </div>
            ) : (
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[85vh]"
                  style={{ width: 'auto', height: 'auto' }}
                >
                  Tu navegador no soporta el elemento de video.
                </video>
                <p className="text-white text-center mt-2 p-2">{selectedMedia.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente para previsualización de solo imágenes
 */
export function ImagePreview({ images, onRemove }: { 
  images: Array<{ url: string; name: string }>;
  onRemove: (index: number) => void;
}) {
  const mediaFiles: MediaFile[] = images.map(img => ({
    ...img,
    type: 'image'
  }));
  
  return <MediaPreview files={mediaFiles} onRemove={onRemove} title="Imágenes Adicionales" />;
}

/**
 * Componente para previsualización de solo videos
 */
export function VideoPreview({ videos, onRemove }: {
  videos: Array<{ url: string; name: string }>;
  onRemove: (index: number) => void;
}) {
  const mediaFiles: MediaFile[] = videos.map(vid => ({
    ...vid,
    type: 'video'
  }));
  
  return <MediaPreview files={mediaFiles} onRemove={onRemove} title="Videos" />;
}