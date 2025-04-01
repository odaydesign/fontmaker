#!/usr/bin/env python3
"""
Font generation script using FontForge

This script takes a JSON file with character mappings and
generates a font file in the specified format.

Usage:
  fontforge -script generate_font.py <charmap_file> <output_file> <font_name> [<format>]

Arguments:
  charmap_file: Path to the JSON file with character mappings
  output_file: Path to the output font file (without extension)
  font_name: Name of the font
  format: Font format (ttf, otf, woff, or woff2, default: ttf)
"""

import fontforge
import json
import sys
import os
import datetime

def generate_font(charmap_file, output_file, font_name, format="ttf"):
    """Generate a font file from character mappings."""
    # Load character mappings
    with open(charmap_file, 'r') as f:
        char_data = json.load(f)
    
    # Create a new font
    font = fontforge.font()
    
    # Set font properties
    font.fontname = font_name.replace(" ", "")
    font.familyname = font_name
    font.fullname = font_name
    
    # Set font metadata
    font.copyright = f"Copyright (c) {datetime.datetime.now().year}"
    font.version = "1.0"
    
    # Process each character
    for char_mapping in char_data:
        char = char_mapping["char"]
        char_path = char_mapping["path"]
        unicode_value = ord(char)
        
        # Skip if image doesn't exist
        if not os.path.exists(char_path):
            print(f"Warning: Image for '{char}' not found at {char_path}")
            continue
        
        # Create a new glyph with the appropriate unicode value
        glyph = font.createChar(unicode_value)
        glyph.width = 512  # Default width
        
        # Import the image into the glyph
        try:
            # Clear any existing contours
            glyph.clear()
            
            # Import the image
            glyph.importOutlines(char_path)
            
            # Adjust the glyph metrics
            glyph.autoTrace()  # Trace the bitmap
            glyph.autoHint()   # Add hints
            glyph.round()      # Round to integers
            
            print(f"Successfully imported '{char}' from {char_path}")
        except Exception as e:
            print(f"Error importing '{char}' from {char_path}: {e}")
    
    # Generate the appropriate font file
    output_path = f"{output_file}.{format}"
    
    # Add default glyphs if needed (like space)
    if 32 not in font:  # ASCII space
        space = font.createChar(32)
        space.width = 256  # Half of the default glyph width
    
    # Generate the font file
    if format == "ttf":
        font.generate(output_path)
    elif format == "otf":
        font.generate(output_path, flags=("opentype",))
    elif format == "woff":
        font.generate(output_path, flags=("woff",))
    elif format == "woff2":
        font.generate(output_path, flags=("woff2",))
    else:
        print(f"Unsupported format: {format}, using ttf instead")
        font.generate(f"{output_file}.ttf")
    
    print(f"Generated font at {output_path}")
    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: fontforge -script generate_font.py <charmap_file> <output_file> <font_name> [<format>]")
        sys.exit(1)
    
    charmap_file = sys.argv[1]
    output_file = sys.argv[2]
    font_name = sys.argv[3]
    format = sys.argv[4] if len(sys.argv) > 4 else "ttf"
    
    generate_font(charmap_file, output_file, font_name, format) 