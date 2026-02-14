#!/usr/bin/env node
/**
 * Update Agent State in Command Center
 * 
 * Usage:
 *   node update-agent-state.js <agent_id> <state> [task]
 * 
 * Examples:
 *   node update-agent-state.js devin working "Building new feature"
 *   node update-agent-state.js penny meeting "Team sync"
 *   node update-agent-state.js finn idle
 *   node update-agent-state.js mark waiting "Needs approval"
 * 
 * States:
 *   - idle      → Agent goes to Break Room
 *   - working   → Agent goes to their desk
 *   - meeting   → Agent goes to Conference Room
 *   - waiting   → Agent goes to Calvin's Office
 *   - withAlex  → Agent goes to Alex's Office
 */

const SUPABASE_URL = 'https://wfwglzrsuuqidscdqgao.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmd2dsenJzdXVxaWRzY2RxZ2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTI4MDcsImV4cCI6MjA4NTM4ODgwN30.Tpnv0rJBE1WCmdpt-yHzLIbnNrpriFeAJQeY2y33VlM';

const VALID_AGENTS = [
    'alex', 'penny', 'owen', 'devin', 'denise', 'molly', 'finn', 'mark',
    'randy', 'annie', 'ivan', 'sky', 'leo', 'clara', 'simon', 'henry'
];

const VALID_STATES = ['idle', 'working', 'meeting', 'waiting', 'withAlex', 'alexOffice'];

async function updateAgentState(agentId, state, task = '') {
    // Validate inputs
    if (!VALID_AGENTS.includes(agentId)) {
        console.error(`❌ Invalid agent: ${agentId}`);
        console.error(`Valid agents: ${VALID_AGENTS.join(', ')}`);
        process.exit(1);
    }
    
    if (!VALID_STATES.includes(state)) {
        console.error(`❌ Invalid state: ${state}`);
        console.error(`Valid states: ${VALID_STATES.join(', ')}`);
        process.exit(1);
    }
    
    // First try PATCH (update existing)
    const patchResponse = await fetch(`${SUPABASE_URL}/rest/v1/agent_states?agent_id=eq.${agentId}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            state: state,
            task: task,
            updated_at: new Date().toISOString()
        })
    });
    
    if (patchResponse.ok) {
        const result = await patchResponse.json();
        if (result.length > 0) {
            console.log(`✅ ${agentId} → ${state}${task ? ` (${task})` : ''}`);
            return true;
        }
    }
    
    // If PATCH didn't update anything, INSERT
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/agent_states`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            agent_id: agentId,
            state: state,
            task: task,
            updated_at: new Date().toISOString()
        })
    });
    
    if (insertResponse.ok) {
        console.log(`✅ ${agentId} → ${state}${task ? ` (${task})` : ''} (created)`);
        return true;
    }
    
    console.error(`❌ Failed to update ${agentId}:`, await insertResponse.text());
    return false;
}

async function showCurrentStates() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/agent_states?select=*&order=agent_id`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    
    if (response.ok) {
        const states = await response.json();
        console.log('\n📊 Current Agent States:\n');
        console.log('Agent'.padEnd(10) + 'State'.padEnd(12) + 'Task');
        console.log('-'.repeat(50));
        states.forEach(s => {
            console.log(
                s.agent_id.padEnd(10) + 
                s.state.padEnd(12) + 
                (s.task || '-')
            );
        });
        console.log();
    } else {
        console.error('Failed to fetch states:', await response.text());
    }
}

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage: node update-agent-state.js <agent_id> <state> [task]
       node update-agent-state.js --list

Arguments:
  agent_id  One of: ${VALID_AGENTS.join(', ')}
  state     One of: idle, working, meeting, waiting, withAlex
  task      Optional task description

State Locations:
  idle     → Break Room (water cooler)
  working  → Agent's desk
  meeting  → Conference Room
  waiting  → Calvin's Office
  withAlex → Alex's Office

Examples:
  node update-agent-state.js devin working "Building real-time tracking"
  node update-agent-state.js penny meeting "Team sync"
  node update-agent-state.js finn idle
  node update-agent-state.js --list
`);
    process.exit(0);
}

if (args[0] === '--list' || args[0] === '-l') {
    showCurrentStates();
} else {
    const [agentId, state, ...taskParts] = args;
    const task = taskParts.join(' ');
    
    if (!agentId || !state) {
        console.error('❌ Missing required arguments');
        console.error('Usage: node update-agent-state.js <agent_id> <state> [task]');
        process.exit(1);
    }
    
    updateAgentState(agentId.toLowerCase(), state.toLowerCase(), task);
}
