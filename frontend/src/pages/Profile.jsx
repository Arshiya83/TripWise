import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import './Profile.css';

function Profile() {
  const { user } = useAuth();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || 'Traveller',
    email: user?.email || 'demo@tripwise.app',
    phone: '+91 98765 43210',
    preferredCurrency: 'INR (₹)',
    dietaryPreference: 'Vegetarian / Halal / Any',
    travelPace: 'Balanced & Relaxed',
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header animate-fade-in-up">
          <div className="profile-avatar-large">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-header-text">
            <h1 className="profile-name">{profile.name}</h1>
            <p className="profile-email">{profile.email} • TripWise Explorer Member</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="profile-toast animate-fade-in">
            ✓ Profile preferences saved successfully.
          </div>
        )}

        <div className="profile-form-grid">
          <form className="profile-form-card card" onSubmit={handleSave}>
            <h3 className="profile-sec-title">Account Information</h3>

            <div className="form-group">
              <label className="form-label" htmlFor="prof-name">Full Name</label>
              <input
                id="prof-name"
                type="text"
                className="form-input"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prof-email">Email Address</label>
              <input
                id="prof-email"
                type="email"
                className="form-input"
                value={profile.email}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prof-phone">Phone Number</label>
              <input
                id="prof-phone"
                type="tel"
                className="form-input"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <h3 className="profile-sec-title" style={{ marginTop: '1.5rem' }}>Travel Customization</h3>

            <div className="form-group">
              <label className="form-label" htmlFor="prof-pace">Preferred Travel Pace</label>
              <select
                id="prof-pace"
                className="form-input"
                value={profile.travelPace}
                onChange={(e) => setProfile({ ...profile, travelPace: e.target.value })}
              >
                <option value="Fast-Paced & Packed">Fast-Paced & Packed (Maximum Attractions)</option>
                <option value="Balanced & Relaxed">Balanced & Relaxed (Recommended)</option>
                <option value="Slow Travel">Slow Travel (Deep Heritage & Leisure)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prof-diet">Dietary Preferences</label>
              <input
                id="prof-diet"
                type="text"
                className="form-input"
                value={profile.dietaryPreference}
                onChange={(e) => setProfile({ ...profile, dietaryPreference: e.target.value })}
              />
            </div>

            <Button type="submit" variant="primary" size="lg" style={{ marginTop: '1rem' }}>
              Save Account Changes
            </Button>
          </form>

          {/* Side Info */}
          <div className="profile-side-card card">
            <h3 className="profile-sec-title">Travel Statistics</h3>
            <div className="prof-stat-row">
              <span>Trips Planned</span>
              <strong>3 Trips</strong>
            </div>
            <div className="prof-stat-row">
              <span>Favorite City</span>
              <strong>Hyderabad</strong>
            </div>
            <div className="prof-stat-row">
              <span>Total Sights Visited</span>
              <strong>14 Landmarks</strong>
            </div>
            <div className="prof-stat-row">
              <span>Account Status</span>
              <span className="badge badge-primary">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
