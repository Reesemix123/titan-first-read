-- Make play_code unique
ALTER TABLE playbook_plays
ADD CONSTRAINT playbook_plays_play_code_unique UNIQUE (play_code);

-- Create play_instances table
CREATE TABLE play_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  play_code TEXT REFERENCES playbook_plays(play_code) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  timestamp_start INTEGER NOT NULL,
  timestamp_end INTEGER,
  
  down INTEGER CHECK (down BETWEEN 1 AND 4),
  distance INTEGER,
  yard_line INTEGER CHECK (yard_line BETWEEN 0 AND 100),
  hash_mark TEXT CHECK (hash_mark IN ('left', 'middle', 'right')),
  
  result TEXT,
  yards_gained INTEGER,
  
  notes TEXT,
  tags JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_play_instances_video ON play_instances(video_id);
CREATE INDEX idx_play_instances_play_code ON play_instances(play_code);
CREATE INDEX idx_play_instances_team ON play_instances(team_id);
CREATE INDEX idx_play_instances_tags ON play_instances USING GIN (tags);

-- Trigger
CREATE TRIGGER update_play_instances_updated_at
  BEFORE UPDATE ON play_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();