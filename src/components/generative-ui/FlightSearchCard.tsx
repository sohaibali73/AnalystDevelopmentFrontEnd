'use client';

import React, { useState } from 'react';
import { Plane, Clock, ArrowRight, DollarSign, ExternalLink, ChevronDown, ChevronUp, Users, Wifi } from 'lucide-react';

interface FlightSegment {
  flight: string;
  airline: string;
  from: string;
  to: string;
  departs: string;
  arrives: string;
  aircraft?: string;
}

interface FlightItinerary {
  duration: string;
  stops: number;
  stop_label: string;
  segments: FlightSegment[];
}

interface Flight {
  id: string;
  price: number;
  price_formatted: string;
  currency: string;
  airline: string;
  airline_code: string;
  cabin: string;
  seats_available?: number;
  outbound: FlightItinerary;
  return?: FlightItinerary | null;
  is_round_trip: boolean;
}

interface WebResult {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
}

interface FlightSearchCardProps {
  data: {
    success: boolean;
    tool: string;
    origin: string;
    origin_city?: string;
    destination: string;
    destination_city?: string;
    departure_date: string;
    return_date?: string;
    adults?: number;
    cabin_class?: string;
    trip_type?: string;
    flights_found?: number;
    cheapest_price?: string;
    cheapest_airline?: string;
    flights?: Flight[];
    web_results?: WebResult[];
    answer?: string;
    source?: string;
    note?: string;
    message?: string;
    booking_links?: string[];
    error?: string;
  };
}

function formatDateTime(dt: string): { date: string; time: string } {
  if (!dt) return { date: '', time: '' };
  try {
    const d = new Date(dt);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  } catch {
    // If not a valid date, try to parse as time string
    const parts = dt.split('T');
    return { date: parts[0] || '', time: parts[1]?.slice(0, 5) || dt };
  }
}

function AirlineLogo({ code, name }: { code: string; name: string }) {
  const colors: Record<string, string> = {
    AA: '#0078D2', UA: '#005DAA', DL: '#E01933', WN: '#304CB2',
    B6: '#003876', AS: '#01426A', F9: '#00A651', NK: '#FFCC00',
    G4: '#FF6600', SY: '#FF0000', default: '#6B7280',
  };
  const bg = colors[code?.toUpperCase()] || colors.default;
  return (
    <div
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#fff',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: 'monospace',
      }}
      title={name}
    >
      {code?.slice(0, 2).toUpperCase() || '??'}
    </div>
  );
}

function FlightRow({ flight, index, isSelected, onSelect }: {
  flight: Flight;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const outbound = flight.outbound || {};
  const dep = formatDateTime(outbound.segments?.[0]?.departs || '');
  const arr = formatDateTime(outbound.segments?.[outbound.segments?.length - 1]?.arrives || '');

  return (
    <div
      onClick={onSelect}
      style={{
        border: `1px solid ${isSelected ? '#FEC00F' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '12px',
        padding: '14px 16px',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'rgba(254,192,15,0.06)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.15s ease',
        marginBottom: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Airline logo */}
        <AirlineLogo code={flight.airline_code} name={flight.airline} />

        {/* Route info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
              {dep.time || outbound.segments?.[0]?.departs?.slice(11, 16) || '--:--'}
            </span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
              <span style={{
                fontSize: '10px',
                color: outbound.stops === 0 ? '#10B981' : '#F59E0B',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                padding: '2px 6px',
                backgroundColor: outbound.stops === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                borderRadius: '4px',
              }}>
                {outbound.stop_label || 'Nonstop'}
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
              {arr.time || outbound.segments?.[outbound.segments?.length - 1]?.arrives?.slice(11, 16) || '--:--'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            <span>{outbound.segments?.[0]?.from || '--'}</span>
            <ArrowRight size={10} />
            <span>{outbound.segments?.[outbound.segments?.length - 1]?.to || '--'}</span>
            <span style={{ marginLeft: '4px' }}>·</span>
            <Clock size={10} />
            <span>{outbound.duration || '--'}</span>
            <span>·</span>
            <span>{flight.airline}</span>
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#FEC00F', fontFamily: "'Rajdhani', sans-serif" }}>
            {flight.price_formatted}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            {flight.cabin?.toLowerCase() || 'economy'}
            {flight.seats_available && ` · ${flight.seats_available} left`}
          </div>
        </div>
      </div>

      {/* Expanded segment details */}
      {isSelected && outbound.segments && outbound.segments.length > 0 && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          {outbound.segments.map((seg, i) => {
            const segDep = formatDateTime(seg.departs);
            const segArr = formatDateTime(seg.arrives);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < outbound.segments.length - 1 ? '8px' : 0 }}>
                <Plane size={13} color="#FEC00F" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontWeight: 600 }}>
                  {seg.flight}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  {seg.from} {segDep.time || seg.departs?.slice(11, 16)} → {seg.to} {segArr.time || seg.arrives?.slice(11, 16)}
                </span>
                {seg.aircraft && (
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                    {seg.aircraft}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FlightSearchCard({ data }: FlightSearchCardProps) {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const isDark = true; // always dark in this app

  // Error state
  if (!data.success && data.error) {
    const hasLinks = data.booking_links && data.booking_links.length > 0;
    return (
      <div style={{
        backgroundColor: '#1A1A1A',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
        fontFamily: "'Quicksand', sans-serif",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Plane size={20} color="#FEC00F" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '16px', color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Flight Search
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.6, marginBottom: hasLinks ? '16px' : 0 }}>
          {data.error}
        </p>
        {hasLinks && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Search directly on:</p>
            {data.booking_links!.map((link, i) => {
              const domain = link.split('/')[2]?.replace('www.', '') || link;
              return (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(254,192,15,0.08)',
                  border: '1px solid rgba(254,192,15,0.2)',
                  borderRadius: '10px',
                  color: '#FEC00F',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}>
                  <ExternalLink size={14} />
                  {domain}
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Web search fallback results
  if (data.source === 'web_search' && data.web_results) {
    return (
      <div style={{
        backgroundColor: '#1A1A1A',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
        fontFamily: "'Quicksand', sans-serif",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Plane size={20} color="#FEC00F" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '16px', color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Flight Search Results
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
          {data.origin_city || data.origin} → {data.destination_city || data.destination} · {data.departure_date}
          {data.return_date && ` → ${data.return_date}`}
        </p>
        {data.answer && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(254,192,15,0.06)',
            border: '1px solid rgba(254,192,15,0.15)',
            borderRadius: '10px',
            marginBottom: '14px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.8)',
            lineHeight: 1.6,
          }}>
            {data.answer}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.web_results.map((result, i) => (
            <a key={i} href={result.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'block',
              padding: '12px 14px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px',
              textDecoration: 'none',
              transition: 'border-color 0.15s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FEC00F' }}>{result.title}</span>
                <ExternalLink size={11} color="rgba(255,255,255,0.3)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                {result.summary}
              </p>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', display: 'block' }}>
                {result.source}
              </span>
            </a>
          ))}
        </div>
        {data.note && (
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '12px', lineHeight: 1.5 }}>
            💡 {data.note}
          </p>
        )}
      </div>
    );
  }

  // No flights found
  if (!data.flights || data.flights.length === 0) {
    return (
      <div style={{
        backgroundColor: '#1A1A1A',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
        fontFamily: "'Quicksand', sans-serif",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Plane size={20} color="#FEC00F" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '16px', color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            No Flights Found
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
          {data.message || `No flights found from ${data.origin} to ${data.destination} on ${data.departure_date}.`}
        </p>
      </div>
    );
  }

  const displayedFlights = showAll ? data.flights : data.flights.slice(0, 3);

  return (
    <div style={{
      backgroundColor: '#1A1A1A',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      overflow: 'hidden',
      fontFamily: "'Quicksand', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(135deg, rgba(254,192,15,0.08) 0%, rgba(0,0,0,0) 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Plane size={18} color="#FEC00F" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '16px', color: '#fff', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Flight Search Results
          </span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: '#FEC00F',
            backgroundColor: 'rgba(254,192,15,0.1)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontWeight: 600,
          }}>
            {data.flights_found} flights found
          </span>
        </div>

        {/* Route summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
            {data.origin_city || data.origin}
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
            ({data.origin})
          </span>
          <ArrowRight size={14} color="#FEC00F" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
            {data.destination_city || data.destination}
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
            ({data.destination})
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '4px' }}>
            · {data.departure_date}
            {data.return_date && ` → ${data.return_date}`}
          </span>
          {data.adults && data.adults > 1 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              <Users size={11} />
              {data.adults} adults
            </span>
          )}
        </div>

        {/* Cheapest badge */}
        {data.cheapest_price && (
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Cheapest:</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#FEC00F', fontFamily: "'Rajdhani', sans-serif" }}>
              {data.cheapest_price}
            </span>
            {data.cheapest_airline && (
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>on {data.cheapest_airline}</span>
            )}
          </div>
        )}
      </div>

      {/* Flight list */}
      <div style={{ padding: '16px 20px' }}>
        {displayedFlights.map((flight, i) => (
          <FlightRow
            key={flight.id || i}
            flight={flight}
            index={i}
            isSelected={selectedFlight === (flight.id || String(i))}
            onSelect={() => setSelectedFlight(
              selectedFlight === (flight.id || String(i)) ? null : (flight.id || String(i))
            )}
          />
        ))}

        {data.flights.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              marginTop: '4px',
            }}
          >
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAll ? 'Show fewer' : `Show ${data.flights.length - 3} more flights`}
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
          {data.source === 'amadeus' ? '✓ Live data via Amadeus' : 'Prices may vary · Click a flight to see details'}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Google Flights', url: `https://www.google.com/flights?q=flights+from+${data.origin}+to+${data.destination}` },
            { label: 'Kayak', url: `https://www.kayak.com/flights/${data.origin}-${data.destination}/${data.departure_date}` },
          ].map(({ label, url }) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', color: '#FEC00F',
              textDecoration: 'none', fontWeight: 600,
            }}>
              <ExternalLink size={10} />
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
