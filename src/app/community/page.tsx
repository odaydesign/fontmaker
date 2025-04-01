'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface CommunityFont {
  id: string;
  name: string;
  author: string;
  authorUsername: string;
  createdAt: string;
  previewText: string;
  likes: number;
  downloads: number;
  tags: string[];
}

// Temporary mock data for demonstration
const mockFonts: CommunityFont[] = [
  {
    id: '1',
    name: 'Handscript Pro',
    author: 'Sarah Johnson',
    authorUsername: 'sarahj',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    previewText: 'The quick brown fox jumps over the lazy dog',
    likes: 256,
    downloads: 134,
    tags: ['handwritten', 'script', 'elegant'],
  },
  {
    id: '2',
    name: 'Retro Wave',
    author: 'Mike Chen',
    authorUsername: 'mikedesigns',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    previewText: 'Pack my box with five dozen liquor jugs',
    likes: 189,
    downloads: 97,
    tags: ['retro', '80s', 'bold'],
  },
  {
    id: '3',
    name: 'Minimalist Sans',
    author: 'Alex Taylor',
    authorUsername: 'alext',
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    previewText: 'How vexingly quick daft zebras jump',
    likes: 342,
    downloads: 215,
    tags: ['minimalist', 'modern', 'sans-serif'],
  },
  {
    id: '4',
    name: 'Organic Brush',
    author: 'Emma Watson',
    authorUsername: 'emmaw',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    previewText: 'Sphinx of black quartz, judge my vow',
    likes: 428,
    downloads: 301,
    tags: ['brush', 'artistic', 'organic'],
  },
];

// All unique tags from the mock fonts
const allTags = Array.from(new Set(mockFonts.flatMap(font => font.tags)));

const CommunityPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<'latest' | 'popular'>('latest');
  
  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const filteredFonts = mockFonts
    .filter(font => {
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          font.name.toLowerCase().includes(searchLower) ||
          font.author.toLowerCase().includes(searchLower) ||
          font.authorUsername.toLowerCase().includes(searchLower) ||
          font.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .filter(font => {
      // Filter by selected tags
      if (selectedTags.length === 0) return true;
      return selectedTags.some(tag => font.tags.includes(tag));
    })
    .sort((a, b) => {
      // Sort by selected option
      if (sortOption === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return b.likes - a.likes;
    });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Community Fonts</h1>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Search fonts"
              placeholder="Search by name, author, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as 'latest' | 'popular')}
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
        
        {/* Tags */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by tags
          </label>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  selectedTags.includes(tag)
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-transparent'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Results */}
      {filteredFonts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">No fonts found matching your criteria.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedTags([]);
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFonts.map((font) => (
            <div key={font.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{font.name}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  by <span className="font-medium">{font.author}</span> · {formatDate(font.createdAt)}
                </p>
                
                <div className="bg-gray-50 p-4 rounded-md mb-4 min-h-16">
                  <p className="text-gray-800">{font.previewText}</p>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {font.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <svg 
                        className="w-4 h-4 mr-1" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      {font.likes}
                    </span>
                    <span className="flex items-center">
                      <svg 
                        className="w-4 h-4 mr-1" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      {font.downloads}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityPage; 