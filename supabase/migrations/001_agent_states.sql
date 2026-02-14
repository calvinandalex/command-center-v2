-- Agent States Table for Real-time Office Visualization
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_states (
    agent_id TEXT PRIMARY KEY,
    state TEXT NOT NULL DEFAULT 'idle',
    task TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agent_states;

-- Enable RLS but allow anon access for read/write (this is an internal tool)
ALTER TABLE agent_states ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Allow public read" ON agent_states
    FOR SELECT USING (true);

-- Allow anyone to insert
CREATE POLICY "Allow public insert" ON agent_states
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update
CREATE POLICY "Allow public update" ON agent_states
    FOR UPDATE USING (true);

-- Allow anyone to delete
CREATE POLICY "Allow public delete" ON agent_states
    FOR DELETE USING (true);

-- Insert default states for all agents (idle in breakroom)
INSERT INTO agent_states (agent_id, state, task) VALUES
    ('alex', 'alexOffice', 'Coordinating team'),
    ('penny', 'idle', ''),
    ('owen', 'idle', ''),
    ('devin', 'idle', ''),
    ('denise', 'idle', ''),
    ('molly', 'idle', ''),
    ('finn', 'idle', ''),
    ('mark', 'idle', ''),
    ('randy', 'idle', ''),
    ('annie', 'idle', ''),
    ('ivan', 'idle', ''),
    ('sky', 'idle', ''),
    ('leo', 'idle', ''),
    ('clara', 'idle', ''),
    ('simon', 'idle', ''),
    ('henry', 'idle', '')
ON CONFLICT (agent_id) DO NOTHING;
