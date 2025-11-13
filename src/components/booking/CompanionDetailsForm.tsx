'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * CompanionDetailsForm Component
 *
 * Collects detailed information for each adult traveler including:
 * - Full name (first and last)
 * - Birthday
 * - Gender
 * - Country
 * - Passport number (for international trips)
 * - Lead passenger designation
 *
 * Features accordion UI with validation and auto-save to localStorage.
 *
 * @example
 * ```tsx
 * <CompanionDetailsForm
 *   companions={companions}
 *   onUpdate={(updatedCompanions) => setCompanions(updatedCompanions)}
 *   totalAdults={2}
 *   productType="circuit"
 * />
 * ```
 */

export interface Companion {
  id: string;
  name: string;
  family_name: string;
  birthday: string;  // YYYY-MM-DD
  gender?: 'male' | 'female' | 'other';
  country?: string;
  passport_number?: string;
  isLeadPassenger: boolean;
}

export interface CompanionDetailsFormProps {
  companions: Companion[];
  onUpdate: (companions: Companion[]) => void;
  totalAdults: number;
  productType: 'circuit' | 'package';
}

export function CompanionDetailsForm({
  companions,
  onUpdate,
  totalAdults,
  productType
}: CompanionDetailsFormProps) {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  // Initialize companions if empty
  useEffect(() => {
    if (companions.length === 0 && totalAdults > 0) {
      const initialCompanions: Companion[] = Array.from({ length: totalAdults }, (_, i) => ({
        id: `companion-${Date.now()}-${i}`,
        name: '',
        family_name: '',
        birthday: '',
        gender: undefined,
        country: '',
        passport_number: '',
        isLeadPassenger: i === 0  // First companion is lead by default
      }));
      onUpdate(initialCompanions);
    }
  }, [totalAdults, companions.length, onUpdate]);

  // Auto-save to localStorage
  useEffect(() => {
    if (companions.length > 0) {
      localStorage.setItem('booking-companions', JSON.stringify(companions));
    }
  }, [companions]);

  // Determine if international trip (requires passport)
  const isInternational = productType === 'package';  // Assume packages are international

  // Validate a single companion
  const validateCompanion = (companion: Companion, index: number): Record<string, string> => {
    const companionErrors: Record<string, string> = {};

    if (!companion.name || companion.name.trim().length < 2) {
      companionErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!companion.family_name || companion.family_name.trim().length < 2) {
      companionErrors.family_name = 'El apellido debe tener al menos 2 caracteres';
    }

    if (!companion.birthday) {
      companionErrors.birthday = 'La fecha de nacimiento es requerida';
    } else {
      const birthDate = new Date(companion.birthday);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 18) {
        companionErrors.birthday = 'El acompañante debe ser mayor de 18 años';
      } else if (age > 120) {
        companionErrors.birthday = 'Fecha de nacimiento inválida';
      }
    }

    if (isInternational && (!companion.passport_number || companion.passport_number.trim().length < 5)) {
      companionErrors.passport_number = 'El pasaporte es requerido para viajes internacionales (mínimo 5 caracteres)';
    }

    return companionErrors;
  };

  // Check if companion is complete
  const isCompanionComplete = (companion: Companion): boolean => {
    const hasBasicInfo = companion.name.trim().length >= 2 &&
                        companion.family_name.trim().length >= 2 &&
                        companion.birthday !== '';

    if (isInternational) {
      return hasBasicInfo && companion.passport_number !== undefined && companion.passport_number.trim().length >= 5;
    }

    return hasBasicInfo;
  };

  // Update a single companion field
  const updateCompanionField = (index: number, field: keyof Companion, value: string | boolean) => {
    const updatedCompanions = [...companions];
    updatedCompanions[index] = {
      ...updatedCompanions[index],
      [field]: value
    };
    onUpdate(updatedCompanions);

    // Clear error for this field
    if (errors[index]?.[field]) {
      const newErrors = { ...errors };
      delete newErrors[index][field];
      setErrors(newErrors);
    }
  };

  // Set lead passenger (only one can be lead)
  const setLeadPassenger = (index: number) => {
    const updatedCompanions = companions.map((companion, i) => ({
      ...companion,
      isLeadPassenger: i === index
    }));
    onUpdate(updatedCompanions);
  };

  // Toggle accordion
  const toggleAccordion = (index: number) => {
    // Validate current before closing
    if (expandedIndex !== null && expandedIndex !== index) {
      const companionErrors = validateCompanion(companions[expandedIndex], expandedIndex);
      if (Object.keys(companionErrors).length > 0) {
        setErrors({ ...errors, [expandedIndex]: companionErrors });
        return; // Don't close if has errors
      }
    }

    setExpandedIndex(expandedIndex === index ? -1 : index);
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Información de Acompañantes
        </h3>
        <p className="text-sm text-gray-600">
          Por favor completa la información de todos los adultos que viajarán.
          {isInternational && (
            <span className="block mt-1 text-amber-700 font-medium">
              ✈️ Viaje internacional - Se requiere información de pasaporte
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {companions.map((companion, index) => {
          const isExpanded = expandedIndex === index;
          const isComplete = isCompanionComplete(companion);
          const hasErrors = errors[index] && Object.keys(errors[index]).length > 0;

          return (
            <div
              key={companion.id}
              className={cn(
                "border-2 rounded-2xl overflow-hidden transition-all duration-300",
                isExpanded ? "border-pink-500 shadow-lg" : "border-gray-200",
                hasErrors && !isExpanded ? "border-red-300" : ""
              )}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleAccordion(index)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white",
                    companion.isLeadPassenger
                      ? "bg-gradient-to-r from-pink-500 to-purple-600"
                      : "bg-gray-400"
                  )}>
                    {index + 1}
                  </div>

                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">
                      {companion.isLeadPassenger && (
                        <span className="text-pink-600 mr-2">★</span>
                      )}
                      Acompañante {index + 1}
                      {companion.isLeadPassenger && (
                        <span className="text-sm text-pink-600 ml-2">(Pasajero principal)</span>
                      )}
                    </h4>

                    {!isExpanded && (
                      <p className="text-sm text-gray-600">
                        {isComplete ? (
                          <>
                            {companion.name} {companion.family_name}
                            {companion.birthday && ` (${new Date(companion.birthday).toLocaleDateString('es-MX')})`}
                          </>
                        ) : (
                          <span className="text-amber-600">Información incompleta</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isExpanded && isComplete && (
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}

                  {!isExpanded && hasErrors && (
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}

                  <svg
                    className={cn(
                      "w-6 h-6 text-gray-400 transition-transform duration-300",
                      isExpanded ? "transform rotate-180" : ""
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label htmlFor={`name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        id={`name-${index}`}
                        type="text"
                        value={companion.name}
                        onChange={(e) => updateCompanionField(index, 'name', e.target.value)}
                        className={cn(
                          "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent",
                          errors[index]?.name ? "border-red-500" : "border-gray-300"
                        )}
                        placeholder="Juan"
                      />
                      {errors[index]?.name && (
                        <p className="text-xs text-red-600 mt-1">{errors[index].name}</p>
                      )}
                    </div>

                    {/* Family Name */}
                    <div>
                      <label htmlFor={`family_name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido *
                      </label>
                      <input
                        id={`family_name-${index}`}
                        type="text"
                        value={companion.family_name}
                        onChange={(e) => updateCompanionField(index, 'family_name', e.target.value)}
                        className={cn(
                          "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent",
                          errors[index]?.family_name ? "border-red-500" : "border-gray-300"
                        )}
                        placeholder="Pérez"
                      />
                      {errors[index]?.family_name && (
                        <p className="text-xs text-red-600 mt-1">{errors[index].family_name}</p>
                      )}
                    </div>

                    {/* Birthday */}
                    <div>
                      <label htmlFor={`birthday-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de nacimiento *
                      </label>
                      <input
                        id={`birthday-${index}`}
                        type="date"
                        value={companion.birthday}
                        onChange={(e) => updateCompanionField(index, 'birthday', e.target.value)}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        className={cn(
                          "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent",
                          errors[index]?.birthday ? "border-red-500" : "border-gray-300"
                        )}
                      />
                      {errors[index]?.birthday && (
                        <p className="text-xs text-red-600 mt-1">{errors[index].birthday}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Género (opcional)
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`gender-${index}`}
                            checked={companion.gender === 'male'}
                            onChange={() => updateCompanionField(index, 'gender', 'male')}
                            className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Masculino</span>
                        </label>

                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`gender-${index}`}
                            checked={companion.gender === 'female'}
                            onChange={() => updateCompanionField(index, 'gender', 'female')}
                            className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Femenino</span>
                        </label>

                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`gender-${index}`}
                            checked={companion.gender === 'other'}
                            onChange={() => updateCompanionField(index, 'gender', 'other')}
                            className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Otro</span>
                        </label>
                      </div>
                    </div>

                    {/* Country */}
                    <div>
                      <label htmlFor={`country-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        País (opcional)
                      </label>
                      <input
                        id={`country-${index}`}
                        type="text"
                        value={companion.country || ''}
                        onChange={(e) => updateCompanionField(index, 'country', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="México"
                      />
                    </div>

                    {/* Passport (conditional) */}
                    {isInternational && (
                      <div>
                        <label htmlFor={`passport-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Número de pasaporte *
                        </label>
                        <input
                          id={`passport-${index}`}
                          type="text"
                          value={companion.passport_number || ''}
                          onChange={(e) => updateCompanionField(index, 'passport_number', e.target.value.toUpperCase())}
                          className={cn(
                            "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent uppercase",
                            errors[index]?.passport_number ? "border-red-500" : "border-gray-300"
                          )}
                          placeholder="M12345678"
                        />
                        {errors[index]?.passport_number && (
                          <p className="text-xs text-red-600 mt-1">{errors[index].passport_number}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lead Passenger Selector */}
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={companion.isLeadPassenger}
                        onChange={() => setLeadPassenger(index)}
                        className="w-5 h-5 text-pink-600 focus:ring-pink-500 rounded"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        ★ Designar como pasajero principal
                      </span>
                    </label>
                    <p className="text-xs text-gray-600 mt-1 ml-8">
                      El pasajero principal recibirá todas las comunicaciones y confirmaciones del viaje.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium">
              Progreso: {companions.filter(isCompanionComplete).length} de {totalAdults} completados
            </p>
            <p className="text-xs text-blue-800 mt-1">
              La información se guarda automáticamente mientras completas el formulario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
