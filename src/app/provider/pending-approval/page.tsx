import { RouteProtectionWrapper } from '@/components/auth/RouteProtectionWrapper';
import Link from 'next/link';

/**
 * Página de estado pendiente para providers no aprobados
 * Replica el diseño del correo de YAAN para proceso en trámite
 */
export default async function PendingApprovalPage() {
  // Obtener estado actual del usuario sin requerir aprobación
  const auth = await RouteProtectionWrapper.protect({
    allowedUserTypes: 'provider',
    requireApproval: false,
    requireGroup: false
  });
  
  if (!auth.user) {
    return null;
  }

  const userName = auth.user.name || auth.user.username || 'Estimado/a';
  const isApproved = auth.permissions?.isApproved || false;
  const inGroup = auth.permissions?.inRequiredGroup || false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con gradiente estilo YAAN */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-3">yaan</h1>
          <p className="text-lg opacity-90">Plataforma de experiencias y marketplace de viajes</p>
        </div>
      </div>

      {/* Contenido principal */}
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
              Su proceso está en trámite
            </h2>
            
            <p className="text-lg text-gray-700 mb-2">
              Estimado/a <strong>{userName}</strong>, hemos recibido exitosamente sus documentos oficiales.
            </p>
          </div>

          {/* Estado del proceso */}
          <div className="bg-gray-50 px-8 py-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              ESTADO DEL PROCESO
            </h3>
            
            <div className="space-y-4">
              {/* Documentos recibidos */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Documentos recibidos</p>
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleDateString('es-MX', { 
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })} CST
                  </p>
                </div>
              </div>

              {/* En revisión */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">En revisión</p>
                  <p className="text-sm text-gray-600">
                    Tiempo estimado: 24-48 horas
                  </p>
                </div>
              </div>

              {/* Pendiente de aprobación */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Pendiente de aprobación</p>
                  <p className="text-sm text-gray-600">
                    {!isApproved && 'Validando información proporcionada'}
                    {!inGroup && !isApproved && ' y '}
                    {!inGroup && 'asignación de permisos'}
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
              <Link 
                href="/moments"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium text-center transition-colors duration-200"
              >
                Ir a Momentos
              </Link>
              <Link 
                href="/profile"
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium text-center transition-all duration-200"
              >
                Completar mi perfil
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2025 YAAN · Transformando el turismo en México</p>
        </div>
      </div>
    </div>
  );
}