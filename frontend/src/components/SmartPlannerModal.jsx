import { useState, useEffect } from 'react';
import './SmartPlannerModal.css';

/**
 * SmartPlannerModal:
 * Displays the AI itinerary optimization sequence when user clicks
 * "Create My Smart Trip".
 * 
 * Future Gemini flow:
 * While this animation runs, the client will call the backend API
 * (POST /api/trips/generate), which will invoke Google Gemini, returning
 * the optimized itinerary schema.
 */
export default function SmartPlannerModal({ isOpen, tripData, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Analyzing your selected places & opening hours...',
    'Optimizing day-by-day route & geographic clusters...',
    'Structuring your budget breakdown & allocations...',
    'Finalizing your AI-generated smart itinerary...',
  ];

  useEffect(() => {
    if (!isOpen) return;

    setStepIndex(0);
    const t1 = setTimeout(() => setStepIndex(1), 500);
    const t2 = setTimeout(() => setStepIndex(2), 1100);
    const t3 = setTimeout(() => setStepIndex(3), 1700);
    const t4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const destination = tripData?.destination || 'your destination';
  const days = tripData?.numberOfDays || 3;
  const travelers = tripData?.travelers || 2;
  const budget = tripData?.budget ? `₹${Number(tripData.budget).toLocaleString('en-IN')}` : '₹25,000';
  const interests = (tripData?.interests || []).join(', ') || 'Culture, History';
  const placesCount = tripData?.selectedPlaces?.length || 0;

  return (
    <div className="planner-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="planner-modal-title">
      <div className="planner-modal-card animate-scale-up">
        {/* Glow header badge */}
        <div className="planner-modal-badge">
          <span className="ai-sparkle">✨</span> TripWise Smart Planner
        </div>

        <h2 id="planner-modal-title" className="planner-modal-title">
          Creating your personalized itinerary for {destination}...
        </h2>

        <p className="planner-modal-subtitle">
          TripWise is analyzing your trip parameters to craft an optimized, stress-free route.
        </p>

        {/* Parameter checklist */}
        <div className="planner-analysis-box">
          <div className="analysis-box-header">TripWise is analyzing:</div>
          <ul className="analysis-items-list">
            <li className="analysis-item checked">
              <span className="check-icon">✓</span>
              <span><strong>{placesCount} Selected Places:</strong> Sequenced to eliminate backtrack travel</span>
            </li>
            <li className="analysis-item checked">
              <span className="check-icon">✓</span>
              <span><strong>Trip Duration:</strong> {days} Days scheduled with balanced pacing</span>
            </li>
            <li className="analysis-item checked">
              <span className="check-icon">✓</span>
              <span><strong>Budget Target:</strong> {budget} optimized for accommodation, dining & tickets</span>
            </li>
            <li className="analysis-item checked">
              <span className="check-icon">✓</span>
              <span><strong>Travel Party:</strong> {travelers} Travelers • {tripData?.travelType || 'Couple'} Style</span>
            </li>
            <li className="analysis-item checked">
              <span className="check-icon">✓</span>
              <span><strong>Interests:</strong> {interests} matched to local experiences</span>
            </li>
            <li className="analysis-item checked">
              <span className="check-icon">✓</span>
              <span><strong>Transit Proximity:</strong> Clustered routes to reduce daily travel fatigue</span>
            </li>
          </ul>
        </div>

        {/* Live step indicator */}
        <div className="planner-live-progress">
          <div className="progress-spinner-row">
            <div className="planner-spinner" />
            <span className="live-step-text">{steps[stepIndex] || steps[steps.length - 1]}</span>
          </div>

          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="planner-modal-footer">
          <span className="future-engine-note">
            ⚡ Powered by TripWise Route Sequencing Engine • Gemini Architecture Ready
          </span>
        </div>
      </div>
    </div>
  );
}
