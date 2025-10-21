'use client';

interface Season {
  id: string;
  start_date?: string;
  end_date?: string;
  number_of_nights?: string;
  product_pricing?: number;
}

interface SeasonCardProps {
  season: Season;
  index: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function SeasonCard({ season, index, isSelected = false, onSelect }: SeasonCardProps) {
  // Format dates for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Format price
  const formatPrice = (price?: number) => {
    if (!price) return 'Consultar';
    return `$${price.toLocaleString('es-MX')} MXN`;
  };

  // Calculate if season is currently active
  const isCurrentSeason = () => {
    if (!season.start_date || !season.end_date) return false;
    const now = new Date();
    const start = new Date(season.start_date);
    const end = new Date(season.end_date);
    return now >= start && now <= end;
  };

  const isCurrent = isCurrentSeason();

  return (
    <div
      onClick={onSelect}
      className={`flex-shrink-0 w-80 h-full transition-all duration-300 ${
        onSelect ? 'cursor-pointer' : ''
      } ${isSelected ? 'scale-105' : 'hover:scale-105'}`}
    >
      <div
        className={`relative h-full rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
          isSelected
            ? 'shadow-2xl ring-4 ring-pink-500'
            : 'shadow-lg hover:shadow-2xl'
        }`}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700" />

        {/* Overlay pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id={`pattern-${season.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#pattern-${season.id})`} />
          </svg>
        </div>

        {/* Content */}
        <div className="relative h-full p-6 flex flex-col text-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold">{index + 1}</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider opacity-90">
                  Temporada
                </h3>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-400 text-green-900 px-2 py-0.5 rounded-full mt-1 font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Activa
                  </span>
                )}
              </div>
            </div>

            {/* Price badge */}
            <div className="bg-white/95 backdrop-blur-sm text-purple-900 px-4 py-2 rounded-xl shadow-lg">
              <div className="text-xs font-medium opacity-70 uppercase tracking-wide">Desde</div>
              <div className="text-lg font-bold leading-tight">
                {season.product_pricing
                  ? `$${season.product_pricing.toLocaleString()}`
                  : 'Consultar'
                }
              </div>
            </div>
          </div>

          {/* Dates section */}
          <div className="flex-1 space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold uppercase tracking-wide">Fechas</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-80">Inicio:</span>
                  <span className="font-semibold">{formatDate(season.start_date)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-80">Fin:</span>
                  <span className="font-semibold">{formatDate(season.end_date)}</span>
                </div>
              </div>
            </div>

            {/* Duration */}
            {season.number_of_nights && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold uppercase tracking-wide">Duración</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{season.number_of_nights}</span>
                  <span className="text-sm opacity-80">noche{parseInt(season.number_of_nights) !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer with selection indicator */}
          {onSelect && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className={`flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
              }`}>
                {isSelected ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Temporada seleccionada
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Clic para seleccionar
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
        </div>
      </div>
    </div>
  );
}
