import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock CognitoLocationMap component
const MockCognitoLocationMap = jest.fn(({ productName }) => (
  <div data-testid="cognito-map">CognitoLocationMap: {productName}</div>
));

// Mock ProductMap component
const MockProductMap = jest.fn(({ productName, destinations }) => (
  <div data-testid="product-map">
    ProductMap: {productName}
    <div data-testid="destinations-count">{destinations.length}</div>
  </div>
));

jest.mock('../../maps/CognitoLocationMap', () => ({
  CognitoLocationMap: (props: any) => MockCognitoLocationMap(props)
}));

jest.mock('../../ProductMap', () => ({
  ProductMap: (props: any) => MockProductMap(props)
}));

// Control which amplify outputs are returned
let mockOutputs: any = {};

jest.mock('../../../../../amplify/outputs.json', () => ({
  get auth() {
    return mockOutputs.auth;
  }
}), { virtual: true });

// Import component after mocks are set up
import { HybridProductMap } from '../../maps/HybridProductMap';

describe('HybridProductMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOutputs = {};
  });

  test('1- renderiza CognitoLocationMap cuando AWS Location Service está configurado', () => {
    // Configure mock outputs with full AWS auth config
    mockOutputs.auth = {
      identity_pool_id: 'us-east-1:test-pool-id',
      user_pool_id: 'us-east-1_TestPool',
      aws_region: 'us-east-1'
    };

    const destinations = [
      { place: 'Lima', coordinates: { latitude: -12.0464, longitude: -77.0428 } }
    ];

    render(
      <HybridProductMap 
        destinations={destinations as any} 
        productType="circuit" 
        productName="Peru Tour" 
      />
    );

    // Should render CognitoLocationMap
    expect(screen.getByTestId('cognito-map')).toBeInTheDocument();
    expect(screen.getByText(/CognitoLocationMap: Peru Tour/)).toBeInTheDocument();
    
    // Should NOT render ProductMap
    expect(screen.queryByTestId('product-map')).not.toBeInTheDocument();

    // Verify CognitoLocationMap was called with correct props
    expect(MockCognitoLocationMap).toHaveBeenCalledWith(
      expect.objectContaining({
        destinations,
        productType: 'circuit',
        productName: 'Peru Tour'
      })
    );
  });

  test('2- renderiza ProductMap cuando AWS Location Service NO está configurado', () => {
    // Leave mockOutputs empty (no auth config)
    mockOutputs.auth = undefined;

    const destinations = [
      { place: 'Lima', coordinates: { latitude: -12.0464, longitude: -77.0428 } },
      { place: 'Cusco', coordinates: { latitude: -13.5319, longitude: -71.9675 } }
    ];

    render(
      <HybridProductMap 
        destinations={destinations as any} 
        productType="package" 
        productName="Andes Package" 
      />
    );

    // Should render ProductMap
    expect(screen.getByTestId('product-map')).toBeInTheDocument();
    expect(screen.getByText(/ProductMap: Andes Package/)).toBeInTheDocument();
    
    // Should NOT render CognitoLocationMap
    expect(screen.queryByTestId('cognito-map')).not.toBeInTheDocument();

    // Verify ProductMap was called
    expect(MockProductMap).toHaveBeenCalled();
  });

  test('3- transforma coordenadas de objeto a array para ProductMap', () => {
    mockOutputs.auth = undefined;

    const destinations = [
      { 
        place: 'Lima', 
        placeSub: 'Centro',
        complementary_description: 'Capital',
        coordinates: { latitude: -12.0464, longitude: -77.0428 } 
      }
    ];

    render(
      <HybridProductMap 
        destinations={destinations as any} 
        productType="package" 
        productName="Test" 
      />
    );

    // Verify ProductMap received transformed destinations
    expect(MockProductMap).toHaveBeenCalledWith(
      expect.objectContaining({
        destinations: [
          expect.objectContaining({
            place: 'Lima',
            placeSub: 'Centro',
            complementaryDescription: 'Capital',
            coordinates: [-77.0428, -12.0464] // [longitude, latitude]
          })
        ]
      })
    );
  });

  test('4- renderiza ProductMap cuando identity_pool_id falta', () => {
    // Configure auth but missing identity_pool_id
    mockOutputs.auth = {
      user_pool_id: 'us-east-1_TestPool',
      aws_region: 'us-east-1'
      // identity_pool_id is missing
    };

    const destinations = [
      { place: 'Test', coordinates: { latitude: -12.0, longitude: -77.0 } }
    ];

    render(
      <HybridProductMap 
        destinations={destinations as any} 
        productType="circuit" 
        productName="Incomplete Config" 
      />
    );

    // Should fallback to ProductMap
    expect(screen.getByTestId('product-map')).toBeInTheDocument();
    expect(screen.queryByTestId('cognito-map')).not.toBeInTheDocument();
  });

  test('5- renderiza ProductMap cuando user_pool_id falta', () => {
    // Configure auth but missing user_pool_id
    mockOutputs.auth = {
      identity_pool_id: 'us-east-1:test-pool-id',
      aws_region: 'us-east-1'
      // user_pool_id is missing
    };

    const destinations = [
      { place: 'Test', coordinates: { latitude: -12.0, longitude: -77.0 } }
    ];

    render(
      <HybridProductMap 
        destinations={destinations as any} 
        productType="circuit" 
        productName="Incomplete Config" 
      />
    );

    // Should fallback to ProductMap
    expect(screen.getByTestId('product-map')).toBeInTheDocument();
    expect(screen.queryByTestId('cognito-map')).not.toBeInTheDocument();
  });

  test('6- renderiza ProductMap cuando aws_region falta', () => {
    // Configure auth but missing aws_region
    mockOutputs.auth = {
      identity_pool_id: 'us-east-1:test-pool-id',
      user_pool_id: 'us-east-1_TestPool'
      // aws_region is missing
    };

    const destinations = [
      { place: 'Test', coordinates: { latitude: -12.0, longitude: -77.0 } }
    ];

    render(
      <HybridProductMap 
        destinations={destinations as any} 
        productType="package" 
        productName="Incomplete Config" 
      />
    );

    // Should fallback to ProductMap
    expect(screen.getByTestId('product-map')).toBeInTheDocument();
    expect(screen.queryByTestId('cognito-map')).not.toBeInTheDocument();
  });

  test('7- maneja destinos sin coordenadas para ProductMap', () => {
    mockOutputs.auth = undefined;

    const destinations = [
      { place: 'Valid', coordinates: { latitude: -12.0, longitude: -77.0 } },
      { place: 'Invalid', coordinates: undefined },
      { place: 'AnotherValid', coordinates: { latitude: -13.0, longitude: -76.0 } }
    ];

    render(
      <HybridProductMap 
        destinations={destinations as any} 
        productType="circuit" 
        productName="Mixed" 
      />
    );

    // Verify all destinations were passed (transformation handles undefined)
    expect(MockProductMap).toHaveBeenCalledWith(
      expect.objectContaining({
        destinations: expect.arrayContaining([
          expect.objectContaining({ place: 'Valid', coordinates: [-77.0, -12.0] }),
          expect.objectContaining({ place: 'Invalid', coordinates: undefined }),
          expect.objectContaining({ place: 'AnotherValid', coordinates: [-76.0, -13.0] })
        ])
      })
    );
  });

  test('8- pasa props correctamente a CognitoLocationMap', () => {
    mockOutputs.auth = {
      identity_pool_id: 'us-east-1:test-pool-id',
      user_pool_id: 'us-east-1_TestPool',
      aws_region: 'us-east-1'
    };

    const destinations = [
      { 
        place: 'Lima', 
        placeSub: 'Miraflores',
        complementary_description: 'Distrito moderno',
        coordinates: { latitude: -12.1167, longitude: -77.0378 } 
      }
    ];

    render(
      <HybridProductMap 
        destinations={destinations as any} 
        productType="circuit" 
        productName="Lima Express" 
      />
    );

    // Verify CognitoLocationMap received original destinations (not transformed)
    expect(MockCognitoLocationMap).toHaveBeenCalledWith(
      expect.objectContaining({
        destinations: [
          expect.objectContaining({
            place: 'Lima',
            placeSub: 'Miraflores',
            complementary_description: 'Distrito moderno',
            coordinates: expect.objectContaining({
              latitude: -12.1167,
              longitude: -77.0378
            })
          })
        ],
        productType: 'circuit',
        productName: 'Lima Express'
      })
    );
  });

  test('9- maneja múltiples destinos correctamente', () => {
    mockOutputs.auth = undefined;

    const destinations = [
      { place: 'A', coordinates: { latitude: -12.0, longitude: -77.0 } },
      { place: 'B', coordinates: { latitude: -13.0, longitude: -76.0 } },
      { place: 'C', coordinates: { latitude: -14.0, longitude: -75.0 } }
    ];

    render(
      <HybridProductMap 
        destinations={destinations as any} 
        productType="package" 
        productName="Multi Stop" 
      />
    );

    expect(screen.getByTestId('destinations-count')).toHaveTextContent('3');
    expect(MockProductMap).toHaveBeenCalledWith(
      expect.objectContaining({
        destinations: expect.arrayContaining([
          expect.objectContaining({ place: 'A' }),
          expect.objectContaining({ place: 'B' }),
          expect.objectContaining({ place: 'C' })
        ])
      })
    );
  });
});
