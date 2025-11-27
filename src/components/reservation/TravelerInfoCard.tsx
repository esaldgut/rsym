'use client';

import { useState } from 'react';

/**
 * Traveler Info Card Component
 *
 * Displays traveler information including:
 * - Total count (adults, kids, babys)
 * - Companions list with details (read-only in Sprint 1)
 * - Data completeness indicator
 * - Future: Edit functionality
 *
 * Part of Sprint 1: Fundamentos del Detalle de Viaje
 */

interface Companion {
  name: string;
  family_name: string;
  birthday: string;
  country: string;
  gender: string;
  passport_number: string;
}

interface ReservationData {
  id: string;
  adults: number;
  kids: number;
  babys: number;
  companions?: Companion[];
}

interface TravelerInfoCardProps {
  reservation: ReservationData;
  onEdit?: () => void; // For future Sprint 2 implementation
}

export default function TravelerInfoCard({ reservation, onEdit }: TravelerInfoCardProps) {
  const [expandedCompanion, setExpandedCompanion] = useState<number | null>(null);

  // Calculate totals
  const totalTravelers = reservation.adults + reservation.kids + reservation.babys;
  const hasCompanionsData = reservation.companions && reservation.companions.length > 0;
  const completedCompanions = reservation.companions?.length || 0;
  const completenessPercentage = (completedCompanions / totalTravelers) * 100;

  // Format date
  const formatBirthday = (birthday: string): string => {
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
  };

  // Calculate age
  const calculateAge = (birthday: string): number => {
    try {
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age;
    } catch {
      return 0;
    }
  };

  // Get gender label
  const getGenderLabel = (gender: string): string => {
    const genderMap: Record<string, string> = {
      male: 'Masculino',
      female: 'Femenino',
      other: 'Otro'
    };
    return genderMap[gender.toLowerCase()] || gender;
  };

  // Get completeness color
  const getCompletenessColor = (): string => {
    if (completenessPercentage === 100) return 'text-green-600';
    if (completenessPercentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Información de Viajeros</h2>
            <p className="text-sm text-gray-500 mt-1">
              {totalTravelers} viajero{totalTravelers !== 1 ? 's' : ''} en total
            </p>
          </div>

          {/* Edit Button - FASE 2 Enabled */}
          <button
            onClick={onEdit}
            disabled={!onEdit}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              onEdit
                ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
            title={onEdit ? 'Editar información de viajeros' : 'Disponible en próxima versión'}
          >
            <svg
              className="w-4 h-4 inline-block mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Editar
          </button>
        </div>

        {/* Traveler Distribution */}
        <div className="grid grid-cols-3 gap-4">
          {reservation.adults > 0 && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{reservation.adults}</div>
              <div className="text-xs text-blue-800 mt-1">
                Adulto{reservation.adults !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {reservation.kids > 0 && (
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{reservation.kids}</div>
              <div className="text-xs text-purple-800 mt-1">
                Niño{reservation.kids !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {reservation.babys > 0 && (
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-pink-600">{reservation.babys}</div>
              <div className="text-xs text-pink-800 mt-1">
                Bebé{reservation.babys !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Completeness Indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Datos completados</span>
            <span className={`text-sm font-semibold ${getCompletenessColor()}`}>
              {completedCompanions} / {totalTravelers}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                completenessPercentage === 100
                  ? 'bg-green-500'
                  : completenessPercentage >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${completenessPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Companions List */}
      <div className="p-6">
        {!hasCompanionsData ? (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <p className="text-gray-500 mb-2">Aún no se han capturado los datos de los viajeros</p>
            <p className="text-sm text-gray-400">
              La información será requerida antes de la fecha límite de pago
            </p>
          </div>
        ) : reservation.companions ? (
          <div className="space-y-3">
            {reservation.companions.map((companion, index) => {
              const isExpanded = expandedCompanion === index;
              const age = calculateAge(companion.birthday);

              return (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Companion Header - Always Visible */}
                  <button
                    onClick={() => setExpandedCompanion(isExpanded ? null : index)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {companion.name.charAt(0)}
                        {companion.family_name.charAt(0)}
                      </div>

                      {/* Name and Age */}
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {companion.name} {companion.family_name}
                        </p>
                        <p className="text-sm text-gray-500">{age} años</p>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Companion Details - Expandable */}
                  {isExpanded && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-gray-500 font-medium">Fecha de Nacimiento</dt>
                          <dd className="text-gray-900 mt-1">
                            {formatBirthday(companion.birthday)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-gray-500 font-medium">Género</dt>
                          <dd className="text-gray-900 mt-1">
                            {getGenderLabel(companion.gender)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-gray-500 font-medium">País</dt>
                          <dd className="text-gray-900 mt-1">{companion.country}</dd>
                        </div>

                        <div>
                          <dt className="text-gray-500 font-medium">Pasaporte</dt>
                          <dd className="text-gray-900 mt-1 font-mono">
                            {companion.passport_number}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Info Message */}
        {hasCompanionsData && completenessPercentage < 100 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Faltan datos de {totalTravelers - completedCompanions} viajero
                  {totalTravelers - completedCompanions !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Completa la información antes de la fecha límite de pago
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
