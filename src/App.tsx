import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import BeatCard from './components/BeatCard';
import { beats } from './data/beats';
import { Music4 } from 'lucide-react';

function App() {
  const [playingBeatId, setPlayingBeatId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Hero />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Beats</h2>
            <p className="text-gray-600 mt-2">Find the perfect beat for your next track</p>
          </div>
          <div className="flex items-center gap-4">
            <select className="bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-700">
              <option>All Genres</option>
              <option>Trap</option>
              <option>Hip Hop</option>
              <option>R&B</option>
            </select>
            <select className="bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-700">
              <option>Latest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        {beats.length === 0 ? (
          <div className="text-center py-12">
            <Music4 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No beats found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding some beats.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beats.map((beat) => (
              <BeatCard
                key={beat.id}
                beat={beat}
                isPlaying={playingBeatId === beat.id}
                onPlayPause={() => {
                  if (playingBeatId === beat.id) {
                    setPlayingBeatId(null);
                  } else {
                    setPlayingBeatId(beat.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <p className="text-gray-400">Premium beats marketplace for producers and artists worldwide.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-purple-400">Beats</a></li>
                <li><a href="#" className="hover:text-purple-400">Licensing</a></li>
                <li><a href="#" className="hover:text-purple-400">Services</a></li>
                <li><a href="#" className="hover:text-purple-400">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-purple-400">Terms of Service</a></li>
                <li><a href="#" className="hover:text-purple-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-purple-400">License Terms</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
              <p className="text-gray-400 mb-4">Subscribe for new beats and exclusive offers.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 text-white px-4 py-2 rounded-md flex-1"
                />
                <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BeatMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;