'use client';

import { ReactNode } from 'react';
import { Plane, Github, Heart } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">TravelCraft</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                Home
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                My Itineraries
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                Destinations
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                About
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Plane className="h-6 w-6 text-blue-400 mr-2" />
                <h3 className="text-lg font-bold">TravelCraft</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Create personalized travel itineraries powered by AI. Discover amazing destinations, 
                local experiences, and hidden gems tailored to your interests and budget.
              </p>
              <div className="flex items-center text-sm text-gray-400">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-400 mx-1" />
                <span>for travelers worldwide</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                Features
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>AI-Powered Itineraries</li>
                <li>Local Insights</li>
                <li>Budget Planning</li>
                <li>Visual Content</li>
                <li>Export & Share</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                Support
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2024 TravelCraft. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
