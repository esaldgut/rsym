'use client';

import { useState } from 'react';
import { Circuit, CircuitLocation } from '../../types/graphql';

interface CreateCircuitFormProps {
  onSubmit: (circuit: Partial<Circuit>) => void;
  onCancel: () => void;
}

export function CreateCircuitForm({ onSubmit, onCancel }: CreateCircuitFormProps) {
  const [formData, setFormData] = useState<Partial<Circuit>>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    included_services: '',
    language: [],
    preferences: [],
    published: false,
    status: 'draft'
  });

  const [newPreference, setNewPreference] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

  const addLanguage = () => {
    if (newLanguage.trim()) {
      setFormData({
        ...formData,
        language: [...(formData.language || []), newLanguage.trim()]
      });
      setNewLanguage('');
    }
  };

  const removeLanguage = (index: number) => {
    setFormData({
      ...formData,
      language: formData.language?.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Crear Nuevo Circuito
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nombre del Circuito *
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
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Servicios Incluidos
                </label>
                <textarea
                  rows={3}
                  value={formData.included_services}
                  onChange={(e) => setFormData({ ...formData, included_services: e.target.value })}
                  placeholder="Transporte, alojamiento, guía turístico..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferencias/Categorías
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newPreference}
                    onChange={(e) => setNewPreference(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPreference())}
                    placeholder="Aventura, Naturaleza, Cultural..."
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
                  Idiomas
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                    placeholder="Español, Inglés, Francés..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.language?.map((lang, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {lang}
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className="text-blue-600 hover:text-blue-800"
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
                Crear Circuito
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}