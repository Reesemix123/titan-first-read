-- Migration: Normalize playbook_plays table to use JSONB attributes
-- This creates a clean, AI-ready schema with single source of truth

-- Step 1: Add new columns
ALTER TABLE playbook_plays
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS diagram JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Migrate existing data to new structure
UPDATE playbook_plays SET attributes = jsonb_build_object(
  'odk', COALESCE(odk, 'offense'),
  'formation', COALESCE(off_form, ''),
  'playType', COALESCE(play_type, ''),
  'personnel', COALESCE(personnel, ''),
  'runConcept', COALESCE(off_play, ''),
  'motion', COALESCE(motion_shift, ''),
  'targetHole', COALESCE(gap, ''),
  'ballCarrier', COALESCE(ball_carrier, ''),
  'front', COALESCE(def_front, ''),
  'coverage', COALESCE(def_coverage, ''),
  'blitzType', COALESCE(def_blitz, ''),
  'unit', COALESCE(st_unit, ''),
  'customTags', COALESCE(tags, '[]'::jsonb)
)
WHERE attributes = '{}';

-- Step 3: Migrate play_diagram to diagram
UPDATE playbook_plays SET diagram = play_diagram
WHERE play_diagram IS NOT NULL AND diagram = '{}';

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_playbook_plays_attributes ON playbook_plays USING GIN (attributes);
CREATE INDEX IF NOT EXISTS idx_playbook_plays_odk ON playbook_plays ((attributes->>'odk'));
CREATE INDEX IF NOT EXISTS idx_playbook_plays_formation ON playbook_plays ((attributes->>'formation'));

-- Step 5: Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_playbook_plays_updated_at ON playbook_plays;
CREATE TRIGGER update_playbook_plays_updated_at
  BEFORE UPDATE ON playbook_plays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: Old columns are kept for now for backward compatibility
-- After verifying the migration worked, you can drop them manually if desired