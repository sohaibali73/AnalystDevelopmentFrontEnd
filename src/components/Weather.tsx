'use client'

import React from 'react';
import { Cloud, CloudRain, Sun } from 'lucide-react';

export interface WeatherProps {
  city?: string;
  temperature?: number;
  condition?: 'sunny' | 'cloudy' | 'rainy';
}

export function Weather({ city = 'New York', temperature = 72, condition = 'sunny' }: WeatherProps) {
  const getWeatherIcon = () => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-12 h-12 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="w-12 h-12 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="w-12 h-12 text-blue-500" />;
      default:
        return <Sun className="w-12 h-12 text-yellow-500" />;
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{city}</h3>
          <p className="text-2xl font-bold">{temperature}Â°F</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{condition}</p>
        </div>
        <div>{getWeatherIcon()}</div>
      </div>
    </div>
  );
}

export default Weather;
