# HappyFont - AI Typography Creation

HappyFont is a web application that allows users to create custom typography fonts using AI-generated graphics or uploaded images. The application provides an intuitive workflow for mapping characters, testing the font, and exporting it in various formats.

## Features

- **Image Upload/Generation**: Upload your own images or generate them with AI prompts
- **Character Mapping**: Map characters to regions in your images
- **Font Testing**: Preview your font with different text samples
- **Font Metadata**: Add details about your font, including name, author, and tags
- **Font Export**: Download your font in various formats (TTF, OTF, WOFF2)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/happyfont.git
cd happyfont
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
happyfont/
├── src/                  # Source code
│   ├── app/              # Next.js app directory
│   │   ├── layout/       # Layout components
│   │   ├── tools/        # Font creation tools
│   │   └── ui/           # Reusable UI components
│   └── context/          # React context for state management
├── public/              # Static assets
│   └── demo-fonts/      # Placeholder font files for demo
└── README.md            # This file
```

## How Font Generation Works

The current implementation provides a UI flow for font creation but does not include the actual font generation logic. In a production environment, the font generation would involve:

1. **Backend Processing**: A server endpoint that receives character mappings and images
2. **Character Extraction**: Cutting out each character from the source images based on mapping coordinates
3. **Image Processing**: Cleaning up, normalizing, and vectorizing the character images
4. **Font Creation**: Using a font creation library like FontForge to generate font files
5. **Storage**: Storing the generated fonts and providing download links

### Implementation Notes for Real Font Generation

For actual font generation functionality, consider implementing:

1. **API Endpoint**: Create a `/api/fonts/generate` endpoint that accepts:
   - Character mappings with coordinates
   - Source images or URLs
   - Font metadata
   - Desired output format

2. **Python Backend**: Use libraries like:
   - `fontforge` for font creation
   - `numpy` and `opencv` for image processing
   - `potrace` for vectorization

3. **Storage**: Store generated fonts in:
   - Local file system (development)
   - Cloud storage like AWS S3 (production)

## Future Enhancements

- Real-time font previewing during character mapping
- Advanced font settings (spacing, kerning, etc.)
- Font sharing and community gallery
- Font editing and version history
- Export to additional formats
- Enhanced AI image generation with more style options
- Character set templates for different languages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI](https://openai.com/) (for AI image generation concepts)
