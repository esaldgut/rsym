/**
 * Tab Navigation Utilities for Product Wizard
 *
 * Pure functions for managing tab navigation in ProductDetailsStep and PackageDetailsStep.
 * Extracted for testability and reuse.
 */

/**
 * Tab IDs for product wizard detail steps
 */
export type TabId = 'destination' | 'departures' | 'itinerary' | 'seasons' | 'hotels';

/**
 * Product types supported by the wizard
 */
export type ProductType = 'circuit' | 'package';

/**
 * Get the ordered list of tabs for a given product type
 *
 * @param productType - 'circuit' or 'package'
 * @returns Array of tab IDs in order
 */
export const getTabOrder = (productType: ProductType): TabId[] => {
  const baseOrder: TabId[] = ['destination', 'departures', 'itinerary', 'seasons'];
  if (productType === 'circuit') {
    baseOrder.push('hotels');
  }
  return baseOrder;
};

/**
 * Get the first tab ID (always 'destination')
 *
 * @returns The first tab ID
 */
export const getFirstTab = (): TabId => {
  return 'destination';
};

/**
 * Get the last tab ID based on product type
 *
 * @param productType - 'circuit' or 'package'
 * @returns The last tab ID
 */
export const getLastTab = (productType: ProductType): TabId => {
  return productType === 'circuit' ? 'hotels' : 'seasons';
};

/**
 * Get the next tab in the sequence
 *
 * @param currentTab - Current tab ID
 * @param productType - 'circuit' or 'package'
 * @returns Next tab ID or null if at the end
 */
export const getNextTab = (currentTab: TabId, productType: ProductType): TabId | null => {
  const tabOrder = getTabOrder(productType);
  const currentIndex = tabOrder.indexOf(currentTab);

  if (currentIndex === -1 || currentIndex >= tabOrder.length - 1) {
    return null;
  }

  return tabOrder[currentIndex + 1];
};

/**
 * Get the previous tab in the sequence
 *
 * @param currentTab - Current tab ID
 * @param productType - 'circuit' or 'package'
 * @returns Previous tab ID or null if at the beginning
 */
export const getPreviousTab = (currentTab: TabId, productType: ProductType): TabId | null => {
  const tabOrder = getTabOrder(productType);
  const currentIndex = tabOrder.indexOf(currentTab);

  if (currentIndex <= 0) {
    return null;
  }

  return tabOrder[currentIndex - 1];
};

/**
 * Check if a tab is the first tab
 *
 * @param tabId - Tab ID to check
 * @returns true if it's the first tab
 */
export const isFirstTab = (tabId: TabId): boolean => {
  return tabId === 'destination';
};

/**
 * Check if a tab is the last tab for the given product type
 *
 * @param tabId - Tab ID to check
 * @param productType - 'circuit' or 'package'
 * @returns true if it's the last tab
 */
export const isLastTab = (tabId: TabId, productType: ProductType): boolean => {
  return tabId === getLastTab(productType);
};

/**
 * Get the tab index in the sequence
 *
 * @param tabId - Tab ID
 * @param productType - 'circuit' or 'package'
 * @returns Index (0-based) or -1 if not found
 */
export const getTabIndex = (tabId: TabId, productType: ProductType): number => {
  const tabOrder = getTabOrder(productType);
  return tabOrder.indexOf(tabId);
};

/**
 * Get total number of tabs for a product type
 *
 * @param productType - 'circuit' or 'package'
 * @returns Number of tabs
 */
export const getTotalTabs = (productType: ProductType): number => {
  return getTabOrder(productType).length;
};

/**
 * Validate if a tab ID is valid for the given product type
 *
 * @param tabId - Tab ID to validate
 * @param productType - 'circuit' or 'package'
 * @returns true if valid
 */
export const isValidTab = (tabId: string, productType: ProductType): boolean => {
  const tabOrder = getTabOrder(productType);
  return tabOrder.includes(tabId as TabId);
};

/**
 * Get next tab label for button text
 *
 * @param currentTab - Current tab ID
 * @param productType - 'circuit' or 'package'
 * @returns Formatted label like "Siguiente: Itinerario →" or null
 */
export const getNextTabLabel = (currentTab: TabId, productType: ProductType): string | null => {
  const nextTab = getNextTab(currentTab, productType);
  if (!nextTab) return null;

  const labels: Record<TabId, string> = {
    destination: 'Destinos',
    departures: 'Salidas',
    itinerary: 'Itinerario',
    seasons: 'Temporadas',
    hotels: 'Hoteles',
  };

  return `Siguiente: ${labels[nextTab]} →`;
};

/**
 * Tab completion check data structure
 */
export interface TabCompletionData {
  destination?: unknown[];
  departures?: {
    regular_departures?: unknown[];
    specific_departures?: unknown[];
  };
  itinerary?: string;
  seasons?: unknown[];
  hotels?: unknown[];
}

/**
 * Check if a specific tab has been completed
 *
 * @param tabId - Tab ID to check
 * @param data - Form data to check against
 * @returns true if tab requirements are met
 */
export const checkTabCompletion = (tabId: TabId, data: TabCompletionData): boolean => {
  switch (tabId) {
    case 'destination':
      return Array.isArray(data.destination) && data.destination.length > 0;
    case 'departures':
      return !!(
        data.departures &&
        ((Array.isArray(data.departures.regular_departures) &&
          data.departures.regular_departures.length > 0) ||
          (Array.isArray(data.departures.specific_departures) &&
            data.departures.specific_departures.length > 0))
      );
    case 'itinerary':
      return typeof data.itinerary === 'string' && data.itinerary.trim().length > 0;
    case 'seasons':
      return Array.isArray(data.seasons) && data.seasons.length > 0;
    case 'hotels':
      return Array.isArray(data.hotels) && data.hotels.length > 0;
    default:
      return false;
  }
};

/**
 * Get completion status for all tabs
 *
 * @param productType - 'circuit' or 'package'
 * @param data - Form data to check against
 * @returns Record of tab IDs to completion status
 */
export const getAllTabsCompletion = (
  productType: ProductType,
  data: TabCompletionData
): Record<TabId, boolean> => {
  const tabOrder = getTabOrder(productType);
  const completion: Partial<Record<TabId, boolean>> = {};

  for (const tab of tabOrder) {
    completion[tab] = checkTabCompletion(tab, data);
  }

  return completion as Record<TabId, boolean>;
};

/**
 * Count completed tabs
 *
 * @param productType - 'circuit' or 'package'
 * @param data - Form data to check against
 * @returns Number of completed tabs
 */
export const countCompletedTabs = (productType: ProductType, data: TabCompletionData): number => {
  const completion = getAllTabsCompletion(productType, data);
  return Object.values(completion).filter(Boolean).length;
};

/**
 * Get progress percentage
 *
 * @param productType - 'circuit' or 'package'
 * @param data - Form data to check against
 * @returns Percentage (0-100)
 */
export const getTabProgressPercentage = (
  productType: ProductType,
  data: TabCompletionData
): number => {
  const total = getTotalTabs(productType);
  const completed = countCompletedTabs(productType, data);
  return Math.round((completed / total) * 100);
};
