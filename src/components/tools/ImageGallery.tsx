'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useFont } from '@/context/FontContext';

const ImageGallery: React.FC = () => {
  const { sourceImages, removeSourceImage, toggleImageSelection } = useFont();

  if (sourceImages.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No images uploaded yet. Upload or generate some images to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Your Images</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sourceImages.map((image) => (
          <div
            key={image.id}
            className={`relative group overflow-hidden rounded-lg border-2 transition-all ${
              image.selected ? 'border-indigo-500 shadow-md' : 'border-gray-200'
            }`}
          >
            <div className="relative aspect-video w-full">
              <Image
                src={image.url}
                alt={image.aiPrompt || 'Uploaded image'}
                fill
                className="object-cover"
              />
            </div>
            
            {/* Image info */}
            <div className="p-3 bg-white">
              <p className="text-sm text-gray-500 truncate">
                {image.isAiGenerated
                  ? `AI Generated: "${image.aiPrompt}"`
                  : 'Uploaded Image'}
              </p>
            </div>
            
            {/* Image actions */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleImageSelection(image.id)}
                  className="bg-white"
                >
                  {image.selected ? 'Deselect' : 'Select'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeSourceImage(image.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;