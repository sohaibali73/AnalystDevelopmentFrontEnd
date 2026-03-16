'use client';

import React from 'react';
import { Cloud, CloudRain, CloudSnow, CloudLightning, Sun, CloudSun, Wind, Droplets, Eye, Thermometer, Sunrise, Sunset } from 'lucide-react';

interface ForecastDay {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  icon?: string;
  precipitation_chance?: number;
}

interface WeatherCardProps {
  city?: string;
  location?: string;  // Backend returns 'location' instead of 'city'
  country?: string;
  temperature?: number;
  feels_like?: number;
  condition?: string;
  condition_text?: string;  // Backend returns both 'condition' and 'condition_text'
  description?: string;
  humidity?: number;
  wind_speed?: number;
  wind_direction?: string;
  visibility?: number;
  visibility_unit?: string;
  pressure?: number;
  uv_index?: number;
  sunrise?: string;
  sunset?: string;
  forecast?: ForecastDay[];
  unit?: 'F' | 'C';
  temp_unit?: string;  // Backend returns '°F' or '°C'
  wind_unit?: string;
  icon?: string;
  success?: boolean;
  error?: string;
  [key: string]: any;
}

const conditionConfig: Record<string, { Icon: any; gradient: string; accent: string }> = {
  sunny: { Icon: Sun, gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)', accent: '#FCD34D' },
  clear: { Icon: Sun, gradient: 'linear-gradient(135deg, #1E3A5F 0%, #0f172a 50%, #1e1b4b 100%)', accent: '#FCD34D' },
  cloudy: { Icon: Cloud, gradient: 'linear-gradient(135deg, #374151 0%, #1F2937 50%, #111827 100%)', accent: '#9CA3AF' },
  partly_cloudy: { Icon: CloudSun, gradient: 'linear-gradient(135deg, #1E3A5F 0%, #374151 50%, #1F2937 100%)', accent: '#60A5FA' },
  rainy: { Icon: CloudRain, gradient: 'linear-gradient(135deg, #1E3A5F 0%, #1e293b 50%, #0f172a 100%)', accent: '#60A5FA' },
  rain: { Icon: CloudRain, gradient: 'linear-gradient(135deg, #1E3A5F 0%, #1e293b 50%, #0f172a 100%)', accent: '#60A5FA' },
  snow: { Icon: CloudSnow, gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #64748b 100%)', accent: '#E2E8F0' },
  thunderstorm: { Icon: CloudLightning, gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', accent: '#A78BFA' },
  windy: { Icon: Wind, gradient: 'linear-gradient(135deg, #134e4a 0%, #115e59 50%, #0f766e 100%)', accent: '#5EEAD4' },
};

const getConditionStyle = (condition: string | undefined | null) => {
  if (!condition) return conditionConfig.cloudy;
  const key = condition.toLowerCase().replace(/\s+/g, '_');
  return conditionConfig[key] || conditionConfig.cloudy;
};

const getSmallIcon = (condition: string | undefined | null) => {
  const { Icon } = getConditionStyle(condition);
  return <Icon size={16} />;
};

export function WeatherCard(props: WeatherCardProps) {
  // Normalize: accept both frontend naming (city) and backend naming (location)
  const city = props.city || props.location || 'Unknown';
  const country = props.country || '';
  const temperature = props.temperature ?? 0;
  const feels_like = props.feels_like;
  const condition = props.condition || props.condition_text || 'cloudy';
  const description = props.description || props.condition_text || '';
  const humidity = props.humidity;
  const wind_speed = props.wind_speed;
  const wind_direction = props.wind_direction || '';
  const visibility = props.visibility;
  const pressure = props.pressure;
  const uv_index = props.uv_index;
  const sunrise = props.sunrise;
  const sunset = props.sunset;
  const forecast = props.forecast || [];
  const unit = props.unit || (props.temp_unit?.includes('C') ? 'C' : 'F') as 'F' | 'C';

  // Show error state if the tool returned an error
  if (props.success === false && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '14px', maxWidth: '420px' }}>
        <strong>Weather Error:</strong> {props.error}
      </div>
    );
  }

  const { Icon, gradient, accent } = getConditionStyle(condition);

  return (
    <div style={{
      borderRadius: '16px',
      background: gradient,
      color: '#fff',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      maxWidth: '420px',
    }}>
      {/* Main weather */}
      <div style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Background icon */}
        <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.08 }}>
          <Icon size={160} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.5px' }}>{city}</h3>
              {country && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{country}</div>}
            </div>
            <Icon size={40} color={accent} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '16px 0 4px' }}>
            <span style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1, fontFamily: 'monospace' }}>{Math.round(temperature)}</span>
            <span style={{ fontSize: '24px', fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>°{unit}</span>
          </div>

          <div style={{ fontSize: '14px', fontWeight: 600, textTransform: 'capitalize', color: accent }}>{condition}</div>
          {description && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{description}</div>}

          {feels_like !== undefined && (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
              Feels like {Math.round(feels_like)}°{unit}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
        {humidity !== undefined && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <Droplets size={16} color={accent} style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{humidity}%</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Humidity</div>
          </div>
        )}
        {wind_speed !== undefined && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <Wind size={16} color={accent} style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{wind_speed} mph</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Wind {wind_direction || ''}</div>
          </div>
        )}
        {visibility !== undefined && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <Eye size={16} color={accent} style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{visibility} mi</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Visibility</div>
          </div>
        )}
        {uv_index !== undefined && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <Sun size={16} color={accent} style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{uv_index}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>UV Index</div>
          </div>
        )}
        {sunrise && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <Sunrise size={16} color="#FCD34D" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{sunrise}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Sunrise</div>
          </div>
        )}
        {sunset && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <Sunset size={16} color="#FB923C" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{sunset}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Sunset</div>
          </div>
        )}
      </div>

      {/* Forecast */}
      {forecast.length > 0 && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            {forecast.length}-Day Forecast
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {forecast.map((day, i) => (
              <div key={i} style={{
                flex: 1, padding: '10px 6px', borderRadius: '10px', textAlign: 'center',
                backgroundColor: i === 0 ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>{day.day}</div>
                <div style={{ marginBottom: '6px' }}>{getSmallIcon(day.condition)}</div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{Math.round(day.high)}°</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{Math.round(day.low)}°</div>
                {day.precipitation_chance !== undefined && day.precipitation_chance > 0 && (
                  <div style={{ fontSize: '10px', color: '#60A5FA', marginTop: '4px' }}>
                    <Droplets size={8} style={{ display: 'inline', verticalAlign: 'middle' }} /> {day.precipitation_chance}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WeatherCard;
