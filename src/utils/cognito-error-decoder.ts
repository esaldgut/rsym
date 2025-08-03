// src/utils/cognito-error-decoder.ts
'use client';

/**
 * Decodifica errores de Cognito y state OAuth
 */

export interface CognitoError {
  code?: string;
  error?: string;
  error_description?: string;
  state?: string;
  decodedState?: any;
}

export function decodeCognitoError(url: string): CognitoError {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  
  const result: CognitoError = {
    code: params.get('code') || undefined,
    error: params.get('error') || undefined,
    error_description: params.get('error_description') || undefined,
    state: params.get('state') || undefined,
  };

  // Decodificar state si existe
  if (result.state) {
    try {
      const decodedState = atob(result.state);
      result.decodedState = JSON.parse(decodedState);
    } catch (e) {
      console.error('Error decoding state:', e);
    }
  }

  return result;
}

export function analyzeError(errorData: CognitoError): string {
  if (errorData.code) {
    // Error genérico de Cognito con código
    return `Error interno de Cognito (ID: ${errorData.code}). 
           Esto usualmente indica:
           1. Problema con Lambda triggers
           2. Configuración incorrecta del User Pool Client
           3. Error en el mapeo de atributos
           4. URL de callback incorrecta`;
  }

  if (errorData.error === 'redirect_mismatch') {
    return 'URL de callback no coincide con la configuración del User Pool Client';
  }

  if (errorData.error === 'invalid_request') {
    return `Solicitud inválida: ${errorData.error_description || 'Sin descripción'}`;
  }

  if (errorData.error === 'access_denied') {
    return 'Usuario canceló la autenticación o acceso denegado por el proveedor';
  }

  return 'Error desconocido de OAuth';
}

/**
 * Genera URL de diagnóstico para CloudWatch
 */
export function getCloudWatchUrl(region: string = 'us-west-2'): string {
  return `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/$252Faws$252Fcognito$252Fuserpool`;
}

/**
 * Información de debugging para errores de Cognito
 */
export function generateDebugInfo(): string {
  const now = new Date().toISOString();
  const userAgent = navigator.userAgent;
  const currentUrl = window.location.href;
  
  return `
Debug Info:
- Timestamp: ${now}
- User Agent: ${userAgent}
- Current URL: ${currentUrl}
- Origin: ${window.location.origin}
- Referrer: ${document.referrer}
  `.trim();
}