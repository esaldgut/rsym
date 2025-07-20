'use client';

import { useState } from 'react';
import { Package, Price } from '../../types/graphql';

interface CreatePackageFormProps {
  onSubmit: (packageData: Partial<Package>) => void;
  onCancel: () => void;
}

export function CreatePackageForm({ onSubmit, onCancel }: CreatePackageFormProps) {
  const [formData, setFormData] = useState<Partial<Package>>({
    name: '',
    description: '',
    numberOfNights: '',
    capacity: 0,
    included_services: '',
    aditional_services: '',
    preferences: [],
    categories: [],
    published: false,
    status: 'draft'
  });

  const [newPreference, setNewPreference] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [basePrice, setBasePrice] = useState<Partial<Price>>({
    price: 0,
    currency: 'USD',
    roomType: 'standard'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      prices: basePrice.price ? [basePrice as Price] : []
    };
    onSubmit(submitData);
  };

  const addPreference = () => {
    if (newPreference.trim()) {
      setFormData({
        ...formData,
        preferences: [...(formData.preferences || []), newPreference.trim()]
      });
      setNewPreference('');
    }
  };

  const removePreference = (index: number) => {
    setFormData({
      ...formData,
      preferences: formData.preferences?.filter((_, i) => i !== index)
    });
  };

  const addCategory = () => {
    if (newCategory.trim()) {
      setFormData({
        ...formData,
        categories: [...(formData.categories || []), newCategory.trim()]
      });
      setNewCategory('');
    }
  };

  const removeCategory = (index: number) => {
    setFormData({
      ...formData,
      categories: formData.categories?.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Crear Nuevo Paquete
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número de Noches *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.numberOfNights}
                  onChange={(e) => setFormData({ ...formData, numberOfNights: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Capacidad (personas) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Servicios Incluidos *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.included_services}
                  onChange={(e) => setFormData({ ...formData, included_services: e.target.value })}
                  placeholder="Alojamiento, desayuno, transporte..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Servicios Adicionales
                </label>
                <textarea
                  rows={2}
                  value={formData.aditional_services}
                  onChange={(e) => setFormData({ ...formData, aditional_services: e.target.value })}
                  placeholder="Tours opcionales, spa, actividades..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Precio Base</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500">Precio *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={basePrice.price}
                      onChange={(e) => setBasePrice({ ...basePrice, price: parseFloat(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Moneda</label>
                    <select
                      value={basePrice.currency}
                      onChange={(e) => setBasePrice({ ...basePrice, currency: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="MXN">MXN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Tipo de Habitación</label>
                    <select
                      value={basePrice.roomType}
                      onChange={(e) => setBasePrice({ ...basePrice, roomType: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="standard">Estándar</option>
                      <option value="suite">Suite</option>
                      <option value="deluxe">Deluxe</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferencias
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newPreference}
                    onChange={(e) => setNewPreference(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPreference())}
                    placeholder="Playa, Montaña, Ciudad..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={addPreference}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.preferences?.map((pref, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {pref}
                      <button
                        type="button"
                        onClick={() => removePreference(index)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorías
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                    placeholder="Familiar, Romántico, Aventura..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.categories?.map((cat, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Publicar inmediatamente
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              >
                Crear Paquete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}