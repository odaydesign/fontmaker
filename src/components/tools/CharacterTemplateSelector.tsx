'use client';

import { useState } from 'react';
import {
  characterTemplates,
  getTemplatesByCategory,
  getTemplateStats,
  type CharacterTemplate
} from '@/lib/characterTemplates';
import { Button } from '@/components/ui/button';
import { X, Check, Info } from 'lucide-react';
import { toast } from 'sonner';

interface CharacterTemplateSelectorProps {
  onSelectTemplate: (characters: string) => void;
  onClose: () => void;
}

export default function CharacterTemplateSelector({ onSelectTemplate, onClose }: CharacterTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<'basic' | 'extended' | 'symbols' | 'language'>('basic');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const categories = [
    { id: 'basic' as const, name: 'Basic', icon: '🔤', description: 'English alphabet and numbers' },
    { id: 'language' as const, name: 'Languages', icon: '🌍', description: 'Accented characters' },
    { id: 'symbols' as const, name: 'Symbols', icon: '✨', description: 'Special characters' },
    { id: 'extended' as const, name: 'Complete', icon: '📦', description: 'Full character sets' },
  ];

  const templates = getTemplatesByCategory(selectedCategory);

  const toggleTemplate = (templateId: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplates(newSelected);
  };

  const handleApply = () => {
    if (selectedTemplates.size === 0) {
      toast.error('Please select at least one template');
      return;
    }

    const selectedChars = characterTemplates
      .filter(t => selectedTemplates.has(t.id))
      .map(t => t.characters)
      .join('');

    // Remove duplicates
    const uniqueChars = Array.from(new Set(selectedChars.split(''))).join('');

    onSelectTemplate(uniqueChars);
    toast.success(`Added ${uniqueChars.length} characters to your clipboard`);
    onClose();
  };

  const getPreviewText = (template: CharacterTemplate): string => {
    const chars = template.characters;
    if (chars.length <= 20) return chars;
    return chars.slice(0, 20) + '...';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Character Templates</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Select templates to copy characters for your font
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => {
              const isSelected = selectedTemplates.has(template.id);
              const stats = getTemplateStats(template);
              const isHovered = hoveredTemplate === template.id;

              return (
                <div
                  key={template.id}
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  onClick={() => toggleTemplate(template.id)}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600'
                  }`}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Template info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  {/* Character preview */}
                  <div className="bg-white dark:bg-gray-800 rounded-md p-3 mb-3 font-mono text-sm text-gray-700 dark:text-gray-300 overflow-hidden">
                    {isHovered ? (
                      <div className="whitespace-pre-wrap break-all">
                        {template.characters}
                      </div>
                    ) : (
                      <div className="truncate">
                        {getPreviewText(template)}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {stats.total} chars
                    </span>
                    {stats.uppercase > 0 && <span>↑ {stats.uppercase}</span>}
                    {stats.lowercase > 0 && <span>↓ {stats.lowercase}</span>}
                    {stats.numbers > 0 && <span>№ {stats.numbers}</span>}
                    {stats.symbols > 0 && <span>✦ {stats.symbols}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No templates in this category
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTemplates.size > 0 ? (
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''} selected
                </span>
              ) : (
                <span>Select templates to get started</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApply}
                disabled={selectedTemplates.size === 0}
              >
                Copy Characters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
