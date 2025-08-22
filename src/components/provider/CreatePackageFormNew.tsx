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

export function CreatePackageFormNew({ onSubmit, onCancel }: CreatePackageFormProps) {
  const router = useRouter();
  const { user, userType } = useAmplifyAuth();
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
  const [newCategory, setNewCategory] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Manejo de ubicaciones con hooks personalizados - SIEMPRE llamamos los hooks
  const {
    selectedLocation: destinationLocation,
    selectLocation: selectDestination,
    removeLocation: removeDestination,
    error: destinationError,
    validateLocation: validateDestination
  } = useLocationSelector({
    validate: (location) => {
      if (!location) return 'Debe seleccionar al menos una ubicación de destino';
      return null;
    }
  });

  const {
    selectedLocation: originLocation,
    selectLocation: selectOrigin,
    removeLocation: removeOrigin,
    error: originError
  } = useLocationSelector();

  // Verificar que el usuario es provider DESPUÉS de los hooks
  const isProvider = userType === 'provider';

  if (!isProvider) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-600 mb-4">Acceso Denegado</h3>
            <p className="text-gray-600 mb-4">
              Solo los proveedores pueden crear paquetes turísticos.
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

  // Helpers para manejar arrays
  const addToArray = useCallback((key: keyof FormData, value: string) => {
    if (!value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      [key]: [...(prev[key] as string[]), value.trim()]
    }));
    
    // Limpiar input correspondiente
    switch (key) {
      case 'preferences': setNewPreference(''); break;
      case 'categories': setNewCategory(''); break;
      case 'language': setNewLanguage(''); break;
      case 'image_url': setNewImageUrl(''); break;
      case 'video_url': setNewVideoUrl(''); break;
    }
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

  // Manejar envío del formulario
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores anteriores
    setError(null);
    setValidationErrors({});

    // Validar ubicaciones
    if (!validateDestination()) {
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

    // Ubicaciones (convertir a CircuitLocationInput)
    const destination = destinationLocation ? [destinationLocation] : [];
    const origin = originLocation ? [originLocation] : [];
    
    submitData.append('destination', JSON.stringify(destination));
    submitData.append('origin', JSON.stringify(origin));

    // Ejecutar Server Action
    startTransition(async () => {
      try {
        const result = await createPackageAction(submitData);
        
        if (result.success) {
          console.log('✅ Paquete creado exitosamente:', result.data?.id);
          onSubmit?.(true, result.data?.id);
          router.refresh(); // Refrescar datos del servidor
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
  }, [formData, destinationLocation, originLocation, validateDestination, onSubmit, router]);

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
          {isProvider && (
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Proveedor Verificado
            </div>
          )}
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Ubicaciones */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Ubicaciones</h4>
            <div className="space-y-6">
              {/* Destino */}
              <LocationSelector
                selectedLocation={destinationLocation}
                onLocationSelect={selectDestination}
                onLocationRemove={removeDestination}
                placeholder="Buscar destino principal del paquete..."
                countries={['MEX', 'USA', 'CAN', 'GTM', 'BLZ']}
                required={true}
                label="Destino Principal *"
                helpText="Selecciona la ubicación principal donde se desarrollará el paquete turístico"
                error={destinationError}
              />

              {/* Origen (opcional) */}
              <LocationSelector
                selectedLocation={originLocation}
                onLocationSelect={selectOrigin}
                onLocationRemove={removeOrigin}
                placeholder="Buscar punto de partida (opcional)..."
                countries={['MEX', 'USA', 'CAN', 'GTM', 'BLZ']}
                label="Punto de Partida (Opcional)"
                helpText="Si aplica, selecciona desde dónde inicia el paquete"
                error={originError}
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

          {/* Preferencias y Categorías */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            {/* Categorías */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Categorías</h4>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('categories', newCategory))}
                    placeholder="Familiar, Romántico, Aventura..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('categories', newCategory)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.categories.map((cat, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeFromArray('categories', index)}
                        className="text-green-600 hover:text-green-800"
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