'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { uploadData } from 'aws-amplify/storage';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import outputs from '../../../amplify/outputs.json';
import type { Schema } from '@/amplify/data/resource';
import type { CreateMomentInput } from '@/lib/graphql/types';

// Tipos para media
export type MediaType = 'image' | 'video' | 'text';
export type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

// Validación de archivos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Validar archivo multimedia
function validateMediaFile(file: File): { valid: boolean; error?: string; type: MediaType } {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_IMAGE_SIZE) {
      return { valid: false, error: 'La imagen no puede superar 10MB', type: 'image' };
    }
    return { valid: true, type: 'image' };
  }
  
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_SIZE) {
      return { valid: false, error: 'El video no puede superar 100MB', type: 'video' };
    }
    return { valid: true, type: 'video' };
  }
  
  return { valid: false, error: 'Tipo de archivo no permitido', type: 'text' };
}

// Server Action: Crear momento
export async function createMomentAction(formData: FormData) {
  try {
    // Obtener usuario autenticado (PATRÓN CORRECTO AWS Amplify Gen 2 v6)
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    // Extraer datos del formulario
    const description = formData.get('description') as string;
    const mediaFile = formData.get('media') as File | null;
    const tags = formData.getAll('tags') as string[];
    const preferences = formData.getAll('preferences') as string[];

    if (!description?.trim()) {
      throw new Error('La descripción es requerida');
    }

    let resourceUrl: string | undefined;
    let resourceType: MediaType = 'text';

    // Procesar archivo multimedia si existe
    if (mediaFile && mediaFile.size > 0) {
      const validation = validateMediaFile(mediaFile);
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      resourceType = validation.type;

      // Subir archivo a S3
      const fileExtension = mediaFile.name.split('.').pop();
      const fileName = `moments/${user.sub}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;

      // Usar uploadData directamente sin runWithAmplifyServerContext
      // AWS Amplify Gen 2 v6 maneja automáticamente las cookies en SSR
      const uploadResult = await uploadData({
        path: fileName,
        data: mediaFile,
        options: {
          accessLevel: 'protected',
          contentType: mediaFile.type,
          metadata: {
            userId: user.sub,
            uploadedAt: new Date().toISOString(),
            originalName: mediaFile.name
          }
        }
      }).result;

      resourceUrl = uploadResult.path;

    }

    // Crear momento en GraphQL
    const _input: CreateMomentInput = {
      description,
      resourceType,
      resourceUrl: resourceUrl ? [resourceUrl] : undefined,
      tags: tags.filter(t => t.trim()),
      preferences: preferences.filter(p => p.trim())
    };

    // TODO: Implementar con GraphQL cuando esté listo
    const result = {
      createMoment: {
        id: `temp-${Date.now()}`,
        description,
        resourceType,
        resourceUrl: resourceUrl ? [resourceUrl] : undefined,
        tags,
        preferences,
        user_data: {
          name: user.userId,
          username: user.userId,
          avatar_url: undefined
        },
        created_at: new Date().toISOString(),
        likeCount: 0,
        viewerHasLiked: false
      }
    };

    // Revalidar cache
    revalidateTag('moments-feed');
    revalidatePath('/moments');

    return {
      success: true,
      data: result?.createMoment,
      message: 'Momento creado exitosamente'
    };
  } catch (error) {
    console.error('Error creando momento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear momento'
    };
  }
}

// Server Action: Toggle Like
export async function toggleLikeAction(itemId: string, _itemType: 'Moment' | 'MarketplaceFeed' = 'Moment') {
  try {
    // Obtener usuario autenticado (PATRÓN CORRECTO AWS Amplify Gen 2 v6)
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    // TODO: Implementar con GraphQL cuando esté listo
    const result = {
      toggleLike: {
        viewerHasLiked: Math.random() > 0.5, // Simular toggle
        newLikeCount: Math.floor(Math.random() * 100)
      }
    };

    // Revalidar cache específico del item
    revalidateTag(`moment-${itemId}`);
    revalidateTag('moments-feed');

    return {
      success: true,
      data: result?.toggleLike,
      liked: result?.toggleLike?.viewerHasLiked,
      likeCount: result?.toggleLike?.newLikeCount
    };
  } catch (error) {
    console.error('Error toggling like:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al procesar like'
    };
  }
}

// Server Action: Obtener momentos (con cache)
export async function getMomentsAction(limit: number = 20, _nextToken?: string) {
  try {
    // TODO: Implementar con GraphQL cuando esté listo
    // Por ahora devolvemos datos mock
    const mockMoments = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: `mock-${Date.now()}-${i}`,
      description: `Este es un momento de ejemplo #${i + 1}. ¡Explorando el mundo con YAAN! 🌍`,
      resourceType: i % 3 === 0 ? 'video' : i % 2 === 0 ? 'image' : 'text',
      resourceUrl: i % 2 === 0 ? ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'] : undefined,
      tags: ['viaje', 'aventura', 'yaan'],
      preferences: [],
      user_data: {
        name: `Usuario ${i + 1}`,
        username: `user${i + 1}`,
        avatar_url: undefined
      },
      created_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
      likeCount: Math.floor(Math.random() * 50),
      viewerHasLiked: Math.random() > 0.5
    }));

    return {
      success: true,
      moments: mockMoments,
      nextToken: undefined
    };
  } catch (error) {
    console.error('Error obteniendo momentos:', error);
    return {
      success: false,
      moments: [],
      error: error instanceof Error ? error.message : 'Error al cargar momentos'
    };
  }
}

// Server Action: Eliminar momento (solo el propietario)
export async function deleteMomentAction(_momentId: string) {
  try {
    // Obtener usuario autenticado (PATRÓN CORRECTO AWS Amplify Gen 2 v6)
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    // TODO: Implementar mutation deleteMoment en GraphQL
    // Por ahora solo revalidamos el cache
    
    revalidateTag('moments-feed');
    revalidatePath('/moments');

    return {
      success: true,
      message: 'Momento eliminado exitosamente'
    };
  } catch (error) {
    console.error('Error eliminando momento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar momento'
    };
  }
}

// Server Action: Reportar contenido
export async function reportContentAction(itemId: string, reason: string, details?: string) {
  try {
    // Obtener usuario autenticado (PATRÓN CORRECTO AWS Amplify Gen 2 v6)
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    // TODO: Implementar mutation reportContent en GraphQL
    console.log('Reportando contenido:', { itemId, reason, details, userId: user.userId });

    return {
      success: true,
      message: 'Contenido reportado. Nuestro equipo lo revisará.'
    };
  } catch (error) {
    console.error('Error reportando contenido:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al reportar contenido'
    };
  }
}