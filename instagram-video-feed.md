Feed de Videos y Reels con Reproducción Automática - Next.js 15.5.4
Te voy a proporcionar una implementación completa y profesional del feed de videos de Instagram con reproducción automática. Esta solución incluye:

✅ Feed de videos con scroll vertical similar a Instagram
✅ Reels en pantalla completa con reproducción automática
✅ Intersection Observer para detección de visibilidad
✅ Custom Hooks reutilizables
✅ TypeScript con tipado estricto
✅ Clean Architecture y patrones de diseño
✅ Optimización de performance

// types/video.ts
export interface Video {
  id: string;
  url: string;
  thumbnail: string;
  username: string;
  avatar: string;
  likes: number;
  comments: number;
  description: string;
  duration: number;
}

// hooks/useVideoAutoplay.ts
import { useEffect, useRef, useState } from 'react';

interface UseVideoAutoplayOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useVideoAutoplay = (options: UseVideoAutoplayOptions = {}) => {
  const { threshold = 0.7, rootMargin = '0px' } = options;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isVisible) {
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Error playing video:', error);
        });
      }
    } else {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  }, [isVisible]);

  return { videoRef, isVisible, isPlaying };
};

// components/VideoCard.tsx
import { Video } from '@/types/video';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';

interface VideoCardProps {
  video: Video;
  isFeed?: boolean;
}

export const VideoCard = ({ video, isFeed = false }: VideoCardProps) => {
  const { videoRef, isPlaying } = useVideoAutoplay({
    threshold: isFeed ? 0.7 : 0.5,
  });

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  return (
    <div
      className={`relative ${
        isFeed ? 'aspect-square w-full' : 'h-screen w-full'
      } bg-black overflow-hidden`}
    >
      {/* Video Player */}
      <video
        ref={videoRef}
        src={video.url}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted
        onClick={handleVideoClick}
        poster={video.thumbnail}
      />

      {/* Overlay Controls */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={video.avatar}
                alt={video.username}
                className="w-8 h-8 rounded-full border-2 border-white"
              />
              <span className="text-white font-semibold text-sm">
                {video.username}
              </span>
              <button className="text-white text-xs font-semibold px-4 py-1 border border-white rounded-lg">
                Follow
              </button>
            </div>
            <button className="text-white">
              <MoreHorizontal size={24} />
            </button>
          </div>
        </div>

        {/* Bottom Bar - Actions */}
        {!isFeed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-auto">
            <div className="flex items-end justify-between">
              {/* Description */}
              <div className="flex-1 pr-4">
                <p className="text-white text-sm mb-4 line-clamp-2">
                  {video.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-6">
                <button className="flex flex-col items-center text-white">
                  <Heart size={28} />
                  <span className="text-xs mt-1">
                    {video.likes > 1000
                      ? `${(video.likes / 1000).toFixed(1)}K`
                      : video.likes}
                  </span>
                </button>
                <button className="flex flex-col items-center text-white">
                  <MessageCircle size={28} />
                  <span className="text-xs mt-1">{video.comments}</span>
                </button>
                <button className="flex flex-col items-center text-white">
                  <Send size={28} />
                </button>
                <button className="flex flex-col items-center text-white">
                  <Bookmark size={28} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feed Mode Overlay */}
        {isFeed && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-auto" />
        )}
      </div>

      {/* Play/Pause Indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};

// app/feed/page.tsx
'use client';

import { VideoCard } from '@/components/VideoCard';
import { Video } from '@/types/video';

const MOCK_VIDEOS: Video[] = [
  {
    id: '1',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113',
    username: 'travel_diaries',
    avatar: 'https://i.pravatar.cc/150?img=1',
    likes: 12453,
    comments: 234,
    description: 'Amazing sunset views from the mountains 🌄 #travel #nature',
    duration: 15,
  },
  {
    id: '2',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
    username: 'fitness_guru',
    avatar: 'https://i.pravatar.cc/150?img=2',
    likes: 8967,
    comments: 145,
    description: 'Morning workout routine 💪 Get fit with me! #fitness #health',
    duration: 30,
  },
  {
    id: '3',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    username: 'food_lover',
    avatar: 'https://i.pravatar.cc/150?img=3',
    likes: 15678,
    comments: 456,
    description: 'Best pasta recipe ever! 🍝 Try this at home #cooking #food',
    duration: 25,
  },
  {
    id: '4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516796181074-bf453fbfa3e6',
    username: 'adventure_seeker',
    avatar: 'https://i.pravatar.cc/150?img=4',
    likes: 23456,
    comments: 789,
    description: 'Exploring hidden beaches 🏖️ #adventure #beach #paradise',
    duration: 20,
  },
  {
    id: '5',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29',
    username: 'tech_reviews',
    avatar: 'https://i.pravatar.cc/150?img=5',
    likes: 9876,
    comments: 234,
    description: 'Latest tech gadgets review 📱 #technology #gadgets #review',
    duration: 35,
  },
  {
    id: '6',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7',
    username: 'car_enthusiast',
    avatar: 'https://i.pravatar.cc/150?img=6',
    likes: 34567,
    comments: 567,
    description: 'Epic car collection showcase 🚗 #cars #luxury #automotive',
    duration: 28,
  },
];

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-white text-2xl font-bold">Feed</h1>
        </div>
      </div>

      {/* Video Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-1">
          {MOCK_VIDEOS.map((video) => (
            <div key={video.id} className="aspect-square">
              <VideoCard video={video} isFeed />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// app/reels/page.tsx
'use client';

import { VideoCard } from '@/components/VideoCard';
import { Video } from '@/types/video';
import { useEffect, useRef } from 'react';

const MOCK_REELS: Video[] = [
  {
    id: '1',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113',
    username: 'travel_diaries',
    avatar: 'https://i.pravatar.cc/150?img=1',
    likes: 12453,
    comments: 234,
    description: 'Amazing sunset views from the mountains 🌄 #travel #nature #wanderlust',
    duration: 15,
  },
  {
    id: '2',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
    username: 'fitness_guru',
    avatar: 'https://i.pravatar.cc/150?img=2',
    likes: 8967,
    comments: 145,
    description: 'Morning workout routine 💪 Get fit with me! #fitness #health #motivation',
    duration: 30,
  },
  {
    id: '3',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    username: 'food_lover',
    avatar: 'https://i.pravatar.cc/150?img=3',
    likes: 15678,
    comments: 456,
    description: 'Best pasta recipe ever! 🍝 Try this at home and let me know what you think #cooking #food #recipe',
    duration: 25,
  },
  {
    id: '4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516796181074-bf453fbfa3e6',
    username: 'adventure_seeker',
    avatar: 'https://i.pravatar.cc/150?img=4',
    likes: 23456,
    comments: 789,
    description: 'Exploring hidden beaches around the world 🏖️ #adventure #beach #paradise #travel',
    duration: 20,
  },
  {
    id: '5',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29',
    username: 'tech_reviews',
    avatar: 'https://i.pravatar.cc/150?img=5',
    likes: 9876,
    comments: 234,
    description: 'Latest tech gadgets review - worth buying? 📱 #technology #gadgets #review #tech',
    duration: 35,
  },
];

export default function ReelsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrolling: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(isScrolling);
      isScrolling = setTimeout(() => {
        // Snap to nearest video
        const scrollTop = container.scrollTop;
        const windowHeight = window.innerHeight;
        const targetIndex = Math.round(scrollTop / windowHeight);
        container.scrollTo({
          top: targetIndex * windowHeight,
          behavior: 'smooth',
        });
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(isScrolling);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollbarWidth: 'none' }}
    >
      {MOCK_REELS.map((video) => (
        <div key={video.id} className="snap-start snap-always">
          <VideoCard video={video} />
        </div>
      ))}
    </div>
  );
}

// app/page.tsx
'use client';

import Link from 'next/link';
import { Play, Grid } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Instagram Clone
          </h1>
          <p className="text-gray-600">
            Video Feed & Reels with Auto-play
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/feed"
            className="flex items-center justify-between w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Grid size={28} />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">Video Feed</h2>
                <p className="text-sm text-white/80">Grid layout</p>
              </div>
            </div>
            <div className="text-2xl">→</div>
          </Link>

          <Link
            href="/reels"
            className="flex items-center justify-between w-full bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Play size={28} />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">Reels</h2>
                <p className="text-sm text-white/80">Full screen</p>
              </div>
            </div>
            <div className="text-2xl">→</div>
          </Link>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Built with Next.js 15.5.4 & TypeScript</p>
        </div>
      </div>
    </div>
  );
}

// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Instagram Clone - Video Feed & Reels',
  description: 'Instagram-like video feed and reels with auto-play functionality',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

// app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}

// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;

// package.json
{
  "name": "instagram-video-feed",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.5.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^3.4.1",
    "postcss": "^8",
    "autoprefixer": "^10.0.1"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

🎯 Características Implementadas
1. Feed de Videos (Grid Layout)

Grid de 3 columnas con videos en aspecto cuadrado
Reproducción automática al entrar en el viewport
Pausa automática al salir del viewport
Overlay con información del usuario

2. Reels (Pantalla Completa)

Videos en pantalla completa vertical
Scroll snap para navegación fluida
Controles de interacción (likes, comentarios, compartir)
Información de usuario y descripción

3. Características Técnicas
Custom Hook useVideoAutoplay

