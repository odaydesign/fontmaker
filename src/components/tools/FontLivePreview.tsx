import React, { useState, useEffect } from 'react';
import { useFont } from '@/context/FontContext';
import { toast } from 'sonner';

const FontLivePreview: React.FC = () => {
  const { fontAdjustments } = useFont();
  const [fontUrl, setFontUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleText, setSampleText] = useState('The quick brown fox jumps over the lazy dog 1234567890');
  const [fontFamily, setFontFamily] = useState('');

  // Generate a unique font family name for each preview
  useEffect(() => {
    setFontFamily('HappeFontPreview_' + Math.random().toString(36).slice(2, 10));
  }, []);

  // Fetch the preview font when adjustments change
  useEffect(() => {
    let cancelled = false;
    async function fetchFont() {
      setLoading(true);
      setError(null);
      setFontUrl(null);
      try {
        const res = await fetch('/api/preview-font', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adjustments: fontAdjustments }),
        });
        const data = await res.json();
        if (!res.ok || !data.fontUrl) {
          throw new Error(data.error || 'Failed to generate preview font');
        }
        if (!cancelled) {
          setFontUrl(data.fontUrl);
        }
      } catch (err: any) {
        setError(err.message || 'Error generating font preview');
        toast.error('Font preview failed: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
    fetchFont();
    return () => { cancelled = true; };
    // Only re-run when adjustments change
  }, [JSON.stringify(fontAdjustments)]);

  // Inject @font-face rule when fontUrl changes
  useEffect(() => {
    if (!fontUrl || !fontFamily) return;
    const style = document.createElement('style');
    style.innerHTML = `@font-face { font-family: '${fontFamily}'; src: url('${fontUrl}') format('woff2'); font-display: swap; }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, [fontUrl, fontFamily]);

  return (
    <div className="p-4 border rounded-lg bg-white mt-4">
      <h4 className="font-medium mb-2">Live Font Preview</h4>
      <input
        type="text"
        value={sampleText}
        onChange={e => setSampleText(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        placeholder="Type to preview your font..."
      />
      {loading && (
        <div className="text-blue-500">Generating preview font...</div>
      )}
      {error && (
        <div className="text-red-500">{error}</div>
      )}
      {fontUrl && !loading && !error && (
        <div className="border p-4 rounded bg-gray-50">
          <span
            style={{
              fontFamily: fontFamily,
              fontSize: 48,
              display: 'block',
              wordBreak: 'break-word',
              minHeight: 64,
            }}
          >
            {sampleText}
          </span>
          <div className="text-xs text-gray-400 mt-2">Font file: <a href={fontUrl} target="_blank" rel="noopener noreferrer" className="underline">{fontUrl}</a></div>
        </div>
      )}
      {!fontUrl && !loading && !error && (
        <div className="text-gray-400">No preview available.</div>
      )}
    </div>
  );
};

export default FontLivePreview; 