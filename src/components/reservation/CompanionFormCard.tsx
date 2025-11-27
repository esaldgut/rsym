'use client';

/**
 * Companion Form Card Component
 *
 * Individual form card for editing a single companion's data
 *
 * Features:
 * - Real-time validation with error messages
 * - Auto-classification by age (adult/kid/baby)
 * - Country-specific passport format hints
 * - Gender and country selects
 * - Birthday date picker
 */

import { useFormContext, Controller } from 'react-hook-form';
import {
  getPassportHint,
  getCountryName,
  getGenderLabel,
  getCompanionTypeLabel,
  GENDER_OPTIONS,
  COUNTRY_CODES,
  type Companion
} from '@/lib/validations/companion-schemas';

interface CompanionFormCardProps {
  index: number;
  reservation: {
    adults: number;
    kids: number;
    babys: number;
  };
}

export default function CompanionFormCard({ index, reservation }: CompanionFormCardProps) {
  const {
    register,
    control,
    watch,
    formState: { errors }
  } = useFormContext<{ companions: Companion[] }>();

  // Watch current companion's data
  const currentCompanion = watch(`companions.${index}`);
  const selectedCountry = currentCompanion?.country || 'MX';
  const selectedBirthday = currentCompanion?.birthday || '';

  // Get companion type label if birthday is set
  const companionTypeLabel = selectedBirthday
    ? getCompanionTypeLabel(selectedBirthday)
    : null;

  // Get errors for this companion
  const companionErrors = errors.companions?.[index];

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Viajero #{index + 1}
          </h3>
          {companionTypeLabel && (
            <p className="text-sm text-gray-600 mt-1">
              {companionTypeLabel}
            </p>
          )}
        </div>

        {/* Validation Status */}
        {!companionErrors && currentCompanion?.name && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Completo</span>
          </div>
        )}
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label htmlFor={`companions.${index}.name`} className="block text-sm font-medium text-gray-700 mb-1">
            Nombre(s) <span className="text-red-500">*</span>
          </label>
          <input
            {...register(`companions.${index}.name`)}
            type="text"
            id={`companions.${index}.name`}
            placeholder="Juan Carlos"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              companionErrors?.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {companionErrors?.name && (
            <p className="text-red-600 text-xs mt-1">{companionErrors.name.message}</p>
          )}
        </div>

        {/* Family Name */}
        <div>
          <label htmlFor={`companions.${index}.family_name`} className="block text-sm font-medium text-gray-700 mb-1">
            Apellido(s) <span className="text-red-500">*</span>
          </label>
          <input
            {...register(`companions.${index}.family_name`)}
            type="text"
            id={`companions.${index}.family_name`}
            placeholder="Pérez García"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              companionErrors?.family_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {companionErrors?.family_name && (
            <p className="text-red-600 text-xs mt-1">{companionErrors.family_name.message}</p>
          )}
        </div>

        {/* Birthday */}
        <div>
          <label htmlFor={`companions.${index}.birthday`} className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Nacimiento <span className="text-red-500">*</span>
          </label>
          <input
            {...register(`companions.${index}.birthday`)}
            type="date"
            id={`companions.${index}.birthday`}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              companionErrors?.birthday ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {companionErrors?.birthday && (
            <p className="text-red-600 text-xs mt-1">{companionErrors.birthday.message}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label htmlFor={`companions.${index}.gender`} className="block text-sm font-medium text-gray-700 mb-1">
            Género <span className="text-red-500">*</span>
          </label>
          <Controller
            name={`companions.${index}.gender`}
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id={`companions.${index}.gender`}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  companionErrors?.gender ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {getGenderLabel(option)}
                  </option>
                ))}
              </select>
            )}
          />
          {companionErrors?.gender && (
            <p className="text-red-600 text-xs mt-1">{companionErrors.gender.message}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label htmlFor={`companions.${index}.country`} className="block text-sm font-medium text-gray-700 mb-1">
            País de Pasaporte <span className="text-red-500">*</span>
          </label>
          <Controller
            name={`companions.${index}.country`}
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id={`companions.${index}.country`}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  companionErrors?.country ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {COUNTRY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {getCountryName(code)}
                  </option>
                ))}
              </select>
            )}
          />
          {companionErrors?.country && (
            <p className="text-red-600 text-xs mt-1">{companionErrors.country.message}</p>
          )}
        </div>

        {/* Passport Number */}
        <div>
          <label htmlFor={`companions.${index}.passport_number`} className="block text-sm font-medium text-gray-700 mb-1">
            Número de Pasaporte <span className="text-red-500">*</span>
          </label>
          <input
            {...register(`companions.${index}.passport_number`)}
            type="text"
            id={`companions.${index}.passport_number`}
            placeholder="ABC123456"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase ${
              companionErrors?.passport_number ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {companionErrors?.passport_number && (
            <p className="text-red-600 text-xs mt-1">{companionErrors.passport_number.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {getPassportHint(selectedCountry)}
          </p>
        </div>
      </div>

      {/* General Error for Companion */}
      {companionErrors && !companionErrors.name && !companionErrors.family_name && !companionErrors.birthday && !companionErrors.gender && !companionErrors.country && !companionErrors.passport_number && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Por favor completa todos los campos correctamente
          </p>
        </div>
      )}
    </div>
  );
}
