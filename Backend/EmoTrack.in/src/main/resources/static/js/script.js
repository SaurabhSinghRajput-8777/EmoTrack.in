// API Base URL - Change this to match your Spring Boot server
const API_BASE_URL = "http://localhost:8080/api";

// Current logged in user data
let currentUser = null;

// Function to reset the questionnaire form
function resetQuestionnaireForm() {
    const answers = document.querySelectorAll('#questionnaire-form input[type="radio"]');
    answers.forEach(answer => {
        answer.checked = false; // Uncheck all radio buttons
    });
}

// Function to navigate between pages
function goToPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        if (!page.classList.contains('hidden')) {
            page.classList.add('hidden');
        }
    });

    // Show the target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // Reset questionnaire form if navigating to that page
    if (pageId === 'questionnaire-page') {
        resetQuestionnaireForm();
    }
}

// Function to handle user signup
async function signup() {
    const username = document.getElementById('new-username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('new-password').value;
    const name = document.getElementById('name').value;
    const age = document.getElementById('age').value;

    if (!username || !email || !password || !name || !age) {
        alert("Please fill in all fields");
        return;
    }

    const userData = {
        username: username,
        email: email,
        password: password,
        name: name,
        age: parseInt(age)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            alert("Signup successful! Please login.");
            goToPage('login-page');
        } else {
            const errorText = await response.text();
            alert("Signup failed: " + errorText);
        }
    } catch (error) {
        console.error("Error during signup:", error);
        alert("An error occurred during signup. Please try again.");
    }
}

// Function to handle user login
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert("Please enter both username and password");
        return;
    }

    const loginData = { username: username, password: password };

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        if (response.ok) {
            currentUser = await response.json();
            document.getElementById('user-name').innerText = currentUser.name || currentUser.username;
            goToPage('main-page');
            updateLastCheckedTime();
        } else {
            const errorText = await response.text();
            alert("Login failed: " + errorText);
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred during login. Please try again.");
    }
}

// Function to update the last checked time on the dashboard
async function updateLastCheckedTime() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/stress-reports/${currentUser.id}`);
        if (response.ok) {
            const reports = await response.json();
            if (reports.length > 0) {
                reports.sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));
                const lastReport = reports[0];
                document.getElementById('last-checked').innerText = new Date(lastReport.assessmentDate).toLocaleString();
                document.getElementById('current-stress').innerText = lastReport.stressLevel;
            }
        }
    } catch (error) {
        console.error("Error fetching last checked time:", error);
    }
}

// Function to handle logout
function logout() {
    currentUser = null;
    goToPage('login-page');
}

// Function to calculate the stress level from the questionnaire
function calculateStressLevel() {
    const answers = document.querySelectorAll('#questionnaire-form input[type="radio"]:checked');
    if (answers.length < 7) {
        alert("Please answer all questions");
        return;
    }
    
    let totalStressScore = 0;
    answers.forEach(answer => {
        totalStressScore += parseInt(answer.value);
    });

    let level;
    if (totalStressScore <= 7) level = "Low";
    else if (totalStressScore <= 14) level = "Moderate";
    else level = "High";

    saveStressAssessment(totalStressScore, level);

    document.getElementById('stress-level').innerText = level;
    const stressBar = document.getElementById('stress-bar');
    stressBar.className = 'progress-bar'; 
    stressBar.classList.add(level.toLowerCase());
    stressBar.querySelector('.progress-fill').style.width = `${(totalStressScore / 21) * 100}%`;
    goToPage('analysis-page');
}

// Function to save stress assessment to the backend
async function saveStressAssessment(totalStressScore, stressLevel) {
    if (!currentUser) return;

    const assessment = {
        userId: currentUser.id,
        totalStressScore: totalStressScore,
        stressLevel: stressLevel
    };

    try {
        const response = await fetch(`${API_BASE_URL}/stress-assessment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assessment)
        });
        if (response.ok) {
            updateLastCheckedTime();
        } else {
            console.error("Failed to save assessment:", await response.text());
        }
    } catch (error) {
        console.error("Error saving assessment:", error);
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
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/stress-reports/${currentUser.id}`);
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
    document.getElementById('proceed-button').addEventListener('click', () => goToPage('login-page'));
    document.querySelector('#login-form button').addEventListener('click', login);
    document.querySelector('#signup-form button').addEventListener('click', signup);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.querySelector('.stress-trend-card').addEventListener('click', () => {
        loadStressReports();
        goToPage('reports-page');
    });
    document.querySelector('#questionnaire-form .btn-primary').addEventListener('click', calculateStressLevel);
    document.querySelector('#analysis-page button').addEventListener('click', () => showCopingStrategies());
    document.querySelector('#management-tips-page .consultation-btn').addEventListener('click', () => goToPage('consultation-page'));
    document.querySelector('#contact-form button').addEventListener('click', submitContactForm);
});