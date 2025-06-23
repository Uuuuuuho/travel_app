'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Users, Loader2 } from 'lucide-react';

const destinationSchema = z.object({
  destination: z.string().min(2, 'Destination must be at least 2 characters'),
  duration: z.number().min(1, 'Duration must be at least 1 day').max(30, 'Duration cannot exceed 30 days'),
  travelers: z.number().min(1, 'At least 1 traveler required').max(20, 'Maximum 20 travelers'),
  budget: z.enum(['budget', 'mid-range', 'luxury']),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
});

type DestinationFormData = z.infer<typeof destinationSchema>;

interface DestinationFormProps {
  onSubmit: (data: DestinationFormData) => void;
  isLoading?: boolean;
}

// Interest options will be translated dynamically

export default function DestinationForm({ onSubmit, isLoading = false }: DestinationFormProps) {
  const { t } = useTranslation();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Get translated interest options
  const interestOptions = [
    { key: 'culture', label: t('form.interests.culture') },
    { key: 'adventure', label: t('form.interests.adventure') },
    { key: 'food', label: t('form.interests.food') },
    { key: 'nightlife', label: t('form.interests.nightlife') },
    { key: 'art', label: t('form.interests.art') },
    { key: 'nature', label: t('form.interests.nature') },
    { key: 'beach', label: t('form.interests.beach') },
    { key: 'shopping', label: t('form.interests.shopping') },
    { key: 'photography', label: t('form.interests.photography') },
    { key: 'local', label: t('form.interests.local') },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DestinationFormData>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      duration: 7,
      travelers: 2,
      budget: 'mid-range',
      interests: [],
    },
  });

  const handleInterestToggle = (interestKey: string) => {
    const newInterests = selectedInterests.includes(interestKey)
      ? selectedInterests.filter(i => i !== interestKey)
      : [...selectedInterests, interestKey];

    setSelectedInterests(newInterests);
    setValue('interests', newInterests);
  };

  const onFormSubmit = (data: DestinationFormData) => {
    onSubmit({ ...data, interests: selectedInterests });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('form.title')}
        </h1>
        <p className="text-gray-600">
          {t('form.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Destination Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            {t('form.destination.label')}
          </label>
          <input
            {...register('destination')}
            type="text"
            placeholder={t('form.destination.placeholder')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          {errors.destination && (
            <p className="mt-1 text-sm text-red-600">{t('form.destination.error')}</p>
          )}
        </div>

        {/* Duration and Travelers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              {t('form.duration.label')}
            </label>
            <input
              {...register('duration', { valueAsNumber: true })}
              type="number"
              min="1"
              max="30"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {errors.duration && (
              <p className="mt-1 text-sm text-red-600">{t('form.duration.error')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              {t('form.travelers.label')}
            </label>
            <input
              {...register('travelers', { valueAsNumber: true })}
              type="number"
              min="1"
              max="20"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {errors.travelers && (
              <p className="mt-1 text-sm text-red-600">{t('form.travelers.error')}</p>
            )}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.budget.label')}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['budget', 'mid-range', 'luxury'] as const).map((option) => (
              <label key={option} className="relative">
                <input
                  {...register('budget')}
                  type="radio"
                  value={option}
                  className="sr-only"
                  disabled={isLoading}
                />
                <div className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${
                  watch('budget') === option
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <div className="font-medium">
                    {option === 'budget' && t('form.budget.budget')}
                    {option === 'mid-range' && t('form.budget.midRange')}
                    {option === 'luxury' && t('form.budget.luxury')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {option === 'budget' && t('form.budget.budgetDesc')}
                    {option === 'mid-range' && t('form.budget.midRangeDesc')}
                    {option === 'luxury' && t('form.budget.luxuryDesc')}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.interests.label')}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {interestOptions.map((interest) => (
              <button
                key={interest.key}
                type="button"
                onClick={() => handleInterestToggle(interest.key)}
                disabled={isLoading}
                className={`p-2 text-sm border rounded-lg transition-colors ${
                  selectedInterests.includes(interest.key)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {interest.label}
              </button>
            ))}
          </div>
          {errors.interests && (
            <p className="mt-1 text-sm text-red-600">{t('form.interests.error')}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
              {t('form.generating')}
            </>
          ) : (
            t('form.submit')
          )}
        </button>
      </form>
    </div>
  );
}
