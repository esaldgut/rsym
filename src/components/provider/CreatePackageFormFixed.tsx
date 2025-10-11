'use client';

import { useState, useTransition, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LocationSelector } from '@/components/location/LocationSelector';
import { useLocationSelector } from '@/hooks/useLocationSelector';
import { createPackageAction } from '@/lib/server/package-actions';
import type { CircuitLocation } from '@/types/location';
import type { PriceInput } from '@/lib/graphql/types';
import { Preferences } from '@/utils/preferences';
import { ImageUpload, VideoUpload } from '@/components/ui/FileUpload';

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
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
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
  const [newLanguage, setNewLanguage] = useState('');
  
  // Opciones de categoría predefinidas
  const categoryOptions = ['Primera', 'Primera superior', 'Lujo'];
  
  // Tipos de habitación fijos (solo estas 3 opciones)
  const roomTypeOptions = ['Sencilla', 'Doble', 'Triple'];
  
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
    if (key === 'language') setNewLanguage('');
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

  // Manejar selección de preferencias
  const togglePreference = useCallback((preferenceId: string) => {
    setFormData(prev => {
      const isSelected = prev.preferences.includes(preferenceId);
      return {
        ...prev,
        preferences: isSelected 
          ? prev.preferences.filter(id => id !== preferenceId)
          : [...prev.preferences, preferenceId]
      };
    });
  }, []);

  // Verificar si una preferencia está seleccionada
  const isPreferenceSelected = useCallback((preferenceId: string) => {
    return formData.preferences.includes(preferenceId);
  }, [formData.preferences]);

  // Manejar upload exitoso de imagen de portada
  const handleCoverImageUpload = useCallback((url: string, fileName: string) => {
    setFormData(prev => ({
      ...prev,
      cover_image_url: url
    }));
    setUploadError(null);
    console.log('✅ Imagen de portada subida:', fileName, url);
  }, []);

  // Manejar upload exitoso de imagen adicional
  const handleImageUpload = useCallback((url: string, fileName: string) => {
    setFormData(prev => ({
      ...prev,
      image_url: [...prev.image_url, url]
    }));
    setUploadError(null);
    console.log('✅ Imagen adicional subida:', fileName, url);
  }, []);

  // Manejar upload exitoso de video
  const handleVideoUpload = useCallback((url: string, fileName: string) => {
    setFormData(prev => ({
      ...prev,
      video_url: [...prev.video_url, url]
    }));
    setUploadError(null);
    console.log('✅ Video subido:', fileName, url);
  }, []);

  // Manejar errores de upload
  const handleUploadError = useCallback((error: string) => {
    setUploadError(error);
    console.error('❌ Error de upload:', error);
  }, []);

  // Manejar precios con tipos de habitación fijos
  const addPrice = useCallback(() => {
    // Solo permitir máximo 3 precios
    if (formData.prices.length >= 3) return;
    
    // Encontrar el primer tipo de habitación disponible
    const usedRoomTypes = formData.prices.map(p => p.roomName);
    const availableRoomType = roomTypeOptions.find(roomType => !usedRoomTypes.includes(roomType));
    
    if (availableRoomType) {
      setFormData(prev => ({
        ...prev,
        prices: [...prev.prices, { currency: 'MXN', price: 0, roomName: availableRoomType }]
      }));
    }
  }, [formData.prices, roomTypeOptions]);

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

  // Obtener tipos de habitación disponibles para un precio específico
  const getAvailableRoomTypes = useCallback((currentIndex: number) => {
    const usedRoomTypes = formData.prices
      .map((p, i) => i !== currentIndex ? p.roomName : null)
      .filter(Boolean);
    
    return roomTypeOptions.filter(roomType => !usedRoomTypes.includes(roomType));
  }, [formData.prices, roomTypeOptions]);

  // Manejar precios extra (noches adicionales) con tipos fijos
  const addExtraPrice = useCallback(() => {
    // Solo permitir máximo 3 precios extra
    if (formData.extraPrices.length >= 3) return;
    
    // Encontrar el primer tipo de habitación disponible para precios extra
    const usedRoomTypes = formData.extraPrices.map(p => p.roomName);
    const availableRoomType = roomTypeOptions.find(roomType => !usedRoomTypes.includes(roomType));
    
    if (availableRoomType) {
      setFormData(prev => ({
        ...prev,
        extraPrices: [...prev.extraPrices, { currency: 'MXN', price: 0, roomName: availableRoomType }]
      }));
    }
  }, [formData.extraPrices, roomTypeOptions]);

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

  // Obtener tipos de habitación disponibles para precios extra
  const getAvailableExtraRoomTypes = useCallback((currentIndex: number) => {
    const usedRoomTypes = formData.extraPrices
      .map((p, i) => i !== currentIndex ? p.roomName : null)
      .filter(Boolean);
    
    return roomTypeOptions.filter(roomType => !usedRoomTypes.includes(roomType));
  }, [formData.extraPrices, roomTypeOptions]);

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
                countries={['USA', 'CAN', 'GBR', 'DEU', 'FRA', 'ITA', 'ESP', 'JPN', 'CHN', 'IND', 'BRA', 'MEX', 'AUS', 'NLD', 'BEL', 'CHE', 'SWE', 'NOR', 'DNK', 'FIN', 'AUT', 'GRC', 'PRT', 'IRL', 'POL', 'RUS', 'TUR', 'SAU', 'ARE', 'ZAF', 'EGY', 'NGA', 'KEN', 'ETH', 'GHA', 'MAR', 'DZA', 'TUN', 'ARG', 'CHL', 'COL', 'PER', 'VEN', 'ECU', 'NZL', 'SGP', 'MYS', 'IDN', 'THA', 'VNM', 'PHL', 'KOR', 'HKG', 'TWN', 'ISR', 'ARE', 'QAT', 'KWT', 'OMN', 'PAK', 'BGD', 'LKA', 'UKR', 'ROU', 'HUN', 'CZE', 'SVK', 'BGR', 'HRV', 'SRB', 'SVN', 'LTU', 'LVA', 'EST', 'ISL', 'LUX', 'CYP', 'MLT', 'JOR', 'LBN', 'IRQ', 'IRN', 'KAZ', 'UZB', 'AZE', 'GEO', 'ARM', 'TZA', 'UGA', 'MOZ', 'ZMB', 'MWI', 'AGO', 'CMR', 'SEN', 'CIV', 'GIN', 'NGA', 'ZAF', 'KEN']}
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
                countries={['USA', 'CAN', 'GBR', 'DEU', 'FRA', 'ITA', 'ESP', 'JPN', 'CHN', 'IND', 'BRA', 'MEX', 'AUS', 'NLD', 'BEL', 'CHE', 'SWE', 'NOR', 'DNK', 'FIN', 'AUT', 'GRC', 'PRT', 'IRL', 'POL', 'RUS', 'TUR', 'SAU', 'ARE', 'ZAF', 'EGY', 'NGA', 'KEN', 'ETH', 'GHA', 'MAR', 'DZA', 'TUN', 'ARG', 'CHL', 'COL', 'PER', 'VEN', 'ECU', 'NZL', 'SGP', 'MYS', 'IDN', 'THA', 'VNM', 'PHL', 'KOR', 'HKG', 'TWN', 'ISR', 'ARE', 'QAT', 'KWT', 'OMN', 'PAK', 'BGD', 'LKA', 'UKR', 'ROU', 'HUN', 'CZE', 'SVK', 'BGR', 'HRV', 'SRB', 'SVN', 'LTU', 'LVA', 'EST', 'ISL', 'LUX', 'CYP', 'MLT', 'JOR', 'LBN', 'IRQ', 'IRN', 'KAZ', 'UZB', 'AZE', 'GEO', 'ARM', 'TZA', 'UGA', 'MOZ', 'ZMB', 'MWI', 'AGO', 'CMR', 'SEN', 'CIV', 'GIN', 'NGA', 'ZAF', 'KEN']}
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

          {/* Multimedia con Carga de Archivos */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Imágenes y Videos</h4>
            
            {/* Mostrar errores de upload */}
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{uploadError}</p>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Imagen de portada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de Portada *
                </label>
                <div className="space-y-3">
                  {/* Mostrar imagen actual si existe */}
                  {formData.cover_image_url && (
                    <div className="relative">
                      <div className="aspect-video w-full max-w-sm rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={formData.cover_image_url}
                          alt="Imagen de portada"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Botón de upload */}
                  <div className="flex items-center gap-3">
                    <ImageUpload
                      onUploadSuccess={handleCoverImageUpload}
                      onUploadError={handleUploadError}
                      disabled={isPending}
                    />
                    <span className="text-sm text-gray-500">
                      {formData.cover_image_url ? 'Cambiar imagen' : 'Formatos: JPG, PNG, WEBP (máx. 10MB)'}
                    </span>
                  </div>
                </div>
                {validationErrors.cover_image_url && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.cover_image_url}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">Esta será la imagen principal del paquete que verán los usuarios</p>
              </div>

              {/* Imágenes adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes Adicionales
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({formData.image_url.length} imagen{formData.image_url.length !== 1 ? 's' : ''})
                  </span>
                </label>
                
                {/* Botón de upload */}
                <div className="mb-4">
                  <ImageUpload
                    onUploadSuccess={handleImageUpload}
                    onUploadError={handleUploadError}
                    disabled={isPending}
                  />
                  <p className="mt-1 text-sm text-gray-500">Agrega más imágenes para mostrar diferentes aspectos del paquete</p>
                </div>

                {/* Galería de imágenes */}
                {formData.image_url.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {formData.image_url.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={url}
                            alt={`Imagen adicional ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromArray('image_url', index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Videos
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({formData.video_url.length} video{formData.video_url.length !== 1 ? 's' : ''})
                  </span>
                </label>
                
                {/* Botón de upload */}
                <div className="mb-4">
                  <VideoUpload
                    onUploadSuccess={handleVideoUpload}
                    onUploadError={handleUploadError}
                    disabled={isPending}
                  />
                  <p className="mt-1 text-sm text-gray-500">Formatos: MP4, MOV, AVI, MKV, WEBM (máx. 100MB)</p>
                </div>

                {/* Lista de videos */}
                {formData.video_url.length > 0 && (
                  <div className="space-y-3">
                    {formData.video_url.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">Video {index + 1}</p>
                            <p className="text-xs text-gray-500 truncate">{url}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromArray('video_url', index)}
                          className="flex-shrink-0 text-red-500 hover:text-red-700 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

            {/* Preferencias con Imágenes */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Preferencias del Viaje
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Selecciona las que apliquen)
                </span>
              </h4>
              
              {/* Grid de preferencias con imágenes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {Preferences.map((preference) => (
                  <div
                    key={preference.id}
                    onClick={() => togglePreference(preference.id)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      isPreferenceSelected(preference.id)
                        ? 'border-purple-500 shadow-lg transform scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {/* Imagen */}
                    <div className="aspect-video relative">
                      <img
                        src={preference.uri}
                        alt={preference.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Overlay con checkmark */}
                      {isPreferenceSelected(preference.id) && (
                        <div className="absolute inset-0 bg-purple-500 bg-opacity-30 flex items-center justify-center">
                          <div className="bg-white rounded-full p-1">
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Texto */}
                    <div className="p-2">
                      <p className={`text-xs font-medium text-center ${
                        isPreferenceSelected(preference.id)
                          ? 'text-purple-700'
                          : 'text-gray-700'
                      }`}>
                        {preference.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contador de preferencias seleccionadas */}
              {formData.preferences.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <span className="font-semibold">{formData.preferences.length}</span> preferencia{formData.preferences.length !== 1 ? 's' : ''} seleccionada{formData.preferences.length !== 1 ? 's' : ''}:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.preferences.map((prefId) => {
                      const preference = Preferences.find(p => p.id === prefId);
                      return preference ? (
                        <span
                          key={prefId}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700"
                        >
                          {preference.name}
                          <button
                            type="button"
                            onClick={() => togglePreference(prefId)}
                            className="ml-1 text-purple-500 hover:text-purple-700"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
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
  const { userType, isLoading } = useAuth();

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
