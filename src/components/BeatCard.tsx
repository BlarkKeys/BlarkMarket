import React from 'react';
import { Play, Pause, ShoppingCart, Download } from 'lucide-react';
import { Beat } from '../types';

interface BeatCardProps {
  beat: Beat;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export default function BeatCard({ beat, isPlaying, onPlayPause }: BeatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform">
      <div className="relative h-48">
        <img
          src={beat.coverArt}
          alt={beat.title}
          className="w-full h-full object-cover"
        />
        <button
          onClick={onPlayPause}
          className="absolute bottom-4 left-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{beat.title}</h3>
            <p className="text-sm text-gray-600">{beat.bpm} BPM • {beat.key}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-purple-600">${beat.price}</p>
            <p className="text-xs text-gray-500">*License</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
            <ShoppingCart size={18} />
            Buy Now
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors">
            <Download size={18} />
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}