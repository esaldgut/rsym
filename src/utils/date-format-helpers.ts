/**
 * Utilidades para manejo de formatos de fecha entre Cognito y formularios HTML
 * Cognito almacena birthdate como DD/MM/YYYY
 * HTML input[type="date"] requiere YYYY-MM-DD
 */

/**
 * Convierte fecha de formato Cognito (DD/MM/YYYY) a formato HTML (YYYY-MM-DD)
 */
export function cognitoDateToHTML(cognitoDate: string | null | undefined): string {
  if (!cognitoDate) return '';

  // Verificar si ya está en formato HTML (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cognitoDate)) {
    return cognitoDate;
  }

  // Convertir de DD/MM/YYYY a YYYY-MM-DD
  const parts = cognitoDate.split('/');
  if (parts.length !== 3) {
    console.warn('Formato de fecha inválido:', cognitoDate);
    return '';
  }

  const [day, month, year] = parts;

  // Validar componentes
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
    console.warn('Fecha contiene valores no numéricos:', cognitoDate);
    return '';
  }

  // Validar rangos
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    console.warn('Fecha fuera de rango válido:', cognitoDate);
    return '';
  }

  // Formatear con padding de ceros
  const formattedDay = day.padStart(2, '0');
  const formattedMonth = month.padStart(2, '0');
  const formattedYear = year.padStart(4, '0');

  return `${formattedYear}-${formattedMonth}-${formattedDay}`;
}

/**
 * Convierte fecha de formato HTML (YYYY-MM-DD) a formato Cognito (DD/MM/YYYY)
 */
export function htmlDateToCognito(htmlDate: string | null | undefined): string {
  if (!htmlDate) return '';

  // Verificar si ya está en formato Cognito (DD/MM/YYYY)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(htmlDate)) {
    return htmlDate;
  }

  // Convertir de YYYY-MM-DD a DD/MM/YYYY
  const parts = htmlDate.split('-');
  if (parts.length !== 3) {
    console.warn('Formato de fecha HTML inválido:', htmlDate);
    return '';
  }

  const [year, month, day] = parts;

  // Validar componentes
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
    console.warn('Fecha HTML contiene valores no numéricos:', htmlDate);
    return '';
  }

  // Validar rangos
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    console.warn('Fecha HTML fuera de rango válido:', htmlDate);
    return '';
  }

  // Formatear con padding de ceros
  const formattedDay = day.padStart(2, '0');
  const formattedMonth = month.padStart(2, '0');

  return `${formattedDay}/${formattedMonth}/${year}`;
}

/**
 * Valida si una fecha está en formato Cognito (DD/MM/YYYY)
 */
export function isCognitoDateFormat(date: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(date);
}

/**
 * Valida si una fecha está en formato HTML (YYYY-MM-DD)
 */
export function isHTMLDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * Obtiene la edad a partir de una fecha de nacimiento
 */
export function calculateAge(birthdate: string): number | null {
  if (!birthdate) return null;

  let dateObj: Date;

  if (isCognitoDateFormat(birthdate)) {
    const [day, month, year] = birthdate.split('/');
    dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else if (isHTMLDateFormat(birthdate)) {
    dateObj = new Date(birthdate);
  } else {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dateObj.getFullYear();
  const monthDiff = today.getMonth() - dateObj.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
    age--;
  }

  return age;
}

/**
 * Formatea una fecha para mostrar al usuario (DD de Mes de YYYY)
 */
export function formatDateForDisplay(date: string): string {
  if (!date) return '';

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  let day, month, year;

  if (isCognitoDateFormat(date)) {
    [day, month, year] = date.split('/');
  } else if (isHTMLDateFormat(date)) {
    [year, month, day] = date.split('-');
  } else {
    return date;
  }

  const monthNum = parseInt(month, 10) - 1;
  const monthName = months[monthNum] || month;

  return `${parseInt(day, 10)} de ${monthName} de ${year}`;
}