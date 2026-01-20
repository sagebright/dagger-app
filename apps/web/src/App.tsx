import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import type { HealthResponse } from '@dagger-app/shared-types';

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="btn-secondary"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}

function HomePage() {
  const health: HealthResponse = { status: 'ok', timestamp: new Date().toISOString() };

  return (
    <div className="min-h-screen bg-parchment-100 dark:bg-shadow-900 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <h1 className="font-serif text-4xl text-ink-950 dark:text-parchment-50">
            Dagger-Gen
          </h1>
          <DarkModeToggle />
        </header>

        <main className="max-w-2xl mx-auto">
          <div className="card mb-8">
            <h2 className="text-gold-600 dark:text-gold-400 mb-2">
              Daggerheart TTRPG Adventure Generator
            </h2>
            <p className="text-ink-600 dark:text-parchment-300 mb-4">
              Create immersive adventures with AI-powered content generation.
            </p>
            <p className="text-sm text-ink-500 dark:text-parchment-400">
              Status: <span className="text-gold">{health.status}</span>
            </p>
          </div>

          <div className="flex gap-4">
            <Link to="/adventure" className="btn-primary">
              Start New Adventure
            </Link>
            <button className="btn-danger">
              Danger Button
            </button>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-parchment rounded-fantasy text-center">
              <span className="text-sm font-medium">Parchment</span>
            </div>
            <div className="p-4 bg-ink text-parchment-100 rounded-fantasy text-center">
              <span className="text-sm font-medium">Ink</span>
            </div>
            <div className="p-4 bg-gold text-ink-950 rounded-fantasy text-center">
              <span className="text-sm font-medium">Gold</span>
            </div>
            <div className="p-4 bg-blood text-parchment-50 rounded-fantasy text-center">
              <span className="text-sm font-medium">Blood</span>
            </div>
            <div className="p-4 bg-shadow text-parchment-100 rounded-fantasy text-center">
              <span className="text-sm font-medium">Shadow</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AdventurePage() {
  return (
    <div className="min-h-screen bg-parchment-100 dark:bg-shadow-900 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <h1 className="font-serif text-4xl text-ink-950 dark:text-parchment-50">
            Adventure Generator
          </h1>
          <DarkModeToggle />
        </header>

        <main className="max-w-2xl mx-auto">
          <div className="card mb-8">
            <p className="text-ink-600 dark:text-parchment-300">
              Adventure creation workflow coming soon...
            </p>
          </div>

          <Link to="/" className="btn-secondary">
            ← Back to Home
          </Link>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/adventure" element={<AdventurePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
