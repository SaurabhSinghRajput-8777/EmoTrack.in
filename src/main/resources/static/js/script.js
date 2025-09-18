// script.js - EmoTrack.in (Full Fixed Version)

const API_BASE_URL = "https://emotrackin-production.up.railway.app/api";

let currentUser = null;
let authToken = null;

let quizAnswers = {};
let currentQuestionIndex = 0;
const totalQuestions = 7;

let currentPage = 'welcome-page';
let isNavigating = false;

// ====================== HELPERS ======================
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : ''
    };
}

function getPageTitle(pageId) {
    const pageTitles = {
        'welcome-page': 'Welcome - EmoTrack.in',
        'login-page': 'Login - EmoTrack.in',
        'signup-page': 'Sign Up - EmoTrack.in',
        'main-page': 'Dashboard - EmoTrack.in',
        'questionnaire-page': 'Stress Assessment - EmoTrack.in',
        'analysis-page': 'Results - EmoTrack.in',
        'reports-page': 'Reports - EmoTrack.in',
        'analytics-page': 'Analytics - EmoTrack.in',
        'management-tips-page': 'Coping Strategies - EmoTrack.in',
        'consultation-page': 'Consultation - EmoTrack.in',
        'question-1': 'Question 1 - EmoTrack.in',
        'question-2': 'Question 2 - EmoTrack.in',
        'question-3': 'Question 3 - EmoTrack.in',
        'question-4': 'Question 4 - EmoTrack.in',
        'question-5': 'Question 5 - EmoTrack.in',
        'question-6': 'Question 6 - EmoTrack.in',
        'question-7': 'Question 7 - EmoTrack.in'
    };
    return pageTitles[pageId] || 'EmoTrack.in';
}

function canAccessPage(pageId) {
    const authRequiredPages = ['main-page', 'reports-page', 'analytics-page', 'management-tips-page', 'consultation-page'];
    const questionPages = ['question-1','question-2','question-3','question-4','question-5','question-6','question-7'];
    if (authRequiredPages.includes(pageId) || questionPages.includes(pageId)) {
        return !!(currentUser && authToken);
    }
    return true;
}

// ====================== NAVIGATION ======================
function goToPage(pageId, addToHistory = true) {
    if (currentPage === pageId) return;

    if (!canAccessPage(pageId)) {
        if (!isNavigating) goToPage('login-page', true);
        return;
    }

    const previousPage = currentPage;
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

    const target = document.getElementById(pageId);
    if (target) {
        target.classList.remove('hidden');
        currentPage = pageId;
        document.title = getPageTitle(pageId);
    }

    if (addToHistory && window.history) {
        const state = { page: pageId, timestamp: Date.now() };
        const title = getPageTitle(pageId);
        const url = pageId === 'welcome-page' ? '/' : `#${pageId}`;
        try { window.history.pushState(state, title, url); } catch {}
    }

    handlePageNavigation(pageId, previousPage);
}

function handlePageNavigation(pageId) {
    const logoutBtn = document.getElementById('logout-btn');
    const authRequiredPages = ['main-page','reports-page','analytics-page','management-tips-page','consultation-page'];
    const questionPages = ['question-1','question-2','question-3','question-4','question-5','question-6','question-7'];

    if ((authRequiredPages.includes(pageId) || questionPages.includes(pageId)) && currentUser && authToken) {
        logoutBtn?.classList.remove('hidden');
    } else {
        logoutBtn?.classList.add('hidden');
    }

    if (pageId === 'questionnaire-page') {
        resetQuestionnaireForm();
        resetQuiz();
    }

    if (pageId.startsWith('question-')) {
        const qn = parseInt(pageId.split('-')[1], 10);
        currentQuestionIndex = qn - 1;
        const qid = `q${qn}`;
        if (quizAnswers[qid]) setTimeout(() => restoreSelection(qn, quizAnswers[qid]), 100);
    }
}

function handlePopState(event) {
    if (event.state && event.state.page) {
        goToPage(event.state.page, false);
    } else {
        const hash = window.location.hash.slice(1);
        const pageId = hash || 'welcome-page';
        if (['login-page','signup-page','welcome-page'].includes(pageId)) goToPage(pageId, false);
        else if (canAccessPage(pageId)) goToPage(pageId, false);
        else goToPage('welcome-page', false);
    }
}

function initializePageFromURL() {
    if (isNavigating) return;
    const hash = window.location.hash.slice(1);
    const pageId = hash || 'welcome-page';
    if (['login-page','signup-page'].includes(pageId)) {
        goToPage(pageId, false); return;
    }
    if (canAccessPage(pageId)) goToPage(pageId, false);
    else goToPage('welcome-page', false);
}

// ====================== QUIZ FLOW ======================
function resetQuestionnaireForm() {
    document.querySelectorAll('#questionnaire-form input[type="radio"]').forEach(r => r.checked = false);
}
function resetQuiz() {
    quizAnswers = {}; currentQuestionIndex = 0;
    document.getElementById('submit-btn')?.setAttribute('disabled', true);
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
}
function startQuiz() { resetQuiz(); goToPage('question-1'); }

function selectAnswer(questionId, value) {
    quizAnswers[questionId] = value;
    const qn = parseInt(questionId.substring(1), 10);
    const page = document.getElementById(`question-${qn}`);
    if (!page) return;
    page.querySelectorAll('.option-card').forEach(opt => opt.classList.remove('selected'));

    const selectedOption = Array.from(page.querySelectorAll('.option-card')).find(opt => {
        const matches = (opt.getAttribute('onclick')||'').match(/(\d+)/g);
        return matches && parseInt(matches.pop(),10) === value;
    });
    selectedOption?.classList.add('selected');

    if (Object.keys(quizAnswers).length === totalQuestions) {
        document.getElementById('submit-btn')?.removeAttribute('disabled');
    }
    if (qn < totalQuestions) setTimeout(() => goToNextQuestion(qn), 600);
}

function goToNextQuestion(qn) {
    if (qn < totalQuestions) {
        goToPage(`question-${qn+1}`);
        currentQuestionIndex = qn;
        const qid = `q${qn+1}`;
        if (quizAnswers[qid]) setTimeout(() => restoreSelection(qn+1, quizAnswers[qid]), 100);
    }
}
function goToPreviousQuestion(qn) {
    if (qn > 1) {
        goToPage(`question-${qn-1}`);
        currentQuestionIndex = qn-2;
        const qid = `q${qn-1}`;
        if (quizAnswers[qid]) setTimeout(() => restoreSelection(qn-1, quizAnswers[qid]), 100);
    }
}
function restoreSelection(qn, value) {
    const page = document.getElementById(`question-${qn}`); if (!page) return;
    page.querySelectorAll('.option-card').forEach(opt => {
        opt.classList.remove('selected');
        const matches = (opt.getAttribute('onclick')||'').match(/(\d+)/g);
        if (matches && parseInt(matches.pop(),10) === value) opt.classList.add('selected');
    });
}
function submitQuiz() {
    if (Object.keys(quizAnswers).length < totalQuestions) { alert("Answer all questions"); return; }
    let score=0; for (let i=1;i<=totalQuestions;i++) score += quizAnswers[`q${i}`]||0;
    let level = score<=7 ? "Low" : score<=14 ? "Moderate" : "High";
    saveStressAssessment(score, level);
    document.getElementById('stress-level').innerText = level;
    const bar = document.getElementById('stress-bar'); 
    if (bar) {
        bar.className="progress-bar " + level.toLowerCase();
        bar.querySelector('.progress-fill').style.width = `${(score/21)*100}%`;
    }
    goToPage('analysis-page');
}

// ====================== AUTH ======================
async function signup() {
    const username=document.getElementById('new-username')?.value;
    const email=document.getElementById('email')?.value;
    const password=document.getElementById('new-password')?.value;
    const name=document.getElementById('name')?.value;
    const age=document.getElementById('age')?.value;
    if(!username||!email||!password||!name||!age){alert("Fill all fields");return;}
    const userData={username,email,password,name,age:parseInt(age,10)};
    try {
        const res=await fetch(`${API_BASE_URL}/signup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(userData)});
        if(res.ok){ alert("Signup successful! Please login."); document.getElementById('signup-form')?.reset();
            setTimeout(()=>{isNavigating=true; goToPage('login-page'); isNavigating=false;},100);
        } else { const err=await res.json().catch(()=>({})); alert("Signup failed: "+(err.message||'Unknown error')); }
    } catch(e){ console.error(e); alert("Error during signup"); }
}
async function login() {
    const username=document.getElementById('username')?.value;
    const password=document.getElementById('password')?.value;
    if(!username||!password){alert("Enter username & password");return;}
    try {
        const res=await fetch(`${API_BASE_URL}/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
        if(res.ok){ const data=await res.json(); authToken=data.token; currentUser=data.user;
            document.getElementById('user-name').innerText=currentUser.name||currentUser.username;
            document.getElementById('logout-btn')?.classList.remove('hidden'); goToPage('main-page'); updateLastCheckedTime();
        } else alert("Login failed: "+await res.text());
    } catch(e){ console.error(e); alert("Error during login"); }
}
function logout() {
    currentUser=null; authToken=null;
    document.getElementById('logout-btn')?.classList.add('hidden');
    document.getElementById('last-checked').innerText="Never";
    document.getElementById('current-stress').innerText="--";
    document.getElementById('user-name').innerText="";
    ['new-username','email','new-password','name','age','username','password'].forEach(id=>{const el=document.getElementById(id); if(el) el.value="";});
    goToPage('login-page');
}
function handleLogoClick(){ if(currentUser&&authToken) goToPage('main-page'); else goToPage('welcome-page'); }

// ====================== REPORTS & ANALYTICS ======================
async function saveStressAssessment(totalStressScore, stressLevel) {
    if(!currentUser||!authToken) return;
    const assessment={userId:currentUser.id,totalStressScore,stressLevel};
    try {
        const res=await fetch(`${API_BASE_URL}/stress-assessment`,{method:'POST',headers:getAuthHeaders(),body:JSON.stringify(assessment)});
        if(res.ok) updateLastCheckedTime();
    } catch(e){ console.error("Save assessment error",e); }
}
async function updateLastCheckedTime() {
    if(!currentUser||!authToken) return;
    const lastChecked=document.getElementById('last-checked'); const currentStress=document.getElementById('current-stress');
    lastChecked.innerText="Never"; currentStress.innerText="--";
    try {
        const res=await fetch(`${API_BASE_URL}/stress-reports/${currentUser.id}`,{headers:getAuthHeaders()});
        if(res.ok){ const reports=await res.json(); if(Array.isArray(reports)&&reports.length>0){
            reports.sort((a,b)=>new Date(b.assessmentDate)-new Date(a.assessmentDate));
            const last=reports[0];
            lastChecked.innerText=new Date(last.assessmentDate).toLocaleString();
            currentStress.innerText=last.stressLevel;
        }} 
    } catch(e){ console.error("Error fetching reports",e); }
}
async function loadStressReports() {
    if(!currentUser||!authToken) return;
    try {
        const res=await fetch(`${API_BASE_URL}/stress-reports/${currentUser.id}`,{headers:getAuthHeaders()});
        if(res.ok){ displayStressReports(await res.json()); }
    } catch(e){ console.error("Load reports error",e); }
}
function displayStressReports(reports) {
    const container = document.getElementById('reports-container');
    if (!container) return;
    container.className = 'reports-list';
    container.innerHTML = "";
    if (!reports || reports.length === 0) return; 

    reports.sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));
    reports.forEach(report => {
        const card = document.createElement('div');
        const stressClass = report.stressLevel.toLowerCase() + '-stress';
        card.className = `report-card ${stressClass}`;
        card.innerHTML = `
            <div class="report-header">
                <div class="report-date">${new Date(report.assessmentDate).toLocaleString()}</div>
                <div class="report-level">${report.stressLevel}</div>
            </div>
            <div class="report-body">
                <p>Your assessment score was <strong>${report.totalStressScore} out of 21</strong>, indicating a ${report.stressLevel.toLowerCase()} level of stress.</p>
            </div>
            <div class="report-footer">
                <button class="btn btn-secondary" style="margin: 0;" onclick="showCopingStrategies('${report.stressLevel}')">View Tips</button>
            </div>
        `;
        container.appendChild(card);
    });
}
async function loadStressAnalytics() {
    if (!currentUser || !authToken) return;
    goToPage('analytics-page');
    try {
        const res = await fetch(`${API_BASE_URL}/stress-analytics/${currentUser.id}`, { headers: getAuthHeaders() });
        if (res.ok) {
            const data = await res.json();
            displayStressAnalytics(data);
        }
    } catch (e) { console.error("Load analytics error", e); }
}
function displayStressAnalytics(data) {
    if (!data) { alert("No analytics data available to display."); return; }
    document.getElementById('avg-score').innerText = data.averageScore?.toFixed(2) || "--";
    document.getElementById('most-freq-level').innerText = data.mostFrequentLevel || "--";
    document.getElementById('report-count').innerText = data.reportCount || "--";
    drawDistributionChart(data.levelDistribution || {});
    drawTrendChart(data.trendData || []);
    displayInsights(data.insights);
    displayMonthlyComparison(data.monthlyComparison);
}
function drawDistributionChart(dist) {
    const c=document.getElementById('distribution-chart'); if(!c) return;
    const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
    const levels=['Low','Moderate','High']; const colors=['#4CAF50','#FFC107','#F44336'];
    const total=levels.reduce((s,l)=>s+(dist[l]||0),0)||1;
    let start=0; levels.forEach((l,i)=>{const val=dist[l]||0;const angle=(val/total)*2*Math.PI;
        ctx.beginPath(); ctx.moveTo(c.width/2, c.height/2); ctx.arc(c.width/2, c.height/2, Math.min(c.width, c.height)/2 - 10, start, start+angle); ctx.closePath();
        ctx.fillStyle=colors[i]; ctx.fill(); start+=angle;});
}
function drawTrendChart(trend) {
    const c=document.getElementById('trend-chart'); if(!c) return;
    const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
    if(!trend||trend.length===0) return;
    const points=trend.map(t=>({date:new Date(t.assessmentDate).getTime(),score:t.totalStressScore}));
    const minDate=Math.min(...points.map(p=>p.date)), maxDate=Math.max(...points.map(p=>p.date));
    const minScore=0, maxScore=21; const padding = 40;
    const chartW = c.width - 2 * padding, chartH = c.height - 2 * padding;
    function x(d){ return ((d-minDate)/(maxDate-minDate||1))*chartW+padding; }
    function y(s){ return c.height-padding-((s-minScore)/(maxScore-minScore))*chartH; }
    ctx.beginPath(); ctx.moveTo(x(points[0].date),y(points[0].score));
    for(let i=1;i<points.length;i++){ctx.lineTo(x(points[i].date),y(points[i].score));}
    ctx.strokeStyle='#2196F3'; ctx.lineWidth=2; ctx.stroke();
    points.forEach(p=>{ctx.beginPath();ctx.arc(x(p.date),y(p.score),4,0,2*Math.PI);ctx.fillStyle='#2196F3';ctx.fill();});
}
function displayInsights(insights = []) {
    const container = document.getElementById('insights-list'); if (!container) return; container.innerHTML = '';
    if (insights.length === 0) { container.innerHTML = '<p class="no-data-message">No specific insights available yet. Keep tracking to see patterns.</p>'; return; }
    insights.forEach(insightText => { const item = document.createElement('div'); item.className = 'insight-item'; item.innerHTML = `<i class="fas fa-lightbulb"></i> <p>${insightText}</p>`; container.appendChild(item); });
}
function displayMonthlyComparison(comparison = {}) {
    const container = document.getElementById('monthly-stats'); if (!container) return; container.innerHTML = '';
    if (!comparison.currentMonthAvg || !comparison.previousMonthAvg) { container.innerHTML = '<p class="no-data-message">Not enough data for a monthly comparison.</p>'; return; }
    const diff = comparison.currentMonthAvg - comparison.previousMonthAvg; let trendClass = 'stable';
    if (diff < -1) trendClass = 'improvement'; if (diff > 1) trendClass = 'decline';
    container.className = 'monthly-comparison-grid';
    container.innerHTML = `<div class="comparison-card"><h4>Previous Month</h4><div class="stat-large">${comparison.previousMonthAvg.toFixed(1)}</div><small>Average Score</small></div><div class="comparison-card ${trendClass}"><h4>Current Month</h4><div class="stat-large">${comparison.currentMonthAvg.toFixed(1)}</div><small>Average Score</small></div>`;
}

// ====================== TIPS / CONSULT ======================
function showCopingStrategies(stressLevel) {
    const level = stressLevel || document.getElementById('stress-level')?.innerText;
    const strategies = {
        Low: ['Maintain routine exercise', 'Practice mindfulness', 'Stay socially connected', 'Keep healthy sleep habits'],
        Moderate: ['Practice deep breathing', 'Take breaks from work', 'Limit caffeine', 'Seek support from friends'],
        High: ['Consult a professional', 'Prioritize self-care', 'Engage in relaxing hobbies', 'Consider therapy/meditation apps']
    };
    const container = document.getElementById('coping-strategies');
    if (!container) return;
    container.innerHTML = "";
    (strategies[level] || ["No specific tips available. Please consult a professional."]).forEach(tipText => {
        const item = document.createElement('li');
        item.innerText = tipText;
        container.appendChild(item);
    });
    goToPage('management-tips-page');
}
function submitContactForm() {
    const name=document.getElementById('contact-name').value;
    const email=document.getElementById('contact-email').value;
    const message=document.getElementById('contact-message').value;
    if(!name||!email||!message){alert("Fill all fields");return;}
    alert("Thank you! We'll contact you soon."); document.getElementById('contact-form').reset();
}

// ====================== INIT ======================
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('popstate', handlePopState);
    initializePageFromURL();

    document.getElementById('proceed-button')?.addEventListener('click', () => goToPage('login-page'));
    document.getElementById('login-btn')?.addEventListener('click', login);
    document.getElementById('signup-btn')?.addEventListener('click', signup);
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    document.querySelector('#contact-form button')?.addEventListener('click', submitContactForm);
    document.querySelector('.consultation-btn')?.addEventListener('click', () => goToPage('consultation-page'));

    document.getElementById('login-form')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); login(); } });
    document.getElementById('signup-form')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); signup(); } });
});