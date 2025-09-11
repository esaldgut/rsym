'use client';

import React, { useState } from 'react';
import type { ProductSeasonInput, ProductPriceInput, ChildRangeInput } from '@/lib/graphql/types';

interface SeasonConfigurationProps {
  seasons: ProductSeasonInput[];
  onChange: (seasons: ProductSeasonInput[]) => void;
  productType: 'circuit' | 'package';
  error?: string;
}

export function SeasonConfiguration({ 
  seasons = [], 
  onChange, 
  productType,
  error 
}: SeasonConfigurationProps) {
  const [expandedSeason, setExpandedSeason] = useState<number | null>(0);

  const addSeason = () => {
    const newSeason: ProductSeasonInput = {
      category: `Temporada ${seasons.length + 1}`,
      start_date: '',
      end_date: '',
      allotment: 10,
      allotment_remain: 10,
      schedules: '',
      aditional_services: '',
      number_of_nights: productType === 'package' ? '3' : '',
      prices: [{
        currency: 'MXN',
        price: 0,
        room_name: 'Estándar',
        max_adult: 2,
        max_minor: 2,
        children: []
      }],
      extra_prices: []
    };
    onChange([...seasons, newSeason]);
    setExpandedSeason(seasons.length);
  };

  const updateSeason = (index: number, field: keyof ProductSeasonInput, value: any) => {
    const updated = [...seasons];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeSeason = (index: number) => {
    if (seasons.length > 1) {
      const updated = seasons.filter((_, i) => i !== index);
      onChange(updated);
      setExpandedSeason(null);
    }
  };

  const updatePrice = (seasonIndex: number, priceIndex: number, field: keyof ProductPriceInput, value: any) => {
    const updated = [...seasons];
    const prices = [...(updated[seasonIndex].prices || [])];
    prices[priceIndex] = { ...prices[priceIndex], [field]: value };
    updated[seasonIndex] = { ...updated[seasonIndex], prices };
    onChange(updated);
  };

  const addPriceOption = (seasonIndex: number) => {
    const updated = [...seasons];
    const newPrice: ProductPriceInput = {
      currency: 'MXN',
      price: 0,
      room_name: `Opción ${(updated[seasonIndex].prices?.length || 0) + 1}`,
      max_adult: 2,
      max_minor: 2,
      children: []
    };
    updated[seasonIndex] = {
      ...updated[seasonIndex],
      prices: [...(updated[seasonIndex].prices || []), newPrice]
    };
    onChange(updated);
  };

  const removePriceOption = (seasonIndex: number, priceIndex: number) => {
    const updated = [...seasons];
    const prices = (updated[seasonIndex].prices || []).filter((_, i) => i !== priceIndex);
    updated[seasonIndex] = { ...updated[seasonIndex], prices };
    onChange(updated);
  };

  const updateChildRange = (
    seasonIndex: number, 
    priceIndex: number, 
    childIndex: number, 
    field: keyof ChildRangeInput, 
    value: any
  ) => {
    const updated = [...seasons];
    const prices = [...(updated[seasonIndex].prices || [])];
    const children = [...(prices[priceIndex].children || [])];
    children[childIndex] = { ...children[childIndex], [field]: value };
    prices[priceIndex] = { ...prices[priceIndex], children };
    updated[seasonIndex] = { ...updated[seasonIndex], prices };
    onChange(updated);
  };

  const addChildRange = (seasonIndex: number, priceIndex: number) => {
    const updated = [...seasons];
    const prices = [...(updated[seasonIndex].prices || [])];
    const newChild: ChildRangeInput = {
      name: 'Niño',
      min_minor_age: 0,
      max_minor_age: 12,
      child_price: 0
    };
    prices[priceIndex] = {
      ...prices[priceIndex],
      children: [...(prices[priceIndex].children || []), newChild]
    };
    updated[seasonIndex] = { ...updated[seasonIndex], prices };
    onChange(updated);
  };

  const removeChildRange = (seasonIndex: number, priceIndex: number, childIndex: number) => {
    const updated = [...seasons];
    const prices = [...(updated[seasonIndex].prices || [])];
    const children = (prices[priceIndex].children || []).filter((_, i) => i !== childIndex);
    prices[priceIndex] = { ...prices[priceIndex], children };
    updated[seasonIndex] = { ...updated[seasonIndex], prices };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Temporadas y Precios</h3>
        <button
          type="button"
          onClick={addSeason}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-shadow text-sm font-medium"
        >
          + Agregar Temporada
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {seasons.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No hay temporadas configuradas</p>
          <button
            type="button"
            onClick={addSeason}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-shadow text-sm font-medium"
          >
            Crear Primera Temporada
          </button>
        </div>
      )}

      {seasons.map((season, seasonIndex) => (
        <div key={seasonIndex} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Season Header */}
          <div 
            className="bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setExpandedSeason(expandedSeason === seasonIndex ? null : seasonIndex)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">📅</span>
                <div>
                  <h4 className="font-medium text-gray-900">{season.category}</h4>
                  <p className="text-sm text-gray-500">
                    {season.start_date} - {season.end_date}
                    {season.prices && ` • ${season.prices.length} opciones de precio`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {seasons.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSeason(seasonIndex);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1"
                  >
                    Eliminar
                  </button>
                )}
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedSeason === seasonIndex ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Season Content */}
          {expandedSeason === seasonIndex && (
            <div className="p-6 space-y-6">
              {/* Basic Season Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Temporada
                  </label>
                  <input
                    type="text"
                    value={season.category}
                    onChange={(e) => updateSeason(seasonIndex, 'category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Temporada Alta, Navidad, Verano"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disponibilidad (Cupos)
                  </label>
                  <input
                    type="number"
                    value={season.allotment}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      updateSeason(seasonIndex, 'allotment', value);
                      updateSeason(seasonIndex, 'allotment_remain', value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={season.start_date}
                    onChange={(e) => updateSeason(seasonIndex, 'start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={season.end_date}
                    onChange={(e) => updateSeason(seasonIndex, 'end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {productType === 'package' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Noches
                    </label>
                    <input
                      type="number"
                      value={season.number_of_nights}
                      onChange={(e) => updateSeason(seasonIndex, 'number_of_nights', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      max="30"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horarios y Frecuencias
                </label>
                <textarea
                  value={season.schedules}
                  onChange={(e) => updateSeason(seasonIndex, 'schedules', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: Salidas todos los lunes y viernes a las 8:00 AM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servicios Adicionales
                </label>
                <textarea
                  value={season.aditional_services}
                  onChange={(e) => updateSeason(seasonIndex, 'aditional_services', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: Incluye desayuno, guía certificado, seguro de viajero"
                />
              </div>

              {/* Prices Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-lg font-medium text-gray-900">Opciones de Precio</h5>
                  <button
                    type="button"
                    onClick={() => addPriceOption(seasonIndex)}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    + Agregar Precio
                  </button>
                </div>

                {(season.prices || []).map((price, priceIndex) => (
                  <div key={priceIndex} className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-medium text-gray-800">{price.room_name}</h6>
                      {(season.prices?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => removePriceOption(seasonIndex, priceIndex)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tipo de Habitación/Opción
                        </label>
                        <input
                          type="text"
                          value={price.room_name}
                          onChange={(e) => updatePrice(seasonIndex, priceIndex, 'room_name', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                          placeholder="Ej: Doble, Suite"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Precio por Persona (MXN)
                        </label>
                        <input
                          type="number"
                          value={price.price}
                          onChange={(e) => updatePrice(seasonIndex, priceIndex, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Máx. Adultos
                        </label>
                        <input
                          type="number"
                          value={price.max_adult}
                          onChange={(e) => updatePrice(seasonIndex, priceIndex, 'max_adult', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                          min="1"
                          max="10"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Máx. Menores
                        </label>
                        <input
                          type="number"
                          value={price.max_minor}
                          onChange={(e) => updatePrice(seasonIndex, priceIndex, 'max_minor', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                          min="0"
                          max="10"
                        />
                      </div>
                    </div>

                    {/* Child Ranges */}
                    {price.max_minor > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Precios para Menores</span>
                          <button
                            type="button"
                            onClick={() => addChildRange(seasonIndex, priceIndex)}
                            className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                          >
                            + Agregar Rango
                          </button>
                        </div>

                        {(price.children || []).map((child, childIndex) => (
                          <div key={childIndex} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2 last:mb-0">
                            <input
                              type="text"
                              value={child.name}
                              onChange={(e) => updateChildRange(seasonIndex, priceIndex, childIndex, 'name', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                              placeholder="Ej: Bebé"
                            />
                            <input
                              type="number"
                              value={child.min_minor_age}
                              onChange={(e) => updateChildRange(seasonIndex, priceIndex, childIndex, 'min_minor_age', parseInt(e.target.value) || 0)}
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                              placeholder="Edad mín"
                              min="0"
                              max="17"
                            />
                            <input
                              type="number"
                              value={child.max_minor_age}
                              onChange={(e) => updateChildRange(seasonIndex, priceIndex, childIndex, 'max_minor_age', parseInt(e.target.value) || 0)}
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                              placeholder="Edad máx"
                              min="0"
                              max="17"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={child.child_price}
                                onChange={(e) => updateChildRange(seasonIndex, priceIndex, childIndex, 'child_price', parseFloat(e.target.value) || 0)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                placeholder="Precio"
                                min="0"
                                step="0.01"
                              />
                              <button
                                type="button"
                                onClick={() => removeChildRange(seasonIndex, priceIndex, childIndex)}
                                className="p-1 text-red-600 hover:text-red-700"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}