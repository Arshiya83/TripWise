/**
 * TripWise — API Service Layer
 *
 * All backend communication goes through this file.
 * Base URL reads from the Vite env variable VITE_API_URL.
 * Do NOT call MongoDB directly from React — always go through Express.
 *
 * TODO (Stage 2): Replace the placeholder stubs with real axios calls
 *   once the backend endpoints are implemented.
 */

import axios from 'axios';

// ─── Axios Instance ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta?.env?.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: attach JWT token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tripwise_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err),
);

// ─── Response Interceptor: handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Do not redirect to /login if the 401 is from login or register attempts
      const isAuthEndpoint =
        err.config?.url?.includes('/auth/login') ||
        err.config?.url?.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem('tripwise_token');
        localStorage.removeItem('tripwise_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

// ─── Health ──────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get('/health');

// ─── Auth ────────────────────────────────────────────────────────────────────
// Stage 2: POST /api/auth/login
export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password });

// Stage 2: POST /api/auth/register
export const registerUser = (name, email, password) =>
  api.post('/auth/register', { name, email, password });

// Stage 2: GET /api/auth/me
export const getCurrentUser = () => api.get('/auth/me');

// ─── Trips ───────────────────────────────────────────────────────────────────
// Stage 2: POST /api/trips
export const createTrip = (tripData) => api.post('/trips', tripData);

// Stage 2: PUT /api/trips/:id
export const updateTrip = (id, tripData) => api.put(`/trips/${id}`, tripData);

// Stage 2: GET /api/trips
export const getSavedTrips = () => api.get('/trips');

// Stage 2: GET /api/trips/:id
export const getTripById = (id) => api.get(`/trips/${id}`);

// Stage 2: DELETE /api/trips/:id
export const deleteTrip = (id) => api.delete(`/trips/${id}`);

// ─── Destinations & Places ───────────────────────────────────────────────────
// Stage 2: GET /api/destinations?city=...
export const getDestinations = (city) =>
  api.get('/destinations', { params: { city } });

// ─── AI Itinerary ─────────────────────────────────────────────────────────────
// POST /api/trips/generate
export const generateTrip = (preferences) =>
  api.post('/trips/generate', preferences);

// ─── Route Optimization ───────────────────────────────────────────────────────
// Stage 2: POST /api/route/calculate
export const calculateRoute = (places) =>
  api.post('/route/calculate', { places });

// ─── Hotels ──────────────────────────────────────────────────────────────────
// GET /api/hotels?city=...&budget=...
export const getHotels = (city, budget, options = {}) =>
  api.get('/hotels', { params: { city, budget, ...options } });

// ─── Restaurants ─────────────────────────────────────────────────────────────
// GET /api/restaurants?city=...
export const getRestaurants = (city, options = {}) =>
  api.get('/restaurants', { params: { city, ...options } });

export default api;
