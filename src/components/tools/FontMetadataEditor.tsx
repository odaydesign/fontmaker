'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Switch from '@/components/ui/Switch';
import TagInput from '@/components/ui/TagInput';
import { useFont } from '@/context/FontContext';
import { FontMetadata } from '@/context/FontContext';

const FontMetadataEditor: React.FC = () => {
  const { metadata, updateMetadata } = useFont();
  const [errors, setErrors] = useState<Partial<Record<keyof FontMetadata, string>>>({});
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMetadata({ name: e.target.value });
    
    // Clear error if present
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateMetadata({ description: e.target.value });
  };
  
  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMetadata({ author: e.target.value });
  };
  
  const handleIsPublicChange = (checked: boolean) => {
    updateMetadata({ isPublic: checked });
  };
  
  const handleTagsChange = (tags: string[]) => {
    updateMetadata({ tags });
  };
  
  const validateMetadata = (): boolean => {
    const newErrors: Partial<Record<keyof FontMetadata, string>> = {};
    
    if (!metadata.name.trim()) {
      newErrors.name = 'Font name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            id="font-name"
            label="Font Name"
            value={metadata.name}
            onChange={handleNameChange}
            error={errors.name}
            placeholder="My Handwritten Font"
            required
            fullWidth
          />
          
          <Input
            id="font-author"
            label="Author"
            value={metadata.author || ''}
            onChange={handleAuthorChange}
            placeholder="Your Name"
            fullWidth
          />
          
          <Switch
            id="font-visibility"
            label="Public Font"
            checked={metadata.isPublic}
            onChange={handleIsPublicChange}
            helperText="Make your font discoverable by other users"
          />
        </div>
        
        <div>
          <Textarea
            id="font-description"
            label="Description"
            value={metadata.description || ''}
            onChange={handleDescriptionChange}
            placeholder="Describe your font..."
            rows={4}
            fullWidth
          />
          
          <TagInput
            id="font-tags"
            label="Tags"
            tags={metadata.tags || []}
            onChange={handleTagsChange}
            placeholder="Add a tag (press Enter)"
            helperText="Add tags to help others discover your font"
            maxTags={5}
            fullWidth
          />
        </div>
      </div>
      
      <div className="p-4 bg-indigo-50 rounded-md">
        <h4 className="text-indigo-800 text-sm font-medium mb-2">Tips for good font metadata</h4>
        <ul className="text-indigo-700 text-sm list-disc pl-5 space-y-1">
          <li>Choose a descriptive name that reflects the style of your font</li>
          <li>Add detailed descriptions to help users understand your font's uniqueness</li>
          <li>Use relevant tags to improve discoverability</li>
          <li>Credit any collaborators or inspirations in the description</li>
        </ul>
      </div>
    </div>
  );
};

export default FontMetadataEditor; 