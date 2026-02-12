// Command Center v2 - Dashboard Logic

// Mock data
const waitingItems = [
    { id: 1, agent: 'penny', title: 'Podcast scheduling', desc: 'PodMatch booking needs approval' },
    { id: 2, agent: 'finn', title: 'QuickBooks access', desc: 'Required for financial tracking' },
    { id: 3, agent: 'ivan', title: 'Trading credentials', desc: 'Coinbase access for UNI play' }
];

const projects = [
    { name: 'VitalStack', status: 'Design', progress: 15 },
    { name: 'Gentle Pace Fitness', status: 'Development', progress: 75 },
    { name: 'Medicare Broker Directory', status: 'Live', progress: 60 },
    { name: 'Command Center v2', status: 'Building', progress: 50 },
    { name: 'Multi-Agent System', status: 'Complete', progress: 100 }
];

let feedItems = [
    { agent: 'leo', action: 'completed Agent Messaging Policy', time: '2m ago', color: '#6366f1' },
    { agent: 'denise', action: 'designed Virtual Office specs', time: '8m ago', color: '#06b6d4' },
    { agent: 'simon', action: 'finished security review', time: '12m ago', color: '#64748b' },
    { agent: 'devin', action: 'started Command Center build', time: '15m ago', color: '#10b981' },
    { agent: 'alex', action: 'deployed messaging policy', time: '20m ago', color: '#8b5cf6' }
];

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
    
    // Render dashboard
    renderWaitingItems();
    renderProjects();
    renderFeed();
    populateFilter();
});

function renderWaitingItems() {
    const container = document.getElementById('waiting-items');
    if (!container) return;
    
    if (waitingItems.length === 0) {
        container.innerHTML = '<p style="color:#3fb950;padding:10px;">✓ All clear!</p>';
        return;
    }
    
    container.innerHTML = waitingItems.map(item => `
        <div class="waiting-item">
            <div>
                <h4>${item.title}</h4>
                <p>${item.agent}: ${item.desc}</p>
            </div>
            <button class="btn btn-approve" onclick="approveItem(${item.id})">Approve</button>
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
}

function approveItem(id) {
    const idx = waitingItems.findIndex(i => i.id === id);
    if (idx > -1) {
        const item = waitingItems[idx];
        
        // Add to feed
        feedItems.unshift({
            agent: item.agent,
            action: `approved: ${item.title}`,
            time: 'now',
            color: '#22c55e'
        });
        
        // Move agent from waiting to working
        if (window.moveAgentTo) {
            window.moveAgentTo(item.agent, 'working');
        }
        
        // Remove from waiting
        waitingItems.splice(idx, 1);
        
        renderWaitingItems();
        renderFeed();
    }
}

// Simulate activity
setInterval(() => {
    const actions = ['updated task', 'completed review', 'sent report', 'started analysis'];
    const agent = window.agents ? window.agents[Math.floor(Math.random() * window.agents.length)] : { id: 'alex', name: 'Alex', color: '#8b5cf6' };
    
    feedItems.unshift({
        agent: agent.name.toLowerCase(),
        action: actions[Math.floor(Math.random() * actions.length)],
        time: 'now',
        color: agent.color
    });
    
    if (feedItems.length > 15) feedItems.pop();
    renderFeed();
}, 15000);
