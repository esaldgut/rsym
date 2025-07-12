// src/components/PlaceholderImage.tsx
export function PlaceholderImage({ className = '' }: { className?: string }) {
  return (
    <div className={`${className} bg-gray-200 flex items-center justify-center`}>
      <svg 
        className="w-16 h-16 text-gray-400" 
        fill="none" 
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// También puedes crear un archivo estático en public/placeholder-image.svg
export const PLACEHOLDER_IMAGE_DATA_URL = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Cpath d='M150 100h100v100H150z' fill='none' stroke='%239ca3af' stroke-width='2'/%3E%3Cpath d='M170 130l30 30 30-30' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='180' cy='120' r='5' fill='%239ca3af'/%3E%3C/svg%3E`;
