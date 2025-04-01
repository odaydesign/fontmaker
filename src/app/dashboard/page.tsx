'use client';

import React from 'react';
import Link from 'next/link';
import { Button, LinkButton } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

interface FontCard {
  id: string;
  name: string;
  createdAt: string;
  previewText: string;
  isPublic: boolean;
}

// Temporary mock data for demonstration
const mockFonts: FontCard[] = [
  {
    id: '1',
    name: 'My Handwriting',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    previewText: 'The quick brown fox jumps over the lazy dog',
    isPublic: true,
  },
  {
    id: '2',
    name: 'Retro Style',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    previewText: 'Pack my box with five dozen liquor jugs',
    isPublic: false,
  },
];

const DashboardPage = () => {
  const { user, logout } = useAuth();
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Please Login</h1>
        <p className="text-gray-600 mb-8">You need to be logged in to view your dashboard.</p>
        <LinkButton href="/auth/login" variant="primary">
          Login
        </LinkButton>
      </div>
    );
  }
  
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">My Dashboard</h1>
        <LinkButton href="/create" variant="primary">
          Create New Font
        </LinkButton>
      </div>
      
      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
          <div className="flex-shrink-0 mb-4 md:mb-0">
            <div className="bg-indigo-100 text-indigo-800 rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{user.displayName || user.username}</h2>
            <p className="text-gray-600 mb-2">{user.email}</p>
            <div className="flex space-x-2 mt-4">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Fonts Created', value: mockFonts.length },
          { label: 'Public Fonts', value: mockFonts.filter(f => f.isPublic).length },
          { label: 'Private Fonts', value: mockFonts.filter(f => !f.isPublic).length },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <p className="text-3xl font-bold text-indigo-600 mb-2">{stat.value}</p>
            <p className="text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
      
      {/* Fonts List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Fonts</h2>
        </div>
        
        {mockFonts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-4">You haven't created any fonts yet.</p>
            <LinkButton href="/create" variant="primary">
              Create Your First Font
            </LinkButton>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {mockFonts.map((font) => (
              <div key={font.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900 mr-2">{font.name}</h3>
                      {font.isPublic ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">Created on {formatDate(font.createdAt)}</p>
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <p className="text-gray-800">{font.previewText}</p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                    <Button variant={font.isPublic ? 'outline' : 'secondary'} size="sm">
                      {font.isPublic ? 'Make Private' : 'Make Public'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 