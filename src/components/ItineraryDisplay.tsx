'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TravelItinerary } from '@/types';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  Share2,
  Edit,
  Star,
  Camera,
  Utensils,
  Car
} from 'lucide-react';

interface ItineraryDisplayProps {
  itinerary: TravelItinerary;
  onEdit?: () => void;
  onSave?: () => void;
}

export default function ItineraryDisplay({ itinerary, onEdit, onSave }: ItineraryDisplayProps) {
  const { t } = useTranslation();
  const [activeDay, setActiveDay] = useState(1);

  const handleExport = () => {
    // Create a simple text version for export
    const textContent = generateTextItinerary(itinerary);
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${itinerary.destination.name}-itinerary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${itinerary.destination.name} Travel Itinerary`,
          text: `Check out this amazing ${itinerary.duration}-day itinerary for ${itinerary.destination.name}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {itinerary.destination.name}, {itinerary.destination.country}
            </h1>
            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{itinerary.duration} days</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{itinerary.duration} travelers</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                <span className="capitalize">{itinerary.travelInfo.budget.daily.midRange}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleShare}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Best Time to Visit</h3>
            <p className="text-blue-700">{itinerary.travelInfo.bestTimeToVisit}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Top Attractions</h3>
            <p className="text-green-700">{itinerary.travelInfo.attractions.length} attractions planned</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Activities</h3>
            <p className="text-purple-700">{itinerary.travelInfo.activities.length} activities included</p>
          </div>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Itinerary</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {itinerary.dailyItineraries.map((day) => (
            <button
              key={day.day}
              onClick={() => setActiveDay(day.day)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeDay === day.day
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>

        {/* Active Day Content */}
        {itinerary.dailyItineraries.map((day) => (
          activeDay === day.day && (
            <div key={day.day} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{day.title}</h3>
                {day.transportation && (
                  <div className="flex items-center text-gray-600 mb-4">
                    <Car className="w-4 h-4 mr-2" />
                    <span>Transportation: {day.transportation}</span>
                  </div>
                )}
              </div>

              {/* Activities */}
              <div className="space-y-4">
                {day.activities.map((activity, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-semibold text-blue-600">{activity.time}</span>
                      </div>
                      {activity.cost && (
                        <span className="text-green-600 font-medium">{activity.cost}</span>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{activity.activity}</h4>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{activity.location}</span>
                      <span className="mx-2">•</span>
                      <span>{activity.duration}</span>
                    </div>
                    {activity.description && (
                      <p className="text-gray-700">{activity.description}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Meals */}
              {day.meals.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Utensils className="w-4 h-4 mr-2" />
                    {t('itinerary.daily.meals')}
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {day.meals.map((meal, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-900">{meal.type}</h5>
                          <span className="text-sm font-medium text-green-600">{meal.priceRange || meal.cost}</span>
                        </div>

                        <div className="mb-3">
                          <h6 className="font-medium text-gray-800">{meal.name || meal.suggestion}</h6>
                          <p className="text-sm text-gray-600 mb-1">{meal.location}</p>
                          {meal.description && (
                            <p className="text-sm text-gray-700 mb-2">{meal.description}</p>
                          )}
                        </div>

                        {meal.specialties && meal.specialties.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-600 mb-1">Specialties:</p>
                            <div className="flex flex-wrap gap-1">
                              {meal.specialties.map((specialty, idx) => (
                                <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {specialty}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {meal.recommendation && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-600 mb-1">Why recommended:</p>
                            <p className="text-xs text-gray-700">{meal.recommendation}</p>
                          </div>
                        )}

                        {meal.culturalContext && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-600 mb-1">Cultural context:</p>
                            <p className="text-xs text-gray-700">{meal.culturalContext}</p>
                          </div>
                        )}

                        <div className="border-t border-gray-100 pt-3 mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>{meal.openingHours}</span>
                            {meal.reservationNeeded && (
                              <span className="text-orange-600 font-medium">Reservation needed</span>
                            )}
                          </div>

                          {meal.distanceFromActivity && (
                            <p className="text-xs text-gray-600 mb-2">{meal.distanceFromActivity}</p>
                          )}

                          <div className="flex gap-2">
                            {meal.website && (
                              <a
                                href={meal.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Website
                              </a>
                            )}
                            {meal.reviewLink && (
                              <a
                                href={meal.reviewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Reviews
                              </a>
                            )}
                          </div>

                          {(meal.paymentMethods || meal.tippingCustom) && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              {meal.paymentMethods && (
                                <p className="text-xs text-gray-600 mb-1">{meal.paymentMethods}</p>
                              )}
                              {meal.tippingCustom && (
                                <p className="text-xs text-gray-600">{meal.tippingCustom}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {day.notes && day.notes.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Notes for the Day</h4>
                  <ul className="list-disc list-inside text-yellow-800 space-y-1">
                    {day.notes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        ))}
      </div>

      {/* Attractions & Activities Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Attractions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Top Attractions
          </h2>
          <div className="space-y-4">
            {itinerary.travelInfo.attractions.slice(0, 5).map((attraction, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{attraction.name}</h3>
                  {attraction.rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">{attraction.rating}</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-700 text-sm mb-2">{attraction.description}</p>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span>{attraction.estimatedDuration}</span>
                  {attraction.entryFee && <span>{attraction.entryFee}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Breakdown */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Budget Overview
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Daily Budget Range</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Budget:</span>
                  <span className="font-medium">{itinerary.travelInfo.budget.daily.budget}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mid-range:</span>
                  <span className="font-medium">{itinerary.travelInfo.budget.daily.midRange}</span>
                </div>
                <div className="flex justify-between">
                  <span>Luxury:</span>
                  <span className="font-medium">{itinerary.travelInfo.budget.daily.luxury}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Expense Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Accommodation:</span>
                  <span>{itinerary.travelInfo.budget.breakdown.accommodation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Food:</span>
                  <span>{itinerary.travelInfo.budget.breakdown.food}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transportation:</span>
                  <span>{itinerary.travelInfo.budget.breakdown.transportation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Activities:</span>
                  <span>{itinerary.travelInfo.budget.breakdown.activities}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Local Tips */}
      {itinerary.travelInfo.localTips.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Local Tips & Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {itinerary.travelInfo.localTips.map((tip, index) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-900">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function generateTextItinerary(itinerary: TravelItinerary): string {
  let text = `${itinerary.destination.name}, ${itinerary.destination.country} - ${itinerary.duration} Day Itinerary\n`;
  text += `Generated on: ${itinerary.generatedAt.toLocaleDateString()}\n\n`;

  itinerary.dailyItineraries.forEach((day) => {
    text += `DAY ${day.day}: ${day.title}\n`;
    text += `${'='.repeat(40)}\n`;
    
    day.activities.forEach((activity) => {
      text += `${activity.time} - ${activity.activity}\n`;
      text += `Location: ${activity.location}\n`;
      text += `Duration: ${activity.duration}\n`;
      if (activity.cost) text += `Cost: ${activity.cost}\n`;
      if (activity.description) text += `${activity.description}\n`;
      text += '\n';
    });

    if (day.meals.length > 0) {
      text += 'MEALS:\n';
      day.meals.forEach((meal) => {
        text += `${meal.type}: ${meal.name || meal.suggestion}\n`;
        text += `Location: ${meal.location}\n`;
        if (meal.description) text += `Description: ${meal.description}\n`;
        if (meal.specialties && meal.specialties.length > 0) {
          text += `Specialties: ${meal.specialties.join(', ')}\n`;
        }
        text += `Price Range: ${meal.priceRange || meal.cost}\n`;
        if (meal.recommendation) text += `Why recommended: ${meal.recommendation}\n`;
        if (meal.openingHours) text += `Hours: ${meal.openingHours}\n`;
        if (meal.website) text += `Website: ${meal.website}\n`;
        if (meal.reservationNeeded) text += `Reservation: Required\n`;
        text += '\n';
      });
      text += '\n';
    }

    if (day.notes && day.notes.length > 0) {
      text += 'NOTES:\n';
      day.notes.forEach((note) => {
        text += `- ${note}\n`;
      });
      text += '\n';
    }

    text += '\n';
  });

  return text;
}
