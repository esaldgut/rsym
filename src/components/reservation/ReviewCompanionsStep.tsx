'use client';

/**
 * Review Companions Step Component
 *
 * Preview of all companion data before saving
 *
 * Features:
 * - Summary cards for each companion
 * - Age-based classification display
 * - Formatted data display
 * - Change summary (if editing existing data)
 */

import {
  getCountryName,
  getGenderLabel,
  getCompanionTypeLabel,
  type Companion
} from '@/lib/validations/companion-schemas';

interface ReviewCompanionsStepProps {
  companions: Companion[];
  reservation: {
    id: string;
    adults: number;
    kids: number;
    babys: number;
  };
}

export default function ReviewCompanionsStep({
  companions,
  reservation
}: ReviewCompanionsStepProps) {
  // Group companions by type
  const adults = companions.filter(c => {
    const age = calculateAge(c.birthday);
    return age >= 18;
  });

  const kids = companions.filter(c => {
    const age = calculateAge(c.birthday);
    return age >= 2 && age < 18;
  });

  const babys = companions.filter(c => {
    const age = calculateAge(c.birthday);
    return age < 2;
  });

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">
              Revisa la información antes de guardar
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Asegúrate de que todos los datos sean correctos, especialmente los números de pasaporte.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{adults.length}</div>
          <div className="text-sm text-blue-800 mt-1">Adulto{adults.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{kids.length}</div>
          <div className="text-sm text-purple-800 mt-1">Niño{kids.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="bg-pink-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-pink-600">{babys.length}</div>
          <div className="text-sm text-pink-800 mt-1">Bebé{babys.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Companions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Información de Viajeros
        </h3>

        {companions.map((companion, index) => (
          <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {companion.name.charAt(0)}{companion.family_name.charAt(0)}
                </div>

                {/* Name and Type */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {companion.name} {companion.family_name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {getCompanionTypeLabel(companion.birthday)}
                  </p>
                </div>
              </div>

              {/* Checkmark */}
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Details Grid */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {/* Birthday */}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Fecha de Nacimiento
                </dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {formatBirthday(companion.birthday)}
                </dd>
              </div>

              {/* Gender */}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Género
                </dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {getGenderLabel(companion.gender)}
                </dd>
              </div>

              {/* Country */}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  País de Pasaporte
                </dt>
                <dd className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                  <span className="text-lg">{getFlagEmoji(companion.country)}</span>
                  {getCountryName(companion.country)}
                </dd>
              </div>

              {/* Passport */}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Número de Pasaporte
                </dt>
                <dd className="text-sm text-gray-900 mt-1 font-mono font-semibold">
                  {companion.passport_number}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* Confirmation Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-900">
              ¡Todos los datos están completos!
            </p>
            <p className="text-xs text-green-700 mt-1">
              Haz clic en "Guardar Cambios" para actualizar la información de los viajeros.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper Functions
 */

function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

function formatBirthday(birthday: string): string {
  try {
    const date = new Date(birthday);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return birthday;
  }
}

function getFlagEmoji(countryCode: string): string {
  // Convert country code to flag emoji
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
