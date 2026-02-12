// Command Center v2 - Dashboard Logic
// Syncs with Virtual Office agent states

const projects = [
    { name: 'VitalStack', status: 'Design', progress: 15 },
    { name: 'Gentle Pace Fitness', status: 'Development', progress: 75 },
    { name: 'Medicare Broker Directory', status: 'Live', progress: 60 },
    { name: 'Command Center v2', status: 'Building', progress: 70 },
    { name: 'Multi-Agent System', status: 'Complete', progress: 100 }
];

let feedItems = [];
let lastKnownStates = {};

// Tab switching
document.addEventListener('DOMContentLoaded', () => {
    // Tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
    
    // Initial render
    setTimeout(() => {
        renderWaitingItems();
        renderProjects();
        renderFeed();
        populateFilter();
        
        // Track initial states for change detection
        if (window.getAgentStates) {
            lastKnownStates = JSON.parse(JSON.stringify(window.getAgentStates()));
        }
    }, 100); // Small delay to let office.js initialize
    
    // Listen for state updates from Virtual Office
    window.addEventListener('agentStatesUpdated', (e) => {
        detectAndLogChanges(e.detail);
        renderWaitingItems();
    });
    
    // Poll for changes every 2 seconds (backup sync)
    setInterval(() => {
        renderWaitingItems();
    }, 2000);
});

function detectAndLogChanges(newStates) {
    if (!window.agents) return;
    
    for (const [agentId, newState] of Object.entries(newStates)) {
        const oldState = lastKnownStates[agentId];
        if (!oldState || oldState.state !== newState.state || oldState.task !== newState.task) {
            const agent = window.agents.find(a => a.id === agentId);
            if (agent && newState.task) {
                // Add to feed
                const action = getActionText(newState.state, newState.task);
                addToFeed(agent.name.toLowerCase(), action, agent.color);
            }
        }
    }
    lastKnownStates = JSON.parse(JSON.stringify(newStates));
}

function getActionText(state, task) {
    switch(state) {
        case 'working': return `working on: ${task}`;
        case 'meeting': return `joined meeting: ${task}`;
        case 'waiting': return `needs Calvin: ${task}`;
        case 'withAlex': return `meeting with Alex: ${task}`;
        case 'idle': return 'taking a break';
        default: return task;
    }
}

function addToFeed(agentName, action, color) {
    feedItems.unshift({
        agent: agentName,
        action: action,
        time: 'now',
        color: color
    });
    
    if (feedItems.length > 20) feedItems.pop();
    renderFeed();
    
    // Age timestamps
    setTimeout(() => {
        feedItems.forEach((item, i) => {
            if (item.time === 'now') item.time = '1m ago';
        });
        renderFeed();
    }, 60000);
}

function renderWaitingItems() {
    const container = document.getElementById('waiting-items');
    if (!container) return;
    
    // Get waiting items from Virtual Office state
    const waitingItems = window.getWaitingItems ? window.getWaitingItems() : [];
    
    if (waitingItems.length === 0) {
        container.innerHTML = '<p style="color:#3fb950;padding:10px;">✓ All clear - no one waiting!</p>';
        return;
    }
    
    container.innerHTML = waitingItems.map(item => `
        <div class="waiting-item">
            <div>
                <h4>${item.title}</h4>
                <p><strong>${item.agent}:</strong> ${item.desc}</p>
                ${item.task ? `<p style="color:#888;font-size:10px;">Task: ${item.task}</p>` : ''}
            </div>
            <button class="btn btn-approve" onclick="approveItem('${item.agentId}')">Approve</button>
        </div>
    `).join('');
}

function renderProjects() {
    const container = document.getElementById('projects-list');
    if (!container) return;
    
    container.innerHTML = projects.map(p => `
        <div class="project-card">
            <h4>${p.name} <span style="color:#8b949e;font-size:10px;">${p.status}</span></h4>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${p.progress}%"></div>
            </div>
        </div>
    `).join('');
}

function renderFeed() {
    const container = document.getElementById('feed-items');
    if (!container) return;
    
    if (feedItems.length === 0) {
        container.innerHTML = '<p style="color:#666;padding:10px;">Activity will appear here...</p>';
        return;
    }
    
    container.innerHTML = feedItems.map(item => `
        <div class="feed-item">
            <div class="feed-avatar" style="background:${item.color}">${item.agent.substring(0,2).toUpperCase()}</div>
            <span><strong>${item.agent}</strong> ${item.action}</span>
            <span class="feed-time">${item.time}</span>
        </div>
    `).join('');
}

function populateFilter() {
    const select = document.getElementById('agent-filter');
    if (!select || !window.agents) return;
    
    window.agents.forEach(agent => {
        const opt = document.createElement('option');
        opt.value = agent.id;
        opt.textContent = agent.name;
        select.appendChild(opt);
    });
    
    select.addEventListener('change', () => {
        const val = select.value;
        renderFilteredFeed(val);
    });
}

function renderFilteredFeed(agentFilter) {
    const container = document.getElementById('feed-items');
    if (!container) return;
    
    const filtered = agentFilter === 'all' 
        ? feedItems 
        : feedItems.filter(f => f.agent === agentFilter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color:#666;padding:10px;">No activity for this agent...</p>';
        return;
    }
    
    container.innerHTML = filtered.map(item => `
        <div class="feed-item">
            <div class="feed-avatar" style="background:${item.color}">${item.agent.substring(0,2).toUpperCase()}</div>
            <span><strong>${item.agent}</strong> ${item.action}</span>
            <span class="feed-time">${item.time}</span>
        </div>
    `).join('');
}

function approveItem(agentId) {
    // Move agent from waiting to working
    if (window.moveAgentTo) {
        const agent = window.agents.find(a => a.id === agentId);
        window.moveAgentTo(agentId, 'working', 'Approved - proceeding');
        
        // Add to feed
        if (agent) {
            addToFeed(agent.name.toLowerCase(), 'approved by Calvin ✓', '#22c55e');
        }
    }
    
    renderWaitingItems();
}

// Initialize some feed items on load
setTimeout(() => {
    if (window.agents) {
        addToFeed('alex', 'coordinating team operations', '#8b5cf6');
        addToFeed('devin', 'building Command Center v2', '#10b981');
        addToFeed('leo', 'completed Agent Messaging Policy', '#6366f1');
    }
}, 500);
