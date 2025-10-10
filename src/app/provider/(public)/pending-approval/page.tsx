import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';
import { runWithAmplifyServerContext } from '@/utils/amplify-server-utils';
import { fetchUserAttributes } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { HeroSection } from '@/components/ui/HeroSection';

/**
 * Página de estado pendiente para providers no aprobados
 * Server Component que sigue el patrón establecido
 * Muestra el proceso de aprobación y proporciona guía al usuario
 */
export default async function PendingApprovalPage() {
  // Verificar que el usuario es un provider (sin requerir aprobación todavía)
  const auth = await UnifiedAuthSystem.requireUserType('provider', {
    requireApproval: false,  // No requerir aprobación para ver esta página
    requireGroup: false      // No requerir grupo todavía
  });

  if (!auth.user) {
    redirect('/auth?callbackUrl=/provider/pending-approval');
  }

  // Obtener atributos completos del usuario
  const userAttributes = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        return await fetchUserAttributes(contextSpec);
      } catch {
        return null;
      }
    }
  });

  const userName = userAttributes?.given_name && userAttributes?.family_name
    ? `${userAttributes.given_name} ${userAttributes.family_name}`
    : userAttributes?.preferred_username || auth.user.username || 'Estimado/a';

  const isApproved = auth.permissions?.isApproved || false;
  const inGroup = auth.permissions?.inRequiredGroup || false;

  // Verificar qué documentos han sido cargados
  const hasComplianceDoc = !!userAttributes?.['custom:complianceOpinPath'];
  const hasSecturDoc = !!userAttributes?.['custom:secturPath'];
  const hasTaxDoc = !!userAttributes?.['custom:proofOfTaxStatusPath'];
  const allDocsUploaded = hasComplianceDoc && hasSecturDoc && hasTaxDoc;

  return (
    <div className="min-h-screen">
      {/* Hero Section usando el componente reutilizable */}
      <HeroSection
        title="Estado del Registro"
        subtitle="Proceso de verificación como proveedor en YAAN"
        size="sm"
        showShapes={true}
      />

      {/* Contenido principal */}
      <div className="bg-gray-50 -mt-8 relative z-10">
        <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Icono de estado */}
          <div className="flex justify-center py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Título principal */}
          <div className="px-8 pb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {isApproved
                ? '¡Felicidades! Tu cuenta está aprobada'
                : allDocsUploaded
                  ? 'Su proceso está en trámite'
                  : 'Complete su registro como proveedor'
              }
            </h2>

            <p className="text-lg text-gray-700 mb-2">
              {isApproved ? (
                <>
                  <strong>{userName}</strong>, ya puedes comenzar a crear y gestionar tus productos turísticos en YAAN.
                </>
              ) : allDocsUploaded ? (
                <>
                  Estimado/a <strong>{userName}</strong>, hemos recibido exitosamente sus documentos oficiales.
                </>
              ) : (
                <>
                  Hola <strong>{userName}</strong>, necesitamos algunos documentos para completar tu registro como proveedor.
                </>
              )}
            </p>
          </div>

          {/* Estado del proceso */}
          <div className="bg-gray-50 px-8 py-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              ESTADO DEL PROCESO
            </h3>

            <div className="space-y-4">
              {/* Paso 1: Documentos */}
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  allDocsUploaded ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
                }`}>
                  {allDocsUploaded ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {allDocsUploaded ? 'Documentos completos' : 'Documentos pendientes'}
                  </p>
                  <div className="text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <span className={hasComplianceDoc ? 'text-green-600' : 'text-gray-400'}>
                        {hasComplianceDoc ? '✓' : '○'} Opinión de cumplimiento
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={hasSecturDoc ? 'text-green-600' : 'text-gray-400'}>
                        {hasSecturDoc ? '✓' : '○'} Registro SECTUR
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={hasTaxDoc ? 'text-green-600' : 'text-gray-400'}>
                        {hasTaxDoc ? '✓' : '○'} Constancia de situación fiscal
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 2: Asignación de grupo */}
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  inGroup ? 'bg-green-500' : allDocsUploaded ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'
                }`}>
                  {inGroup ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : allDocsUploaded ? (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {inGroup ? 'Grupo de providers asignado' : 'Asignación de grupo pendiente'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {inGroup
                      ? 'Ya perteneces al grupo de providers'
                      : allDocsUploaded
                        ? 'En proceso de asignación'
                        : 'Requiere documentos completos'
                    }
                  </p>
                </div>
              </div>

              {/* Paso 3: Aprobación final */}
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isApproved ? 'bg-green-500' : inGroup ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'
                }`}>
                  {isApproved ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : inGroup ? (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {isApproved ? 'Proveedor aprobado' : 'Aprobación final pendiente'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isApproved
                      ? '¡Felicidades! Ya puedes crear productos'
                      : inGroup
                        ? 'Validación final en proceso (24-48 horas)'
                        : 'Requiere completar pasos anteriores'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="px-8 py-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm mb-4">
              Nuestro equipo está validando la información proporcionada. Le notificaremos por correo 
              electrónico tan pronto como se complete el proceso de verificación.
            </p>
            
            <p className="text-gray-600 text-sm">
              Si tiene alguna pregunta, no dude en contactarnos a través de nuestros canales de soporte.
            </p>
          </div>

          {/* Acciones */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Si está aprobado, mostrar botón para crear productos */}
              {isApproved ? (
                <Link
                  href="/provider/products"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium text-center transition-all duration-200 shadow-lg"
                >
                  Ir al Dashboard de Productos
                </Link>
              ) : (
                <>
                  {/* Si no tiene todos los documentos, ir a settings */}
                  {!allDocsUploaded && (
                    <Link
                      href="/settings/profile"
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium text-center transition-all duration-200"
                    >
                      Completar documentos
                    </Link>
                  )}
                  <Link
                    href="/moments"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium text-center transition-colors duration-200"
                  >
                    Explorar Momentos
                  </Link>
                  <Link
                    href="/profile"
                    className="flex-1 bg-white hover:bg-gray-50 text-purple-600 border-2 border-purple-200 px-6 py-3 rounded-lg font-medium text-center transition-colors duration-200"
                  >
                    Ver mi perfil
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>© 2025 YAAN · Transformando el turismo en México</p>
          </div>
        </div>
      </div>
    </div>
  );
}