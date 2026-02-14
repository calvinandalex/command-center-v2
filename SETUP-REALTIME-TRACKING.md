# Real-Time Agent Tracking Setup

The Command Center now supports real-time agent tracking via Supabase. Agents move based on actual states stored in the database, not random simulation.

## One-Time Setup: Create Database Table

Run this SQL in the Supabase SQL Editor:
https://supabase.com/dashboard/project/wfwglzrsuuqidscdqgao/sql

```sql
-- Agent States Table for Real-time Office Visualization
CREATE TABLE IF NOT EXISTS agent_states (
    agent_id TEXT PRIMARY KEY,
    state TEXT NOT NULL DEFAULT 'idle',
    task TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agent_states;

-- Enable RLS with public access (internal tool)
ALTER TABLE agent_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON agent_states FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON agent_states FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON agent_states FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON agent_states FOR DELETE USING (true);

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
```

## Updating Agent States

### Option 1: CLI Script

```bash
cd /Users/calvinbagley/alex/command-center
node update-agent-state.js <agent_id> <state> [task]

# Examples:
node update-agent-state.js devin working "Building new feature"
node update-agent-state.js penny meeting "Team sync"
node update-agent-state.js finn idle
node update-agent-state.js mark waiting "Needs approval"

# List current states:
node update-agent-state.js --list
```

### Option 2: Direct Supabase REST API

```bash
# Update Devin's state to "working"
curl -X PATCH 'https://wfwglzrsuuqidscdqgao.supabase.co/rest/v1/agent_states?agent_id=eq.devin' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"state": "working", "task": "Building features"}'
```

### Option 3: From Alex (programmatic)

```javascript
// Alex can update agent states via the Supabase client
await supabase
    .from('agent_states')
    .update({ state: 'working', task: 'Building features' })
    .eq('agent_id', 'devin');
```

## State Reference

| State      | Location           | Description                |
|------------|-------------------|----------------------------|
| `idle`     | Break Room        | Water cooler, relaxing     |
| `working`  | Agent's Desk      | At their assigned desk     |
| `meeting`  | Conference Room   | In team meeting            |
| `waiting`  | Calvin's Office   | Waiting for Calvin         |
| `withAlex` | Alex's Office     | Meeting with Alex          |

## How It Works

1. **On Load**: Office visualization fetches all states from Supabase
2. **Real-time**: Subscribes to Supabase Realtime for live updates
3. **On Update**: When any state changes in database, agents move immediately
4. **Fallback**: If Supabase unavailable, all agents start in breakroom (idle)
