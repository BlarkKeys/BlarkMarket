import React from 'react';
import { Play } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative bg-purple-900 text-white">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80"
          alt="Studio"
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Premium Beats for Your Next Hit
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 mb-8">
            High-quality instrumentals from top producers worldwide
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-md flex items-center gap-2 transition-colors">
              <Play size={20} />
              Browse Beats
            </button>
            <button className="bg-transparent border-2 border-purple-400 hover:border-purple-300 text-white px-8 py-3 rounded-md transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}