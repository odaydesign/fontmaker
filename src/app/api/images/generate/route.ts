import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Use POST with a JSON body containing a prompt to generate an image.',
    },
    { status: 405 }
  );
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 204 });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured.' },
      { status: 500 }
    );
  }

  try {
    const { prompt, count } = await request.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'A prompt is required to generate an image.' },
        { status: 400 }
      );
    }

    // Use gpt-image-1-mini exclusively (supports up to 4 images)
    const model = 'gpt-image-1-mini';
    const imageCount = Math.min(Math.max(Number(count) || 4, 1), 4);

    const client = new OpenAI({ apiKey });

    // Build request parameters
    const params: any = {
      model,
      prompt,
      size: '1536x1024',
      n: imageCount,
      quality: 'high', // High quality for better character detection
    };

    const response = await client.images.generate(params);

    const images = (response.data ?? [])
      .map(result => result.b64_json ?? null)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);

    if (images.length === 0) {
      const urls = (response.data ?? [])
        .map(result => result.url ?? null)
        .filter((value): value is string => typeof value === 'string' && value.length > 0);

      if (urls.length === 0) {
        return NextResponse.json(
          { error: 'No image was returned from OpenAI.' },
          { status: 502 }
        );
      }

      return NextResponse.json({ urls });
    }

    const imageUrls = images.map(image => `data:image/png;base64,${image}`);

    return NextResponse.json({ images: imageUrls });
  } catch (error) {
    console.error('Error generating image with OpenAI:', error);

    const status =
      typeof error === 'object' && error !== null && 'status' in error && typeof (error as any).status === 'number'
        ? (error as any).status
        : 500;

    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message ?? 'Failed to generate image.')
        : 'Failed to generate image.';

    return NextResponse.json({ error: message }, { status });
  }
}
