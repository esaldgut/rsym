'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
  title?: string;
  message?: string;
  modifiedFields?: string[];
}

export function UnsavedChangesModal({
  isOpen,
  onClose,
  onDiscard,
  onSave,
  title = '¿Abandonar sin guardar?',
  message = 'Tienes cambios sin guardar que se perderán si abandonas esta página.',
  modifiedFields = []
}: UnsavedChangesModalProps) {
  
  // Función para obtener nombres amigables de los campos
  const getFieldFriendlyName = (fieldName: string): string => {
    const fieldNames: Record<string, string> = {
      profilePhotoPath: 'Imagen de perfil',
      phone_number: 'Número de teléfono',
      birthdate: 'Fecha de nacimiento',
      preferred_username: 'Nombre de usuario',
      details: 'Descripción del perfil',
      have_a_passport: 'Pasaporte',
      have_a_Visa: 'Visa',
      proofOfTaxStatusPath: 'Constancia de Situación Fiscal',
      secturPath: 'Registro Nacional de Turismo',
      complianceOpinPath: 'Opinión de Cumplimiento',
      company_profile: 'Perfil de empresa',
      days_of_service: 'Horarios de servicio',
      locale: 'País',
      contact_information: 'Información de contacto',
      emgcy_details: 'Contacto de emergencia',
      'contact_information.contact_name': 'Nombre de contacto',
      'contact_information.contact_phone': 'Teléfono de contacto',
      'contact_information.contact_email': 'Email de contacto',
      'emgcy_details.contact_name': 'Nombre de emergencia',
      'emgcy_details.contact_phone': 'Teléfono de emergencia',
      'emgcy_details.contact_email': 'Email de emergencia',
      uniq_influencer_ID: 'ID de influencer',
      social_media_plfms: 'Redes sociales',
      profilePreferences: 'Preferencias de viaje',
      address: 'Dirección',
      'address.cp': 'Código postal',
      'address.c': 'Calle',
      'address.ne': 'Número exterior',
      'address.ni': 'Número interior',
      'address.col': 'Colonia',
      'address.mun': 'Municipio',
      'address.est': 'Estado',
      name: 'Nombre completo',
      banking_details: 'Datos bancarios',
      interest_rate: 'Tasa de interés',
      req_special_services: 'Servicios especiales',
      credentials: 'Credenciales',
      
      // Campos de productos turísticos
      name: 'Nombre del producto',
      preferences: 'Preferencias de viaje',
      languages: 'Idiomas disponibles',
      description: 'Descripción',
      cover_image_url: 'Imagen de portada',
      image_url: 'Galería de imágenes',
      video_url: 'Videos',
      seasons: 'Temporadas',
      planned_hotels_or_similar: 'Hoteles planeados',
      productType: 'Tipo de producto',
      
      // Campos de temporadas
      'seasons.name': 'Nombre de temporada',
      'seasons.start_date': 'Fecha de inicio',
      'seasons.end_date': 'Fecha de fin',
      'seasons.price': 'Precio',
      'seasons.inclussions': 'Inclusiones',
      'seasons.exclussions': 'Exclusiones',
      'seasons.min_travelers': 'Mínimo de viajeros',
      'seasons.max_travelers': 'Máximo de viajeros'
    };

    return fieldNames[fieldName] || fieldName;
  };
  
  // Agrupar campos modificados por categoría
  const categorizeFields = (fields: string[]) => {
    const categories = {
      perfil: new Set<string>(),
      documentos: new Set<string>(),
      contacto: new Set<string>(),
      direccion: new Set<string>(),
      empresa: new Set<string>(),
      producto: new Set<string>(),
      multimedia: new Set<string>(),
      temporadas: new Set<string>(),
      otros: new Set<string>()
    };

    fields.forEach(field => {
      // Normalizar el campo para agrupar objetos relacionados
      let normalizedField = field;
      
      // Agrupar campos de documentos (remover .uri, .name, etc.)
      if (field.includes('proofOfTaxStatusPath')) {
        normalizedField = 'proofOfTaxStatusPath';
      } else if (field.includes('secturPath')) {
        normalizedField = 'secturPath';
      } else if (field.includes('complianceOpinPath')) {
        normalizedField = 'complianceOpinPath';
      } else if (field.includes('contact_information.')) {
        normalizedField = 'contact_information';
      } else if (field.includes('emgcy_details.')) {
        normalizedField = 'emgcy_details';
      } else if (field.includes('address.')) {
        normalizedField = 'address';
      } else if (field.includes('social_media_plfms')) {
        normalizedField = 'social_media_plfms';
      } else if (field.includes('days_of_service')) {
        normalizedField = 'days_of_service';
      } else if (field.includes('seasons')) {
        normalizedField = 'seasons';
      } else if (field.includes('image_url') || field.includes('video_url') || field.includes('cover_image_url')) {
        normalizedField = field.split('.')[0];
      }
      
      const friendlyName = getFieldFriendlyName(normalizedField);
      
      if (normalizedField.includes('Path') || normalizedField.includes('proof') || normalizedField.includes('sectur') || normalizedField.includes('compliance')) {
        categories.documentos.add(friendlyName);
      } else if (normalizedField.includes('contact') || normalizedField.includes('emgcy') || normalizedField.includes('phone') || normalizedField.includes('email')) {
        categories.contacto.add(friendlyName);
      } else if (normalizedField.includes('address') || normalizedField.includes('locale')) {
        categories.direccion.add(friendlyName);
      } else if (normalizedField.includes('company') || normalizedField.includes('days_of_service') || normalizedField.includes('banking')) {
        categories.empresa.add(friendlyName);
      } else if (normalizedField.includes('profile') || normalizedField.includes('username') || normalizedField.includes('details') || normalizedField.includes('birthdate')) {
        categories.perfil.add(friendlyName);
      } else if (normalizedField === 'name' || normalizedField === 'description' || normalizedField === 'preferences' || normalizedField === 'languages' || normalizedField === 'productType' || normalizedField === 'planned_hotels_or_similar') {
        categories.producto.add(friendlyName);
      } else if (normalizedField.includes('image_url') || normalizedField.includes('video_url') || normalizedField.includes('cover_image_url')) {
        categories.multimedia.add(friendlyName);
      } else if (normalizedField === 'seasons') {
        categories.temporadas.add(friendlyName);
      } else {
        categories.otros.add(friendlyName);
      }
    });

    // Convertir Sets a Arrays
    return {
      perfil: Array.from(categories.perfil),
      documentos: Array.from(categories.documentos),
      contacto: Array.from(categories.contacto),
      direccion: Array.from(categories.direccion),
      empresa: Array.from(categories.empresa),
      producto: Array.from(categories.producto),
      multimedia: Array.from(categories.multimedia),
      temporadas: Array.from(categories.temporadas),
      otros: Array.from(categories.otros)
    };
  };

  const categorizedFields = categorizeFields(modifiedFields);
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop con blur */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 pointer-events-auto">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-3xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 mb-6 leading-relaxed">
              {message}
            </p>

            {/* Lista de cambios detectados */}
            {modifiedFields.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 mb-2">
                      {modifiedFields.length === 1 
                        ? 'Se detectó 1 cambio sin guardar:'
                        : `Se detectaron ${modifiedFields.length} cambios sin guardar:`}
                    </p>
                    
                    <div className="space-y-2">
                      {/* Información del perfil */}
                      {categorizedFields.perfil.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Perfil</p>
                          <ul className="mt-1 text-sm text-amber-600 space-y-0.5">
                            {categorizedFields.perfil.map((field, idx) => (
                              <li key={idx}>• {field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Documentos */}
                      {categorizedFields.documentos.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Documentos</p>
                          <ul className="mt-1 text-sm text-amber-600 space-y-0.5">
                            {categorizedFields.documentos.map((field, idx) => (
                              <li key={idx}>• {field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Información de contacto */}
                      {categorizedFields.contacto.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Contacto</p>
                          <ul className="mt-1 text-sm text-amber-600 space-y-0.5">
                            {categorizedFields.contacto.map((field, idx) => (
                              <li key={idx}>• {field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Dirección */}
                      {categorizedFields.direccion.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Dirección</p>
                          <ul className="mt-1 text-sm text-amber-600 space-y-0.5">
                            {categorizedFields.direccion.map((field, idx) => (
                              <li key={idx}>• {field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Empresa */}
                      {categorizedFields.empresa.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Empresa</p>
                          <ul className="mt-1 text-sm text-amber-600 space-y-0.5">
                            {categorizedFields.empresa.map((field, idx) => (
                              <li key={idx}>• {field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Producto */}
                      {categorizedFields.producto?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Producto Turístico</p>
                          <ul className="mt-1 text-sm text-amber-600 space-y-0.5">
                            {categorizedFields.producto.map((field, idx) => (
                              <li key={idx}>• {field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Multimedia */}
                      {categorizedFields.multimedia?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Multimedia</p>
                          <ul className="mt-1 text-sm text-amber-600 space-y-0.5">
                            {categorizedFields.multimedia.map((field, idx) => (
                              <li key={idx}>• {field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Temporadas */}
                      {categorizedFields.temporadas?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Temporadas</p>
                          <ul className="mt-1 text-sm text-amber-600 space-y-0.5">
                            {categorizedFields.temporadas.map((field, idx) => (
                              <li key={idx}>• {field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Otros */}
                      {categorizedFields.otros.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Otros</p>
                          <ul className="mt-1 text-sm text-amber-600 space-y-0.5">
                            {categorizedFields.otros.map((field, idx) => (
                              <li key={idx}>• {field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Botón Guardar */}
              <button
                onClick={onSave}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Guardar cambios</span>
              </button>

              {/* Botón Descartar */}
              <button
                onClick={onDiscard}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Descartar cambios</span>
              </button>

              {/* Botón Cancelar */}
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}