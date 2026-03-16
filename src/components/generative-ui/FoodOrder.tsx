'use client';

import React, { useState } from 'react';
import { UtensilsCrossed, Star, Clock, MapPin, ChevronDown, ChevronUp, ShoppingCart, Plus, Minus, DollarSign, Truck } from 'lucide-react';

interface MenuItem {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  category?: string;
  popular?: boolean;
  vegetarian?: boolean;
  vegan?: boolean;
  spicy?: boolean;
  rating?: number;
}

interface Restaurant {
  name?: string;
  cuisine?: string;
  rating?: number;
  review_count?: number;
  delivery_time?: string;
  delivery_fee?: number;
  minimum_order?: number;
  distance?: string;
  address?: string;
  image_url?: string;
  is_open?: boolean;
  promo?: string;
}

interface FoodOrderProps {
  restaurant?: Restaurant;
  restaurants?: Restaurant[];
  menu?: MenuItem[];
  items?: MenuItem[];
  query?: string;
  order_total?: number;
  delivery_estimate?: string;
  error?: string;
  success?: boolean;
  [key: string]: any;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={10} fill={i <= rating ? '#FEC00F' : 'transparent'} color={i <= rating ? '#FEC00F' : 'rgba(255,255,255,0.2)'} />
      ))}
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div style={{
      padding: '14px',
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', gap: '12px',
    }}>
      {/* Restaurant image/placeholder */}
      <div style={{
        width: '60px', height: '60px', borderRadius: '10px', flexShrink: 0,
        background: restaurant.image_url
          ? `url(${restaurant.image_url}) center/cover`
          : 'linear-gradient(135deg, rgba(254,192,15,0.2), rgba(254,192,15,0.05))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {!restaurant.image_url && <UtensilsCrossed size={20} color="#FEC00F" />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
              {restaurant.name || 'Restaurant'}
            </div>
            {restaurant.cuisine && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{restaurant.cuisine}</div>
            )}
          </div>
          {restaurant.is_open !== undefined && (
            <span style={{
              fontSize: '9px', fontWeight: 800,
              color: restaurant.is_open ? '#22C55E' : '#EF4444',
              backgroundColor: restaurant.is_open ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              padding: '3px 6px', borderRadius: '4px',
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              {restaurant.is_open ? 'OPEN' : 'CLOSED'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
          {restaurant.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <StarRating rating={restaurant.rating} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{restaurant.rating}</span>
              {restaurant.review_count && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>({restaurant.review_count})</span>}
            </div>
          )}
          {restaurant.delivery_time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
              <Clock size={10} /> {restaurant.delivery_time}
            </div>
          )}
          {restaurant.distance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
              <MapPin size={10} /> {restaurant.distance}
            </div>
          )}
        </div>

        {restaurant.promo && (
          <div style={{
            marginTop: '6px', fontSize: '10px', fontWeight: 700, color: '#22C55E',
            backgroundColor: 'rgba(34,197,94,0.1)',
            padding: '3px 8px', borderRadius: '4px', display: 'inline-block',
          }}>
            {restaurant.promo}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItemCard({ item }: { item: MenuItem }) {
  const [qty, setQty] = useState(0);

  return (
    <div style={{
      padding: '12px',
      backgroundColor: qty > 0 ? 'rgba(254,192,15,0.05)' : 'rgba(255,255,255,0.02)',
      borderRadius: '10px',
      border: qty > 0 ? '1px solid rgba(254,192,15,0.2)' : '1px solid rgba(255,255,255,0.04)',
      display: 'flex', gap: '10px',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{item.name || 'Item'}</span>
          {item.popular && <span style={{ fontSize: '8px', fontWeight: 800, color: '#FEC00F', backgroundColor: 'rgba(254,192,15,0.15)', padding: '2px 5px', borderRadius: '3px' }}>POPULAR</span>}
          {item.spicy && <span style={{ fontSize: '10px' }}>{'🌶️'}</span>}
          {item.vegetarian && <span style={{ fontSize: '8px', fontWeight: 800, color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.12)', padding: '2px 5px', borderRadius: '3px' }}>VEG</span>}
        </div>
        {item.description && (
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4', marginBottom: '6px' }}>
            {item.description}
          </div>
        )}
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FEC00F' }}>
          ${item.price?.toFixed(2) || '0.00'}
        </div>
      </div>

      {/* Quantity controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        {qty === 0 ? (
          <button
            onClick={() => setQty(1)}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: 'rgba(254,192,15,0.15)', border: '1px solid rgba(254,192,15,0.3)',
              color: '#FEC00F', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={14} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setQty(Math.max(0, qty - 1))}
              style={{
                width: '24px', height: '24px', borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Minus size={10} />
            </button>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', minWidth: '16px', textAlign: 'center' }}>
              {qty}
            </span>
            <button
              onClick={() => setQty(qty + 1)}
              style={{
                width: '24px', height: '24px', borderRadius: '6px',
                backgroundColor: 'rgba(254,192,15,0.15)', border: '1px solid rgba(254,192,15,0.3)',
                color: '#FEC00F', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Plus size={10} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function FoodOrder(props: FoodOrderProps) {
  const [showMenu, setShowMenu] = useState(true);
  const restaurant = props.restaurant;
  const restaurants = props.restaurants || [];
  const menu = props.menu || props.items || [];

  if (props.success === false && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '14px', maxWidth: '520px' }}>
        <strong>Food Order Error:</strong> {props.error}
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #1e1b2e 50%, #0f172a 100%)',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      maxWidth: '520px',
      marginTop: '8px',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'rgba(254,192,15,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UtensilsCrossed size={16} color="#FEC00F" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
              {restaurant?.name || (props.query ? `Food: "${props.query}"` : 'Food Order')}
            </h3>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {restaurant?.cuisine || `${restaurants.length > 0 ? restaurants.length + ' restaurants' : ''}`}
              {menu.length > 0 && ` \u00B7 ${menu.length} items`}
            </div>
          </div>
        </div>
        {props.delivery_estimate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            <Truck size={12} /> {props.delivery_estimate}
          </div>
        )}
      </div>

      {/* Featured restaurant */}
      {restaurant && (
        <div style={{ padding: '12px' }}>
          <RestaurantCard restaurant={restaurant} />
        </div>
      )}

      {/* Restaurant list */}
      {restaurants.length > 0 && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {restaurants.map((r, i) => <RestaurantCard key={i} restaurant={r} />)}
        </div>
      )}

      {/* Menu items */}
      {menu.length > 0 && (
        <>
          <div
            onClick={() => setShowMenu(!showMenu)}
            style={{
              padding: '10px 20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Menu ({menu.length} items)
            </span>
            {showMenu ? <ChevronUp size={14} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.3)" />}
          </div>
          {showMenu && (
            <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {menu.map((item, i) => <MenuItemCard key={i} item={item} />)}
            </div>
          )}
        </>
      )}

      {/* Order summary */}
      {props.order_total && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'rgba(254,192,15,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingCart size={14} color="#FEC00F" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Order Total</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#FEC00F', fontFamily: 'monospace' }}>
            ${props.order_total.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

export default FoodOrder;
