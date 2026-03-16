'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface Movie {
  id: string;
  title: string;
  year: number;
  duration: number;
  rating: string;
  genre: string;
  description: string;
}

interface TVShow {
  id: string;
  title: string;
  seasons: number;
  rating: string;
  description: string;
}

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
}

interface FlightInfo {
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  aircraft: string;
  altitude: string;
  groundSpeed: string;
  temperature: string;
  distanceRemaining: string;
  timeRemaining: string;
  progress: number;
}

// Mock Data
const MOVIES: Movie[] = [
  { id: '1', title: 'Oppenheimer', year: 2023, duration: 180, rating: 'R', genre: 'Drama', description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.' },
  { id: '2', title: 'Dune: Part Two', year: 2024, duration: 166, rating: 'PG-13', genre: 'Sci-Fi', description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.' },
  { id: '3', title: 'The Batman', year: 2022, duration: 176, rating: 'PG-13', genre: 'Action', description: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate.' },
  { id: '4', title: 'Top Gun: Maverick', year: 2022, duration: 130, rating: 'PG-13', genre: 'Action', description: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator.' },
  { id: '5', title: 'Everything Everywhere All at Once', year: 2022, duration: 139, rating: 'R', genre: 'Sci-Fi', description: 'A middle-aged Chinese immigrant is swept up in an insane adventure.' },
  { id: '6', title: 'Killers of the Flower Moon', year: 2023, duration: 206, rating: 'R', genre: 'Crime', description: 'Members of the Osage tribe in the United States are murdered under mysterious circumstances.' },
  { id: '7', title: 'Barbie', year: 2023, duration: 114, rating: 'PG-13', genre: 'Comedy', description: 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land.' },
  { id: '8', title: 'Poor Things', year: 2023, duration: 141, rating: 'R', genre: 'Drama', description: 'The incredible tale about the fantastical evolution of Bella Baxter.' },
  { id: '9', title: 'The Holdovers', year: 2023, duration: 133, rating: 'R', genre: 'Comedy', description: 'A cranky history teacher at a remote prep school is forced to remain on campus over the holidays.' },
  { id: '10', title: 'American Fiction', year: 2023, duration: 117, rating: 'R', genre: 'Comedy', description: 'A novelist who is fed up with the establishment profiting from Black entertainment uses a pen name.' },
];

const TV_SHOWS: TVShow[] = [
  { id: '1', title: 'The Bear', seasons: 3, rating: 'TV-MA', description: 'A young chef from the fine dining world comes home to Chicago to run his family sandwich shop.' },
  { id: '2', title: 'Succession', seasons: 4, rating: 'TV-MA', description: 'The Roy family is known for controlling the biggest media and entertainment company in the world.' },
  { id: '3', title: 'The Last of Us', seasons: 2, rating: 'TV-MA', description: 'After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl.' },
  { id: '4', title: 'Severance', seasons: 2, rating: 'TV-MA', description: 'Mark leads a team of office workers whose memories have been surgically divided.' },
  { id: '5', title: 'Yellowstone', seasons: 5, rating: 'TV-MA', description: 'The Dutton family controls the largest contiguous ranch in the U.S.' },
  { id: '6', title: 'Shogun', seasons: 1, rating: 'TV-MA', description: 'Set in feudal Japan, Lord Yoshii Toranaga fights for his life as his enemies unite against him.' },
  { id: '7', title: 'True Detective', seasons: 4, rating: 'TV-MA', description: 'An anthology series in which police investigations unearth the personal and professional secrets.' },
  { id: '8', title: 'The White Lotus', seasons: 3, rating: 'TV-MA', description: 'A social satire following the exploits of various guests and employees at a tropical resort.' },
];

const MUSIC_TRACKS: MusicTrack[] = [
  { id: '1', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: 200 },
  { id: '2', title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', duration: 200 },
  { id: '3', title: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer Vacation', duration: 200 },
  { id: '4', title: 'As It Was', artist: 'Harry Styles', album: "Harry's House", duration: 200 },
  { id: '5', title: 'Vampire', artist: 'Olivia Rodrigo', album: 'GUTS', duration: 200 },
  { id: '6', title: 'Kill Bill', artist: 'SZA', album: 'SOS', duration: 200 },
  { id: '7', title: 'Cruel Summer', artist: 'Taylor Swift', album: 'Lover', duration: 200 },
  { id: '8', title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', album: 'F*ck Love 3', duration: 200 },
  { id: '9', title: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland', duration: 200 },
  { id: '10', title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR', duration: 200 },
];

const PODCASTS = [
  { id: '1', title: 'The Daily', episodes: 1250, description: 'This is what the news should sound like.' },
  { id: '2', title: 'Serial', episodes: 48, description: 'One story told week by week.' },
  { id: '3', title: 'SmartLess', episodes: 200, description: 'Three actors talk to interesting people.' },
  { id: '4', title: 'Armchair Expert', episodes: 450, description: 'Experts on everything, usually nothing.' },
];

const GAMES = [
  { id: '1', title: 'Trivia Challenge', description: 'Test your knowledge across multiple categories' },
  { id: '2', title: 'Blackjack', description: 'Classic casino card game' },
  { id: '3', title: 'Sudoku', description: 'Number puzzle game' },
  { id: '4', title: 'Chess', description: 'Play against the computer' },
  { id: '5', title: 'Solitaire', description: 'Classic card game' },
  { id: '6', title: 'Word Puzzle', description: 'Find words from letters' },
];

// Utility Functions
const formatDuration = (minutes: number): string => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Delta Logo Component
const DeltaLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 40" className={`w-24 h-8 ${className}`}>
    <defs>
      <linearGradient id="deltaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#003366" />
        <stop offset="100%" stopColor="#0055A5" />
      </linearGradient>
    </defs>
    <path
      d="M10 8 L60 32 L110 8 Z"
      fill="url(#deltaGrad)"
    />
    <text x="60" y="22" textAnchor="middle" fill="#E31837" fontSize="10" fontWeight="bold" fontFamily="sans-serif">DELTA</text>
  </svg>
);

// Flight Map Component
const FlightMap: React.FC<{ flight: FlightInfo }> = ({ flight }) => {
  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#0a1628] to-[#0d1f3c] rounded-lg overflow-hidden">
      {/* Map background */}
      <svg viewBox="0 0 800 400" className="w-full h-full opacity-40">
        {/* US outline */}
        <path
          d="M50,200 Q150,120 300,140 Q400,100 500,120 Q600,100 700,150 Q750,200 700,280 Q600,320 500,300 Q400,340 300,300 Q150,330 50,280 Q30,230 50,200"
          fill="none"
          stroke="#1e4976"
          strokeWidth="2"
        />
        {/* Grid lines */}
        <g stroke="#1e3a5f" strokeWidth="0.5" opacity="0.3">
          {[100, 200, 300, 400, 500, 600, 700].map(x => (
            <line key={`v${x}`} x1={x} y1="50" x2={x} y2="350" />
          ))}
          {[100, 150, 200, 250, 300, 350].map(y => (
            <line key={`h${y}`} x1="50" y1={y} x2="750" y2={y} />
          ))}
        </g>
      </svg>

      {/* Flight path */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="flightPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0055A5" />
            <stop offset={`${flight.progress}%`} stopColor="#0055A5" />
            <stop offset={`${flight.progress + 1}%`} stopColor="#E31837" />
            <stop offset="100%" stopColor="#E31837" />
          </linearGradient>
        </defs>
        
        {/* Path line */}
        <path
          d="M150,220 Q400,150 650,200"
          fill="none"
          stroke="url(#flightPathGrad)"
          strokeWidth="3"
          strokeDasharray={`${flight.progress * 6.5}, 1000`}
        />
        
        {/* Origin point */}
        <circle cx="150" cy="220" r="8" fill="#0055A5" />
        <circle cx="150" cy="220" r="4" fill="white" />
        
        {/* Destination point */}
        <circle cx="650" cy="200" r="8" fill="#E31837" />
        <circle cx="650" cy="200" r="4" fill="white" />
        
        {/* Aircraft icon */}
        <g transform={`translate(${150 + (flight.progress / 100) * 500}, ${220 - (flight.progress / 100) * 20})`}>
          <circle r="12" fill="#E31837" />
          <path d="M-8,0 L8,0 M0,-6 L0,6" stroke="white" strokeWidth="2" />
        </g>
      </svg>

      {/* City labels */}
      <div className="absolute top-[52%] left-[15%] text-white text-sm font-semibold">
        {flight.origin}
        <div className="text-[10px] text-white/60">{flight.originCity}</div>
      </div>
      <div className="absolute top-[45%] right-[15%] text-white text-sm font-semibold">
        {flight.destination}
        <div className="text-[10px] text-white/60">{flight.destinationCity}</div>
      </div>

      {/* Flight info overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-3 backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-4 text-center text-white text-xs">
          <div>
            <div className="text-white/60">Altitude</div>
            <div className="font-semibold">{flight.altitude}</div>
          </div>
          <div>
            <div className="text-white/60">Speed</div>
            <div className="font-semibold">{flight.groundSpeed}</div>
          </div>
          <div>
            <div className="text-white/60">Remaining</div>
            <div className="font-semibold">{flight.distanceRemaining}</div>
          </div>
          <div>
            <div className="text-white/60">ETA</div>
            <div className="font-semibold">{flight.timeRemaining}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Video Player Component
const VideoPlayer: React.FC<{
  item: Movie | TVShow | null;
  type: 'movie' | 'tv';
  onClose: () => void;
}> = ({ item, type, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);
  const [showControls, setShowControls] = useState(true);
  const duration = type === 'movie' ? (item as Movie)?.duration || 120 : 45;
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTime < duration * 60) {
      interval = setInterval(() => {
        setCurrentTime(t => Math.min(t + 1, duration * 60));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  if (!item) return null;

  return (
    <div 
      className="relative w-full h-full bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* Video area (simulated) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f1a]">
        {/* Simulated video content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white/20 text-6xl font-bold mb-4">{item.title}</div>
            <div className="text-white/40 text-sm">Now Playing</div>
          </div>
        </div>
      </div>

      {/* Controls overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="text-white hover:text-white/80 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-white text-sm font-medium">{item.title}</div>
          <div className="w-6" />
        </div>

        {/* Center play/pause */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div 
              className="h-1 bg-white/30 rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                setCurrentTime(Math.floor(percent * duration * 60));
              }}
            >
              <div 
                className="h-full bg-[#E31837] rounded-full relative"
                style={{ width: `${(currentTime / (duration * 60)) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
              </div>
            </div>
            <div className="flex justify-between text-white/60 text-xs mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration * 60)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Rewind */}
              <button className="text-white hover:text-white/80 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>

              {/* Play/Pause */}
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:text-white/80 transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Forward */}
              <button className="text-white hover:text-white/80 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Media Card Component
const MediaCard: React.FC<{
  title: string;
  subtitle?: string;
  rating?: string;
  onClick: () => void;
}> = ({ title, subtitle, rating, onClick }) => (
  <button
    onClick={onClick}
    className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#0a1628] hover:ring-2 hover:ring-[#E31837] transition-all group"
  >
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-white/20 text-2xl font-bold text-center px-2">{title}</div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-2">
      <div className="text-white text-sm font-medium truncate">{title}</div>
      {subtitle && <div className="text-white/60 text-xs truncate">{subtitle}</div>}
      {rating && (
        <div className="inline-block mt-1 px-1.5 py-0.5 bg-white/20 rounded text-white/80 text-[10px]">
          {rating}
        </div>
      )}
    </div>
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  </button>
);

// Music Player Component
const MusicPlayer: React.FC<{
  track: MusicTrack;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}> = ({ track, isPlaying, onPlayPause, onNext, onPrev }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => (p >= 100 ? 0 : p + 0.5));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-xl p-6">
      <div className="flex items-center gap-6">
        {/* Album art */}
        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-[#E31837] to-[#0055A5] flex items-center justify-center flex-shrink-0">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-lg truncate">{track.title}</div>
          <div className="text-white/60 text-sm truncate">{track.artist}</div>
          <div className="text-white/40 text-xs truncate">{track.album}</div>
          
          {/* Progress */}
          <div className="mt-3">
            <div className="h-1 bg-white/20 rounded-full">
              <div 
                className="h-full bg-[#E31837] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-white/40 text-xs mt-1">
              <span>{formatTime(Math.floor(progress * track.duration / 100))}</span>
              <span>{formatTime(track.duration)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button onClick={onPrev} className="text-white hover:text-white/80 transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button 
            onClick={onPlayPause}
            className="w-12 h-12 rounded-full bg-[#E31837] flex items-center justify-center hover:bg-[#c41530] transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button onClick={onNext} className="text-white hover:text-white/80 transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Settings Panel Component
const SettingsPanel: React.FC<{
  brightness: number;
  volume: number;
  onBrightnessChange: (v: number) => void;
  onVolumeChange: (v: number) => void;
  onClose: () => void;
}> = ({ brightness, volume, onBrightnessChange, onVolumeChange, onClose }) => (
  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-[#1a1a2e] rounded-2xl p-6 w-80">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-lg font-semibold">Settings</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Brightness */}
      <div className="mb-6">
        <label className="text-white/60 text-sm mb-2 block">Brightness</label>
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-white/40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
          </svg>
          <input
            type="range"
            min="30"
            max="100"
            value={brightness}
            onChange={(e) => onBrightnessChange(Number(e.target.value))}
            className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>

      {/* Volume */}
      <div className="mb-6">
        <label className="text-white/60 text-sm mb-2 block">Volume</label>
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-white/40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>

      {/* Language */}
      <div className="mb-6">
        <label className="text-white/60 text-sm mb-2 block">Language</label>
        <select className="w-full bg-white/10 text-white rounded-lg px-3 py-2 border border-white/10">
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
          <option>Japanese</option>
          <option>Chinese</option>
        </select>
      </div>

      {/* Captions */}
      <div className="flex items-center justify-between">
        <span className="text-white text-sm">Closed Captions</span>
        <button className="w-12 h-6 bg-[#E31837] rounded-full relative">
          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
        </button>
      </div>
    </div>
  </div>
);

// Main IFE Screen Component
const IFEScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'movies' | 'tv' | 'music' | 'games' | 'map'>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedTVShow, setSelectedTVShow] = useState<TVShow | null>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(75);
  const [showFlightInfo, setShowFlightInfo] = useState(true);

  // Simulated flight progress
  const [flightProgress, setFlightProgress] = useState(63);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlightProgress(p => (p >= 100 ? 0 : p + 0.01));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const flight: FlightInfo = {
    flightNumber: 'DL 487',
    origin: 'JFK',
    originCity: 'New York',
    destination: 'LAX',
    destinationCity: 'Los Angeles',
    departureTime: '08:30',
    arrivalTime: '11:45',
    duration: '5h 15m',
    aircraft: 'Boeing 777-200LR',
    altitude: '38,000 ft',
    groundSpeed: '485 mph',
    temperature: '-56 C',
    distanceRemaining: `${Math.round((100 - flightProgress) * 24.7)} mi`,
    timeRemaining: `${Math.floor((100 - flightProgress) * 0.05)}h ${Math.floor(((100 - flightProgress) * 3) % 60)}m`,
    progress: flightProgress,
  };

  const handleTrackChange = (delta: number) => {
    setCurrentTrack(t => {
      const newTrack = t + delta;
      if (newTrack < 0) return MUSIC_TRACKS.length - 1;
      if (newTrack >= MUSIC_TRACKS.length) return 0;
      return newTrack;
    });
  };

  // Render video player if media is selected
  if (selectedMovie) {
    return (
      <div className="w-full h-full" style={{ filter: `brightness(${brightness}%)` }}>
        <VideoPlayer
          item={selectedMovie}
          type="movie"
          onClose={() => setSelectedMovie(null)}
        />
      </div>
    );
  }

  if (selectedTVShow) {
    return (
      <div className="w-full h-full" style={{ filter: `brightness(${brightness}%)` }}>
        <VideoPlayer
          item={selectedTVShow}
          type="tv"
          onClose={() => setSelectedTVShow(null)}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0a1628]" style={{ filter: `brightness(${brightness}%)` }}>
      {/* Settings overlay */}
      {showSettings && (
        <SettingsPanel
          brightness={brightness}
          volume={volume}
          onBrightnessChange={setBrightness}
          onVolumeChange={setVolume}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#003366] to-[#0055A5] px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo and flight info */}
          <div className="flex items-center gap-4">
            <DeltaLogo />
            <div className="text-white text-sm">
              <span className="font-semibold">{flight.flightNumber}</span>
              <span className="text-white/60 ml-2">{flight.origin} to {flight.destination}</span>
            </div>
          </div>

          {/* Time and status */}
          <div className="flex items-center gap-6">
            {showFlightInfo && (
              <div className="flex items-center gap-4 text-white text-sm">
                <div>
                  <span className="text-white/60">Arrives </span>
                  <span className="font-semibold">{flight.arrivalTime}</span>
                </div>
                <div className="w-px h-4 bg-white/30" />
                <div>
                  <span className="text-white/60">Time Remaining </span>
                  <span className="font-semibold">{flight.timeRemaining}</span>
                </div>
              </div>
            )}
            
            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="text-white hover:text-white/80 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left sidebar */}
        <div className="w-16 bg-[#0a1628] border-r border-white/10 flex flex-col items-center py-4">
          {[
            { id: 'home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            { id: 'movies', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
            { id: 'tv', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
            { id: 'music', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
            { id: 'games', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-[#E31837] text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Home Tab */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* Flight map */}
              <div className="h-48 rounded-xl overflow-hidden">
                <FlightMap flight={flight} />
              </div>

              {/* Quick access */}
              <div>
                <h2 className="text-white text-lg font-semibold mb-3">Continue Watching</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {MOVIES.slice(0, 4).map((movie) => (
                    <div key={movie.id} className="flex-shrink-0 w-32">
                      <MediaCard
                        title={movie.title}
                        rating={movie.rating}
                        onClick={() => setSelectedMovie(movie)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('movies')}
                  className="bg-gradient-to-r from-[#E31837] to-[#0055A5] rounded-xl p-4 text-left hover:opacity-90 transition-opacity"
                >
                  <div className="text-white text-lg font-semibold">Movies</div>
                  <div className="text-white/60 text-sm">{MOVIES.length} titles available</div>
                </button>
                <button
                  onClick={() => setActiveTab('tv')}
                  className="bg-gradient-to-r from-[#0055A5] to-[#E31837] rounded-xl p-4 text-left hover:opacity-90 transition-opacity"
                >
                  <div className="text-white text-lg font-semibold">TV Shows</div>
                  <div className="text-white/60 text-sm">{TV_SHOWS.length} series available</div>
                </button>
              </div>

              {/* Music section */}
              <div>
                <h2 className="text-white text-lg font-semibold mb-3">Now Playing</h2>
                <MusicPlayer
                  track={MUSIC_TRACKS[currentTrack]}
                  isPlaying={isMusicPlaying}
                  onPlayPause={() => setIsMusicPlaying(!isMusicPlaying)}
                  onNext={() => handleTrackChange(1)}
                  onPrev={() => handleTrackChange(-1)}
                />
              </div>
            </div>
          )}

          {/* Movies Tab */}
          {activeTab === 'movies' && (
            <div>
              <h2 className="text-white text-lg font-semibold mb-4">Movies</h2>
              <div className="grid grid-cols-4 gap-4">
                {MOVIES.map((movie) => (
                  <MediaCard
                    key={movie.id}
                    title={movie.title}
                    subtitle={formatDuration(movie.duration)}
                    rating={movie.rating}
                    onClick={() => setSelectedMovie(movie)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TV Shows Tab */}
          {activeTab === 'tv' && (
            <div>
              <h2 className="text-white text-lg font-semibold mb-4">TV Shows</h2>
              <div className="grid grid-cols-4 gap-4">
                {TV_SHOWS.map((show) => (
                  <MediaCard
                    key={show.id}
                    title={show.title}
                    subtitle={`${show.seasons} Season${show.seasons > 1 ? 's' : ''}`}
                    rating={show.rating}
                    onClick={() => setSelectedTVShow(show)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Music Tab */}
          {activeTab === 'music' && (
            <div className="space-y-4">
              <h2 className="text-white text-lg font-semibold">Music</h2>
              
              {/* Now playing */}
              <MusicPlayer
                track={MUSIC_TRACKS[currentTrack]}
                isPlaying={isMusicPlaying}
                onPlayPause={() => setIsMusicPlaying(!isMusicPlaying)}
                onNext={() => handleTrackChange(1)}
                onPrev={() => handleTrackChange(-1)}
              />

              {/* Track list */}
              <div className="bg-white/5 rounded-xl overflow-hidden">
                {MUSIC_TRACKS.map((track, idx) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setCurrentTrack(idx);
                      setIsMusicPlaying(true);
                    }}
                    className={`w-full flex items-center gap-4 p-3 text-left hover:bg-white/10 transition-colors ${
                      currentTrack === idx ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="w-8 text-white/40 text-sm">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${currentTrack === idx ? 'text-[#E31837]' : 'text-white'}`}>
                        {track.title}
                      </div>
                      <div className="text-white/60 text-xs truncate">{track.artist}</div>
                    </div>
                    <div className="text-white/40 text-xs">{formatTime(track.duration)}</div>
                    {currentTrack === idx && isMusicPlaying && (
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-3 bg-[#E31837] animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-0.5 h-3 bg-[#E31837] animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="w-0.5 h-3 bg-[#E31837] animate-pulse" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div>
              <h2 className="text-white text-lg font-semibold mb-4">Games</h2>
              <div className="grid grid-cols-3 gap-4">
                {GAMES.map((game) => (
                  <button
                    key={game.id}
                    className="aspect-video rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0a1628] p-4 text-left hover:ring-2 hover:ring-[#E31837] transition-all"
                  >
                    <div className="text-white font-semibold">{game.title}</div>
                    <div className="text-white/60 text-xs mt-1">{game.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Map Tab */}
          {activeTab === 'map' && (
            <div className="h-full">
              <FlightMap flight={flight} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#003366] px-4 py-2">
        <div className="flex items-center justify-between text-white/60 text-xs">
          <div>Seat 14A | Boeing 777-200LR</div>
          <div>Delta Sync IFE v4.2.1</div>
          <div className="flex items-center gap-2">
            <span>WiFi Available</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

// Seat Back Frame - The physical seat representation
const SeatBackFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative w-full h-screen bg-gradient-to-b from-[#1a1a1a] via-[#151515] to-[#0a0a0a] overflow-hidden">
    {/* Seat texture overlay */}
    <div className="absolute inset-0 opacity-10">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px',
        }}
      />
    </div>

    {/* Headrest area */}
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-80 h-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-b-3xl shadow-inner" />
      <div className="absolute inset-2 bg-gradient-to-b from-[#333] to-[#222] rounded-b-2xl">
        {/* Headrest stitching */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-[#444] rounded" />
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-[#444] rounded" />
      </div>
    </div>

    {/* Left side of seat back */}
    <div className="absolute top-28 left-0 w-32 h-full bg-gradient-to-r from-[#252525] to-[#1a1a1a]">
      {/* Seat material texture */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.02) 50%)',
        backgroundSize: '4px 4px',
      }} />
    </div>

    {/* Right side of seat back */}
    <div className="absolute top-28 right-0 w-32 h-full bg-gradient-to-l from-[#252525] to-[#1a1a1a]">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.02) 50%)',
        backgroundSize: '4px 4px',
      }} />
    </div>

    {/* Main IFE Screen Container */}
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-[85%] max-w-[1100px]" style={{ height: 'calc(100% - 280px)' }}>
      {/* Screen bezel */}
      <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl">
        {/* Outer frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0f0f0f] rounded-lg border border-[#333]" />
        
        {/* Inner bezel */}
        <div className="absolute inset-2 rounded-md overflow-hidden">
          {/* The actual IFE screen */}
          {children}
        </div>

        {/* Screen reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-lg" />
      </div>

      {/* Screen bezel shadow */}
      <div className="absolute -bottom-2 left-4 right-4 h-4 bg-black/50 blur-md rounded-full" />
    </div>

    {/* Tray table (folded up) */}
    <div className="absolute bottom-52 right-40 w-52 h-2 bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a] rounded-t-sm shadow-lg">
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-[#444] rounded-t" />
    </div>

    {/* Seat pocket */}
    <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 w-72 h-20">
      <div className="absolute inset-0 bg-[#1a1a1a] rounded-t-lg border-t border-x border-[#333]" />
      <div className="absolute top-2 left-2 right-2 h-16 bg-[#151515] rounded-t border-t border-[#222]" />
      {/* Items in pocket */}
      <div className="absolute top-1 left-4 w-8 h-10 bg-white/80 rounded-sm" />
      <div className="absolute top-1 left-14 w-8 h-10 bg-white/80 rounded-sm" />
      <div className="absolute top-1 right-4 w-12 h-8 bg-[#E31837]/80 rounded-sm" />
    </div>

    {/* Left armrest */}
    <div className="absolute bottom-0 left-0 w-28 h-40">
      <div className="absolute inset-0 bg-gradient-to-r from-[#2a2a2a] to-[#1f1f1f] rounded-tr-3xl" />
      <div className="absolute top-6 right-4 w-5 h-5 rounded-full bg-[#444] border-2 border-[#555] shadow-inner" />
      <div className="absolute top-16 right-6 w-4 h-8 bg-[#333] rounded border border-[#444]" />
    </div>

    {/* Right armrest */}
    <div className="absolute bottom-0 right-0 w-28 h-40">
      <div className="absolute inset-0 bg-gradient-to-l from-[#2a2a2a] to-[#1f1f1f] rounded-tl-3xl" />
      <div className="absolute top-6 left-4 w-5 h-5 rounded-full bg-[#444] border-2 border-[#555] shadow-inner" />
      <div className="absolute top-16 left-6 w-4 h-8 bg-[#333] rounded border border-[#444]" />
    </div>

    {/* Floor shadow */}
    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />

    {/* Seat back stitching details */}
    <div className="absolute top-32 left-16 w-0.5 h-32 bg-[#333] rounded" />
    <div className="absolute top-32 right-16 w-0.5 h-32 bg-[#333] rounded" />
  </div>
);

// Main Page Component
export default function DeltaIFEPage() {
  return (
    <SeatBackFrame>
      <IFEScreen />
    </SeatBackFrame>
  );
}