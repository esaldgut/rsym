/**
 * Utilidades para conversión de formatos de tiempo
 * entre ISO dates y formato HH:MM para ServiceScheduleSelector
 */

/**
 * Item de horario de servicio
 */
export interface ServiceScheduleItem {
  day: string;
  sd: string; // Start time in HH:MM format
  ed: string; // End time in HH:MM format
}

/**
 * Convierte ISO date a formato HH:MM
 * Ej: "2025-08-22T15:00:00.000Z" -> "15:00"
 */
export function isoToTimeString(isoDate: string): string {
  if (!isoDate) return '09:00'; // Default

  try {
    // Si ya está en formato HH:MM, devolverlo tal cual
    if (/^\d{2}:\d{2}$/.test(isoDate)) {
      return isoDate;
    }

    // Parsear ISO date
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
      console.warn('Fecha ISO inválida:', isoDate);
      return '09:00';
    }

    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error convirtiendo ISO a tiempo:', error);
    return '09:00';
  }
}

/**
 * Convierte formato HH:MM a ISO date
 * Usa fecha base arbitraria ya que solo importa la hora
 */
export function timeStringToISO(timeStr: string, baseDate = '2025-01-01'): string {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
    return '';
  }

  try {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date(`${baseDate}T${hours}:${minutes}:00.000Z`);

    return date.toISOString();
  } catch (error) {
    console.error('Error convirtiendo tiempo a ISO:', error);
    return '';
  }
}

/**
 * Normaliza un ServiceSchedule convirtiendo tiempos ISO a HH:MM
 */
export function normalizeServiceSchedule(schedule: ServiceScheduleItem[]): ServiceScheduleItem[] {
  if (!Array.isArray(schedule)) return [];

  return schedule.map(item => ({
    day: item.day,
    sd: isoToTimeString(item.sd),
    ed: isoToTimeString(item.ed)
  }));
}

/**
 * Prepara ServiceSchedule para guardar en Cognito (convierte a ISO)
 */
export function prepareServiceScheduleForSave(schedule: ServiceScheduleItem[]): ServiceScheduleItem[] {
  if (!Array.isArray(schedule)) return [];

  const baseDate = '2025-01-01'; // Fecha arbitraria para mantener consistencia

  return schedule.map(item => ({
    day: item.day,
    sd: timeStringToISO(item.sd, baseDate),
    ed: timeStringToISO(item.ed, baseDate)
  }));
}

/**
 * Valida que un horario sea coherente
 */
export function validateScheduleTime(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // El horario de fin debe ser después del inicio
  return endMinutes > startMinutes;
}

/**
 * Formatea tiempo para mostrar (ej: "09:00 AM")
 */
export function formatTimeDisplay(time: string): string {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return time;

  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}