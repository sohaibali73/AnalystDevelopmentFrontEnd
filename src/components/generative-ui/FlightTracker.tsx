'use client';

import React from 'react';
import { Plane, Clock, MapPin, Luggage, Info } from 'lucide-react';

interface FlightTrackerProps {
  flight_number?: string;
  airline?: string;
  airline_logo?: string;
  status?: string; // 'on_time' | 'delayed' | 'boarding' | 'in_flight' | 'landed' | 'cancelled' | 'diverted'
  departure_city?: string;
  departure_code?: string;
  departure_airport?: string;
  departure_time?: string;
  departure_actual?: string;
  departure_gate?: string;
  departure_terminal?: string;
  arrival_city?: string;
  arrival_code?: string;
  arrival_airport?: string;
  arrival_time?: string;
  arrival_actual?: string;
  arrival_gate?: string;
  arrival_terminal?: string;
  baggage_claim?: string;
  progress?: number; // 0-100
  duration?: string;
  aircraft?: string;
  altitude?: string;
  speed?: string;
  delay_minutes?: number;
  date?: string;
  error?: string;
  success?: boolean;
  [key: string]: any;
}

function getStatusConfig(status?: string) {
  switch (status?.toLowerCase()?.replace(/[\s-]/g, '_')) {
    case 'on_time': return { label: 'ON TIME', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' };
    case 'delayed': return { label: 'DELAYED', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
    case 'boarding': return { label: 'BOARDING', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
    case 'in_flight': case 'in_air': case 'enroute': return { label: 'IN FLIGHT', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' };
    case 'landed': case 'arrived': return { label: 'LANDED', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' };
    case 'cancelled': return { label: 'CANCELLED', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
    case 'diverted': return { label: 'DIVERTED', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
    case 'scheduled': return { label: 'SCHEDULED', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' };
    default: return { label: status?.toUpperCase() || 'UNKNOWN', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' };
  }
}

export function FlightTracker(props: FlightTrackerProps) {
  const statusCfg = getStatusConfig(props.status);
  const progress = props.progress ?? (props.status?.toLowerCase()?.includes('land') ? 100 : props.status?.toLowerCase()?.includes('flight') || props.status?.toLowerCase()?.includes('enroute') ? 55 : 0);
  const isInFlight = ['in_flight', 'in_air', 'enroute'].includes(props.status?.toLowerCase()?.replace(/[\s-]/g, '_') || '');

  if (props.success === false && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '14px', maxWidth: '520px' }}>
        <strong>Flight Error:</strong> {props.error}
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      maxWidth: '520px',
      marginTop: '8px',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plane size={16} color="#3B82F6" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' }}>
                {props.flight_number || 'Flight'}
              </span>
              <span style={{
                fontSize: '9px', fontWeight: 800,
                color: statusCfg.color, backgroundColor: statusCfg.bg,
                padding: '3px 8px', borderRadius: '4px',
                letterSpacing: '0.5px',
              }}>
                {statusCfg.label}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
              {props.airline || ''}{props.date ? ` \u00B7 ${props.date}` : ''}{props.aircraft ? ` \u00B7 ${props.aircraft}` : ''}
            </div>
          </div>
        </div>
        {props.delay_minutes && props.delay_minutes > 0 && (
          <div style={{
            fontSize: '11px', fontWeight: 700, color: '#EF4444',
            backgroundColor: 'rgba(239,68,68,0.1)',
            padding: '4px 8px', borderRadius: '6px',
          }}>
            +{props.delay_minutes}min
          </div>
        )}
      </div>

      {/* Flight route */}
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Departure */}
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: '2px', lineHeight: 1 }}>
              {props.departure_code || 'DEP'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontWeight: 500 }}>
              {props.departure_city || props.departure_airport || ''}
            </div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                {props.departure_actual || props.departure_time || '--:--'}
              </div>
              {props.departure_actual && props.departure_time && props.departure_actual !== props.departure_time && (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                  {props.departure_time}
                </div>
              )}
            </div>
            {(props.departure_gate || props.departure_terminal) && (
              <div style={{ marginTop: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                {props.departure_terminal && `T${props.departure_terminal}`}
                {props.departure_terminal && props.departure_gate && ' \u00B7 '}
                {props.departure_gate && `Gate ${props.departure_gate}`}
              </div>
            )}
          </div>

          {/* Flight path */}
          <div style={{ flex: 1.5, padding: '4px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {props.duration && (
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={10} /> {props.duration}
              </div>
            )}
            {/* Progress track */}
            <div style={{ width: '100%', position: 'relative', height: '20px' }}>
              {/* Track line */}
              <div style={{
                position: 'absolute', top: '50%', left: '0', right: '0', height: '2px',
                backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '1px',
                transform: 'translateY(-50%)',
              }} />
              {/* Progress fill */}
              <div style={{
                position: 'absolute', top: '50%', left: '0', height: '2px',
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: statusCfg.color, borderRadius: '1px',
                transform: 'translateY(-50%)',
                transition: 'width 1s ease',
              }} />
              {/* Dots at ends */}
              <div style={{
                position: 'absolute', top: '50%', left: '0', transform: 'translate(-50%, -50%)',
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: progress > 0 ? statusCfg.color : 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(15,23,42,1)',
              }} />
              <div style={{
                position: 'absolute', top: '50%', right: '0', transform: 'translate(50%, -50%)',
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: progress >= 100 ? statusCfg.color : 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(15,23,42,1)',
              }} />
              {/* Plane icon on track */}
              {isInFlight && (
                <div style={{
                  position: 'absolute', top: '50%',
                  left: `${Math.min(Math.max(progress, 5), 95)}%`,
                  transform: 'translate(-50%, -50%)',
                }}>
                  <Plane size={14} color="#3B82F6" fill="#3B82F6" style={{ transform: 'rotate(0deg)' }} />
                </div>
              )}
            </div>
          </div>

          {/* Arrival */}
          <div style={{ textAlign: 'right', flex: 1 }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: '2px', lineHeight: 1 }}>
              {props.arrival_code || 'ARR'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontWeight: 500 }}>
              {props.arrival_city || props.arrival_airport || ''}
            </div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                {props.arrival_actual || props.arrival_time || '--:--'}
              </div>
              {props.arrival_actual && props.arrival_time && props.arrival_actual !== props.arrival_time && (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                  {props.arrival_time}
                </div>
              )}
            </div>
            {(props.arrival_gate || props.arrival_terminal) && (
              <div style={{ marginTop: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                {props.arrival_terminal && `T${props.arrival_terminal}`}
                {props.arrival_terminal && props.arrival_gate && ' \u00B7 '}
                {props.arrival_gate && `Gate ${props.arrival_gate}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flight details footer */}
      {(props.baggage_claim || props.altitude || props.speed) && (
        <div style={{
          padding: '10px 20px 14px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: '16px', flexWrap: 'wrap',
        }}>
          {props.baggage_claim && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Luggage size={12} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Baggage: {props.baggage_claim}</span>
            </div>
          )}
          {props.altitude && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={12} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Alt: {props.altitude}</span>
            </div>
          )}
          {props.speed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plane size={12} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Speed: {props.speed}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FlightTracker;
