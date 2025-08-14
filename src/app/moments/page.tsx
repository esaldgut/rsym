'use client';

import { useState } from 'react';
import { AuthGuard } from '../../components/guards/AuthGuard';
import { useRequireCompleteProfile } from '../../components/guards/ProfileCompletionGuard';

export default function MomentsPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { checkProfile, isComplete, isLoading } = useRequireCompleteProfile();

  const handleCreateMoment = () => {
    checkProfile('create_moment', { action: 'create_moment' }, () => {
      // Lógica para crear momento
      console.log('Creando momento...');
      // TODO: Implementar creación de momento
    });
  };

  const handleRequestNetwork = (userId: string) => {
    checkProfile('request_network', { userId }, () => {
      // Lógica para solicitar incluir en red
      console.log('Solicitando incluir en red a:', userId);
      // TODO: Implementar solicitud de red
    });
  };

  const handleSendMessage = (userId: string) => {
    checkProfile('send_message', { userId }, () => {
      // Lógica para enviar mensaje
      console.log('Enviando mensaje a:', userId);
      // TODO: Implementar envío de mensaje
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Momentos</h1>

          {/* Create Moment Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Comparte un momento
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen
                </label>
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border border-gray-300 transition-colors duration-200">
                    <span className="text-gray-700">Seleccionar imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {selectedImage && (
                    <span className="text-sm text-gray-600">
                      {selectedImage.name}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={4}
                  placeholder="Cuéntanos sobre este momento..."
                />
              </div>

              <button
                onClick={handleCreateMoment}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50"
              >
                {isLoading ? 'Verificando perfil...' : 'Crear Momento'}
              </button>
            </div>
          </div>

          {/* Example Moments Feed */}
          <div className="space-y-6">
            {/* Sample Moment 1 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    JD
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">Juan Pérez</h3>
                    <p className="text-sm text-gray-500">hace 2 horas</p>
                  </div>
                </div>
                
                <p className="text-gray-800 mb-4">
                  ¡Increíble experiencia en las pirámides de Teotihuacán! La vista desde la Pirámide del Sol es simplemente espectacular 🌅
                </p>
                
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>24</span>
                  </button>
                  
                  <button
                    onClick={() => handleSendMessage('user-juan')}
                    className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Mensaje</span>
                  </button>
                  
                  <button
                    onClick={() => handleRequestNetwork('user-juan')}
                    className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Agregar a red</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sample Moment 2 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    MG
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">María González</h3>
                    <p className="text-sm text-gray-500">hace 1 día</p>
                  </div>
                </div>
                
                <p className="text-gray-800 mb-4">
                  Explorando las cenotes de la Riviera Maya. ¡El agua cristalina es perfecta para snorkel! 🐠🏊‍♀️
                </p>
                
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>18</span>
                  </button>
                  
                  <button
                    onClick={() => handleSendMessage('user-maria')}
                    className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Mensaje</span>
                  </button>
                  
                  <button
                    onClick={() => handleRequestNetwork('user-maria')}
                    className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Agregar a red</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Complete Status */}
          {!isLoading && (
            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                <strong>Estado del perfil:</strong>{' '}
                {isComplete ? (
                  <span className="text-green-600">✓ Completo</span>
                ) : (
                  <span className="text-orange-600">⚠ Incompleto</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}