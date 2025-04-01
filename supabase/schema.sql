-- Create schema for our tables
CREATE SCHEMA IF NOT EXISTS public;

-- Set up necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create fonts table
CREATE TABLE IF NOT EXISTS fonts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  author TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  character_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create font_files table
CREATE TABLE IF NOT EXISTS font_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  font_id UUID REFERENCES fonts(id) ON DELETE CASCADE,
  format TEXT NOT NULL, -- 'ttf', 'otf', 'woff', 'woff2'
  url TEXT,
  storage_path TEXT,
  file_size INTEGER,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create source_images table
CREATE TABLE IF NOT EXISTS source_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  font_id UUID REFERENCES fonts(id) ON DELETE CASCADE,
  url TEXT,
  storage_path TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create character_mappings table
CREATE TABLE IF NOT EXISTS character_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  font_id UUID REFERENCES fonts(id) ON DELETE CASCADE,
  character TEXT NOT NULL,
  x1 FLOAT NOT NULL,
  y1 FLOAT NOT NULL,
  x2 FLOAT NOT NULL,
  y2 FLOAT NOT NULL,
  original_image_width FLOAT,
  original_image_height FLOAT,
  char_image_url TEXT,
  char_image_path TEXT,
  source_image_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create font_tags table
CREATE TABLE IF NOT EXISTS font_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  font_id UUID REFERENCES fonts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  
  -- Unique constraint to prevent duplicate tags for a font
  UNIQUE(font_id, name)
);

-- Create function to update the 'updated_at' field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the 'updated_at' field
CREATE TRIGGER update_fonts_updated_at
BEFORE UPDATE ON fonts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_font_files_updated_at
BEFORE UPDATE ON font_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
-- Only allow users to see their own fonts unless they are public
CREATE POLICY fonts_select_policy ON fonts
  FOR SELECT
  USING (
    is_public OR auth.uid() = user_id
  );

-- Only allow users to insert/update/delete their own fonts
CREATE POLICY fonts_insert_policy ON fonts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY fonts_update_policy ON fonts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY fonts_delete_policy ON fonts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for related tables
-- font_files policies
CREATE POLICY font_files_select_policy ON font_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fonts
      WHERE fonts.id = font_files.font_id
      AND (fonts.is_public OR fonts.user_id = auth.uid())
    )
  );

CREATE POLICY font_files_insert_policy ON font_files
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fonts
      WHERE fonts.id = font_files.font_id
      AND fonts.user_id = auth.uid()
    )
  );

CREATE POLICY font_files_update_policy ON font_files
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM fonts
      WHERE fonts.id = font_files.font_id
      AND fonts.user_id = auth.uid()
    )
  );

CREATE POLICY font_files_delete_policy ON font_files
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM fonts
      WHERE fonts.id = font_files.font_id
      AND fonts.user_id = auth.uid()
    )
  );

-- Apply similar policies for source_images, character_mappings and font_tags
-- source_images policies
CREATE POLICY source_images_select_policy ON source_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fonts
      WHERE fonts.id = source_images.font_id
      AND (fonts.is_public OR fonts.user_id = auth.uid())
    )
  );

-- character_mappings policies
CREATE POLICY character_mappings_select_policy ON character_mappings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fonts
      WHERE fonts.id = character_mappings.font_id
      AND (fonts.is_public OR fonts.user_id = auth.uid())
    )
  );

-- font_tags policies
CREATE POLICY font_tags_select_policy ON font_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fonts
      WHERE fonts.id = font_tags.font_id
      AND (fonts.is_public OR fonts.user_id = auth.uid())
    )
  );

-- Enable RLS on all tables
ALTER TABLE fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE font_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE font_tags ENABLE ROW LEVEL SECURITY; 