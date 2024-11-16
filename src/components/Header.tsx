import React from 'react';
import { Music2, ShoppingCart, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Music2 className="h-8 w-8 text-purple-600" />
            <span className="text-xl font-bold text-gray-900">BlarkMarket</span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">Beats</a>
            <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">Licensing</a>
            <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">Services</a>
            <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-700 hover:text-purple-600 transition-colors">
              <ShoppingCart className="h-6 w-6" />
            </button>
            <button className="p-2 text-gray-700 hover:text-purple-600 transition-colors">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}