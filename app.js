// Authentication Data - Updated with actual staff
const credentials = {
    'teacher': {
        'lakshmi': { pass: '123', name: 'Lakshmi', section: '4K', isFirstReport: true },
        'mahalakshmi': { pass: '123', name: 'Mahalakshmi', section: '7P', isFirstReport: true },
        'sony': { pass: '123', name: 'Sony', section: '5I', isFirstReport: true },
        'padhmini': { pass: '123', name: 'Padhmini', section: '6D', isFirstReport: true },
        'pallavi': { pass: '123', name: 'Pallavi', role: 'Coordinator', section: '4K', isFirstReport: true },
        'shailaja': { pass: '123', name: 'Shailaja', role: 'Coordinator', section: '7P', isFirstReport: true },
        'meghna': { pass: '123', name: 'Meghna', role: 'Coordinator', section: '5I', isFirstReport: true },
        'samreen': { pass: '123', name: 'Samreen', role: 'Coordinator', section: '6D', isFirstReport: true }
    },
    'senior-mistress': {
        'suparna': { pass: '123', name: 'Suparna', handles: ['4K', '5I'] },
        'ranjana': { pass: '123', name: 'Ranjana', handles: ['7P', '6D'] }
    },
    'head-mistress': {
        'taj': { pass: '123', name: 'Taj', handles: ['7P', '6D'] }
    },
    'vice-principal': {
        'priya': { pass: '123', name: 'Priya', handles: ['4K', '5I'] }
    },
    'principal': {
        'anitha': { pass: '123', name: 'Anitha' }
    }
};

let currentUser = null;
let incidents = {}; // Store incidents by ID
let nextIncidentId = 47;
let selectedIncidentId = null;
// Global flag to ensure notifications are shown only once per session
let notificationsAlreadyShown = false;

// Student Database - Updated from Prompt
const studentDatabase = {
    "B/19912": { name: "A.Avyukth", class: "4K", teacher: "Lakshmi", coordinator: "Pallavi", sm: "Suparna", vp: "Priya" },
    "B/11676": { name: "A.Advaith", class: "7P", teacher: "Mahalakshmi", coordinator: "Shailaja", sm: "Ranjana", hm: "Taj" },
    "B/13561": { name: "Isha", class: "5I", teacher: "Sony", coordinator: "Meghna", sm: "Suparna", vp: "Priya" },
    "B/12415": { name: "Ishan Karthik", class: "6D", teacher: "Padhmini", coordinator: "Samreen", sm: "Ranjana", hm: "Taj" }
};

// Role switching logic
function switchRole(roleTarget, bypassAuth = false) {
    if (roleTarget === 'student') {
        performSwitch(roleTarget);
        currentUser = null;
        selectedIncidentId = null;
        return;
    }

    const userId = prompt(`Enter Login ID for ${roleTarget.replace('-', ' ').toUpperCase()}:`);
    if (!userId) return;

    const categoryDetails = credentials[roleTarget];
    if (categoryDetails && categoryDetails[userId.toLowerCase()]) {
        const password = prompt("Enter Password:");
        if (password === categoryDetails[userId.toLowerCase()].pass) {
            // Reset notification flag and dashboard for the new session
            notificationsAlreadyShown = false;
            currentUser = {
                role: roleTarget,
                ...categoryDetails[userId.toLowerCase()]
            };
            selectedIncidentId = null;
            alert(`Welcome, ${currentUser.name}`);
            performSwitch(roleTarget);
            showNotifications();
            updateDashboard();
        } else {
            alert("Incorrect Password!");
        }
    } else {
        alert("Invalid Login ID for this role.");
    }
}

function performSwitch(role) {
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('active');
        const btnText = btn.innerText.toLowerCase().replace(/\s/g, '-');
        if (btnText.includes(role) || (role === 'vice-principal' && btnText.includes('principal') && !btnText.includes('head'))) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    const targetView = document.getElementById(`${role}-view`);
    if (targetView) {
        targetView.classList.add('active');
        // Ensure dashboard updates when view changes
        setTimeout(updateDashboard, 50);
    }
}

function showNotifications() {
    if (!currentUser || notificationsAlreadyShown) return;

    let pendingCount = 0;
    let escalatedCount = 0;

    Object.values(incidents).forEach(inc => {
        if (inc.status === 'solved') return;

        const student = studentDatabase[inc.admNo];
        if (!student) return;

        if (currentUser.isFirstReport) {
            if (student.teacher === currentUser.name || student.coordinator === currentUser.name) {
                if (!inc.takenOver && !inc.escalatedTo) pendingCount++;
            }
        } else {
            // Check if specifically escalated to this user's role and they handle this student
            const isAssigned = (currentUser.role === 'senior-mistress' && student.sm === currentUser.name) ||
                (currentUser.role === 'head-mistress' && student.hm === currentUser.name) ||
                (currentUser.role === 'vice-principal' && student.vp === currentUser.name) ||
                (currentUser.role === 'principal');

            if (inc.escalatedTo === currentUser.role && isAssigned && (!inc.viewedBy || !inc.viewedBy.includes(currentUser.name))) {
                escalatedCount++;
            }
        }
    });

    if (pendingCount > 0) alert(`🔔 You have ${pendingCount} new incident(s) to review!`);
    if (escalatedCount > 0) alert(`🔴 You have ${escalatedCount} escalated case(s) requiring your attention!`);

    notificationsAlreadyShown = true;
}

function handleAdmLookup(val) {
    const studentNameInput = document.getElementById('student-name');
    const studentClassInput = document.getElementById('student-class');
    const key = val.toUpperCase().trim();

    if (studentDatabase[key]) {
        studentNameInput.value = studentDatabase[key].name;
        studentClassInput.value = studentDatabase[key].class;
        studentNameInput.style.borderColor = "var(--success)";
        studentClassInput.style.borderColor = "var(--success)";
    } else {
        studentNameInput.value = "";
        studentClassInput.value = "";
        studentNameInput.style.borderColor = "var(--border)";
        studentClassInput.style.borderColor = "var(--border)";
    }
}

function handleSubmit() {
    const admNo = document.getElementById('adm-number').value.trim();
    const name = document.getElementById('student-name').value;
    const desc = document.getElementById('student-desc').value;
    const place = document.getElementById('incident-place').value.trim();
    const date = document.getElementById('incident-date').value;
    const time = document.getElementById('incident-time').value;

    if (!name || !studentDatabase[admNo]) {
        alert("Please enter a valid Admission Number first.");
        return;
    }

    if (!place) {
        alert("Please specify the Place of Incident.");
        return;
    }

    const incidentId = ++nextIncidentId;
    incidents[incidentId] = {
        id: incidentId,
        admNo: admNo,
        studentName: name,
        studentClass: studentDatabase[admNo].class,
        description: desc || "No description provided.",
        place: place,
        date: date || "Not specified",
        time: time || "Not specified",
        status: 'pending',
        takenOver: false,
        handler: null,
        escalatedTo: null,
        escalatedBy: null,
        viewedBy: [],
        timestamp: new Date().toLocaleString()
    };

    alert(`Success! Report #${incidentId} submitted for ${name}.`);
    alert("The Class Teacher and Coordinator have been notified.");
    updateDashboard();

    document.getElementById('incident-form').reset();
    document.getElementById('adm-number').value = 'B/';
}

function updateDashboard() {
    if (!currentUser) return;

    let relevantIncidents = Object.values(incidents).filter(inc => {
        const student = studentDatabase[inc.admNo];
        if (!student) return false;

        // Visibility conditions
        if (currentUser.isFirstReport) {
            return student.teacher === currentUser.name || student.coordinator === currentUser.name;
        }

        // Higher authorities see reports if they are assigned to that student
        const isAssigned = (currentUser.role === 'senior-mistress' && student.sm === currentUser.name) ||
            (currentUser.role === 'head-mistress' && student.hm === currentUser.name) ||
            (currentUser.role === 'vice-principal' && student.vp === currentUser.name) ||
            (currentUser.role === 'principal');

        return isAssigned;
    });

    updatePrincipalStats();

    const activeView = document.querySelector('.view.active');
    if (activeView) {
        const listEl = activeView.querySelector('.incident-list');
        if (listEl) {
            const sortedIncidents = [...relevantIncidents].reverse();
            listEl.innerHTML = sortedIncidents.length > 0 ? sortedIncidents.map(inc => {
                const statusTag = inc.status === 'solved' ? 'tag-solved' : inc.takenOver ? 'tag-review' : 'tag-pending';
                const statusText = inc.status === 'solved' ? 'SOLVED' : inc.takenOver ? 'UNDER REVIEW' : 'PENDING';
                const isActiveStyle = selectedIncidentId === inc.id ? 'border: 2px solid var(--primary); transform: scale(1.02);' : '';
                return `
                    <li class="incident-item" onclick="displayIncident(incidents[${inc.id}])" style="cursor:pointer; border-left: 4px solid var(--info); display: block; margin-bottom: 0.8rem; padding: 1rem; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--border); transition: all 0.2s; ${isActiveStyle}">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div>
                                <h4 style="margin: 0; font-size: 1rem; color: var(--primary);">Case #${inc.id} - ${inc.studentName}</h4>
                                <small style="color: var(--text-muted); font-size: 0.75rem;">${inc.timestamp} | Class: ${inc.studentClass}</small>
                            </div>
                            <span class="status-tag ${statusTag}" style="font-size: 0.7rem; padding: 4px 8px; border-radius: 4px; font-weight: 700;">${statusText}</span>
                        </div>
                    </li>`;
            }).join('') : '<p style="text-align:center; padding: 2rem; color: var(--text-muted); font-style: italic;">No current incidents for your section.</p>';
        }

        if (!selectedIncidentId && relevantIncidents.length > 0) {
            // Check if latest is unsolved
            const latest = relevantIncidents[relevantIncidents.length - 1];
            if (latest.status !== 'solved') {
                displayIncident(latest);
            } else {
                hideStudentProfile();
            }
        } else if (selectedIncidentId && incidents[selectedIncidentId]) {
            const current = incidents[selectedIncidentId];
            if (current.status === 'solved') {
                hideStudentProfile();
            } else {
                displayIncident(current);
            }
        } else {
            hideStudentProfile();
        }
    }
}

function hideStudentProfile() {
    selectedIncidentId = null;
    document.querySelectorAll('.bio-container').forEach(c => c.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-muted); font-style: italic; background: #f8fafc; border-radius: 12px; border: 1px dashed var(--border);">No active case selected or available.</div>');

    const descElements = ['teacher-desc-preview', 'senior-mistress-desc', 'head-mistress-desc', 'vice-principal-desc', 'principal-desc'];
    descElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = "N/A";
    });

    document.querySelectorAll('.detail-status-badge').forEach(badge => badge.style.display = 'none');
    document.querySelectorAll('.handler-display').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.btn-takeover').forEach(btn => btn.style.display = 'none');
    document.querySelectorAll('.btn-solved').forEach(btn => btn.style.display = 'none');

    // Clear highlighting
    document.querySelectorAll('.incident-item').forEach(item => item.style.border = '1px solid var(--border)');
}

function updatePrincipalStats() {
    const allIncidents = Object.values(incidents);
    const total = allIncidents.length;
    const solved = allIncidents.filter(inc => inc.status === 'solved').length;
    const escalated = allIncidents.filter(inc => inc.status !== 'solved' && inc.escalatedTo).length;
    const pending = allIncidents.filter(inc => inc.status !== 'solved' && !inc.escalatedTo).length;

    const elements = {
        'total-cases-count': total,
        'pending-cases-count': pending,
        'escalated-cases-count': escalated,
        'solved-cases-count': solved
    };

    for (const [id, count] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = count;
    }
}

function displayIncident(incident) {
    if (!incident) return;
    selectedIncidentId = incident.id;

    const student = studentDatabase[incident.admNo];
    if (!student) return;

    if (incident.escalatedTo === currentUser.role && (!incident.viewedBy || !incident.viewedBy.includes(currentUser.name))) {
        if (!incident.viewedBy) incident.viewedBy = [];
        incident.viewedBy.push(currentUser.name);
    }

    const statusBadges = document.querySelectorAll('.detail-status-badge');
    const statusTagClass = incident.status === 'solved' ? 'tag-solved' : incident.takenOver ? 'tag-review' : 'tag-pending';
    const statusText = incident.status === 'solved' ? 'SOLVED' : incident.takenOver ? 'UNDER REVIEW' : 'PENDING ACTION';

    statusBadges.forEach(badge => {
        badge.innerHTML = `<span class="status-tag ${statusTagClass}" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 6px; font-weight: 700;">${statusText}</span>`;
        badge.style.display = 'block';
    });

    updateBioScreen(student.name, incident.admNo, student.class, student.teacher, student.coordinator, student.sm, student.hm, student.vp);

    // Show description ONLY to the active handler or the person who solved it
    const isHandler = incident.takenOver && incident.handler === currentUser.name;
    const isSolver = incident.status === 'solved' && (incident.solvedBy === currentUser.name || currentUser.role === 'principal');
    const canSeeDescription = isHandler || isSolver;

    const descElements = ['teacher-desc-preview', 'senior-mistress-desc', 'head-mistress-desc', 'vice-principal-desc', 'principal-desc'];
    descElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (canSeeDescription) {
                el.innerText = incident.description;
            } else if (incident.takenOver) {
                el.innerText = `Case being handled by ${incident.handler}. Description locked for privacy.`;
            } else {
                el.innerText = "Take over this case to view the full description.";
            }
        }
    });

    updateHandlerUI(incident);

    const escalationInfos = document.querySelectorAll('.escalation-info');
    escalationInfos.forEach(el => {
        if (incident.escalatedBy) {
            el.style.display = 'block';
            el.innerText = `Escalated by ${incident.escalatedBy} to you`;
        } else {
            el.style.display = 'none';
        }
    });

    document.querySelectorAll('.incident-item').forEach(item => {
        if (item.innerHTML.includes(`Case #${incident.id}`)) {
            item.style.border = '2px solid var(--primary)';
        } else {
            item.style.border = '1px solid var(--border)';
        }
    });
}

function updateBioScreen(name, admNo, classSection, teacher, coordinator, sm, hm, vp) {
    let bioHTML = '';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    if (currentUser.isFirstReport) {
        bioHTML = `
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 1.25rem; border-radius: 12px; color: white; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; align-items: center; gap: 1.25rem;">
                    <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 700;">${initials}</div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0; font-size: 1.2rem;">${name}</h3>
                        <p style="margin: 2px 0 0 0; opacity: 0.9; font-size: 0.85rem;">Class: ${classSection} | Adm: ${admNo}</p>
                    </div>
                </div>
                <div style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.75rem; font-size: 0.85rem; display: flex; gap: 15px;">
                    <span><strong>Teacher:</strong> ${teacher}</span>
                    <span><strong>Coordinator:</strong> ${coordinator}</span>
                </div>
            </div>`;
    } else {
        const authority1Label = vp ? "Vice Principal" : "Head Mistress";
        const authority1Name = vp || hm || 'N/A';
        bioHTML = `
            <div style="background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%); padding: 1.25rem; border-radius: 12px; color: white; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1rem;">
                    <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 700;">${initials}</div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.2rem;">${name}</h3>
                        <p style="margin: 2px 0 0 0; opacity: 0.9; font-size: 0.85rem;">Adm: ${admNo} | Class: ${classSection}</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.8rem; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 8px;">
                    <div><span style="opacity: 0.7;">Teacher:</span><br><strong>${teacher}</strong></div>
                    <div><span style="opacity: 0.7;">Coordinator:</span><br><strong>${coordinator}</strong></div>
                    <div><span style="opacity: 0.7;">Senior Mistress:</span><br><strong>${sm}</strong></div>
                    <div><span style="opacity: 0.7;">${authority1Label}:</span><br><strong>${authority1Name}</strong></div>
                </div>
            </div>`;
    }
    document.querySelectorAll('.bio-container').forEach(c => c.innerHTML = bioHTML + '<div class="escalation-info" style="display: none; background: #fffbeb; padding: 0.75rem; border-radius: 8px; color: #92400e; font-size: 0.85rem; margin-bottom: 1rem; border: 1px solid #fcd34d; font-weight: 500;"></div>');
}

function handleTakeOver() {
    if (!currentUser || !selectedIncidentId) return;
    const incident = incidents[selectedIncidentId];
    if (!incident || incident.status === 'solved') return;
    // Removed level restrictions to allow any responsible staff member to take over the case at any time.
    if (incident.takenOver && incident.handler !== currentUser.name) { alert(`Already handled by ${incident.handler}.`); return; }
    if (confirm(`Do you want to take over?`)) {
        incident.takenOver = true; incident.handler = currentUser.name;
        displayIncident(incident); updateDashboard();
        alert(`You have successfully taken over this case.`);
    }
}

function handleEscalate() {
    if (!currentUser || !selectedIncidentId) return;
    const incident = incidents[selectedIncidentId];
    const dropdown = document.getElementById('escalation-level') || document.getElementById('escalation-level-sm') || document.getElementById('escalation-level-hm') || document.getElementById('escalation-level-vp');
    const level = dropdown?.value || '';
    if (!level) { alert("Please select an authority."); return; }
    if (!incident.takenOver || incident.handler !== currentUser.name) { alert("You must take over before escalating."); return; }
    const authorityName = { 'senior-mistress': 'Senior Mistress', 'head-mistress': 'Head Mistress', 'vice-principal': 'Vice Principal', 'principal': 'Principal' }[level];
    incident.escalatedTo = level; incident.escalatedBy = currentUser.name; incident.takenOver = false; incident.handler = null;
    alert(`Escalated to ${authorityName}.`); updateDashboard();
}

function handleSolve() {
    if (!currentUser || !selectedIncidentId) return;
    const incident = incidents[selectedIncidentId];
    if (incident.handler !== currentUser.name) { alert("You aren't handling this."); return; }
    if (confirm("Mark as SOLVED?")) {
        incident.status = 'solved'; incident.solvedBy = currentUser.name; incident.takenOver = false; incident.handler = null;
        alert(`Closed.`); updateDashboard();
    }
}

function updateHandlerUI(incident) {
    if (!incident) return;
    const fields = { status: incident.status, taken: incident.takenOver, handler: incident.handler, solver: incident.solvedBy };
    const hDs = document.querySelectorAll('.handler-display');
    const tOs = document.querySelectorAll('.btn-takeover');
    const sBs = document.querySelectorAll('.btn-solved');
    if (fields.status === 'solved') {
        hDs.forEach(e => { e.style.display = 'block'; e.innerHTML = `<strong>Solved By:</strong> ${fields.solver}`; e.style.background = '#dcfce7'; e.style.color = '#166534'; e.style.borderColor = '#86efac'; });
        tOs.forEach(b => b.style.display = 'none'); sBs.forEach(b => b.style.display = 'none');
    } else if (fields.taken) {
        hDs.forEach(e => { e.style.display = 'block'; e.innerHTML = `<strong>Taken Over By:</strong> ${fields.handler}`; e.style.background = '#fffbeb'; e.style.color = '#92400e'; e.style.borderColor = '#fcd34d'; });
        tOs.forEach(b => b.style.display = 'none'); sBs.forEach(b => b.style.display = fields.handler === currentUser.name ? 'block' : 'none');
    } else {
        hDs.forEach(e => e.style.display = 'none'); tOs.forEach(b => b.style.display = 'block'); sBs.forEach(b => b.style.display = 'none');
    }
}

function clearPastData() { if (confirm("Clear?")) { incidents = {}; nextIncidentId = 47; selectedIncidentId = null; alert("Cleared."); location.reload(); } }
function seatCaret(i, p) { if (i.setSelectionRange) { i.focus(); i.setSelectionRange(p, p); } }
function handleAdmInput(i) { if (!i.value.startsWith('B/')) i.value = 'B/'; handleAdmLookup(i.value); }
function protectPrefix(e, i) { const p = i.selectionStart; if ((e.key === 'Backspace' || e.key === 'Delete') && p <= 2) e.preventDefault(); if (p < 2 && e.key.length === 1) e.preventDefault(); }
function handlePaste(e, i) { e.preventDefault(); const r = i.value.substring(0, 2) + (e.clipboardData || window.clipboardData).getData('text'); i.value = r; handleAdmLookup(r); }
window.onload = () => { console.log("School Safety Hub Initialized"); };