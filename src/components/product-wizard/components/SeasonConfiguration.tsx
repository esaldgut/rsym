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
  const [seasonCurrencies, setSeasonCurrencies] = useState<{ [key: number]: string }>({});

  // Inicializar currencies desde los datos existentes
  React.useEffect(() => {
    const initialCurrencies: { [key: number]: string } = {};
    seasons.forEach((season, index) => {
      const firstPrice = season.prices?.[0];
      initialCurrencies[index] = firstPrice?.currency || 'MXN';
    });
    setSeasonCurrencies(initialCurrencies);
  }, [seasons.length]);

  // Migración automática de 'Standard' a 'Doble' para datos existentes
  React.useEffect(() => {
    const needsMigration = seasons.some(season =>
      season.prices?.some(price =>
        price.room_name === 'Standard' ||
        price.room_name === 'Estándar' ||
        price.room_name === 'standard'
      )
    );

    if (needsMigration) {
      const migratedSeasons = seasons.map(season => ({
        ...season,
        prices: season.prices?.map(price => ({
          ...price,
          room_name: (price.room_name === 'Standard' ||
                      price.room_name === 'Estándar' ||
                      price.room_name === 'standard')
                     ? 'Doble'
                     : price.room_name
        }))
      }));
      onChange(migratedSeasons);
    }
  }, []);

  const updateSeasonCurrency = (seasonIndex: number, newCurrency: string) => {
    setSeasonCurrencies(prev => ({ ...prev, [seasonIndex]: newCurrency }));

    const updated = [...seasons];
    updated[seasonIndex] = {
      ...updated[seasonIndex],
      prices: updated[seasonIndex].prices?.map(price => ({
        ...price,
        currency: newCurrency
      })),
      extra_prices: updated[seasonIndex].extra_prices?.map(price => ({
        ...price,
        currency: newCurrency
      }))
    };
    onChange(updated);
  };

  const addSeason = () => {
    const newSeason: ProductSeasonInput = {
      category: 'Primera', // Inicializar con categoría de 3 estrellas por defecto
      start_date: '',
      end_date: '',
      // allotment y allotment_remain se inicializarán como undefined
      schedules: '',
      aditional_services: '',
      number_of_nights: productType === 'package' ? '3' : '',
      prices: [{
        currency: 'MXN',
        price: 0,
        room_name: 'Doble',
        max_adult: 2,
        max_minor: 2,
        children: []
      }],
      extra_prices: []
    };
    onChange([...seasons, newSeason]);
    setExpandedSeason(seasons.length);
  };

  const updateSeason = (index: number, field: keyof ProductSeasonInput, value: ProductSeasonInput[keyof ProductSeasonInput]) => {
    const updated = [...seasons];

    // Convertir a número solo para allotment
    if (field === 'allotment') {
      const numValue = value === '' ? 0 : Number(value);
      updated[index] = { ...updated[index], [field]: numValue };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    onChange(updated);
  };

  const removeSeason = (index: number) => {
    if (seasons.length > 1) {
      const updated = seasons.filter((_, i) => i !== index);
      onChange(updated);
      setExpandedSeason(null);
    }
  };

  const duplicateSeason = (index: number) => {
    const seasonToDuplicate = seasons[index];
    const duplicatedSeason: ProductSeasonInput = {
      ...seasonToDuplicate,
      // Clonar arrays profundamente para evitar referencias compartidas
      prices: seasonToDuplicate.prices?.map(price => ({
        ...price,
        children: price.children?.map(child => ({ ...child }))
      })),
      extra_prices: seasonToDuplicate.extra_prices?.map(price => ({
        ...price,
        children: price.children?.map(child => ({ ...child }))
      }))
    };

    const updated = [...seasons];
    updated.splice(index + 1, 0, duplicatedSeason);
    onChange(updated);
    setExpandedSeason(index + 1); // Expandir la temporada duplicada
  };

  const updatePrice = (seasonIndex: number, priceIndex: number, field: keyof ProductPriceInput, value: ProductPriceInput[keyof ProductPriceInput]) => {
    const updated = [...seasons];
    const prices = [...(updated[seasonIndex].prices || [])];
    prices[priceIndex] = { ...prices[priceIndex], [field]: value };
    updated[seasonIndex] = { ...updated[seasonIndex], prices };
    onChange(updated);
  };

  const addPriceOption = (seasonIndex: number) => {
    const updated = [...seasons];
    const existingPrices = updated[seasonIndex].prices || [];

    // Tipos de habitación disponibles
    const availableRoomTypes = ['Sencilla', 'Doble', 'Triple'];

    // Encontrar tipos ya usados
    const usedRoomTypes = existingPrices.map(p => p.room_name);

    // Encontrar el primer tipo disponible
    const availableType = availableRoomTypes.find(type => !usedRoomTypes.includes(type));

    // Si ya están todos los tipos, no agregar más
    if (!availableType) {
      return;
    }

    // Configurar valores por defecto según el tipo de habitación
    const roomDefaults = {
      'Sencilla': { max_adult: 1, max_minor: 0 },
      'Doble': { max_adult: 2, max_minor: 2 },
      'Triple': { max_adult: 3, max_minor: 2 }
    };

    const currentCurrency = seasonCurrencies[seasonIndex] || 'MXN';

    const newPrice: ProductPriceInput = {
      currency: currentCurrency,
      price: 0,
      room_name: availableType,
      max_adult: roomDefaults[availableType as keyof typeof roomDefaults].max_adult,
      max_minor: roomDefaults[availableType as keyof typeof roomDefaults].max_minor,
      children: []
    };

    updated[seasonIndex] = {
      ...updated[seasonIndex],
      prices: [...existingPrices, newPrice]
    };
    onChange(updated);
  };

  const removePriceOption = (seasonIndex: number, priceIndex: number) => {
    const updated = [...seasons];
    const removedPrice = updated[seasonIndex].prices?.[priceIndex];
    const prices = (updated[seasonIndex].prices || []).filter((_, i) => i !== priceIndex);

    // También eliminar el precio extra correspondiente
    let extraPrices = updated[seasonIndex].extra_prices;
    if (removedPrice && extraPrices) {
      extraPrices = extraPrices.filter(ep => ep.room_name !== removedPrice.room_name);
    }

    updated[seasonIndex] = {
      ...updated[seasonIndex],
      prices,
      extra_prices: extraPrices
    };
    onChange(updated);
  };

  const updateChildRange = (
    seasonIndex: number,
    priceIndex: number,
    childIndex: number,
    field: keyof ChildRangeInput,
    value: ChildRangeInput[keyof ChildRangeInput]
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
      name: 'Menor',
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateSeason(seasonIndex);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1"
                  title="Duplicar temporada"
                >
                  📋 Duplicar
                </button>
                {seasons.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSeason(seasonIndex);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1"
                  >
                    🗑️ Eliminar
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría de la Temporada
                  </label>
                  <div className="space-y-3">
                    {/* Star Rating Selector - Mobile First */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-1">
                      {[3, 4, 5].map((stars) => {
                        const isSelected =
                          (stars === 3 && season.category === 'Primera') ||
                          (stars === 4 && season.category === 'Primera superior') ||
                          (stars === 5 && season.category === 'Lujo');

                        return (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => {
                              const categoryMap = {
                                3: 'Primera',
                                4: 'Primera superior',
                                5: 'Lujo'
                              };
                              updateSeason(seasonIndex, 'category', categoryMap[stars as 3 | 4 | 5]);
                            }}
                            className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-3 sm:py-2 rounded-lg border transition-all text-center sm:text-left ${
                              isSelected
                                ? 'bg-purple-100 border-purple-500 text-purple-700'
                                : 'bg-white border-gray-300 text-gray-600 hover:border-purple-300 hover:bg-purple-50 active:bg-purple-50'
                            }`}
                          >
                            <div className="flex">
                              {Array.from({ length: stars }, (_, i) => (
                                <span key={i} className="text-yellow-400 text-base sm:text-lg">⭐</span>
                              ))}
                            </div>
                            <span className="text-sm sm:text-sm font-medium">
                              {stars === 3 && 'Primera'}
                              {stars === 4 && 'Primera superior'}
                              {stars === 5 && 'Lujo'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected category display */}
                    {season.category && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                        <strong>Categoría seleccionada:</strong> {season.category}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cupos Totales
                  </label>
                  <input
                    type="number"
                    value={season.allotment || ''}
                    onChange={(e) => updateSeason(seasonIndex, 'allotment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    placeholder="Ej: 90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={season.start_date || ''}
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
                    value={season.end_date || ''}
                    onChange={(e) => updateSeason(seasonIndex, 'end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Noches
                  </label>
                  <input
                    type="number"
                    value={season.number_of_nights || ''}
                    onChange={(e) => updateSeason(seasonIndex, 'number_of_nights', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    max="30"
                    placeholder="Ej: 3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horarios y Frecuencias
                </label>
                <textarea
                  value={season.schedules || ''}
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
                  value={season.aditional_services || ''}
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

                  <div className="flex items-center gap-3">
                    {/* Currency Selector */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Moneda:</label>
                      <select
                        value={seasonCurrencies[seasonIndex] || 'MXN'}
                        onChange={(e) => updateSeasonCurrency(seasonIndex, e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="MXN">MXN</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>

                    {/* Add Price Button */}
                    {(season.prices || []).length < 3 ? (
                      <button
                        type="button"
                        onClick={() => addPriceOption(seasonIndex)}
                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                      >
                        + Agregar Precio
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500 italic">
                        Máximo alcanzado
                      </span>
                    )}
                  </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tipo de Habitación
                        </label>
                        <input
                          type="text"
                          value={price.room_name || ''}
                          readOnly
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed"
                          title="Los tipos de habitación son fijos: Sencilla, Doble o Triple"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Precio por Persona ({seasonCurrencies[seasonIndex] || 'MXN'})
                        </label>
                        <input
                          type="number"
                          value={price.price || ''}
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
                          value={price.max_adult || ''}
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
                          value={price.max_minor || ''}
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
                          <div key={childIndex} className="space-y-2 mb-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Nombre del Rango</label>
                                <input
                                  type="text"
                                  value={child.name || ''}
                                  onChange={(e) => updateChildRange(seasonIndex, priceIndex, childIndex, 'name', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                  placeholder="Ej: Menor, Bebé"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Edad Mínima</label>
                                <input
                                  type="number"
                                  value={child.min_minor_age !== undefined && child.min_minor_age !== null ? child.min_minor_age : ''}
                                  onChange={(e) => updateChildRange(seasonIndex, priceIndex, childIndex, 'min_minor_age', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                  placeholder="0"
                                  min="0"
                                  max="17"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Edad Máxima</label>
                                <input
                                  type="number"
                                  value={child.max_minor_age !== undefined && child.max_minor_age !== null ? child.max_minor_age : ''}
                                  onChange={(e) => updateChildRange(seasonIndex, priceIndex, childIndex, 'max_minor_age', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                  placeholder="12"
                                  min="0"
                                  max="17"
                                />
                              </div>
                              <div className="flex items-end gap-1">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-600 mb-1">Precio ({seasonCurrencies[seasonIndex] || 'MXN'})</label>
                                  <input
                                    type="number"
                                    value={child.child_price || ''}
                                    onChange={(e) => updateChildRange(seasonIndex, priceIndex, childIndex, 'child_price', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeChildRange(seasonIndex, priceIndex, childIndex)}
                                  className="p-1 text-red-600 hover:text-red-700"
                                  title="Eliminar rango"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Extra Nights Pricing Section */}
              {(season.prices || []).length > 0 && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h5 className="text-lg font-medium text-gray-900 mb-4">Precios por Noche Extra</h5>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      💡 Define el costo adicional por noche extra para cada tipo de habitación
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(season.prices || []).map((price, priceIndex) => (
                      <div key={priceIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                        <h6 className="font-medium text-gray-800 mb-2">{price.room_name}</h6>
                        <label className="block text-sm text-gray-600 mb-1">
                          Precio por noche extra ({seasonCurrencies[seasonIndex] || 'MXN'})
                        </label>
                        <input
                          type="number"
                          value={
                            season.extra_prices?.find(ep => ep.room_name === price.room_name)?.price || 0
                          }
                          onChange={(e) => {
                            const extraPrice = parseFloat(e.target.value) || 0;
                            const updatedSeason = { ...season };

                            // Inicializar extra_prices si no existe
                            if (!updatedSeason.extra_prices) {
                              updatedSeason.extra_prices = [];
                            }

                            // Buscar si ya existe un precio extra para este room_name
                            const existingIndex = updatedSeason.extra_prices.findIndex(
                              ep => ep.room_name === price.room_name
                            );

                            if (existingIndex >= 0) {
                              // Actualizar precio existente
                              updatedSeason.extra_prices[existingIndex] = {
                                ...updatedSeason.extra_prices[existingIndex],
                                price: extraPrice
                              };
                            } else {
                              // Crear nuevo precio extra
                              updatedSeason.extra_prices.push({
                                currency: seasonCurrencies[seasonIndex] || 'MXN',
                                price: extraPrice,
                                room_name: price.room_name,
                                max_adult: price.max_adult,
                                max_minor: price.max_minor,
                                children: []
                              });
                            }

                            const updatedSeasons = [...seasons];
                            updatedSeasons[seasonIndex] = updatedSeason;
                            onChange(updatedSeasons);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
