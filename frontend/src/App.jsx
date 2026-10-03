import './App.css';

function App() {
  return (
    <main className="container">
      <div className="card">
        <div className="badge">Project Foundation • Step 1</div>
        <h1 className="title">TripWise</h1>
        <p className="subtitle">
          AI-Powered Personalized Travel Planner &amp; Smart Route Optimizer
        </p>

        <div className="status-grid">
          <div className="status-item">
            <span className="dot dot-active"></span>
            <div>
              <strong>Frontend</strong>
              <p>React + Vite</p>
            </div>
          </div>

          <div className="status-item">
            <span className="dot dot-active"></span>
            <div>
              <strong>Backend</strong>
              <p>Node.js + Express</p>
            </div>
          </div>

          <div className="status-item">
            <span className="dot dot-pending"></span>
            <div>
              <strong>Database</strong>
              <p>MongoDB + Mongoose (Upcoming)</p>
            </div>
          </div>

          <div className="status-item">
            <span className="dot dot-pending"></span>
            <div>
              <strong>AI &amp; Maps</strong>
              <p>Gemini API, Leaflet &amp; OSRM (Upcoming)</p>
            </div>
          </div>
        </div>

        <div className="info-box">
          Initial project foundation initialized successfully. Ready for subsequent development steps.
        </div>
      </div>
    </main>
  );
}

export default App;
