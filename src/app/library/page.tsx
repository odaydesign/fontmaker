'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { fontStorage } from '@/lib/storage/fontStorage';
import { Download, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StoredFont {
  id: string;
  name: string;
  data: ArrayBuffer;
  format: string;
  createdAt: number;
  updatedAt: number;
  metadata: {
    name: string;
    author?: string;
    description?: string;
    isPublic: boolean;
  };
}

export default function FontLibraryPage() {
  const [fonts, setFonts] = useState<StoredFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [selectedFont, setSelectedFont] = useState<string | null>(null);

  // Load fonts on mount
  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    setLoading(true);
    try {
      const [fontsList, storageStats] = await Promise.all([
        fontStorage.listFonts(),
        fontStorage.getStorageStats(),
      ]);
      setFonts(fontsList);
      setStats(storageStats);
    } catch (error) {
      console.error('Failed to load fonts:', error);
      toast.error('Failed to load fonts from library');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (font: StoredFont) => {
    const blob = new Blob([font.data], { type: `font/${font.format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${font.name}.${font.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${font.name}`);
  };

  const handleDelete = async (fontId: string, fontName: string) => {
    if (!confirm(`Are you sure you want to delete "${fontName}"?`)) {
      return;
    }

    try {
      await fontStorage.deleteFont(fontId);
      toast.success('Font deleted');
      loadFonts(); // Reload list
    } catch (error) {
      console.error('Failed to delete font:', error);
      toast.error('Failed to delete font');
    }
  };

  const handlePreview = async (font: StoredFont) => {
    try {
      // Load font for preview
      const blob = new Blob([font.data], { type: `font/${font.format}` });
      const url = URL.createObjectURL(blob);
      const fontFace = new FontFace(font.name, `url(${url})`);

      await fontFace.load();
      document.fonts.add(fontFace);

      setSelectedFont(font.name);
      toast.success('Font loaded for preview');
    } catch (error) {
      console.error('Failed to preview font:', error);
      toast.error('Failed to load font preview');
    }
  };

  // Load all fonts for card previews on mount
  useEffect(() => {
    fonts.forEach(async (font) => {
      try {
        const blob = new Blob([font.data], { type: `font/${font.format}` });
        const url = URL.createObjectURL(blob);
        const fontFace = new FontFace(font.name, `url(${url})`);
        await fontFace.load();
        document.fonts.add(fontFace);
      } catch (error) {
        console.error(`Failed to load font ${font.name} for preview:`, error);
      }
    });
  }, [fonts]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading your font library...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Font Library</h1>
        <Button onClick={loadFonts} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Storage stats */}
      {stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold mb-2">Storage Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Fonts Stored</p>
              <p className="text-2xl font-bold">{stats.fonts.count}</p>
            </div>
            <div>
              <p className="text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold">{stats.total.sizeMB} MB</p>
            </div>
            <div>
              <p className="text-gray-600">Projects Saved</p>
              <p className="text-2xl font-bold">{stats.projects.count}</p>
            </div>
          </div>
        </div>
      )}

      {/* Preview section */}
      {selectedFont && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Font Preview</h2>
          <input
            type="text"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter preview text..."
          />
          <div
            className="text-4xl p-6 bg-gray-50 rounded"
            style={{ fontFamily: selectedFont }}
          >
            {previewText}
          </div>
          <div className="mt-4 space-y-2">
            <div
              className="text-2xl"
              style={{ fontFamily: selectedFont }}
            >
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </div>
            <div
              className="text-2xl"
              style={{ fontFamily: selectedFont }}
            >
              abcdefghijklmnopqrstuvwxyz
            </div>
            <div
              className="text-2xl"
              style={{ fontFamily: selectedFont }}
            >
              0123456789
            </div>
          </div>
        </div>
      )}

      {/* Font list */}
      {fonts.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">No fonts in your library yet</p>
          <Button onClick={() => window.location.href = '/create'}>
            Create Your First Font
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 justify-start">
          {fonts.map((font) => (
            <div
              key={font.id}
              className="flex flex-col gap-3"
            >
              {/* Font Card - Same as homepage */}
              <div
                className="w-[220px] h-[280px] bg-white border rounded-lg flex flex-col items-center justify-center gap-4 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => handlePreview(font)}
              >
                <div
                  className="text-center"
                  style={{ fontFamily: font.name }}
                >
                  <span className="text-7xl font-bold leading-none text-foreground">A</span>
                  <span className="text-6xl font-semibold leading-none text-foreground">a</span>
                </div>
                <span className="text-base text-muted-foreground font-medium">{font.name}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-[220px]">
                <Button
                  onClick={() => handleDownload(font)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handlePreview(font)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(font.id, font.name)}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>100% Private:</strong> All fonts are stored locally in your browser using IndexedDB.
          No data is sent to any server. Your fonts are only accessible on this device.
        </p>
      </div>
    </div>
  );
}
