'use client';

import Image from 'next/image';
import { useRequireCompleteProfile } from '../../components/guards/ProfileCompletionGuard';

// Datos de ejemplo para experiencias
const sampleExperiences = [
  {
    id: 'exp-1',
    title: 'Tour a Teotihuacán con Globo Aerostático',
    provider: 'Aventuras México',
    rating: 4.8,
    reviews: 124,
    price: 2500,
    currency: 'MXN',
    image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    location: 'Estado de México',
    duration: '8 horas',
    category: 'Aventura'
  },
  {
    id: 'exp-2',
    title: 'Experiencia Gastronómica en Polanco',
    provider: 'Gourmet Tours',
    rating: 4.9,
    reviews: 89,
    price: 1800,
    currency: 'MXN',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    location: 'Ciudad de México',
    duration: '4 horas',
    category: 'Gastronomía'
  },
  {
    id: 'exp-3',
    title: 'Snorkel en Cenotes de Tulum',
    provider: 'Eco Adventures',
    rating: 4.7,
    reviews: 156,
    price: 1200,
    currency: 'MXN',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    location: 'Tulum, Quintana Roo',
    duration: '6 horas',
    category: 'Naturaleza'
  }
];

interface ExperienceCardProps {
  experience: typeof sampleExperiences[0];
}

function ExperienceCard({ experience }: ExperienceCardProps) {
  const { checkProfile } = useRequireCompleteProfile();

  const handleReserveNow = () => {
    checkProfile('reserve_experience', { experienceId: experience.id, title: experience.title }, () => {
      // Lógica para reservar experiencia
      console.log('Reservando experiencia:', experience.id);
      // TODO: Implementar proceso de reserva
      alert(`¡Reservando: ${experience.title}!`);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48">
        <Image
          src={experience.image}
          alt={experience.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-white/90 text-gray-700 text-xs font-medium rounded-full">
            {experience.category}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {experience.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            por {experience.provider}
          </p>
        </div>

        <div className="flex items-center mb-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">{experience.rating}</span>
            <span className="text-sm text-gray-500 ml-1">({experience.reviews} reseñas)</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {experience.location}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {experience.duration}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              ${experience.price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 ml-1">{experience.currency}</span>
            <p className="text-xs text-gray-500">por persona</p>
          </div>
          
          <button
            onClick={handleReserveNow}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02]"
          >
            Reservar ahora
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Marketplace de Experiencias
          </h1>
          <p className="text-gray-600">
            Descubre experiencias únicas creadas por proveedores locales
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                <option>Todas las categorías</option>
                <option>Aventura</option>
                <option>Gastronomía</option>
                <option>Naturaleza</option>
                <option>Cultural</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                <option>Todas las ubicaciones</option>
                <option>Ciudad de México</option>
                <option>Quintana Roo</option>
                <option>Estado de México</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio máximo
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                <option>Sin límite</option>
                <option>Hasta $1,000</option>
                <option>Hasta $2,000</option>
                <option>Hasta $3,000</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300">
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Grid de Experiencias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleExperiences.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </div>

        {/* Call to Action para Proveedores */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            ¿Tienes una experiencia que ofrecer?
          </h2>
          <p className="text-purple-100 mb-6">
            Únete a nuestra comunidad de proveedores y comparte tus experiencias únicas con viajeros de todo el mundo.
          </p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors duration-300">
            Convertirme en proveedor
          </button>
        </div>
      </div>
    </div>
  );
}