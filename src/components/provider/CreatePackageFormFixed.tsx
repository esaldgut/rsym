'use client';

import { useState, useTransition, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAmplifyAuth } from '@/hooks/useAmplifyAuth';
import { LocationSelector } from '@/components/location/LocationSelector';
import { useLocationSelector } from '@/hooks/useLocationSelector';
import { createPackageAction } from '@/lib/server/package-actions';
import type { CircuitLocation } from '@/types/location';
import type { PriceInput } from '@/lib/graphql/types';

interface CreatePackageFormProps {
  onSubmit?: (success: boolean, packageId?: string) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  capacity: number;
  numberOfNights: string;
  included_services: string;
  aditional_services: string;
  cover_image_url: string;
  published: boolean;
  startDate: string;
  endDate: string;
  preferences: string[];
  categories: string[];
  language: string[];
  image_url: string[];
  video_url: string[];
  prices: PriceInput[];
  extraPrices: PriceInput[];
}

/**
 * Componente interno que contiene toda la lógica del formulario
 * Separado para evitar hooks condicionales
 */
function PackageFormContent({ onSubmit, onCancel }: CreatePackageFormProps) {
  const router = useRouter();
  const { user } = useAmplifyAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Estados del formulario
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    capacity: 1,
    numberOfNights: '1',
    included_services: '',
    aditional_services: '',
    cover_image_url: '',
    published: false,
    startDate: '',
    endDate: '',
    preferences: [],
    categories: [],
    language: ['es'],
    image_url: [],
    video_url: [],
    prices: [{ currency: 'USD', price: 0, roomName: 'Estándar' }],
    extraPrices: []
  });

  // Estados para agregar elementos
  const [newPreference, setNewPreference] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  
  // Opciones de categoría predefinidas
  const categoryOptions = ['Primera', 'Primera superior', 'Lujo'];
  
  // Idiomas más comunes
  const languageOptions = ['es', 'en', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ar', 'ru'];

  // Hooks de ubicación - SIEMPRE se ejecutan
  const destinationSelector = useLocationSelector({
    validate: (location) => {
      if (!location) return 'Debe seleccionar al menos una ubicación de destino';
      return null;
    }
  });

  const originSelector = useLocationSelector();

  // Helpers para manejar arrays
  const addToArray = useCallback((key: keyof FormData, value: string) => {
    if (!value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      [key]: [...(prev[key] as string[]), value.trim()]
    }));
    
    // Limpiar input correspondiente
    if (key === 'preferences') setNewPreference('');
    if (key === 'language') setNewLanguage('');
    if (key === 'image_url') setNewImageUrl('');
    if (key === 'video_url') setNewVideoUrl('');
  }, []);
  
  // Helper específico para categoría (solo una opción)
  const handleCategoryChange = useCallback((category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: [category] // Solo una categoría permitida
    }));
  }, []);

  const removeFromArray = useCallback((key: keyof FormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).filter((_, i) => i !== index)
    }));
  }, []);

  // Manejar precios
  const addPrice = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      prices: [...prev.prices, { currency: 'USD', price: 0, roomName: '' }]
    }));
  }, []);

  const updatePrice = useCallback((index: number, field: keyof PriceInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      prices: prev.prices.map((price, i) => 
        i === index ? { ...price, [field]: value } : price
      )
    }));
  }, []);

  const removePrice = useCallback((index: number) => {
    if (formData.prices.length > 1) {
      setFormData(prev => ({
        ...prev,
        prices: prev.prices.filter((_, i) => i !== index)
      }));
    }
  }, [formData.prices.length]);

  // Manejar precios extra (noches adicionales)
  const addExtraPrice = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      extraPrices: [...prev.extraPrices, { currency: 'USD', price: 0, roomName: 'Noche extra' }]
    }));
  }, []);

  const updateExtraPrice = useCallback((index: number, field: keyof PriceInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      extraPrices: prev.extraPrices.map((price, i) => 
        i === index ? { ...price, [field]: value } : price
      )
    }));
  }, []);

  const removeExtraPrice = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      extraPrices: prev.extraPrices.filter((_, i) => i !== index)
    }));
  }, []);

  // Manejar envío del formulario
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores anteriores
    setError(null);
    setValidationErrors({});

    // Validar ubicaciones
    if (!destinationSelector.validateLocation()) {
      setError('Debe seleccionar una ubicación de destino válida');
      return;
    }

    // Preparar datos para envío
    const submitData = new FormData();
    
    // Campos básicos
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        submitData.append(key, JSON.stringify(value));
      } else {
        submitData.append(key, String(value));
      }
    });

    // Ubicaciones
    const destination = destinationSelector.selectedLocation ? [destinationSelector.selectedLocation] : [];
    const origin = originSelector.selectedLocation ? [originSelector.selectedLocation] : [];
    
    submitData.append('destination', JSON.stringify(destination));
    submitData.append('origin', JSON.stringify(origin));

    // Ejecutar Server Action
    startTransition(async () => {
      try {
        const result = await createPackageAction(submitData);
        
        if (result.success) {
          console.log('✅ Paquete creado exitosamente:', result.data?.id);
          onSubmit?.(true, result.data?.id);
          router.refresh();
        } else {
          if (result.validationErrors) {
            setValidationErrors(result.validationErrors);
          }
          setError(result.error || 'Error al crear el paquete');
        }
      } catch (error) {
        console.error('Error en createPackageAction:', error);
        setError('Error interno del servidor');
      }
    });
  }, [formData, destinationSelector, originSelector, onSubmit, router]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-6xl shadow-lg rounded-md bg-white mb-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Crear Nuevo Paquete</h3>
            <p className="text-sm text-gray-600 mt-1">
              Diseña un paquete turístico único para ofrecer en el marketplace
            </p>
          </div>
          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            ✓ Proveedor Verificado
          </div>
        </div>

        {/* Error General */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al crear paquete</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Información Básica */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nombre del Paquete *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
                    validationErrors.name ? 'border-red-300' : ''
                  }`}
                  placeholder="Ej: Escapada Romántica a Playa del Carmen"
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Descripción *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
                    validationErrors.description ? 'border-red-300' : ''
                  }`}
                  placeholder="Describe tu paquete turístico de manera atractiva..."
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número de Noches *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="365"
                  value={formData.numberOfNights}
                  onChange={(e) => setFormData({ ...formData, numberOfNights: e.target.value })}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
                    validationErrors.numberOfNights ? 'border-red-300' : ''
                  }`}
                />
                {validationErrors.numberOfNights && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.numberOfNights}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Capacidad (personas) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="50"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
                    validationErrors.capacity ? 'border-red-300' : ''
                  }`}
                />
                {validationErrors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.capacity}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ubicaciones */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Ubicaciones</h4>
            <div className="space-y-6">
              <LocationSelector
                selectedLocation={destinationSelector.selectedLocation}
                onLocationSelect={destinationSelector.selectLocation}
                onLocationRemove={destinationSelector.removeLocation}
                placeholder="Buscar destino principal del paquete..."
                countries={['MEX', 'USA', 'CAN', 'GTM', 'BLZ']}
                required={true}
                label="Destino Principal *"
                helpText="Selecciona la ubicación principal donde se desarrollará el paquete turístico"
                error={destinationSelector.error}
              />

              <LocationSelector
                selectedLocation={originSelector.selectedLocation}
                onLocationSelect={originSelector.selectLocation}
                onLocationRemove={originSelector.removeLocation}
                placeholder="Buscar punto de partida (opcional)..."
                countries={['MEX', 'USA', 'CAN', 'GTM', 'BLZ']}
                label="Punto de Partida (Opcional)"
                helpText="Si aplica, selecciona desde dónde inicia el paquete"
                error={originSelector.error}
              />
            </div>
          </div>

          {/* Servicios */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Servicios</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Servicios Incluidos *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.included_services}
                  onChange={(e) => setFormData({ ...formData, included_services: e.target.value })}
                  placeholder="Alojamiento, desayuno, transporte, guía turístico..."
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
                    validationErrors.included_services ? 'border-red-300' : ''
                  }`}
                />
                {validationErrors.included_services && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.included_services}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Servicios Adicionales
                </label>
                <textarea
                  rows={2}
                  value={formData.aditional_services}
                  onChange={(e) => setFormData({ ...formData, aditional_services: e.target.value })}
                  placeholder="Tours opcionales, spa, actividades especiales..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">Precios</h4>
              <button
                type="button"
                onClick={addPrice}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
              >
                + Agregar Precio
              </button>
            </div>
            <div className="space-y-4">
              {formData.prices.map((price, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-gray-500">Precio *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={price.price}
                      onChange={(e) => updatePrice(index, 'price', parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Moneda</label>
                    <select
                      value={price.currency}
                      onChange={(e) => updatePrice(index, 'currency', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="MXN">MXN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Tipo de Habitación</label>
                    <input
                      type="text"
                      value={price.roomName}
                      onChange={(e) => updatePrice(index, 'roomName', e.target.value)}
                      placeholder="Estándar, Suite, Deluxe..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    {formData.prices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrice(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Precios por Noches Extras */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">Precios por Noches Extras</h4>
              <button
                type="button"
                onClick={addExtraPrice}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
              >
                + Agregar Precio Extra
              </button>
            </div>
            <div className="space-y-4">
              {formData.extraPrices.length > 0 ? (
                formData.extraPrices.map((price, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-xs text-gray-500">Precio por noche extra *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={price.price}
                        onChange={(e) => updateExtraPrice(index, 'price', parseFloat(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Moneda</label>
                      <select
                        value={price.currency}
                        onChange={(e) => updateExtraPrice(index, 'currency', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="MXN">MXN</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Descripción</label>
                      <input
                        type="text"
                        value={price.roomName}
                        onChange={(e) => updateExtraPrice(index, 'roomName', e.target.value)}
                        placeholder="Noche extra, habitación adicional..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => removeExtraPrice(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    No hay precios por noches extras configurados.
                    Agrega precios para estadías prolongadas.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fechas de Disponibilidad */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Fechas de Disponibilidad</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
                    validationErrors.startDate ? 'border-red-300' : ''
                  }`}
                />
                {validationErrors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
                    validationErrors.endDate ? 'border-red-300' : ''
                  }`}
                />
                {validationErrors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Idiomas de la Experiencia */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Idiomas de la Experiencia</h4>
            <div className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">Seleccionar idioma...</option>
                  {languageOptions.map(lang => (
                    <option key={lang} value={lang}>
                      {lang === 'es' ? 'Español' : 
                       lang === 'en' ? 'Inglés' : 
                       lang === 'fr' ? 'Francés' : 
                       lang === 'de' ? 'Alemán' : 
                       lang === 'it' ? 'Italiano' : 
                       lang === 'pt' ? 'Portugués' : 
                       lang === 'ja' ? 'Japonés' : 
                       lang === 'zh' ? 'Chino' : 
                       lang === 'ar' ? 'Árabe' : 
                       lang === 'ru' ? 'Ruso' : lang.toUpperCase()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => addToArray('language', newLanguage)}
                  disabled={!newLanguage || formData.language.includes(newLanguage)}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.language.map((lang, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                  >
                    {lang === 'es' ? 'Español' : 
                     lang === 'en' ? 'Inglés' : 
                     lang === 'fr' ? 'Francés' : 
                     lang === 'de' ? 'Alemán' : 
                     lang === 'it' ? 'Italiano' : 
                     lang === 'pt' ? 'Portugués' : 
                     lang === 'ja' ? 'Japonés' : 
                     lang === 'zh' ? 'Chino' : 
                     lang === 'ar' ? 'Árabe' : 
                     lang === 'ru' ? 'Ruso' : lang.toUpperCase()}
                    <button
                      type="button"
                      onClick={() => removeFromArray('language', index)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Multimedia */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Imágenes y Videos</h4>
            <div className="space-y-6">
              {/* Imagen de portada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de Portada *
                </label>
                <input
                  type="url"
                  required
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  placeholder="https://ejemplo.com/imagen-portada.jpg"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
                    validationErrors.cover_image_url ? 'border-red-300' : ''
                  }`}
                />
                {validationErrors.cover_image_url && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.cover_image_url}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">Esta será la imagen principal del paquete</p>
              </div>

              {/* Imágenes adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes Adicionales
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('image_url', newImageUrl)}
                    disabled={!newImageUrl}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                  >
                    Agregar
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {formData.image_url.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600 truncate flex-1">
                        {url.length > 30 ? `${url.substring(0, 30)}...` : url}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromArray('image_url', index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Videos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Videos
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('video_url', newVideoUrl)}
                    disabled={!newVideoUrl}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    Agregar
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {formData.video_url.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600 truncate flex-1">
                        {url.length > 40 ? `${url.substring(0, 40)}...` : url}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromArray('video_url', index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Categoría y Preferencias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categoría */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Categoría del Paquete</h4>
              <div className="space-y-3">
                {categoryOptions.map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category}
                      checked={formData.categories[0] === category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                {formData.categories.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {formData.categories[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Preferencias */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Preferencias</h4>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPreference}
                    onChange={(e) => setNewPreference(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('preferences', newPreference))}
                    placeholder="Playa, Montaña, Ciudad..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('preferences', newPreference)}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.preferences.map((pref, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {pref}
                      <button
                        type="button"
                        onClick={() => removeFromArray('preferences', index)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Opciones de Publicación */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Opciones de Publicación</h4>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Publicar inmediatamente
                  </span>
                  <p className="text-xs text-gray-500">
                    El paquete será visible en el marketplace al crearse
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                'Crear Paquete'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Componente principal que verifica permisos antes de renderizar
 */
export function CreatePackageFormFixed({ onSubmit, onCancel }: CreatePackageFormProps) {
  const { userType, isLoading } = useAmplifyAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-gray-700">Verificando permisos...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not a provider
  if (userType !== 'provider') {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-600 mb-4">Acceso Denegado</h3>
            <p className="text-gray-600 mb-4">
              Solo los proveedores pueden crear paquetes turísticos.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Tu tipo de usuario: <span className="font-mono">{userType || 'No identificado'}</span>
            </p>
            <button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Provider - render form
  return <PackageFormContent onSubmit={onSubmit} onCancel={onCancel} />;
}