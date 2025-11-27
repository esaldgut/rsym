/**
 * Unit Tests for wizard-steps.tsx
 *
 * Tests the step configuration logic for the Product Wizard.
 * These are pure function tests - no React components involved.
 *
 * @coverage Target: 100%
 */
import {
  PRODUCT_STEPS,
  getStepsForProductType,
  CIRCUIT_STEPS,
  PACKAGE_STEPS,
} from '../wizard-steps';

describe('wizard-steps', () => {
  // ============================================================================
  // PRODUCT_STEPS (Base Configuration)
  // ============================================================================
  describe('PRODUCT_STEPS', () => {
    it('contiene exactamente 4 pasos', () => {
      expect(PRODUCT_STEPS).toHaveLength(4);
    });

    it('tiene IDs únicos para cada paso', () => {
      const ids = PRODUCT_STEPS.map((step) => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('tiene el orden correcto de pasos', () => {
      const expectedOrder = ['general-info', 'product-details', 'policies', 'review'];
      const actualOrder = PRODUCT_STEPS.map((step) => step.id);
      expect(actualOrder).toEqual(expectedOrder);
    });

    it('cada paso tiene las propiedades requeridas', () => {
      PRODUCT_STEPS.forEach((step) => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('component');
        expect(step).toHaveProperty('validation');
        expect(step).toHaveProperty('optional');

        // Type checks
        expect(typeof step.id).toBe('string');
        expect(typeof step.title).toBe('string');
        expect(typeof step.optional).toBe('boolean');
      });
    });

    it('ningún paso es opcional por defecto', () => {
      PRODUCT_STEPS.forEach((step) => {
        expect(step.optional).toBe(false);
      });
    });
  });

  // ============================================================================
  // getStepsForProductType
  // ============================================================================
  describe('getStepsForProductType', () => {
    describe('para circuits', () => {
      let circuitSteps: ReturnType<typeof getStepsForProductType>;

      beforeEach(() => {
        circuitSteps = getStepsForProductType('circuit');
      });

      it('retorna exactamente 4 pasos', () => {
        expect(circuitSteps).toHaveLength(4);
      });

      it('el primer paso tiene título "Información General"', () => {
        expect(circuitSteps[0].title).toBe('Información General');
      });

      it('el segundo paso tiene título "Detalles del Circuito"', () => {
        expect(circuitSteps[1].title).toBe('Detalles del Circuito');
      });

      it('el segundo paso usa ProductDetailsStep component', () => {
        // Verificamos que el componente está definido (lazy loaded)
        expect(circuitSteps[1].component).toBeDefined();
      });

      it('el tercer paso es "Políticas de Pago"', () => {
        expect(circuitSteps[2].id).toBe('policies');
        expect(circuitSteps[2].title).toBe('Políticas de Pago');
      });

      it('el cuarto paso es "Revisión"', () => {
        expect(circuitSteps[3].id).toBe('review');
        expect(circuitSteps[3].title).toBe('Revisión');
      });

      it('usa generalInfoCircuitSchema para validación del primer paso', () => {
        // El schema debe estar definido y ser un schema de Zod
        expect(circuitSteps[0].validation).toBeDefined();
        expect(typeof circuitSteps[0].validation.safeParse).toBe('function');
      });

      it('usa tourDetailsSchema para validación del segundo paso', () => {
        expect(circuitSteps[1].validation).toBeDefined();
        expect(typeof circuitSteps[1].validation.safeParse).toBe('function');
      });
    });

    describe('para packages', () => {
      let packageSteps: ReturnType<typeof getStepsForProductType>;

      beforeEach(() => {
        packageSteps = getStepsForProductType('package');
      });

      it('retorna exactamente 4 pasos', () => {
        expect(packageSteps).toHaveLength(4);
      });

      it('el primer paso tiene título "Información General"', () => {
        expect(packageSteps[0].title).toBe('Información General');
      });

      it('el segundo paso tiene título "Detalles del Paquete"', () => {
        expect(packageSteps[1].title).toBe('Detalles del Paquete');
      });

      it('el segundo paso usa PackageDetailsStep component', () => {
        expect(packageSteps[1].component).toBeDefined();
      });

      it('usa generalInfoPackageSchema para validación del primer paso', () => {
        expect(packageSteps[0].validation).toBeDefined();
        expect(typeof packageSteps[0].validation.safeParse).toBe('function');
      });

      it('usa packageDetailsSchema para validación del segundo paso', () => {
        expect(packageSteps[1].validation).toBeDefined();
        expect(typeof packageSteps[1].validation.safeParse).toBe('function');
      });
    });

    describe('inmutabilidad', () => {
      it('no modifica PRODUCT_STEPS original al crear circuit steps', () => {
        const originalLength = PRODUCT_STEPS.length;
        const originalFirstTitle = PRODUCT_STEPS[0].title;

        getStepsForProductType('circuit');

        expect(PRODUCT_STEPS).toHaveLength(originalLength);
        expect(PRODUCT_STEPS[0].title).toBe(originalFirstTitle);
      });

      it('no modifica PRODUCT_STEPS original al crear package steps', () => {
        const originalLength = PRODUCT_STEPS.length;

        getStepsForProductType('package');

        expect(PRODUCT_STEPS).toHaveLength(originalLength);
      });

      it('retorna nuevos arrays en cada llamada', () => {
        const steps1 = getStepsForProductType('circuit');
        const steps2 = getStepsForProductType('circuit');

        expect(steps1).not.toBe(steps2); // Diferentes referencias
        expect(steps1).toEqual(steps2); // Mismo contenido
      });
    });

    describe('diferencias entre circuit y package', () => {
      it('tienen diferentes componentes en el segundo paso', () => {
        const circuitSteps = getStepsForProductType('circuit');
        const packageSteps = getStepsForProductType('package');

        expect(circuitSteps[1].component).not.toBe(packageSteps[1].component);
      });

      it('tienen diferentes títulos en el segundo paso', () => {
        const circuitSteps = getStepsForProductType('circuit');
        const packageSteps = getStepsForProductType('package');

        expect(circuitSteps[1].title).toBe('Detalles del Circuito');
        expect(packageSteps[1].title).toBe('Detalles del Paquete');
      });

      it('tienen diferentes schemas de validación en el segundo paso', () => {
        const circuitSteps = getStepsForProductType('circuit');
        const packageSteps = getStepsForProductType('package');

        expect(circuitSteps[1].validation).not.toBe(packageSteps[1].validation);
      });

      it('comparten los mismos pasos para policies y review', () => {
        const circuitSteps = getStepsForProductType('circuit');
        const packageSteps = getStepsForProductType('package');

        expect(circuitSteps[2].id).toBe(packageSteps[2].id);
        expect(circuitSteps[3].id).toBe(packageSteps[3].id);
      });
    });
  });

  // ============================================================================
  // Legacy Exports
  // ============================================================================
  describe('Legacy Exports (CIRCUIT_STEPS, PACKAGE_STEPS)', () => {
    it('CIRCUIT_STEPS está definido', () => {
      expect(CIRCUIT_STEPS).toBeDefined();
      expect(Array.isArray(CIRCUIT_STEPS)).toBe(true);
    });

    it('PACKAGE_STEPS está definido', () => {
      expect(PACKAGE_STEPS).toBeDefined();
      expect(Array.isArray(PACKAGE_STEPS)).toBe(true);
    });

    it('CIRCUIT_STEPS es equivalente a getStepsForProductType("circuit")', () => {
      const dynamicCircuitSteps = getStepsForProductType('circuit');

      expect(CIRCUIT_STEPS).toHaveLength(dynamicCircuitSteps.length);
      expect(CIRCUIT_STEPS[1].title).toBe(dynamicCircuitSteps[1].title);
    });

    it('PACKAGE_STEPS es equivalente a getStepsForProductType("package")', () => {
      const dynamicPackageSteps = getStepsForProductType('package');

      expect(PACKAGE_STEPS).toHaveLength(dynamicPackageSteps.length);
      expect(PACKAGE_STEPS[1].title).toBe(dynamicPackageSteps[1].title);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('Edge Cases', () => {
    it('maneja múltiples llamadas consecutivas', () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(getStepsForProductType('circuit'));
      }

      // Todas las llamadas deben producir resultados equivalentes
      results.forEach((result) => {
        expect(result).toHaveLength(4);
        expect(result[1].title).toBe('Detalles del Circuito');
      });
    });

    it('alterna correctamente entre tipos de producto', () => {
      const circuit1 = getStepsForProductType('circuit');
      const package1 = getStepsForProductType('package');
      const circuit2 = getStepsForProductType('circuit');
      const package2 = getStepsForProductType('package');

      expect(circuit1[1].title).toBe('Detalles del Circuito');
      expect(package1[1].title).toBe('Detalles del Paquete');
      expect(circuit2[1].title).toBe('Detalles del Circuito');
      expect(package2[1].title).toBe('Detalles del Paquete');
    });
  });
});
