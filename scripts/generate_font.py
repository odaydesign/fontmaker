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
    
    # Default adjustment values
    letter_spacing = adjustments.get('letterSpacing', 0)
    baseline_offset = adjustments.get('baselineOffset', 0)
    char_width_scaling = adjustments.get('charWidth', 100) / 100.0
    kerning_pairs = adjustments.get('kerningPairs', {})
    char_positions = adjustments.get('charPositions', {})
    
    # Apply greater effect multipliers - significantly increased for baseline adjustments
    letter_spacing_factor = 20
    baseline_offset_factor = 40  # Doubled from 20 for more noticeable effect
    kerning_factor = 20
    position_factor = 40  # Doubled for per-character vertical adjustments
    
    print(f"Applied adjustments: letterSpacing={letter_spacing} (factor: {letter_spacing_factor})")
    print(f"Applied adjustments: baselineOffset={baseline_offset} (factor: {baseline_offset_factor})")
    print(f"Applied adjustments: charWidth={char_width_scaling}")
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
    
    # Adjust global font metrics based on adjustments
    default_width = 512
    adjusted_width = int(default_width * char_width_scaling)
    
    # Set units per em for more precise adjustments
    font.em = 1000
    
    # Set font metrics with more space for vertical adjustments
    font.ascent = 800
    font.descent = 200
    
    # Global baseline offset applied to font metrics
    if baseline_offset != 0:
        global_baseline = baseline_offset * baseline_offset_factor
        # Adjust ascent and descent based on baseline shift
        # This helps ensure characters don't get clipped
        if global_baseline > 0:
            font.ascent += int(global_baseline)
        else:
            font.descent += int(abs(global_baseline))
        print(f"Applied global baseline adjustment to font metrics: {global_baseline}")
    
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
        
        # Default width without adjustments
        glyph.width = adjusted_width
    
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
            
            # Import the image
            glyph.importOutlines(char_path)
            
            # Adjust the glyph metrics
            glyph.autoTrace()  # Trace the bitmap
            glyph.autoHint()   # Add hints
            glyph.round()      # Round to integers
            
            # Check for per-character position adjustment
            char_position = char_positions.get(char)
            
            # Apply character-specific vertical position adjustment if available
            if char_position:
                print(f"Found custom position for '{char}': x={char_position.get('x', 0)}, y={char_position.get('y', 0)}")
                
                # Apply Y adjustment (vertical positioning) - CRITICAL FIX HERE
                if 'y' in char_position:
                    # Apply a stronger vertical adjustment factor
                    char_y_adjust = float(char_position['y']) * position_factor
                    
                    # Make sure negative values move down and positive values move up
                    # This is the key fix for baseline positioning
                    print(f"Applying character-specific vertical adjustment to '{char}': {char_y_adjust}")
                    
                    # Apply the transformation to move the glyph vertically
                    glyph.transform([1, 0, 0, 1, 0, char_y_adjust])
                    
                    # Mark the character with a custom anchor point for debugging
                    try:
                        # Add an anchor point at the baseline to visualize the adjustment
                        glyph.addAnchorPoint("baseline_marker", "base", 0, 0)
                    except:
                        pass  # Ignore errors with anchor points
                
                # Handle X adjustment through glyph width and left/right side bearings
                if 'x' in char_position:
                    char_x_adjust = float(char_position['x']) * 0.4  # Increased factor for horizontal positioning
                    print(f"Applying character-specific horizontal adjustment to '{char}': {char_x_adjust}")
                    
                    # Adjust left side bearing 
                    glyph.left_side_bearing += int(char_x_adjust)
                    
                    # Reset width to default plus spacing
                    glyph.width = adjusted_width + int(letter_spacing * letter_spacing_factor)
            else:
                # If no character-specific position, apply global baseline adjustment
                if baseline_offset != 0:
                    total_vertical_adjust = baseline_offset * baseline_offset_factor
                    glyph.transform([1, 0, 0, 1, 0, total_vertical_adjust])
                    print(f"Applied global baseline adjustment to '{char}': vertical={total_vertical_adjust}")
                
                # Apply global letter spacing
                spacing_adjustment = int(letter_spacing * letter_spacing_factor)
                glyph.width = adjusted_width + spacing_adjustment
                print(f"Character '{char}': width={glyph.width} (base={adjusted_width}, spacing adjustment={spacing_adjustment})")
            
            # Apply character width scaling
            # This scales the glyph outlines horizontally while keeping the glyph.width set above
            if char_width_scaling != 1.0:
                bbox = glyph.boundingBox()
                if bbox:  # Make sure we have a valid bounding box
                    # Get the center of the glyph horizontally
                    center_x = (bbox[0] + bbox[2]) / 2
                    
                    # Create transformation matrix for scaling from center
                    # First translate center to origin, then scale, then translate back
                    glyph.transform([1, 0, 0, 1, -center_x, 0])  # Translate to origin
                    glyph.transform([char_width_scaling, 0, 0, 1, 0, 0])  # Scale horizontally
                    glyph.transform([1, 0, 0, 1, center_x, 0])  # Translate back
                    
                    print(f"Applied width scaling to '{char}': scale={char_width_scaling}")
            
            print(f"Successfully imported '{char}' from {char_path}")
        except Exception as e:
            print(f"Error importing '{char}' from {char_path}: {e}")
    
    # Apply kerning pairs
    if kerning_pairs:
        print("\n=== APPLYING KERNING PAIRS ===")
        try:
            # Create a lookup for kerning
            lookup = font.addLookup("kern", "gpos_pair", (), (("kern", (("latn", ("dflt")),)),))
            
            # Create a subtable in that lookup
            font.addLookupSubtable("kern", "kern-1")
            
            # Now add the kerning pairs to the subtable
            for pair, value in kerning_pairs.items():
                if len(pair) == 2:
                    left_char, right_char = pair[0], pair[1]
                    left_unicode = ord(left_char)
                    right_unicode = ord(right_char)
                    
                    # Make sure both characters exist in the font
                    if left_unicode in font and right_unicode in font:
                        # Convert adjustment value to font units - negative value means tighter spacing
                        kerning_value = int(value * -kerning_factor)
                        
                        # Add the kerning pair to the subtable
                        font[left_unicode].addPosSub("kern-1", right_char, kerning_value, 0, 0, 0, 0, 0, 0, 0)
                        print(f"Added kerning pair for '{pair}' with value {kerning_value}")
                    else:
                        print(f"Warning: Cannot add kerning for '{pair}' - one or both characters missing from font")
            
            print(f"Successfully applied {len(kerning_pairs)} kerning pairs")
        except Exception as e:
            print(f"Error applying kerning pairs: {e}")
    
    # Add default glyphs if needed (like space)
    if 32 not in font:  # ASCII space
        space = font.createChar(32)
        space.width = adjusted_width // 2  # Adjust space width based on char width scaling
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
    try:
        # Generate the font file with appropriate options
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
        
        # Verify the font file was created
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            print(f"Font file successfully created: {output_path} ({file_size} bytes)")
            if file_size < 1000:
                print("WARNING: Font file is unusually small, may indicate generation problems")
        else:
            print(f"ERROR: Font file was not created at {output_path}")
            return False
    except Exception as e:
        print(f"ERROR generating font: {e}")
        return False
    
    print("=== FONT GENERATION COMPLETED ===\n")
    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: fontforge -script generate_font.py <charmap_file> <output_file> <font_name> [<format>] [<adjustments_file>]")
        sys.exit(1)
    
    charmap_file = sys.argv[1]
    output_file = sys.argv[2]
    font_name = sys.argv[3]
    format = sys.argv[4] if len(sys.argv) > 4 else "ttf"
    adjustments_file = sys.argv[5] if len(sys.argv) > 5 else None
    
    result = generate_font(charmap_file, output_file, font_name, format, adjustments_file)
    if not result:
        sys.exit(1) 