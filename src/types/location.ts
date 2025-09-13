/**
 * Tipos para AWS Location Service alineados con GraphQL Schema oficial YAAN
 */

// Tipo Point según GraphQL schema oficial
export interface Point {
  longitude: number;
  latitude: number;
}

// Tipo Location según GraphQL schema oficial (líneas 181-187)
export interface Location {
  id?: string;
  place: string;
  placeSub?: string;
  complementary_description?: string;
  coordinates?: Point;
}

// Input Location según GraphQL schema oficial (líneas 189-194)  
export interface LocationInput {
  place: string;
  placeSub?: string;
  complementary_description?: string;
  coordinates?: PointInput;
}

// Input Point según GraphQL schema oficial (líneas 328-331)
export interface PointInput {
  longitude?: number;
  latitude?: number;
}

// Tipo legacy para compatibilidad con AWS Location Service
// NOTA: Este tipo NO está en el GraphQL schema oficial
export interface CircuitLocation {
  id?: string;
  place: string;
  placeSub?: string;
  complementaryDescription?: string;
  coordinates: [number, number]; // [longitude, latitude] format para AWS SDK
  amazon_location_service_response: string; // JSON stringified response
}

// Respuesta de AWS Location Service
export interface AWSLocationPlace {
  PlaceId?: string;
  Label?: string;
  Geometry?: {
    Point?: [number, number];
  };
  Address?: {
    Label?: string;
    Country?: string;
    Region?: string;
    SubRegion?: string;
    Municipality?: string;
    District?: string;
    PostalCode?: string;
    Street?: string;
    StreetComponents?: Array<{
      BaseName?: string;
      Type?: string;
      TypePlacement?: string;
      TypeSeparator?: string;
      Prefix?: string;
      Suffix?: string;
      Direction?: string;
      Language?: string;
    }>;
  };
  AddressNumber?: string;
  Categories?: string[];
  FoodTypes?: string[];
  AccessPoints?: Array<{
    Position?: [number, number];
  }>;
  TimeZone?: {
    Name?: string;
    Offset?: number;
  };
  PhoneNumber?: string;
  WebsiteUrl?: string;
  OpeningHours?: Array<{
    Display?: string;
    OpenNow?: boolean;
    Components?: Array<{
      OpeningTime?: string;
      ClosingTime?: string;
      Recurrence?: string;
    }>;
  }>;
}

// Resultado de búsqueda
export interface SearchResult {
  Place?: AWSLocationPlace;
  PlaceId?: string;
  Text?: string;
  Relevance?: number;
  Distance?: number;
}

// Respuesta de búsqueda
export interface SearchResponse {
  Results?: SearchResult[];
  Summary?: {
    Text?: string;
    BiasPosition?: [number, number];
    FilterBBox?: [number, number, number, number];
    FilterCountries?: string[];
    MaxResults?: number;
    ResultBBox?: [number, number, number, number];
    DataSource?: string;
  };
}

// Opciones de búsqueda
export interface SearchOptions {
  maxResults?: number;
  countries?: string[];
  biasPosition?: [number, number];
  filterBBox?: [number, number, number, number];
  language?: string;
  categories?: string[];
  timeZone?: boolean;
}

// Respuesta del Server Action
export interface LocationActionResponse {
  success: boolean;
  locations?: CircuitLocation[];
  error?: string;
  rawResponse?: string; // Para debugging
}

// Contexto de selección de ubicación
export interface LocationSelectionContext {
  selectedLocation: CircuitLocation | null;
  searchHistory: CircuitLocation[];
  isSearching: boolean;
}