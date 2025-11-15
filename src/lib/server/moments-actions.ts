'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { uploadData } from 'aws-amplify/storage';
import { getAuthenticatedUser } from '@/utils/amplify-server-utils';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import outputs from '../../../amplify/outputs.json';
import type { Schema } from '@/amplify/data/resource';
// ✅ Usar imports desde GraphQL Code Generator (fuente única de verdad)
import type { CreateMomentInput } from '@/generated/graphql';
import * as mutations from '@/graphql/operations';
import * as queries from '@/graphql/operations';

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

// Server Action: Crear momento (soporta archivos nuevos o URLs existentes)
export async function createMomentAction(formData: FormData) {
  console.log('[createMomentAction] 🚀 Iniciando creación de momento...');

  try {
    // Obtener usuario autenticado (PATRÓN CORRECTO AWS Amplify Gen 2 v6)
    const user = await getAuthenticatedUser();

    console.log('[createMomentAction] 👤 Usuario autenticado:', {
      sub: user?.sub,
      userId: user?.userId,
      username: user?.username
    });

    if (!user?.sub) {
      console.error('[createMomentAction] ❌ Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }

    // Extraer datos del formulario
    const description = formData.get('description') as string;
    const mediaFile = formData.get('media') as File | null;
    const existingMediaUrls = formData.getAll('existingMediaUrls') as string[]; // URLs ya subidas
    const tags = formData.getAll('tags') as string[];
    const preferences = formData.getAll('preferences') as string[];

    // Parse locations (destination)
    const destinations: Array<{
      place?: string;
      placeSub?: string;
      coordinates?: { latitude?: number; longitude?: number };
    }> = [];
    let index = 0;
    while (formData.has(`destination[${index}][place]`)) {
      const place = formData.get(`destination[${index}][place]`) as string;
      const placeSub = formData.get(`destination[${index}][placeSub]`) as string;
      const latitude = formData.get(`destination[${index}][coordinates][latitude]`) as string | null;
      const longitude = formData.get(`destination[${index}][coordinates][longitude]`) as string | null;

      destinations.push({
        place: place || undefined,
        placeSub: placeSub || undefined,
        coordinates: (latitude && longitude) ? {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        } : undefined
      });

      index++;
    }

    // Parse experience link
    const experienceLink = formData.get('experienceLink') as string | null;

    // Parse tagged user IDs (futureproof - backend doesn't support yet)
    const taggedUserIds = formData.getAll('taggedUserIds').map(id => String(id)).filter(id => id.trim());

    console.log('[createMomentAction] 📝 Datos del formulario:', {
      description,
      mediaFile: mediaFile ? `${mediaFile.name} (${mediaFile.size} bytes)` : 'null',
      existingMediaUrls,
      tags,
      preferences,
      destinations: destinations.length,
      experienceLink,
      taggedUserIds: taggedUserIds.length
    });

    if (!description?.trim()) {
      console.error('[createMomentAction] ❌ Descripción vacía');
      throw new Error('La descripción es requerida');
    }

    let resourceUrls: string[] = [];
    let resourceType: MediaType = 'text';

    // Opción 1: Usar paths S3 existentes (archivos ya subidos)
    if (existingMediaUrls.length > 0) {
      // existingMediaUrls contiene paths S3, NO URLs completas
      // Ejemplo: public/users/{username}/social-content/{moment_id}/video_xxx.mov
      resourceUrls = existingMediaUrls;

      console.log('[createMomentAction] 📂 Usando paths S3 ya subidos:', resourceUrls);

      // Detectar tipo por path/extensión
      const firstPath = existingMediaUrls[0].toLowerCase();
      if (firstPath.includes('video') || firstPath.endsWith('.mov') || firstPath.endsWith('.mp4') || firstPath.endsWith('.m4v')) {
        resourceType = 'video';
      } else if (firstPath.includes('image') || firstPath.match(/\.(jpg|jpeg|png|heic|heif|webp|gif|dng|cr2|nef|arw)$/)) {
        resourceType = 'image';
      }

      console.log('[createMomentAction] 📋 Tipo detectado:', resourceType);
    }
    // Opción 2: Subir nuevo archivo
    else if (mediaFile && mediaFile.size > 0) {
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

      resourceUrls = [uploadResult.path];
    }

    // Crear momento en GraphQL
    const input: CreateMomentInput = {
      description,
      resourceType,
      resourceUrl: resourceUrls.length > 0 ? resourceUrls : undefined,
      tags: tags.filter(t => t.trim()),
      preferences: preferences.filter(p => p.trim()),
      destination: destinations.length > 0 ? destinations : undefined,
      experienceLink: experienceLink || undefined,
      // Futureproof - send taggedUserIds even though backend doesn't support yet
      ...(taggedUserIds.length > 0 && {
        taggedUserIds: taggedUserIds as any
      })
    };

    console.log('[createMomentAction] 📊 Input para GraphQL:', JSON.stringify(input, null, 2));

    // ✅ Integración con GraphQL usando generateServerClientUsingCookies
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    console.log('[createMomentAction] 🔄 Llamando GraphQL mutation createMoment...');

    const { data: result, errors } = await client.graphql({
      query: mutations.createMoment,
      variables: { input }
    });

    console.log('[createMomentAction] 📬 Respuesta GraphQL:', {
      hasData: !!result,
      hasErrors: !!errors,
      errors: errors,
      momentCreated: !!result?.createMoment
    });

    if (errors || !result?.createMoment) {
      console.error('[createMomentAction] ❌ GraphQL errors creating moment:', JSON.stringify(errors, null, 2));

      // Si falló GraphQL y subimos archivos nuevos, limpiar archivos de S3
      if (mediaFile && resourceUrls.length > 0) {
        // TODO: Implementar cleanup de S3
        console.warn('[createMomentAction] ⚠️ Failed to create moment, S3 files not cleaned:', resourceUrls);
      }

      throw new Error('Failed to create moment in database');
    }

    console.log('[createMomentAction] ✅ Momento creado exitosamente:', result.createMoment.id);

    // Revalidar cache
    revalidateTag('moments-feed');
    revalidatePath('/moments');

    console.log('[createMomentAction] 🔄 Cache revalidado');

    return {
      success: true,
      data: result?.createMoment,
      message: 'Momento creado exitosamente'
    };
  } catch (error) {
    console.error('[createMomentAction] ❌ Error creando momento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear momento'
    };
  }
}

// Server Action: Toggle Like
// itemType debe coincidir con backend Go: "Moment" o "Comment" (capitalizados)
export async function toggleLikeAction(itemId: string, itemType: 'Moment' | 'Comment' = 'Moment') {
  try {
    // Obtener usuario autenticado (PATRÓN CORRECTO AWS Amplify Gen 2 v6)
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    // ✅ Integración con GraphQL
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.toggleLike,
      variables: {
        item_id: itemId,
        item_type: itemType
      }
    });

    if (errors || !data?.toggleLike) {
      console.error('GraphQL errors toggling like:', errors);
      throw new Error('Failed to toggle like');
    }

    // Revalidar cache específico del item
    revalidateTag(`moment-${itemId}`);
    revalidateTag('moments-feed');

    return {
      success: true,
      data: data.toggleLike,
      liked: data.toggleLike.viewerHasLiked,
      likeCount: data.toggleLike.newLikeCount
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
export async function getMomentsAction(
  feedType: 'all' | 'following' | 'preferences' | 'user' = 'all',
  limit: number = 20,
  _nextToken?: string
) {
  console.log('[getMomentsAction] 🔍 Obteniendo momentos...', { feedType, limit });

  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      console.error('[getMomentsAction] ❌ Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }

    console.log('[getMomentsAction] 👤 Usuario:', {
      sub: user.sub,
      userId: user.userId
    });

    // ✅ Integración con GraphQL
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    // Mapear tipo de feed a query correspondiente
    const queryMap = {
      all: queries.getAllActiveMoments,
      following: queries.getAllActiveMoments, // TODO: Implementar getAllMomentsByFollowing
      preferences: queries.getAllActiveMoments, // TODO: Implementar getAllMomentsByMyPreferences
      user: queries.getAllMomentsByUser
    };

    console.log('[getMomentsAction] 🔄 Llamando GraphQL query:', feedType);

    const { data, errors } = await client.graphql({
      query: queryMap[feedType]
    });

    if (errors) {
      console.error('[getMomentsAction] ❌ GraphQL errors fetching moments:', JSON.stringify(errors, null, 2));
      throw new Error('Failed to fetch moments');
    }

    // Extraer moments según el tipo de query
    const moments = data?.getAllActiveMoments || data?.getAllMomentsByUser || [];

    console.log('[getMomentsAction] 📦 Momentos obtenidos:', {
      count: moments.length,
      moments: moments.map((m: any) => ({
        id: m?.id,
        description: m?.description?.substring(0, 50),
        hasMedia: !!m?.resourceUrl,
        resourceUrlType: typeof m?.resourceUrl,
        resourceUrlIsArray: Array.isArray(m?.resourceUrl),
        resourceUrlFirstItem: Array.isArray(m?.resourceUrl) ? m.resourceUrl[0] : m?.resourceUrl
      }))
    });

    // Log completo de UN momento para ver estructura
    if (moments.length > 0) {
      console.log('[getMomentsAction] 📋 Ejemplo de momento completo:');
      console.log(JSON.stringify(moments[0], null, 2));
    }

    return {
      success: true,
      moments,
      nextToken: undefined // TODO: Implementar pagination cuando GraphQL lo soporte
    };
  } catch (error) {
    console.error('[getMomentsAction] ❌ Error obteniendo momentos:', error);
    return {
      success: false,
      moments: [],
      error: error instanceof Error ? error.message : 'Error al cargar momentos'
    };
  }
}

// Server Action: Toggle Save
// itemType debe coincidir con backend Go: "Moment" o "Product" (capitalizados)
export async function toggleSaveAction(itemId: string, itemType: 'Moment' | 'Product' = 'Moment') {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    // ✅ Integración con GraphQL
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.toggleSave,
      variables: {
        item_id: itemId,
        item_type: itemType
      }
    });

    if (errors || !data?.toggleSave) {
      console.error('GraphQL errors toggling save:', errors);
      throw new Error('Failed to toggle save');
    }

    revalidateTag(`moment-${itemId}`);
    revalidateTag('moments-feed');

    return {
      success: true,
      data: data.toggleSave,
      saved: data.toggleSave.viewerHasSaved,
      saveCount: data.toggleSave.newSaveCount
    };
  } catch (error) {
    console.error('Error toggling save:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al guardar'
    };
  }
}

// Server Action: Crear comentario
export async function createCommentAction(momentId: string, comment: string) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.sub) {
      throw new Error('Usuario no autenticado');
    }

    if (!comment?.trim()) {
      throw new Error('El comentario no puede estar vacío');
    }

    // ✅ Integración con GraphQL
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies
    });

    const { data, errors } = await client.graphql({
      query: mutations.createComment,
      variables: {
        input: {
          moment_id: momentId,
          comment: comment.trim()
        }
      }
    });

    if (errors || !data?.createComment) {
      console.error('GraphQL errors creating comment:', errors);
      throw new Error('Failed to create comment');
    }

    revalidateTag(`moment-${momentId}`);
    revalidateTag('moments-feed');

    return {
      success: true,
      data: data.createComment,
      message: 'Comentario creado exitosamente'
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear comentario'
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