import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Credential Manager para AWS Amplify Identity Pool
 * Soluciona el error "Credentials should not be empty" que ocurre cuando
 * se intenta usar Storage APIs mientras las credenciales se están refrescando
 *
 * Contexto del problema:
 * - Amplify v6 eliminó el evento 'configured' del Hub
 * - Durante fetchAuthSession({ forceRefresh: true }), hay un periodo donde
 *   las credenciales del Identity Pool NO están disponibles
 * - Si uploadData() o getUrl() se llaman durante este periodo, fallan
 * - Issues relacionados: #12681, #12945 en aws-amplify/amplify-js
 *
 * Solución:
 * - Verificar credenciales antes de usarlas
 * - Retry con exponential backoff si no están listas
 * - Logging detallado para debugging
 */

export interface CredentialCheckResult {
  available: boolean;
  credentials: {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    expiration?: Date;
  } | null;
  attempts: number;
  totalTime: number;
  error?: string;
}

export interface CredentialCheckOptions {
  maxAttempts?: number;     // Número máximo de intentos (default: 10)
  pollInterval?: number;    // Intervalo entre intentos en ms (default: 1000)
  totalTimeout?: number;    // Timeout total en ms (default: 10000)
}

/**
 * Verifica que las credenciales del Identity Pool estén disponibles
 * Implementa retry logic con polling constante para soportar regeneración lenta de AWS
 *
 * ACTUALIZACIÓN v2: Aumentado timeout de 1.5s a 10s para soportar Identity Pool
 * regeneration que puede tardar 4-10 segundos en producción
 *
 * @param options - Opciones de configuración (maxAttempts, pollInterval, totalTimeout)
 * @returns Resultado de la verificación con credenciales o error
 */
export async function ensureCredentialsAvailable(
  options: CredentialCheckOptions = {}
): Promise<CredentialCheckResult> {
  const {
    maxAttempts = 10,        // 10 intentos para soportar delays largos
    pollInterval = 1000,     // 1s entre intentos (polling constante)
    totalTimeout = 10000     // 10s timeout total
  } = options;
  const startTime = Date.now();
  let attempts = 0;
  let lastError: string | undefined;

  console.log('🔐 [CredentialManager] Verificando disponibilidad de credenciales...', {
    maxAttempts,
    pollInterval: `${pollInterval}ms`,
    totalTimeout: `${totalTimeout}ms`
  });

  for (let i = 0; i < maxAttempts; i++) {
    attempts = i + 1;
    const elapsedTime = Date.now() - startTime;

    // Check timeout total
    if (elapsedTime >= totalTimeout) {
      console.warn(`⏰ [CredentialManager] Timeout total alcanzado (${elapsedTime}ms >= ${totalTimeout}ms)`);
      break;
    }

    try {
      console.log(`🔄 [CredentialManager] Intento ${attempts}/${maxAttempts} (elapsed: ${elapsedTime}ms)...`);

      // Intentar obtener sesión con credenciales
      const session = await fetchAuthSession();

      // Verificar que la sesión tiene credenciales válidas
      if (session.credentials) {
        const { accessKeyId, secretAccessKey, sessionToken, expiration } = session.credentials;

        // Logging detallado de qué tenemos
        console.log('🔍 [CredentialManager] Estado de credenciales:', {
          hasAccessKeyId: !!accessKeyId,
          hasSecretAccessKey: !!secretAccessKey,
          hasSessionToken: !!sessionToken,
          hasExpiration: !!expiration,
          identityId: session.identityId || 'undefined'
        });

        // Verificar que las credenciales tienen todos los campos requeridos
        if (accessKeyId && secretAccessKey && sessionToken) {
          const totalTime = Date.now() - startTime;

          console.log('✅ [CredentialManager] Credenciales disponibles:', {
            accessKeyId: `${accessKeyId.substring(0, 8)}...`,
            hasSessionToken: !!sessionToken,
            expiresAt: expiration,
            identityId: session.identityId,
            attempts,
            totalTime: `${totalTime}ms`
          });

          return {
            available: true,
            credentials: {
              accessKeyId,
              secretAccessKey,
              sessionToken,
              expiration
            },
            attempts,
            totalTime
          };
        } else {
          // Credenciales parciales
          lastError = 'Credenciales parciales: ' +
            [
              !accessKeyId && 'sin accessKeyId',
              !secretAccessKey && 'sin secretAccessKey',
              !sessionToken && 'sin sessionToken'
            ].filter(Boolean).join(', ');
        }
      } else {
        lastError = 'session.credentials es undefined';
      }

      console.warn(`⚠️ [CredentialManager] ${lastError} en intento ${attempts}`);

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ [CredentialManager] Error en intento ${attempts}:`, error);
    }

    // Si no es el último intento y no hemos excedido el timeout, esperar con polling constante
    if (i < maxAttempts - 1 && (Date.now() - startTime) < totalTimeout) {
      console.log(`⏳ [CredentialManager] Esperando ${pollInterval}ms antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  const totalTime = Date.now() - startTime;
  console.error(`❌ [CredentialManager] Credenciales NO disponibles después de ${attempts} intentos (${totalTime}ms)`);

  return {
    available: false,
    credentials: null,
    attempts,
    totalTime,
    error: lastError || 'Credenciales no disponibles'
  };
}

/**
 * Verifica rápidamente si las credenciales están disponibles (sin retry)
 * Útil para checks no bloqueantes
 *
 * @returns true si las credenciales están disponibles, false en caso contrario
 */
export async function areCredentialsAvailable(): Promise<boolean> {
  try {
    const session = await fetchAuthSession();
    return !!(
      session.credentials?.accessKeyId &&
      session.credentials?.secretAccessKey &&
      session.credentials?.sessionToken
    );
  } catch (error) {
    console.error('[CredentialManager] Error checking credentials:', error);
    return false;
  }
}

/**
 * Pre-calienta las credenciales del Identity Pool
 * Fuerza una regeneración temprana para evitar delays en operaciones futuras
 *
 * USO: Llamar después de refreshUser() para preparar credenciales
 * mientras el usuario ve la nueva página
 *
 * @returns Promise que se resuelve cuando el warmup termina (no espera resultado)
 */
export async function warmupCredentials(): Promise<void> {
  console.log('🔥 [CredentialManager] Pre-calentando credenciales del Identity Pool...');

  try {
    // Trigger regeneración en background sin forceRefresh
    // Esto prepara las credenciales para uso futuro
    const session = await fetchAuthSession({ forceRefresh: false });

    if (session.credentials) {
      console.log('✅ [CredentialManager] Warmup completado - credenciales listas:', {
        hasAccessKeyId: !!session.credentials.accessKeyId,
        hasSessionToken: !!session.credentials.sessionToken,
        identityId: session.identityId
      });
    } else {
      console.warn('⚠️ [CredentialManager] Warmup completado pero credenciales undefined');
      console.warn('   Las credenciales se regenerarán en el primer uso');
    }
  } catch (error) {
    console.warn('⚠️ [CredentialManager] Warmup falló (no crítico):', error);
    console.warn('   Las credenciales se regenerarán cuando se necesiten');
  }
}

/**
 * Ejecuta una operación de Storage con verificación automática de credenciales
 * Wrapper genérico para cualquier operación que requiera Identity Pool credentials
 *
 * @param operation - Función async que realiza la operación de Storage
 * @param operationName - Nombre descriptivo para logging
 * @param options - Opciones de configuración para ensureCredentialsAvailable
 * @returns Resultado de la operación o null si falla
 */
export async function withCredentialCheck<T>(
  operation: () => Promise<T>,
  operationName: string,
  options?: CredentialCheckOptions
): Promise<T | null> {
  console.log(`🔐 [CredentialManager] Ejecutando: ${operationName}`);

  // Verificar credenciales con retry (ahora usa timeout de 10s por defecto)
  const credentialCheck = await ensureCredentialsAvailable(options);

  if (!credentialCheck.available) {
    console.error(`❌ [CredentialManager] No se pudo ejecutar ${operationName}: credenciales no disponibles después de ${credentialCheck.totalTime}ms`);
    return null;
  }

  try {
    console.log(`▶️ [CredentialManager] Credenciales verificadas en ${credentialCheck.totalTime}ms, ejecutando ${operationName}...`);
    const result = await operation();
    console.log(`✅ [CredentialManager] ${operationName} completado exitosamente`);
    return result;
  } catch (error) {
    console.error(`❌ [CredentialManager] Error ejecutando ${operationName}:`, error);

    // Si el error es por credenciales, intentar una vez más después de esperar
    if (error instanceof Error && error.message.includes('Credentials')) {
      console.log(`🔄 [CredentialManager] Reintentando ${operationName} después de error de credenciales...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2s antes de retry

      try {
        const result = await operation();
        console.log(`✅ [CredentialManager] ${operationName} exitoso en segundo intento`);
        return result;
      } catch (retryError) {
        console.error(`❌ [CredentialManager] ${operationName} falló en retry:`, retryError);
        return null;
      }
    }

    return null;
  }
}
