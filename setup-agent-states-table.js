#!/usr/bin/env node
/**
 * Setup Script: Create agent_states table in Supabase
 * 
 * This script creates the agent_states table needed for real-time
 * agent tracking in the Command Center.
 * 
 * Run this once to initialize the database.
 */

const SUPABASE_URL = 'https://wfwglzrsuuqidscdqgao.supabase.co';
// Service role key - needed for database operations
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmd2dsenJzdXVxaWRzY2RxZ2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgxMjgwNywiZXhwIjoyMDg1Mzg4ODA3fQ.WPmAxHB6EddgdB_N0aQByAC0sB6RUUojusTQO8CvhkM';

const AGENTS = [
    'alex', 'penny', 'owen', 'devin', 'denise', 'molly', 'finn', 'mark',
    'randy', 'annie', 'ivan', 'sky', 'leo', 'clara', 'simon', 'henry'
];

async function checkTableExists() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/agent_states?select=count&limit=1`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    return response.ok;
}

async function insertInitialStates() {
    console.log('📝 Inserting initial agent states...\n');
    
    for (const agentId of AGENTS) {
        const state = agentId === 'alex' ? 'alexOffice' : 'idle';
        const task = agentId === 'alex' ? 'Coordinating team' : '';
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/agent_states`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal,resolution=ignore-duplicates'
            },
            body: JSON.stringify({
                agent_id: agentId,
                state: state,
                task: task,
                updated_at: new Date().toISOString()
            })
        });
        
        if (response.ok || response.status === 409) {
            console.log(`  ✅ ${agentId}: ${state}${task ? ` (${task})` : ''}`);
        } else {
            console.log(`  ❌ ${agentId}: Failed - ${await response.text()}`);
        }
    }
}

async function main() {
    console.log('🔧 Command Center - Agent States Table Setup\n');
    console.log('=' .repeat(50));
    
    // Check if table already exists
    const exists = await checkTableExists();
    
    if (exists) {
        console.log('✅ Table agent_states already exists!\n');
        console.log('Current states:');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/agent_states?select=*&order=agent_id`, {
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`
            }
        });
        
        if (response.ok) {
            const states = await response.json();
            states.forEach(s => {
                console.log(`  ${s.agent_id}: ${s.state}${s.task ? ` (${s.task})` : ''}`);
            });
        }
        
        console.log('\n✅ Setup complete! Real-time tracking is ready.');
        return;
    }
    
    console.log('❌ Table agent_states does not exist yet.\n');
    console.log('📋 Please create the table by running this SQL in Supabase Dashboard:\n');
    console.log('   1. Go to: https://supabase.com/dashboard/project/wfwglzrsuuqidscdqgao/sql');
    console.log('   2. Paste and run the following SQL:\n');
    console.log('-'.repeat(60));
    console.log(`
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
`);
    console.log('-'.repeat(60));
    console.log('\n   3. After creating the table, run this script again to insert initial states.');
}

main().catch(console.error);
