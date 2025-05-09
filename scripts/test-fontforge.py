#!/usr/bin/env python3
import fontforge
import sys

def test_fontforge():
    try:
        # Create a new font
        font = fontforge.font()
        
        # Add a simple glyph
        glyph = font.createChar(65, "A")  # ASCII 65 is 'A'
        
        # Draw a simple triangle for the 'A'
        pen = glyph.glyphPen()
        pen.moveTo(0, 0)
        pen.lineTo(500, 1000)
        pen.lineTo(1000, 0)
        pen.closePath()
        
        print("FontForge is working correctly!")
        return True
    except Exception as e:
        print(f"Error testing FontForge: {e}")
        return False

if __name__ == "__main__":
    success = test_fontforge()
    sys.exit(0 if success else 1) 