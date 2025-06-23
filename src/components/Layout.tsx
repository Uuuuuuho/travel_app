'use client';

import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Plane, Github, Heart } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">{t('app.name')}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                  {t('navigation.home')}
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                  {t('navigation.myItineraries')}
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                  {t('navigation.destinations')}
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                  {t('navigation.about')}
                </a>
              </nav>
              <LanguageSelector />
            </div>
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
                <h3 className="text-lg font-bold">{t('app.name')}</h3>
              </div>
              <p className="text-gray-400 mb-4">
                {t('footer.description')}
              </p>
              <div className="flex items-center text-sm text-gray-400">
                <span>{t('footer.madeWith')}</span>
                <Heart className="h-4 w-4 text-red-400 mx-1" />
                <span>{t('footer.forTravelers')}</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                {t('footer.features')}
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{t('footer.featuresList.aiPowered')}</li>
                <li>{t('footer.featuresList.localInsights')}</li>
                <li>{t('footer.featuresList.budgetPlanning')}</li>
                <li>{t('footer.featuresList.visualContent')}</li>
                <li>{t('footer.featuresList.exportShare')}</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                {t('footer.support')}
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t('footer.supportLinks.helpCenter')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t('footer.supportLinks.contact')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t('footer.supportLinks.privacy')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t('footer.supportLinks.terms')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2024 {t('app.name')}. {t('footer.copyright')}
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
