'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * ItineraryCard Component
 *
 * Displays product itinerary in a visual timeline format with expandable days.
 */

export interface ItineraryCardProps {
  itinerary: string;
  productType: 'circuit' | 'package';
}

interface DayActivity {
  day: number;
  title: string;
  activities: string[];
}

export function ItineraryCard({ itinerary, productType }: ItineraryCardProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  const parseItinerary = (): DayActivity[] => {
    if (!itinerary || itinerary.trim() === '') return [];

    const days: DayActivity[] = [];
    const lines = itinerary.split('\n').filter(line => line.trim() !== '');
    let currentDay: DayActivity | null = null;

    for (const line of lines) {
      const dayMatch = line.match(/^(?:Día|Day)\s+(\d+)[:\s]+(.+)$/i);

      if (dayMatch) {
        if (currentDay) days.push(currentDay);
        currentDay = { day: parseInt(dayMatch[1], 10), title: dayMatch[2].trim(), activities: [] };
      } else if (currentDay) {
        const activity = line.trim();
        if (activity.startsWith('-') || activity.startsWith('•')) {
          currentDay.activities.push(activity.substring(1).trim());
        } else if (activity.length > 0) {
          currentDay.activities.push(activity);
        }
      }
    }

    if (currentDay) days.push(currentDay);
    return days;
  };

  const parsedDays = parseItinerary();

  const getActivityIcon = (activity: string): string => {
    const lower = activity.toLowerCase();
    if (lower.includes('hotel')) return '🏨';
    if (lower.includes('comida') || lower.includes('desayuno')) return '🍽️';
    if (lower.includes('transfer') || lower.includes('transporte')) return '🚌';
    if (lower.includes('vuelo') || lower.includes('aeropuerto')) return '✈️';
    if (lower.includes('playa')) return '🏖️';
    if (lower.includes('museo') || lower.includes('tour')) return '🎫';
    return '📍';
  };

  const toggleDay = (day: number) => {
    const newExpanded = new Set(expandedDays);
    newExpanded.has(day) ? newExpanded.delete(day) : newExpanded.add(day);
    setExpandedDays(newExpanded);
  };

  if (parsedDays.length === 0) {
    return <div className="text-center py-8 text-gray-500">No hay itinerario disponible</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-500 to-purple-600" />
        <div className="space-y-4">
          {parsedDays.map((day, index) => {
            const isExpanded = expandedDays.has(day.day);
            return (
              <div key={day.day} className="relative pl-16 pb-4">
                <div className="absolute left-0 top-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {day.day}
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => toggleDay(day.day)} className="w-full text-left group">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-pink-600">
                        📅 Día {day.day}: {day.title}
                      </h4>
                      <svg className={cn("w-6 h-6 text-gray-400 transition-transform", isExpanded && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {isExpanded && day.activities.length > 0 && (
                    <ul className="space-y-2 mt-3">
                      {day.activities.map((activity, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-2xl">{getActivityIcon(activity)}</span>
                          <span className="text-sm text-gray-700">{activity}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
