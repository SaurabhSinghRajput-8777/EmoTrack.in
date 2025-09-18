
const API_BASE_URL = "https://emotrackin-production.up.railway.app/api";

let currentUser = null;
let authToken = null;

let quizAnswers = {};
let currentQuestionIndex = 0;
const totalQuestions = 7;

let currentPage = 'welcome-page';
let isNavigating = false;

// Helpers
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

// Navigation
function goToPage(pageId, addToHistory = true) {
    if (currentPage === pageId) return;

    // Access guard
    if (!canAccessPage(pageId)) {
        if (!isNavigating) {
            // redirect to login if not already handling navigation
            goToPage('login-page', true);
        }
        return; // always stop further execution when page is blocked
    }

    const previousPage = currentPage;

    // hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

    // show target
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.remove('hidden');
        currentPage = pageId;
        document.title = getPageTitle(pageId);
    }

    // history state
    if (addToHistory && window.history) {
        const state = { page: pageId, timestamp: Date.now() };
        const title = getPageTitle(pageId);
        const url = pageId === 'welcome-page' ? '/' : `#${pageId}`;
        try {
            window.history.pushState(state, title, url);
        } catch (e) {
            // some browsers might throw for pushState in file:// — ignore
        }
    }

    // page-specific logic
    handlePageNavigation(pageId, previousPage);
}

function handlePageNavigation(pageId, previousPage) {
    // logout button visibility
    const logoutBtn = document.getElementById('logout-btn');
    const authRequiredPages = ['main-page','reports-page','analytics-page','management-tips-page','consultation-page'];
    const questionPages = ['question-1','question-2','question-3','question-4','question-5','question-6','question-7'];

    if (authRequiredPages.includes(pageId) || questionPages.includes(pageId)) {
        if (logoutBtn && currentUser && authToken) logoutBtn.classList.remove('hidden');
    } else {
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }

    // reset questionnaire root page
    if (pageId === 'questionnaire-page') {
        resetQuestionnaireForm();
        resetQuiz();
    }

    // if we're showing a question page, set index and restore selection
    if (pageId && pageId.startsWith('question-')) {
        const qn = parseInt(pageId.split('-')[1], 10);
        currentQuestionIndex = qn - 1;
        const questionId = `q${qn}`;
        if (quizAnswers[questionId]) {
            setTimeout(() => restoreSelection(qn, quizAnswers[questionId]), 100);
        }
    }
}

// popstate handling (back/forward)
function handlePopState(event) {
    if (event.state && event.state.page) {
        goToPage(event.state.page, false);
    } else {
        const hash = window.location.hash.slice(1);
        const pageId = hash || 'welcome-page';
        if (pageId === 'login-page' || pageId === 'signup-page' || pageId === 'welcome-page') {
            goToPage(pageId, false);
        } else if (canAccessPage(pageId)) {
            goToPage(pageId, false);
        } else {
            goToPage('welcome-page', false);
        }
    }
}

function initializePageFromURL() {
    if (isNavigating) return;
    const hash = window.location.hash.slice(1);
    const pageId = hash || 'welcome-page';

    if (pageId === 'login-page' || pageId === 'signup-page') {
        goToPage(pageId, false);
        return;
    }

    if (canAccessPage(pageId)) {
        goToPage(pageId, false);
    } else {
        goToPage('welcome-page', false);
    }
}

// Questionnaire helpers
function resetQuestionnaireForm() {
    const radios = document.querySelectorAll('#questionnaire-form input[type="radio"]');
    radios.forEach(r => r.checked = false);
}

function resetQuiz() {
    quizAnswers = {};
    currentQuestionIndex = 0;
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.disabled = true;
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
}

function startQuiz() {
    resetQuiz();
    goToPage('question-1');
}

function selectAnswer(questionId, value) {
    // store
    quizAnswers[questionId] = value;

    const questionNum = parseInt(questionId.substring(1), 10);
    const currentQuestionPage = document.getElementById(`question-${questionNum}`);
    if (!currentQuestionPage) return;

    const options = currentQuestionPage.querySelectorAll('.option-card');
    options.forEach(opt => opt.classList.remove('selected'));

    // find option by onclick value extraction (works with current markup)
    const selectedOption = Array.from(options).find(option => {
        const attr = option.getAttribute('onclick') || '';
        const matches = attr.match(/(\d+)/g);
        if (!matches || matches.length === 0) return false;
        const optionValue = parseInt(matches[matches.length - 1], 10);
        return optionValue === value;
    });

    if (selectedOption) selectedOption.classList.add('selected');

    // enable submit if all answered
    if (Object.keys(quizAnswers).length === totalQuestions) {
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) submitBtn.disabled = false;
    }

    // auto advance
    if (questionNum < totalQuestions) {
        setTimeout(() => goToNextQuestion(questionNum), 600);
    }
}

function goToNextQuestion(currentQuestionNum) {
    if (currentQuestionNum < totalQuestions) {
        goToPage(`question-${currentQuestionNum + 1}`);
        currentQuestionIndex = currentQuestionNum;
        const nextQid = `q${currentQuestionNum + 1}`;
        if (quizAnswers[nextQid]) {
            setTimeout(() => restoreSelection(currentQuestionNum + 1, quizAnswers[nextQid]), 100);
        }
    }
}

function goToPreviousQuestion(currentQuestionNum) {
    if (currentQuestionNum > 1) {
        goToPage(`question-${currentQuestionNum - 1}`);
        currentQuestionIndex = currentQuestionNum - 2;
        const prevQid = `q${currentQuestionNum - 1}`;
        if (quizAnswers[prevQid]) {
            setTimeout(() => restoreSelection(currentQuestionNum - 1, quizAnswers[prevQid]), 100);
        }
    }
}

function restoreSelection(questionNum, value) {
    const page = document.getElementById(`question-${questionNum}`);
    if (!page) return;
    const options = page.querySelectorAll('.option-card');
    options.forEach(option => {
        option.classList.remove('selected');
        const attr = option.getAttribute('onclick') || '';
        const matches = attr.match(/(\d+)/g);
        if (!matches || matches.length === 0) return;
        const optionValue = parseInt(matches[matches.length - 1], 10);
        if (optionValue === value) option.classList.add('selected');
    });
}

function submitQuiz() {
    if (Object.keys(quizAnswers).length < totalQuestions) {
        alert('Please answer all questions before submitting.');
        return;
    }

    let totalStressScore = 0;
    for (let i = 1; i <= totalQuestions; i++) {
        totalStressScore += quizAnswers[`q${i}`] || 0;
    }

    let level;
    if (totalStressScore <= 7) level = "Low";
    else if (totalStressScore <= 14) level = "Moderate";
    else level = "High";

    saveStressAssessment(totalStressScore, level);

    const levelEl = document.getElementById('stress-level');
    if (levelEl) levelEl.innerText = level;

    const stressBar = document.getElementById('stress-bar');
    if (stressBar) {
        stressBar.className = 'progress-bar';
        stressBar.classList.add(level.toLowerCase());
        const fill = stressBar.querySelector('.progress-fill');
        if (fill) fill.style.width = `${(totalStressScore / 21) * 100}%`;
    }

    goToPage('analysis-page');
}

// API interactions (login/signup/save report/load reports etc.)
async function signup() {
    const username = document.getElementById('new-username')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('new-password')?.value;
    const name = document.getElementById('name')?.value;
    const age = document.getElementById('age')?.value;

    if (!username || !email || !password || !name || !age) {
        alert("Please fill in all fields");
        return;
    }

    const userData = { username, email, password, name, age: parseInt(age, 10) };

    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            alert("Signup successful! Please login.");
            const form = document.getElementById('signup-form');
            if (form) form.reset();

            // small delay then navigate
            setTimeout(() => {
                isNavigating = true;
                goToPage('login-page');
                isNavigating = false;
            }, 100);
        } else {
            const err = await response.json().catch(() => ({}));
            alert("Signup failed: " + (err.message || 'Unknown error'));
        }
    } catch (err) {
        console.error("Signup error:", err);
        alert("An error occurred during signup. Try again.");
    }
}

async function login() {
    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;

    if (!username || !password) {
        alert("Please enter both username and password");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.token;
            currentUser = data.user;
            const nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.innerText = currentUser.name || currentUser.username;

            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) logoutBtn.classList.remove('hidden');

            goToPage('main-page');
            updateLastCheckedTime();
        } else {
            const text = await response.text();
            alert("Login failed: " + text);
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("An error occurred during login. Try again.");
    }
}

async function updateLastCheckedTime() {
    if (!currentUser || !authToken) return;
    const lastCheckedEl = document.getElementById('last-checked');
    const currentStressEl = document.getElementById('current-stress');
    if (lastCheckedEl) lastCheckedEl.innerText = 'Never';
    if (currentStressEl) currentStressEl.innerText = '--';

    try {
        const response = await fetch(`${API_BASE_URL}/stress-reports/${currentUser.id}`, {
            headers: getAuthHeaders()
        });
        if (response.ok) {
            const reports = await response.json();
            if (Array.isArray(reports) && reports.length > 0) {
                reports.sort((a,b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));
                const last = reports[0];
                if (lastCheckedEl) lastCheckedEl.innerText = new Date(last.assessmentDate).toLocaleString();
                if (currentStressEl) currentStressEl.innerText = last.stressLevel;
            }
        }
    } catch (err) {
        console.error("Error fetching reports:", err);
    }
}

function handleLogoClick() {
    if (currentUser && authToken) goToPage('main-page');
    else goToPage('welcome-page');
}

function logout() {
    currentUser = null;
    authToken = null;
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.classList.add('hidden');

    const lastCheckedEl = document.getElementById('last-checked');
    const currentStressEl = document.getElementById('current-stress');
    const userNameEl = document.getElementById('user-name');

    if (lastCheckedEl) lastCheckedEl.innerText = 'Never';
    if (currentStressEl) currentStressEl.innerText = '--';
    if (userNameEl) userNameEl.innerText = '';

    ['new-username','email','new-password','name','age','username','password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    goToPage('login-page');
}

// Saving and loading assessments (short versions)
async function saveStressAssessment(totalStressScore, stressLevel) {
    if (!currentUser || !authToken) return;

    const assessment = { userId: currentUser.id, totalStressScore, stressLevel };

    try {
        const response = await fetch(`${API_BASE_URL}/stress-assessment`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(assessment)
        });
        if (response.ok) updateLastCheckedTime();
        else console.error("Failed to save:", await response.text());
    } catch (err) {
        console.error("Error saving assessment:", err);
    }
}

// Function to show coping strategies based on a given stress level
function showCopingStrategies(stressLevel) {
    const level = stressLevel || document.getElementById('stress-level').innerText.toLowerCase();
    let strategies;

    if (level === 'low') {
        strategies = `<h3>Low Stress</h3><ul><li><b>Mindfulness & Breathing:</b> Practice mindfulness meditation for 5-10 minutes daily.</li><li><b>Physical Activity:</b> Engage in light exercise, such as walking or yoga.</li><li><b>Social Support:</b> Spend time with friends or family.</li></ul>`;
    } else if (level === 'moderate') {
        strategies = `<h3>Moderate Stress</h3><ul><li><b>Cognitive Techniques:</b> Use CBT techniques to challenge negative thoughts.</li><li><b>Relaxation & Sleep:</b> Ensure you're getting 7-9 hours of quality sleep.</li><li><b>Creative Outlets:</b> Engage in hobbies like painting or writing.</li></ul>`;
    } else {
        strategies = `<h3>High Stress</h3><ul><li><b>Professional Help:</b> Seek guidance from a therapist or counselor.</li><li><b>Intense Physical Activity:</b> Engage in vigorous exercise like running or HIIT.</li><li><b>Grounding Techniques:</b> Use the 5-4-3-2-1 method to stay present.</li></ul>`;
    }

    document.getElementById('coping-strategies').innerHTML = strategies;
    goToPage('management-tips-page');
}

// Function to show coping strategies from the report page
function showCopingStrategiesForReport(stressLevel) {
    // We pass the stress level directly to the function
    showCopingStrategies(stressLevel.toLowerCase());
}

// Function to load and display stress reports
async function loadStressReports() {
    if (!currentUser || !authToken) return;

    try {
        const response = await fetch(`${API_BASE_URL}/stress-reports/${currentUser.id}`, {
            headers: getAuthHeaders()
        });
        if (response.ok) {
            const reports = await response.json();
            displayStressReports(reports);
        } else {
            console.error("Failed to load stress reports:", await response.text());
        }
    } catch (error) {
        console.error("Error loading stress reports:", error);
    }
}

// Function to load and display stress analytics
async function loadStressAnalytics() {
    if (!currentUser || !authToken) return;

    try {
        const response = await fetch(`${API_BASE_URL}/stress-analytics/${currentUser.id}`, {
            headers: getAuthHeaders()
        });
        if (response.ok) {
            const analytics = await response.json();
            displayStressAnalytics(analytics);
            goToPage('analytics-page');
        } else {
            console.error("Failed to load stress analytics:", await response.text());
        }
    } catch (error) {
        console.error("Error loading stress analytics:", error);
    }
}

// Function to display stress reports in a card-based layout
function displayStressReports(reports) {
    const reportsPage = document.getElementById('reports-page');
    const reportsContent = reportsPage.querySelector('.page-content');

    const oldList = reportsContent.querySelector('.reports-list');
    if (oldList) oldList.remove();

    const reportsList = document.createElement('div');
    reportsList.className = 'reports-list';

    if (reports.length === 0) {
        reportsList.innerHTML = `<p class="page-intro">You haven't taken any stress tests yet.</p>`;
    } else {
        reports.sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));
        reports.forEach(report => {
            const date = new Date(report.assessmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const card = document.createElement('div');
            card.className = `report-card ${report.stressLevel.toLowerCase()}-stress`;
            card.innerHTML = `
                <div class="report-header">
                    <span class="report-date">${date}</span>
                    <span class="report-level">${report.stressLevel}</span>
                </div>
                <div class="report-body"><p>Your stress score was <strong>${report.totalStressScore}</strong>.</p></div>
                <div class="report-footer"><button onclick="showCopingStrategiesForReport('${report.stressLevel}')" class="btn btn-secondary">View Strategies</button></div>`;
            reportsList.appendChild(card);
        });
    }

    const backButton = reportsContent.querySelector('.btn-secondary');
    reportsContent.insertBefore(reportsList, backButton);
}

// Function to display analytics data
function displayStressAnalytics(analytics) {
    if (analytics.message) {
        document.getElementById('analytics-content').innerHTML = `
            <div class="no-data-message">
                <h3>No Data Available</h3>
                <p>${analytics.message}</p>
                <button onclick="goToPage('questionnaire-page')" class="btn btn-primary">Take Your First Assessment</button>
            </div>`;
        return;
    }

    // Update summary stats
    document.getElementById('total-assessments').textContent = analytics.totalAssessments;
    document.getElementById('average-score').textContent = analytics.averageStressScore;
    
    // Determine trend
    const latestAssessment = analytics.latestAssessment;
    const monthlyComparison = analytics.monthlyComparison;
    let trendText = "Stable";
    if (monthlyComparison.improvement > 0) {
        trendText = "↗️ Improving";
    } else if (monthlyComparison.improvement < 0) {
        trendText = "↘️ Needs Attention";
    }
    document.getElementById('current-trend').textContent = trendText;

    // Display insights
    const insightsList = document.getElementById('insights-list');
    insightsList.innerHTML = '';
    analytics.insights.forEach(insight => {
        const insightItem = document.createElement('div');
        insightItem.className = 'insight-item';
        insightItem.innerHTML = `<i class="fas fa-lightbulb"></i> <span>${insight}</span>`;
        insightsList.appendChild(insightItem);
    });

    // Display monthly comparison
    const monthlyStats = document.getElementById('monthly-stats');
    const improvementClass = monthlyComparison.improvement >= 0 ? 'improvement' : 'decline';
    monthlyStats.innerHTML = `
        <div class="monthly-comparison-grid">
            <div class="comparison-card">
                <h4>This Month</h4>
                <div class="stat-large">${monthlyComparison.currentMonthAverage}</div>
            </div>
            <div class="comparison-card">
                <h4>Last Month</h4>
                <div class="stat-large">${monthlyComparison.previousMonthAverage}</div>
            </div>
            <div class="comparison-card ${improvementClass}">
                <h4>Change</h4>
                <div class="stat-large">${monthlyComparison.improvement >= 0 ? '+' : ''}${monthlyComparison.improvement}</div>
                <small>${monthlyComparison.improvementPercentage >= 0 ? '+' : ''}${monthlyComparison.improvementPercentage}%</small>
            </div>
        </div>`;

    // Draw charts
    drawDistributionChart(analytics.stressLevelDistribution);
    drawTrendChart(analytics.weeklyTrend);
}

// Simple chart drawing functions using Canvas
function drawDistributionChart(distribution) {
    const canvas = document.getElementById('distribution-chart');
    const ctx = canvas.getContext('2d');
    const colors = { Low: '#4cd681', Moderate: '#ffa500', High: '#ff6b6b' };
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!distribution || Object.keys(distribution).length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    let startAngle = 0;
    
    // Draw pie chart
    Object.entries(distribution).forEach(([level, count]) => {
        const sliceAngle = (count / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[level] || '#ccc';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw labels
        const labelAngle = startAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(`${level} (${count})`, labelX, labelY);
        
        startAngle += sliceAngle;
    });
}

function drawTrendChart(weeklyTrend) {
    const canvas = document.getElementById('trend-chart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!weeklyTrend || !weeklyTrend.labels || weeklyTrend.labels.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText('No trend data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const margin = 40;
    const chartWidth = canvas.width - 2 * margin;
    const chartHeight = canvas.height - 2 * margin;
    const maxScore = 21; // Maximum possible score
    
    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.stroke();
    
    // Draw data points and lines
    if (weeklyTrend.scores.length > 1) {
        ctx.strokeStyle = '#00a264';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        weeklyTrend.scores.forEach((score, index) => {
            const x = margin + (index / (weeklyTrend.scores.length - 1)) * chartWidth;
            const y = canvas.height - margin - (score / maxScore) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Draw data points
            ctx.fillStyle = '#004d2f';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        ctx.stroke();
    }
    
    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '10px Roboto';
    ctx.textAlign = 'center';
    
    weeklyTrend.labels.forEach((label, index) => {
        const x = margin + (index / Math.max(1, weeklyTrend.labels.length - 1)) * chartWidth;
        ctx.fillText(label.substring(0, 8), x, canvas.height - 10);
    });
}

// ===== NEW QUIZ SYSTEM FUNCTIONS =====

// Function to start the quiz
function startQuiz() {
    // Reset quiz state
    quizAnswers = {};
    currentQuestionIndex = 0;
    
    // Clear any previous selections
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Go to first question
    goToPage('question-1');
}

// Function to handle answer selection
function selectAnswer(questionId, value) {
    // Store the answer
    quizAnswers[questionId] = value;
    
    // Get current question number
    const questionNum = parseInt(questionId.substring(1));
    
    // Visual feedback - mark selected option
    const currentQuestionPage = document.getElementById(`question-${questionNum}`);
    const options = currentQuestionPage.querySelectorAll('.option-card');
    options.forEach(option => option.classList.remove('selected'));
    
    // Find and mark the selected option (safely parse the answer value)
    const selectedOption = Array.from(options).find(option => {
        const matches = option.getAttribute('onclick').match(/(\d+)/g);
        if (!matches || matches.length === 0) return false;
        const optionValue = parseInt(matches[matches.length - 1], 10);
        return optionValue === value;
    });
    
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // Enable submit button on last question if answered
    if (questionNum === totalQuestions) {
        const submitBtn = document.getElementById('submit-btn');
        if (Object.keys(quizAnswers).length === totalQuestions) {
            submitBtn.disabled = false;
        }
    }
    
    // Auto-advance to next question after a short delay (except for last question)
    if (questionNum < totalQuestions) {
        setTimeout(() => {
            goToNextQuestion(questionNum);
        }, 800); // 800ms delay for user to see their selection
    }
}

// Function to go to next question
function goToNextQuestion(currentQuestionNum) {
    if (currentQuestionNum < totalQuestions) {
        goToPage(`question-${currentQuestionNum + 1}`);
        currentQuestionIndex = currentQuestionNum;
        
        // Restore previous selection if exists
        const nextQuestionId = `q${currentQuestionNum + 1}`;
        if (quizAnswers[nextQuestionId]) {
            setTimeout(() => {
                restoreSelection(currentQuestionNum + 1, quizAnswers[nextQuestionId]);
            }, 100);
        }
    }
}

// Function to go to previous question
function goToPreviousQuestion(currentQuestionNum) {
    if (currentQuestionNum > 1) {
        goToPage(`question-${currentQuestionNum - 1}`);
        currentQuestionIndex = currentQuestionNum - 2;
        
        // Restore previous selection if exists
        const prevQuestionId = `q${currentQuestionNum - 1}`;
        if (quizAnswers[prevQuestionId]) {
            setTimeout(() => {
                restoreSelection(currentQuestionNum - 1, quizAnswers[prevQuestionId]);
            }, 100);
        }
    }
}

// Function to restore visual selection on question page
function restoreSelection(questionNum, value) {
    const questionPage = document.getElementById(`question-${questionNum}`);
    if (!questionPage) return;
    
    const options = questionPage.querySelectorAll('.option-card');
    options.forEach(option => {
        option.classList.remove('selected');
        const matches = option.getAttribute('onclick').match(/(\d+)/g);
        if (!matches || matches.length === 0) return;
        const optionValue = parseInt(matches[matches.length - 1], 10);
        if (optionValue === value) {
            option.classList.add('selected');
        }
    });
}

// Function to submit the quiz
function submitQuiz() {
    // Check if all questions are answered
    if (Object.keys(quizAnswers).length < totalQuestions) {
        alert('Please answer all questions before submitting.');
        return;
    }
    
    // Calculate stress score
    let totalStressScore = 0;
    for (let i = 1; i <= totalQuestions; i++) {
        totalStressScore += quizAnswers[`q${i}`] || 0;
    }
    
    // Determine stress level
    let level;
    if (totalStressScore <= 7) level = "Low";
    else if (totalStressScore <= 14) level = "Moderate";
    else level = "High";
    
    // Save assessment
    saveStressAssessment(totalStressScore, level);
    
    // Show results
    document.getElementById('stress-level').innerText = level;
    const stressBar = document.getElementById('stress-bar');
    stressBar.className = 'progress-bar';
    stressBar.classList.add(level.toLowerCase());
    stressBar.querySelector('.progress-fill').style.width = `${(totalStressScore / 21) * 100}%`;
    
    goToPage('analysis-page');
}

// Function to reset quiz when starting questionnaire page
function resetQuiz() {
    quizAnswers = {};
    currentQuestionIndex = 0;
    
    // Reset submit button
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    
    // Clear all selections
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
}

// Function to submit the contact form
function submitContactForm() {
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;

    if (!name || !email || !message) {
        alert("Please fill in all fields");
        return;
    }
    alert("Thank you for your message. Our team will contact you soon!");
    document.getElementById('contact-form').reset();
}

// Event listeners for page navigation and actions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize browser history support
    window.addEventListener('popstate', handlePopState);
    
    // Initialize page from URL
    initializePageFromURL();
    
    // Basic navigation
    const proceedBtn = document.getElementById('proceed-button');
    if (proceedBtn) proceedBtn.addEventListener('click', () => goToPage('login-page'));
    
    // Auth forms
    const loginBtn = document.querySelector('#login-form button');
    if (loginBtn) loginBtn.addEventListener('click', login);
    
    const signupBtn = document.querySelector('#signup-form button');
    if (signupBtn) signupBtn.addEventListener('click', signup);
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // Dashboard cards
    const trendCard = document.querySelector('.stress-trend-card');
    if (trendCard) {
        trendCard.addEventListener('click', () => {
            loadStressReports();
            goToPage('reports-page');
        });
    }
    
    const analyticsCard = document.querySelector('.analytics-card');
    if (analyticsCard) {
        analyticsCard.addEventListener('click', loadStressAnalytics);
    }
    
    // Analysis page - coping strategies button (already fixed in HTML)
    
    // Consultation button
    const consultationBtn = document.querySelector('#management-tips-page .consultation-btn');
    if (consultationBtn) {
        consultationBtn.addEventListener('click', () => goToPage('consultation-page'));
    }
    
    // Contact form
    const contactBtn = document.querySelector('#contact-form button');
    if (contactBtn) contactBtn.addEventListener('click', submitContactForm);
    
    // Handle Enter key for forms
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                login();
            }
        });
    }
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                signup();
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('popstate', handlePopState);
    initializePageFromURL();

    // Proceed button
    const proceedBtn = document.getElementById('proceed-button');
    if (proceedBtn) proceedBtn.addEventListener('click', () => goToPage('login-page'));

    // Login / Signup buttons (explicit ids added in index.html)
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.addEventListener('click', login);

    const signupBtn = document.getElementById('signup-btn');
    if (signupBtn) signupBtn.addEventListener('click', signup);

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Quiz start (if element exists on page)
    const startBtn = document.querySelector('.btn-large');
    // Some markup uses inline onclick for startQuiz — but we keep this guard
    if (startBtn) startBtn.addEventListener('click', () => {
        if (typeof startQuiz === 'function') startQuiz();
    });

    // contact form submit
    const contactBtn = document.querySelector('#contact-form button');
    if (contactBtn) contactBtn.addEventListener('click', () => {
        if (typeof submitContactForm === 'function') submitContactForm();
    });

    // keyboard enter handling for login/signup
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            login();
        }
    });
    const signupForm = document.getElementById('signup-form');
    if (signupForm) signupForm.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            signup();
        }
    });
});