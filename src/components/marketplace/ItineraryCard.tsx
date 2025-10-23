'use client';

interface ItineraryCardProps {
  itinerary: string;
  productType: string;
}

export function ItineraryCard({ itinerary, productType }: ItineraryCardProps) {
  // Parsear el itinerario buscando patrones como "Día 1:", "Día 2:", etc.
  const parseItinerary = (text: string): Array<{ day: number; title?: string; content: string }> => {
    const dayPattern = /Día\s+(\d+):?\s*([^\n]*)/gi;
    const matches = [...text.matchAll(dayPattern)];

    if (matches.length === 0) {
      // Si no hay formato estructurado, devolver todo el texto como un solo bloque
      return [{ day: 0, content: text }];
    }

    const days: Array<{ day: number; title?: string; content: string }> = [];

    matches.forEach((match, index) => {
      const dayNumber = parseInt(match[1]);
      const dayTitle = match[2]?.trim() || '';
      const startIndex = match.index! + match[0].length;
      const endIndex = index < matches.length - 1 ? matches[index + 1].index! : text.length;
      const content = text.slice(startIndex, endIndex).trim();

      days.push({
        day: dayNumber,
        title: dayTitle,
        content
      });
    });

    return days;
  };

  const days = parseItinerary(itinerary);
  const hasStructuredFormat = days.length > 1 || days[0].day !== 0;

  // Gradientes por día
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-rose-500',
    'from-cyan-500 to-blue-500',
    'from-rose-500 to-orange-500',
    'from-orange-500 to-yellow-500',
  ];

  // Si no tiene formato estructurado, mostrar como antes
  if (!hasStructuredFormat) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
        <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed text-base">
          {itinerary}
        </pre>
      </div>
    );
  }

  // Renderizar con timeline vertical
  return (
    <div className="relative">
      {/* Línea vertical conectora */}
      {days.length > 1 && (
        <div className="absolute left-5 top-10 bottom-10 w-0.5 bg-gradient-to-b from-purple-300 via-pink-300 to-purple-300" />
      )}

      {/* Items del timeline */}
      <div className="space-y-6">
        {days.map((day, index) => (
          <div key={index} className="relative pl-14">
            {/* Número del día circular */}
            <div className={`absolute left-0 w-10 h-10 bg-gradient-to-br ${gradients[index % gradients.length]} rounded-full flex items-center justify-center z-10 shadow-lg`}>
              <span className="text-white font-bold text-lg">{day.day}</span>
            </div>

            {/* Card del día */}
            <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              {day.title && (
                <h3 className="font-bold text-gray-900 mb-3 text-lg">
                  Día {day.day} - {day.title}
                </h3>
              )}
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {day.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
