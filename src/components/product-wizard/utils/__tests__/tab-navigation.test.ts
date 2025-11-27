/**
 * Unit Tests for tab-navigation utilities
 *
 * Tests all pure functions for tab navigation in the Product Wizard.
 * These functions control the flow between tabs in ProductDetailsStep/PackageDetailsStep.
 *
 * @coverage Target: 100%
 */
import {
  getTabOrder,
  getFirstTab,
  getLastTab,
  getNextTab,
  getPreviousTab,
  isFirstTab,
  isLastTab,
  getTabIndex,
  getTotalTabs,
  isValidTab,
  getNextTabLabel,
  checkTabCompletion,
  getAllTabsCompletion,
  countCompletedTabs,
  getTabProgressPercentage,
  type TabId,
  type ProductType,
  type TabCompletionData,
} from '../tab-navigation';

// ============================================================================
// getTabOrder TESTS
// ============================================================================

describe('getTabOrder', () => {
  it('returns 5 tabs for circuit type', () => {
    const order = getTabOrder('circuit');
    expect(order).toHaveLength(5);
  });

  it('returns 4 tabs for package type', () => {
    const order = getTabOrder('package');
    expect(order).toHaveLength(4);
  });

  it('circuit includes hotels tab', () => {
    const order = getTabOrder('circuit');
    expect(order).toContain('hotels');
  });

  it('package does not include hotels tab', () => {
    const order = getTabOrder('package');
    expect(order).not.toContain('hotels');
  });

  it('both types start with destination', () => {
    expect(getTabOrder('circuit')[0]).toBe('destination');
    expect(getTabOrder('package')[0]).toBe('destination');
  });

  it('both types have same first 4 tabs', () => {
    const circuit = getTabOrder('circuit');
    const pkg = getTabOrder('package');

    expect(circuit.slice(0, 4)).toEqual(pkg);
  });

  it('circuit order is destination -> departures -> itinerary -> seasons -> hotels', () => {
    const expected: TabId[] = ['destination', 'departures', 'itinerary', 'seasons', 'hotels'];
    expect(getTabOrder('circuit')).toEqual(expected);
  });

  it('package order is destination -> departures -> itinerary -> seasons', () => {
    const expected: TabId[] = ['destination', 'departures', 'itinerary', 'seasons'];
    expect(getTabOrder('package')).toEqual(expected);
  });
});

// ============================================================================
// getFirstTab TESTS
// ============================================================================

describe('getFirstTab', () => {
  it('always returns destination', () => {
    expect(getFirstTab()).toBe('destination');
  });

  it('returns a valid TabId', () => {
    const result = getFirstTab();
    expect(['destination', 'departures', 'itinerary', 'seasons', 'hotels']).toContain(result);
  });
});

// ============================================================================
// getLastTab TESTS
// ============================================================================

describe('getLastTab', () => {
  it('returns hotels for circuit', () => {
    expect(getLastTab('circuit')).toBe('hotels');
  });

  it('returns seasons for package', () => {
    expect(getLastTab('package')).toBe('seasons');
  });
});

// ============================================================================
// getNextTab TESTS
// ============================================================================

describe('getNextTab', () => {
  describe('for circuit type', () => {
    it('destination -> departures', () => {
      expect(getNextTab('destination', 'circuit')).toBe('departures');
    });

    it('departures -> itinerary', () => {
      expect(getNextTab('departures', 'circuit')).toBe('itinerary');
    });

    it('itinerary -> seasons', () => {
      expect(getNextTab('itinerary', 'circuit')).toBe('seasons');
    });

    it('seasons -> hotels', () => {
      expect(getNextTab('seasons', 'circuit')).toBe('hotels');
    });

    it('hotels -> null (last tab)', () => {
      expect(getNextTab('hotels', 'circuit')).toBeNull();
    });
  });

  describe('for package type', () => {
    it('destination -> departures', () => {
      expect(getNextTab('destination', 'package')).toBe('departures');
    });

    it('departures -> itinerary', () => {
      expect(getNextTab('departures', 'package')).toBe('itinerary');
    });

    it('itinerary -> seasons', () => {
      expect(getNextTab('itinerary', 'package')).toBe('seasons');
    });

    it('seasons -> null (last tab)', () => {
      expect(getNextTab('seasons', 'package')).toBeNull();
    });

    it('hotels returns null (not in package)', () => {
      expect(getNextTab('hotels', 'package')).toBeNull();
    });
  });

  it('returns null for invalid tab', () => {
    expect(getNextTab('invalid' as TabId, 'circuit')).toBeNull();
  });
});

// ============================================================================
// getPreviousTab TESTS
// ============================================================================

describe('getPreviousTab', () => {
  describe('for circuit type', () => {
    it('destination -> null (first tab)', () => {
      expect(getPreviousTab('destination', 'circuit')).toBeNull();
    });

    it('departures -> destination', () => {
      expect(getPreviousTab('departures', 'circuit')).toBe('destination');
    });

    it('itinerary -> departures', () => {
      expect(getPreviousTab('itinerary', 'circuit')).toBe('departures');
    });

    it('seasons -> itinerary', () => {
      expect(getPreviousTab('seasons', 'circuit')).toBe('itinerary');
    });

    it('hotels -> seasons', () => {
      expect(getPreviousTab('hotels', 'circuit')).toBe('seasons');
    });
  });

  describe('for package type', () => {
    it('destination -> null (first tab)', () => {
      expect(getPreviousTab('destination', 'package')).toBeNull();
    });

    it('departures -> destination', () => {
      expect(getPreviousTab('departures', 'package')).toBe('destination');
    });

    it('itinerary -> departures', () => {
      expect(getPreviousTab('itinerary', 'package')).toBe('departures');
    });

    it('seasons -> itinerary', () => {
      expect(getPreviousTab('seasons', 'package')).toBe('itinerary');
    });
  });

  it('returns null for invalid tab', () => {
    expect(getPreviousTab('invalid' as TabId, 'circuit')).toBeNull();
  });
});

// ============================================================================
// isFirstTab TESTS
// ============================================================================

describe('isFirstTab', () => {
  it('returns true for destination', () => {
    expect(isFirstTab('destination')).toBe(true);
  });

  it('returns false for departures', () => {
    expect(isFirstTab('departures')).toBe(false);
  });

  it('returns false for itinerary', () => {
    expect(isFirstTab('itinerary')).toBe(false);
  });

  it('returns false for seasons', () => {
    expect(isFirstTab('seasons')).toBe(false);
  });

  it('returns false for hotels', () => {
    expect(isFirstTab('hotels')).toBe(false);
  });
});

// ============================================================================
// isLastTab TESTS
// ============================================================================

describe('isLastTab', () => {
  describe('for circuit', () => {
    it('returns true for hotels', () => {
      expect(isLastTab('hotels', 'circuit')).toBe(true);
    });

    it('returns false for seasons', () => {
      expect(isLastTab('seasons', 'circuit')).toBe(false);
    });

    it('returns false for destination', () => {
      expect(isLastTab('destination', 'circuit')).toBe(false);
    });
  });

  describe('for package', () => {
    it('returns true for seasons', () => {
      expect(isLastTab('seasons', 'package')).toBe(true);
    });

    it('returns false for hotels', () => {
      expect(isLastTab('hotels', 'package')).toBe(false);
    });

    it('returns false for destination', () => {
      expect(isLastTab('destination', 'package')).toBe(false);
    });
  });
});

// ============================================================================
// getTabIndex TESTS
// ============================================================================

describe('getTabIndex', () => {
  describe('for circuit', () => {
    it('destination is at index 0', () => {
      expect(getTabIndex('destination', 'circuit')).toBe(0);
    });

    it('departures is at index 1', () => {
      expect(getTabIndex('departures', 'circuit')).toBe(1);
    });

    it('itinerary is at index 2', () => {
      expect(getTabIndex('itinerary', 'circuit')).toBe(2);
    });

    it('seasons is at index 3', () => {
      expect(getTabIndex('seasons', 'circuit')).toBe(3);
    });

    it('hotels is at index 4', () => {
      expect(getTabIndex('hotels', 'circuit')).toBe(4);
    });
  });

  describe('for package', () => {
    it('destination is at index 0', () => {
      expect(getTabIndex('destination', 'package')).toBe(0);
    });

    it('seasons is at index 3', () => {
      expect(getTabIndex('seasons', 'package')).toBe(3);
    });

    it('hotels returns -1 (not in package)', () => {
      expect(getTabIndex('hotels', 'package')).toBe(-1);
    });
  });

  it('returns -1 for invalid tab', () => {
    expect(getTabIndex('invalid' as TabId, 'circuit')).toBe(-1);
  });
});

// ============================================================================
// getTotalTabs TESTS
// ============================================================================

describe('getTotalTabs', () => {
  it('returns 5 for circuit', () => {
    expect(getTotalTabs('circuit')).toBe(5);
  });

  it('returns 4 for package', () => {
    expect(getTotalTabs('package')).toBe(4);
  });
});

// ============================================================================
// isValidTab TESTS
// ============================================================================

describe('isValidTab', () => {
  describe('for circuit', () => {
    it('destination is valid', () => {
      expect(isValidTab('destination', 'circuit')).toBe(true);
    });

    it('departures is valid', () => {
      expect(isValidTab('departures', 'circuit')).toBe(true);
    });

    it('itinerary is valid', () => {
      expect(isValidTab('itinerary', 'circuit')).toBe(true);
    });

    it('seasons is valid', () => {
      expect(isValidTab('seasons', 'circuit')).toBe(true);
    });

    it('hotels is valid', () => {
      expect(isValidTab('hotels', 'circuit')).toBe(true);
    });

    it('invalid tab returns false', () => {
      expect(isValidTab('invalid', 'circuit')).toBe(false);
    });
  });

  describe('for package', () => {
    it('destination is valid', () => {
      expect(isValidTab('destination', 'package')).toBe(true);
    });

    it('hotels is NOT valid (not in package)', () => {
      expect(isValidTab('hotels', 'package')).toBe(false);
    });
  });
});

// ============================================================================
// getNextTabLabel TESTS
// ============================================================================

describe('getNextTabLabel', () => {
  describe('for circuit', () => {
    it('destination -> "Siguiente: Salidas →"', () => {
      expect(getNextTabLabel('destination', 'circuit')).toBe('Siguiente: Salidas →');
    });

    it('departures -> "Siguiente: Itinerario →"', () => {
      expect(getNextTabLabel('departures', 'circuit')).toBe('Siguiente: Itinerario →');
    });

    it('itinerary -> "Siguiente: Temporadas →"', () => {
      expect(getNextTabLabel('itinerary', 'circuit')).toBe('Siguiente: Temporadas →');
    });

    it('seasons -> "Siguiente: Hoteles →"', () => {
      expect(getNextTabLabel('seasons', 'circuit')).toBe('Siguiente: Hoteles →');
    });

    it('hotels -> null (no next tab)', () => {
      expect(getNextTabLabel('hotels', 'circuit')).toBeNull();
    });
  });

  describe('for package', () => {
    it('itinerary -> "Siguiente: Temporadas →"', () => {
      expect(getNextTabLabel('itinerary', 'package')).toBe('Siguiente: Temporadas →');
    });

    it('seasons -> null (no next tab)', () => {
      expect(getNextTabLabel('seasons', 'package')).toBeNull();
    });
  });
});

// ============================================================================
// checkTabCompletion TESTS
// ============================================================================

describe('checkTabCompletion', () => {
  describe('destination tab', () => {
    it('returns true when destination has items', () => {
      const data: TabCompletionData = { destination: [{ place: 'Test' }] };
      expect(checkTabCompletion('destination', data)).toBe(true);
    });

    it('returns false when destination is empty', () => {
      const data: TabCompletionData = { destination: [] };
      expect(checkTabCompletion('destination', data)).toBe(false);
    });

    it('returns false when destination is undefined', () => {
      const data: TabCompletionData = {};
      expect(checkTabCompletion('destination', data)).toBe(false);
    });
  });

  describe('departures tab', () => {
    it('returns true when regular_departures has items', () => {
      const data: TabCompletionData = {
        departures: { regular_departures: [{ days: ['Monday'] }], specific_departures: [] },
      };
      expect(checkTabCompletion('departures', data)).toBe(true);
    });

    it('returns true when specific_departures has items', () => {
      const data: TabCompletionData = {
        departures: { regular_departures: [], specific_departures: [{ date: '2024-01-01' }] },
      };
      expect(checkTabCompletion('departures', data)).toBe(true);
    });

    it('returns true when both have items', () => {
      const data: TabCompletionData = {
        departures: {
          regular_departures: [{ days: ['Monday'] }],
          specific_departures: [{ date: '2024-01-01' }],
        },
      };
      expect(checkTabCompletion('departures', data)).toBe(true);
    });

    it('returns false when both are empty', () => {
      const data: TabCompletionData = {
        departures: { regular_departures: [], specific_departures: [] },
      };
      expect(checkTabCompletion('departures', data)).toBe(false);
    });

    it('returns false when departures is undefined', () => {
      const data: TabCompletionData = {};
      expect(checkTabCompletion('departures', data)).toBe(false);
    });
  });

  describe('itinerary tab', () => {
    it('returns true when itinerary has content', () => {
      const data: TabCompletionData = { itinerary: 'Day 1: Arrival' };
      expect(checkTabCompletion('itinerary', data)).toBe(true);
    });

    it('returns false when itinerary is empty string', () => {
      const data: TabCompletionData = { itinerary: '' };
      expect(checkTabCompletion('itinerary', data)).toBe(false);
    });

    it('returns false when itinerary is only whitespace', () => {
      const data: TabCompletionData = { itinerary: '   ' };
      expect(checkTabCompletion('itinerary', data)).toBe(false);
    });

    it('returns false when itinerary is undefined', () => {
      const data: TabCompletionData = {};
      expect(checkTabCompletion('itinerary', data)).toBe(false);
    });
  });

  describe('seasons tab', () => {
    it('returns true when seasons has items', () => {
      const data: TabCompletionData = { seasons: [{ name: 'Summer' }] };
      expect(checkTabCompletion('seasons', data)).toBe(true);
    });

    it('returns false when seasons is empty', () => {
      const data: TabCompletionData = { seasons: [] };
      expect(checkTabCompletion('seasons', data)).toBe(false);
    });

    it('returns false when seasons is undefined', () => {
      const data: TabCompletionData = {};
      expect(checkTabCompletion('seasons', data)).toBe(false);
    });
  });

  describe('hotels tab', () => {
    it('returns true when hotels has items', () => {
      const data: TabCompletionData = { hotels: ['Hotel A', 'Hotel B'] };
      expect(checkTabCompletion('hotels', data)).toBe(true);
    });

    it('returns false when hotels is empty', () => {
      const data: TabCompletionData = { hotels: [] };
      expect(checkTabCompletion('hotels', data)).toBe(false);
    });

    it('returns false when hotels is undefined', () => {
      const data: TabCompletionData = {};
      expect(checkTabCompletion('hotels', data)).toBe(false);
    });
  });

  describe('invalid tab', () => {
    it('returns false for unknown tab', () => {
      const data: TabCompletionData = {};
      expect(checkTabCompletion('invalid' as TabId, data)).toBe(false);
    });
  });
});

// ============================================================================
// getAllTabsCompletion TESTS
// ============================================================================

describe('getAllTabsCompletion', () => {
  it('returns all false for empty data (circuit)', () => {
    const data: TabCompletionData = {};
    const result = getAllTabsCompletion('circuit', data);

    expect(result.destination).toBe(false);
    expect(result.departures).toBe(false);
    expect(result.itinerary).toBe(false);
    expect(result.seasons).toBe(false);
    expect(result.hotels).toBe(false);
  });

  it('returns all false for empty data (package)', () => {
    const data: TabCompletionData = {};
    const result = getAllTabsCompletion('package', data);

    expect(result.destination).toBe(false);
    expect(result.departures).toBe(false);
    expect(result.itinerary).toBe(false);
    expect(result.seasons).toBe(false);
    expect(result.hotels).toBeUndefined(); // Not in package
  });

  it('returns mixed completion status', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
      departures: { regular_departures: [], specific_departures: [] },
      itinerary: 'Day 1',
      seasons: [],
      hotels: ['Hotel A'],
    };
    const result = getAllTabsCompletion('circuit', data);

    expect(result.destination).toBe(true);
    expect(result.departures).toBe(false);
    expect(result.itinerary).toBe(true);
    expect(result.seasons).toBe(false);
    expect(result.hotels).toBe(true);
  });

  it('returns all true for complete data (circuit)', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
      departures: { regular_departures: [{}], specific_departures: [] },
      itinerary: 'Day 1',
      seasons: [{ name: 'Summer' }],
      hotels: ['Hotel A'],
    };
    const result = getAllTabsCompletion('circuit', data);

    expect(result.destination).toBe(true);
    expect(result.departures).toBe(true);
    expect(result.itinerary).toBe(true);
    expect(result.seasons).toBe(true);
    expect(result.hotels).toBe(true);
  });
});

// ============================================================================
// countCompletedTabs TESTS
// ============================================================================

describe('countCompletedTabs', () => {
  it('returns 0 for empty data', () => {
    const data: TabCompletionData = {};
    expect(countCompletedTabs('circuit', data)).toBe(0);
  });

  it('counts completed tabs correctly for circuit', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
      departures: { regular_departures: [{}], specific_departures: [] },
      itinerary: '',
      seasons: [],
      hotels: [],
    };
    expect(countCompletedTabs('circuit', data)).toBe(2);
  });

  it('counts completed tabs correctly for package', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
      departures: { regular_departures: [], specific_departures: [] },
      itinerary: 'Day 1',
      seasons: [{}],
    };
    expect(countCompletedTabs('package', data)).toBe(3);
  });

  it('returns 5 for all complete (circuit)', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
      departures: { regular_departures: [{}], specific_departures: [] },
      itinerary: 'Day 1',
      seasons: [{}],
      hotels: ['Hotel'],
    };
    expect(countCompletedTabs('circuit', data)).toBe(5);
  });

  it('returns 4 for all complete (package)', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
      departures: { regular_departures: [{}], specific_departures: [] },
      itinerary: 'Day 1',
      seasons: [{}],
    };
    expect(countCompletedTabs('package', data)).toBe(4);
  });
});

// ============================================================================
// getTabProgressPercentage TESTS
// ============================================================================

describe('getTabProgressPercentage', () => {
  it('returns 0 for no completion', () => {
    const data: TabCompletionData = {};
    expect(getTabProgressPercentage('circuit', data)).toBe(0);
  });

  it('returns 100 for full completion (circuit)', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
      departures: { regular_departures: [{}], specific_departures: [] },
      itinerary: 'Day 1',
      seasons: [{}],
      hotels: ['Hotel'],
    };
    expect(getTabProgressPercentage('circuit', data)).toBe(100);
  });

  it('returns 100 for full completion (package)', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
      departures: { regular_departures: [{}], specific_departures: [] },
      itinerary: 'Day 1',
      seasons: [{}],
    };
    expect(getTabProgressPercentage('package', data)).toBe(100);
  });

  it('returns 20 for 1/5 completion (circuit)', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
    };
    expect(getTabProgressPercentage('circuit', data)).toBe(20);
  });

  it('returns 25 for 1/4 completion (package)', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
    };
    expect(getTabProgressPercentage('package', data)).toBe(25);
  });

  it('returns 40 for 2/5 completion (circuit)', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
      itinerary: 'Day 1',
    };
    expect(getTabProgressPercentage('circuit', data)).toBe(40);
  });

  it('returns 50 for 2/4 completion (package)', () => {
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
      itinerary: 'Day 1',
    };
    expect(getTabProgressPercentage('package', data)).toBe(50);
  });

  it('rounds percentage correctly', () => {
    // 3/5 = 60%
    const data: TabCompletionData = {
      destination: [{ place: 'Test' }],
      departures: { regular_departures: [{}], specific_departures: [] },
      itinerary: 'Day 1',
    };
    expect(getTabProgressPercentage('circuit', data)).toBe(60);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge cases', () => {
  it('handles cycling through all tabs (circuit)', () => {
    let currentTab: TabId = 'destination';
    const visited: TabId[] = [currentTab];

    while (true) {
      const next = getNextTab(currentTab, 'circuit');
      if (next === null) break;
      currentTab = next;
      visited.push(currentTab);
    }

    expect(visited).toEqual(['destination', 'departures', 'itinerary', 'seasons', 'hotels']);
  });

  it('handles cycling through all tabs backwards (circuit)', () => {
    let currentTab: TabId = 'hotels';
    const visited: TabId[] = [currentTab];

    while (true) {
      const prev = getPreviousTab(currentTab, 'circuit');
      if (prev === null) break;
      currentTab = prev;
      visited.push(currentTab);
    }

    expect(visited).toEqual(['hotels', 'seasons', 'itinerary', 'departures', 'destination']);
  });

  it('getNextTab and getPreviousTab are inverse operations', () => {
    const tabs: TabId[] = ['destination', 'departures', 'itinerary', 'seasons'];

    for (const tab of tabs) {
      const next = getNextTab(tab, 'circuit');
      if (next) {
        const back = getPreviousTab(next, 'circuit');
        expect(back).toBe(tab);
      }
    }
  });

  it('first tab has no previous', () => {
    expect(getPreviousTab(getFirstTab(), 'circuit')).toBeNull();
    expect(getPreviousTab(getFirstTab(), 'package')).toBeNull();
  });

  it('last tab has no next', () => {
    expect(getNextTab(getLastTab('circuit'), 'circuit')).toBeNull();
    expect(getNextTab(getLastTab('package'), 'package')).toBeNull();
  });

  it('tab indices are consecutive from 0', () => {
    const circuitOrder = getTabOrder('circuit');
    circuitOrder.forEach((tab, expectedIndex) => {
      expect(getTabIndex(tab, 'circuit')).toBe(expectedIndex);
    });
  });

  it('total tabs matches tab order length', () => {
    expect(getTotalTabs('circuit')).toBe(getTabOrder('circuit').length);
    expect(getTotalTabs('package')).toBe(getTabOrder('package').length);
  });
});
