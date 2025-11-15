'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { MediaUploader } from '@/components/media/MediaUploader';
import { createMomentAction } from '@/lib/server/moments-actions';
// ✅ Migrado de @/lib/graphql/types a @/generated/graphql (GraphQL Code Generator)
import type { Moment } from '@/generated/graphql';

interface CreatePostCardProps {
  onPostCreated?: (post: Moment) => void;
}

export function CreatePostCard({ onPostCreated }: CreatePostCardProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  // Manejar archivo seleccionado
  const handleFileSelected = useCallback((file: File | null) => {
    setSelectedFile(file);
    setError(null);
  }, []);

  // Agregar tag
  const handleAddTag = useCallback(() => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  }, [currentTag, tags]);

  // Eliminar tag
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  }, [tags]);

  // Enviar post
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() && !selectedFile) {
      setError('Agrega una descripción o selecciona un archivo');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('description', description);
      
      if (selectedFile) {
        formData.append('media', selectedFile);
      }
      
      tags.forEach(tag => formData.append('tags', tag));

      const result = await createMomentAction(formData);

      if (result.success) {
        // Limpiar formulario
        setDescription('');
        setSelectedFile(null);
        setTags([]);
        setIsExpanded(false);
        
        // Notificar al parent
        if (result.data && onPostCreated) {
          onPostCreated(result.data);
        }
      } else {
        setError(result.error || 'Error al crear el momento');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error inesperado al crear el momento');
    } finally {
      setIsSubmitting(false);
    }
  }, [description, selectedFile, tags, onPostCreated]);

  // Cancelar
  const handleCancel = useCallback(() => {
    setDescription('');
    setSelectedFile(null);
    setTags([]);
    setCurrentTag('');
    setError(null);
    setIsExpanded(false);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Vista compacta */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center space-x-3 text-left"
        >
          <ProfileImage
            path={user?.profilePhotoPath}
            alt={user?.name || 'Usuario'}
            fallbackText={user?.name?.substring(0, 2).toUpperCase() || 'U'}
            size="md"
          />
          <div className="flex-1">
            <p className="text-gray-500">¿Qué estás pensando?</p>
          </div>
          <div className="flex space-x-2">
            <span className="p-2 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <span className="p-2 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
        </button>
      ) : (
        /* Vista expandida */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <ProfileImage
              path={user?.profilePhotoPath}
              alt={user?.name || 'Usuario'}
              fallbackText={user?.name?.substring(0, 2).toUpperCase() || 'U'}
              size="md"
            />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={description}
                onChange={handleTextareaChange}
                placeholder="¿Qué estás pensando?"
                className="w-full resize-none outline-none text-lg placeholder-gray-500 min-h-[100px]"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Media uploader */}
          <MediaUploader
            onFileSelected={handleFileSelected}
            selectedFile={selectedFile}
            disabled={isSubmitting}
          />

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Agregar tag..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Agregar
              </button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                      disabled={isSubmitting}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <div className="flex space-x-3">
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Agregar emoji"
                disabled={isSubmitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Agregar ubicación"
                disabled={isSubmitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || (!description.trim() && !selectedFile)}
              >
                {isSubmitting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
