import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TripProvider } from './context/TripContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PlanTrip from './pages/PlanTrip';
import Destinations from './pages/Destinations';
import SelectedPlaces from './pages/SelectedPlaces';
import Itinerary from './pages/Itinerary';
import MapPage from './pages/MapPage';
import BudgetPage from './pages/BudgetPage';
import Hotels from './pages/Hotels';
import Restaurants from './pages/Restaurants';
import TripSummary from './pages/TripSummary';
import SavedTrips from './pages/SavedTrips';
import Profile from './pages/Profile';
import Placeholder from './pages/Placeholder';

import './App.css';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<MainLayout />}>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/plan-trip" element={<PlanTrip />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/selected-places" element={<SelectedPlaces />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/trip-summary" element={<TripSummary />} />
        <Route path="/saved-trips" element={<SavedTrips />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <Placeholder
            title="Page Not Found"
            icon="🔍"
            description="The page you're looking for doesn't exist."
            isError
          />
        }
      />
    </Route>
  )
);

function App() {
  return (
    <AuthProvider>
      <TripProvider>
        <RouterProvider router={router} />
      </TripProvider>
    </AuthProvider>
  );
}

export default App;
