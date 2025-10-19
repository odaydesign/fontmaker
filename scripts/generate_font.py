#!/usr/bin/env python3
"""
Font generation script using FontForge

This script takes a JSON file with character mappings and
generates a font file in the specified format.

Usage:
  fontforge -script generate_font.py <charmap_file> <output_file> <font_name> [<format>] [<adjustments_file>]

Arguments:
  charmap_file: Path to the JSON file with character mappings
  output_file: Path to the output font file (without extension)
  font_name: Name of the font
  format: Font format (ttf, otf, woff, or woff2, default: ttf)
  adjustments_file: Path to the JSON file with font adjustments (optional)
"""

import fontforge
import json
import sys
import os
import datetime
import subprocess
import tempfile

# Comprehensive typographic metrics (in font units)
TYPEFACE_METRICS = {
    # Core metrics
    'units_per_em': 1000,
    'ascender': 800,        # 80% of em square
    'descender': -200,      # 20% of em square
    'x_height': 500,        # 50% of em square
    'cap_height': 700,      # 70% of em square
    'line_gap': 200,        # 20% of em square
    
    # Width metrics
    'default_width': 512,   # Slightly wider than half em square
    'default_spacing': 50,  # 5% of em square
    'word_spacing': 250,    # 25% of em square
    'sentence_spacing': 500, # 50% of em square
    
    # Character width ratios
    'narrow_width': 0.45,   # For i, l, I, J
    'medium_width': 0.55,   # For a, e, n, o
    'wide_width': 0.85,     # For m, w
    
    # Optical size
    'optical_size': 12,     # Default for body text
    
    # Side bearings
    'left_side_bearing': 0.05,  # 5% of character width
    'right_side_bearing': 0.05, # 5% of character width
    
    # Overshoot for round characters
    'overshoot': 20,        # 2% of em square
}

# Character width classifications
CHAR_WIDTH_CLASSES = {
    'narrow': ['i', 'l', 'I', 'J', 'f', 't', '1'],
    'medium': ['a', 'b', 'c', 'd', 'e', 'g', 'h', 'j', 'k', 'n', 'o', 'p', 'q', 'r', 's', 'u', 'v', 'x', 'y', 'z',
               'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z',
               '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    'wide': ['m', 'w', 'M', 'W']
}

# Comprehensive kerning pairs with optimized values
DEFAULT_KERNING_PAIRS = {
    # Uppercase combinations
    'AV': -50, 'AW': -50, 'AY': -50, 'Ta': -30, 'Te': -30, 'To': -30, 'Tr': -30, 'Tu': -30,
    'Ty': -30, 'Va': -40, 'Ve': -40, 'Vo': -40, 'Wa': -40, 'We': -40, 'Wo': -40, 'Ya': -40,
    'Ye': -40, 'Yo': -40, 'FA': -30, 'FE': -30, 'FO': -30, 'Fr': -30, 'FT': -30,
    
    # Lowercase combinations
    'av': -20, 'aw': -20, 'ay': -20, 'fa': -20, 'fe': -20, 'fo': -20, 'fr': -20, 'ft': -20,
    'ta': -20, 'te': -20, 'to': -20, 'tr': -20, 'tt': -20, 'tu': -20, 'ty': -20, 'va': -20,
    've': -20, 'vo': -20, 'wa': -20, 'we': -20, 'wo': -20, 'ya': -20, 'ye': -20, 'yo': -20,
    
    # Number combinations
    '1a': -20, '1e': -20, '1o': -20, '1u': -20, '1y': -20,
    '2a': -15, '2e': -15, '2o': -15, '2u': -15, '2y': -15,
    '3a': -15, '3e': -15, '3o': -15, '3u': -15, '3y': -15,
    '4a': -15, '4e': -15, '4o': -15, '4u': -15, '4y': -15,
    '5a': -15, '5e': -15, '5o': -15, '5u': -15, '5y': -15,
    '6a': -15, '6e': -15, '6o': -15, '6u': -15, '6y': -15,
    '7a': -15, '7e': -15, '7o': -15, '7u': -15, '7y': -15,
    '8a': -15, '8e': -15, '8o': -15, '8u': -15, '8y': -15,
    '9a': -15, '9e': -15, '9o': -15, '9u': -15, '9y': -15,
    '0a': -15, '0e': -15, '0o': -15, '0u': -15, '0y': -15
}

# Round characters that need overshoot
ROUND_CHARS = ['o', 'O', 'e', 'E', 'c', 'C', 'g', 'G', 'p', 'P', 'q', 'Q', 'b', 'B', 'd', 'D']

# Minimum and maximum side bearing (in font units)
MIN_SIDE_BEARING = 5
MAX_SIDE_BEARING = 40

# Add/strengthen kerning for FO and similar pairs (less aggressive)
DEFAULT_KERNING_PAIRS.update({
    'FO': -10, 'FA': -10, 'FE': -10, 'FI': -10, 'FL': -10,
    'IO': -10, 'IA': -10, 'IE': -10, 'IL': -10, 'IN': -10
})

# Set kerning for FO, FI, IO, etc. to zero (no negative kerning)
DEFAULT_KERNING_PAIRS.update({
    'FO': 0, 'FA': 0, 'FE': 0, 'FI': 0, 'FL': 0,
    'IO': 0, 'IA': 0, 'IE': 0, 'IL': 0, 'IN': 0
})

# Add positive kerning for FT, TF, and other problematic pairs
DEFAULT_KERNING_PAIRS.update({
    'FT': 20, 'TF': 20, 'FI': 10, 'IF': 10, 'TI': 10, 'IT': 10,
    'TT': 15, 'FF': 15, 'II': 10, 'TT': 15
})

# List of straight-sided glyphs (prone to collision)
STRAIGHT_GLYPHS = ['F', 'I', 'T', 'L', 'E', 'H', 'K', 'Z']

def get_character_width(char):
    """Determine the width class of a character."""
    for width_class, chars in CHAR_WIDTH_CLASSES.items():
        if char in chars:
            return width_class
    return 'medium'  # Default to medium width

def apply_overshoot(glyph, char):
    """Apply overshoot to round characters."""
    if char in ROUND_CHARS:
        bbox = glyph.boundingBox()
        if bbox:
            # Apply overshoot to top and bottom
            glyph.transform([1, 0, 0, 1, 0, TYPEFACE_METRICS['overshoot']])
            return True
    return False

def auto_balance_side_bearings(glyph, char):
    bbox = glyph.boundingBox()
    if not bbox:
        return
    width = bbox[2] - bbox[0]
    # Special case for F and I: moderate right side bearing
    if char in ['F', 'I']:
        left = max(20, min(int(width * 0.12), 40))
        right = max(25, min(int(width * 0.10), 50))
        print(f"DEBUG: {char} bbox={bbox}, width={width}, left={left}, right={right}")
        glyph.left_side_bearing = left
        glyph.right_side_bearing = right
        min_width = bbox[2] + right + 10
        glyph.width = max(glyph.width, min_width, 350)
        print(f"DEBUG: {char} final glyph.width={glyph.width}")
    # Special case for T
    elif char == 'T':
        left = max(20, min(int(width * 0.10), 40))
        right = max(20, min(int(width * 0.10), 40))
        print(f"DEBUG: {char} bbox={bbox}, width={width}, left={left}, right={right}")
        glyph.left_side_bearing = left
        glyph.right_side_bearing = right
        min_width = bbox[2] + right + 10
        glyph.width = max(glyph.width, min_width, 350)
        print(f"DEBUG: {char} final glyph.width={glyph.width}")
    elif char in CHAR_WIDTH_CLASSES['narrow']:
        left = right = max(MIN_SIDE_BEARING, min(int(width * 0.02), MAX_SIDE_BEARING))
        glyph.left_side_bearing = left
        glyph.right_side_bearing = right
    elif char in ROUND_CHARS:
        left = right = max(MIN_SIDE_BEARING, min(int(width * 0.07), MAX_SIDE_BEARING))
        glyph.left_side_bearing = left
        glyph.right_side_bearing = right
    else:
        left = right = max(MIN_SIDE_BEARING, min(int(width * 0.05), MAX_SIDE_BEARING))
        glyph.left_side_bearing = left
        glyph.right_side_bearing = right

def dynamic_side_bearings(glyph, char):
    try:
        contours = [c for c in glyph.foreground]
        if not contours:
            auto_balance_side_bearings(glyph, char)
            return
        min_x = min(point.x for contour in contours for point in contour)
        max_x = max(point.x for contour in contours for point in contour)
        if char == 'I':
            left_bearing = 10  # Much smaller than default
            right_bearing = 10
            min_width = 60     # Slightly wider than the outline
            glyph.width = max(left_bearing + (max_x - min_x) + right_bearing, min_width)
        else:
            left_bearing = max(15, min_x)
            right_bearing = 30
            left_bearing = min(left_bearing, 60)
            right_bearing = min(right_bearing, 60)
            glyph.width = left_bearing + (max_x - min_x) + right_bearing
        glyph.left_side_bearing = left_bearing
        glyph.right_side_bearing = right_bearing
        print(f"DYNAMIC: {char} min_x={min_x}, max_x={max_x}, left={left_bearing}, right={right_bearing}, width={glyph.width}")
    except Exception as e:
        print(f"DYNAMIC: {char} error in side bearing analysis: {e}")
        auto_balance_side_bearings(glyph, char)

# General safeguard: ensure minimum positive kerning for adjacent straight-sided glyphs
for left_char in STRAIGHT_GLYPHS:
    for right_char in STRAIGHT_GLYPHS:
        pair = left_char + right_char
        if pair not in DEFAULT_KERNING_PAIRS:
            DEFAULT_KERNING_PAIRS[pair] = 10  # Small positive kerning to prevent collision

def generate_font(charmap_file, output_file, font_name, format="ttf", adjustments_file=None):
    """Generate a font file from character mappings."""
    print("\n=== FONT GENERATION STARTED ===")
    print(f"Character map file: {charmap_file}")
    print(f"Output file: {output_file}.{format}")
    print(f"Font name: {font_name}")
    
    # Load character mappings
    with open(charmap_file, 'r') as f:
        char_data = json.load(f)
    
    print(f"Loaded {len(char_data)} character mappings")
    
    # Load adjustments if provided
    adjustments = {}
    if adjustments_file and os.path.exists(adjustments_file):
        with open(adjustments_file, 'r') as f:
            adjustments = json.load(f)
        print(f"SUCCESS: Loaded adjustments from {adjustments_file}")
        print(f"Adjustments content: {json.dumps(adjustments, indent=2)}")
    else:
        print(f"WARNING: No adjustments file found at {adjustments_file}")
    
    # Default adjustment values with improved defaults
    letter_spacing = adjustments.get('letterSpacing', 0)
    baseline_offset = adjustments.get('baselineOffset', 0)
    char_width_scaling = adjustments.get('charWidth', 100) / 100.0
    kerning_pairs = adjustments.get('kerningPairs', {})
    char_positions = adjustments.get('charPositions', {})
    optical_size = adjustments.get('opticalSize', TYPEFACE_METRICS['optical_size'])
    
    # Apply greater effect multipliers with optical size compensation
    size_factor = optical_size / TYPEFACE_METRICS['optical_size']
    letter_spacing_factor = 20 * size_factor
    baseline_offset_factor = 40 * size_factor
    kerning_factor = 20 * size_factor
    position_factor = 40 * size_factor
    
    print(f"Applied adjustments: letterSpacing={letter_spacing} (factor: {letter_spacing_factor})")
    print(f"Applied adjustments: baselineOffset={baseline_offset} (factor: {baseline_offset_factor})")
    print(f"Applied adjustments: charWidth={char_width_scaling}")
    print(f"Optical size: {optical_size}pt (factor: {size_factor})")
    
    if char_positions:
        print(f"Character positions: {json.dumps(char_positions, indent=2)}")
    else:
        print("No individual character positions defined")
        
    if kerning_pairs:
        print(f"Kerning pairs: {kerning_pairs}")
    else:
        print("No kerning pairs defined")
    
    # Create a new font
    font = fontforge.font()
    
    # Set font properties
    font.fontname = font_name.replace(" ", "")
    font.familyname = font_name
    font.fullname = font_name
    
    # Set font metadata
    font.copyright = f"Copyright (c) {datetime.datetime.now().year}"
    font.version = "1.0"
    
    # Set comprehensive typographic metrics
    font.em = TYPEFACE_METRICS['units_per_em']
    font.ascent = TYPEFACE_METRICS['ascender']
    font.descent = TYPEFACE_METRICS['descender']
    font.hhea_ascent = TYPEFACE_METRICS['ascender']
    font.hhea_descent = TYPEFACE_METRICS['descender']
    font.hhea_linegap = TYPEFACE_METRICS['line_gap']
    font.os2_winascent = TYPEFACE_METRICS['ascender']
    font.os2_windescent = TYPEFACE_METRICS['descender']
    font.os2_typoascent = TYPEFACE_METRICS['ascender']
    font.os2_typodescent = TYPEFACE_METRICS['descender']
    font.os2_typolinegap = TYPEFACE_METRICS['line_gap']
    
    # First pass: create all characters in the font
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
        
        # Set width based on character class
        width_class = get_character_width(char)
        if width_class == 'narrow':
            base_width = int(TYPEFACE_METRICS['default_width'] * TYPEFACE_METRICS['narrow_width'])
        elif width_class == 'wide':
            base_width = int(TYPEFACE_METRICS['default_width'] * TYPEFACE_METRICS['wide_width'])
        else:
            base_width = int(TYPEFACE_METRICS['default_width'] * TYPEFACE_METRICS['medium_width'])
        
        # Apply width scaling and spacing
        glyph.width = int(base_width * char_width_scaling) + TYPEFACE_METRICS['default_spacing']
    
    # Second pass: apply all adjustments to each glyph
    for char_mapping in char_data:
        char = char_mapping["char"]
        unicode_value = ord(char)
        
        # Skip if character wasn't created
        if unicode_value not in font:
            continue
        
        glyph = font[unicode_value]
        char_path = char_mapping["path"]
        
        # Import the image into the glyph
        try:
            # Clear any existing contours
            glyph.clear()

            print(f"Processing '{char}' from {char_path}")

            # For PNG/bitmap files, we need to:
            # 1. Convert PNG -> PBM (bitmap) using ImageMagick/convert
            # 2. Trace PBM -> SVG using potrace
            # 3. Import SVG into FontForge

            # Create temporary files for conversion
            with tempfile.NamedTemporaryFile(suffix='.pbm', delete=False) as pbm_file:
                pbm_path = pbm_file.name

            with tempfile.NamedTemporaryFile(suffix='.svg', delete=False) as svg_file:
                svg_path = svg_file.name

            try:
                # Step 1: Convert PNG to PBM using Python's PIL/Pillow or external tool
                # Using ImageMagick's convert command (should be available with brew)
                print(f"  Converting PNG to PBM...")
                result = subprocess.run(
                    ['sips', '-s', 'format', 'bmp', char_path, '--out', pbm_path],
                    capture_output=True,
                    text=True
                )

                if result.returncode != 0:
                    print(f"  Warning: sips conversion failed, trying alternative...")
                    # Try with convert if available
                    subprocess.run(['convert', char_path, pbm_path], check=True)

                # Step 2: Trace bitmap to SVG using potrace
                print(f"  Tracing bitmap to SVG with potrace...")
                result = subprocess.run(
                    ['potrace', '-s', '-o', svg_path, pbm_path],
                    capture_output=True,
                    text=True
                )

                if result.returncode != 0:
                    print(f"  Potrace error: {result.stderr}")
                    raise Exception(f"Potrace failed: {result.stderr}")

                # Step 3: Import the SVG into FontForge
                print(f"  Importing SVG into glyph...")
                glyph.importOutlines(svg_path)

                contour_count = len(glyph.foreground)
                print(f"  Imported {contour_count} contours from SVG")

                # Clean up temporary files
                if os.path.exists(pbm_path):
                    os.unlink(pbm_path)
                if os.path.exists(svg_path):
                    os.unlink(svg_path)

            except Exception as trace_error:
                print(f"  Tracing failed: {trace_error}")
                # Clean up on error
                if os.path.exists(pbm_path):
                    os.unlink(pbm_path)
                if os.path.exists(svg_path):
                    os.unlink(svg_path)
                raise

            # Verify we have contours
            contour_count = len(glyph.foreground)
            print(f"  Final contour count for '{char}': {contour_count}")

            # Only process if we have contours
            if contour_count > 0:
                # Simplify and clean up the paths
                glyph.simplify()   # Simplify paths to reduce points
                glyph.removeOverlap()  # Remove any overlapping contours
                glyph.correctDirection()  # Fix contour directions (clockwise/counter-clockwise)
                glyph.round()      # Round coordinates to integers
                glyph.autoHint()   # Add PostScript hints

                print(f"  Successfully processed '{char}' with {len(glyph.foreground)} contours")
            else:
                print(f"  ERROR: No contours generated for '{char}' - glyph will be empty!")
            
            # Apply overshoot for round characters
            apply_overshoot(glyph, char)
            
            # Apply dynamic side bearings
            dynamic_side_bearings(glyph, char)
            
            # Check for per-character position adjustment
            char_position = char_positions.get(char)
            
            # Apply character-specific vertical position adjustment if available
            if char_position:
                print(f"Found custom position for '{char}': x={char_position.get('x', 0)}, y={char_position.get('y', 0)}")
                
                # Apply Y adjustment (vertical positioning)
                if 'y' in char_position:
                    char_y_adjust = float(char_position['y']) * position_factor
                    print(f"Applying character-specific vertical adjustment to '{char}': {char_y_adjust}")
                    glyph.transform([1, 0, 0, 1, 0, char_y_adjust])
                
                # Handle X adjustment through glyph width and left/right side bearings
                if 'x' in char_position:
                    char_x_adjust = float(char_position['x']) * 0.4
                    print(f"Applying character-specific horizontal adjustment to '{char}': {char_x_adjust}")
                    glyph.left_side_bearing += int(char_x_adjust)
                    glyph.width = int(glyph.width * char_width_scaling) + int(letter_spacing * letter_spacing_factor)
            else:
                # If no character-specific position, apply global baseline adjustment
                if baseline_offset != 0:
                    total_vertical_adjust = baseline_offset * baseline_offset_factor
                    glyph.transform([1, 0, 0, 1, 0, total_vertical_adjust])
                    print(f"Applied global baseline adjustment to '{char}': vertical={total_vertical_adjust}")
                
                # Apply global letter spacing
                spacing_adjustment = int(letter_spacing * letter_spacing_factor)
                glyph.width = int(glyph.width * char_width_scaling) + spacing_adjustment
                print(f"Character '{char}': width={glyph.width}")
            
            print(f"Successfully imported '{char}' from {char_path}")
        except Exception as e:
            print(f"Error importing '{char}' from {char_path}: {e}")
    
    # === DYNAMIC KERNING FOR 'I' PAIRS ===
    print("\n=== DYNAMIC KERNING FOR 'I' PAIRS ===")
    try:
        # Create a lookup for kerning
        lookup = font.addLookup("kern", "gpos_pair", (), (("kern", (("latn", ("dflt")),)),))
        font.addLookupSubtable("kern", "kern-1")
        I_pairs = [chr(c) for c in range(65, 91)]  # A-Z
        threshold = 30
        for neighbor in I_pairs:
            if ord('I') in font and ord(neighbor) in font:
                glyph_I = font[ord('I')]
                glyph_N = font[ord(neighbor)]
                # Get rightmost point of I
                try:
                    I_contours = [c for c in glyph_I.foreground]
                    N_contours = [c for c in glyph_N.foreground]
                    if not I_contours or not N_contours:
                        continue
                    I_max_x = max(point.x for contour in I_contours for point in contour)
                    N_min_x = min(point.x for contour in N_contours for point in contour)
                    # Calculate distance between glyphs (assuming 0,0 origin for each)
                    distance = N_min_x + glyph_I.width - I_max_x
                    if distance < threshold:
                        kerning_value = threshold - distance
                        # Add positive kerning to separate
                        glyph_I.addPosSub("kern-1", neighbor, int(kerning_value), 0, 0, 0, 0, 0, 0, 0)
                        print(f"Added dynamic kerning for 'I{neighbor}' with value {int(kerning_value)} (distance={distance})")
                except Exception as e:
                    print(f"Error in dynamic kerning for I{neighbor}: {e}")
        print("Dynamic kerning for 'I' pairs applied.")
    except Exception as e:
        print(f"Error applying dynamic kerning for 'I' pairs: {e}")
    
    # Add default glyphs if needed (like space)
    if 32 not in font:  # ASCII space
        space = font.createChar(32)
        space.width = int(TYPEFACE_METRICS['default_width'] * 0.5)  # Space is half the default width
        print("Added space character to font")
    
    # Verify that adjustments have been applied
    print("\n=== VERIFICATION OF ADJUSTMENTS ===")
    if letter_spacing != 0:
        print(f"Letter spacing: {letter_spacing} * {letter_spacing_factor} = {letter_spacing * letter_spacing_factor} units")
    if baseline_offset != 0:
        print(f"Baseline offset: {baseline_offset} * {baseline_offset_factor} = {baseline_offset * baseline_offset_factor} units")
    if char_width_scaling != 1.0:
        print(f"Character width: {char_width_scaling * 100}% (scaling factor {char_width_scaling})")
    if kerning_pairs:
        print(f"Kerning pairs: {len(kerning_pairs)} pairs with factor {kerning_factor}")
    if char_positions:
        print(f"Per-character positions: {len(char_positions)} characters with custom positions")
        for char, pos in char_positions.items():
            print(f"  - '{char}': x={pos.get('x', 0)}, y={pos.get('y', 0)} -> Vertical offset: {float(pos.get('y', 0)) * position_factor} units")
    
    # Generate the font file
    output_path = f"{output_file}.{format}"
    print("\n=== GENERATING FONT FILE ===")
    font.generate(output_path)
    print(f"Font file successfully created: {output_path} ({os.path.getsize(output_path)} bytes)")
    print("=== FONT GENERATION COMPLETED ===")
    print(f"Generated font file: {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: fontforge -script generate_font.py <charmap_file> <output_file> <font_name> [<format>] [<adjustments_file>]")
        sys.exit(1)
    
    charmap_file = sys.argv[1]
    output_file = sys.argv[2]
    font_name = sys.argv[3]
    format = sys.argv[4] if len(sys.argv) > 4 else "ttf"
    adjustments_file = sys.argv[5] if len(sys.argv) > 5 else None
    
    generate_font(charmap_file, output_file, font_name, format, adjustments_file) 