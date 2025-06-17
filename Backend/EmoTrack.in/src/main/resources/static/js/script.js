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
    pages.forEach(page => page.classList.add('hidden'));

    // Reset questionnaire form if navigating to that page
    if (pageId === 'questionnaire-page') {
        resetQuestionnaireForm();
    }

    // Show the target page
    document.getElementById(pageId).classList.remove('hidden');
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const data = await response.json();
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

    const loginData = {
        username: username,
        password: password
    };

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data;
            document.getElementById('user-name').innerText = currentUser.name || currentUser.username;
            goToPage('main-page');
            // Update last checked time if available
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

// Function to update the last checked time
async function updateLastCheckedTime() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/stress-reports/${currentUser.id}`);
        
        if (response.ok) {
            const reports = await response.json();
            if (reports.length > 0) {
                // Sort reports by date (newest first)
                reports.sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));
                const lastReport = reports[0];
                
                // Update last checked time
                document.getElementById('last-checked').innerText = new Date(lastReport.assessmentDate).toLocaleString();
                // Update current stress level
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

// Function to calculate the stress level based on questionnaire answers
function calculateStressLevel() {
    // Get the values of all questionnaire answers
    const answers = document.querySelectorAll('#questionnaire-form input[type="radio"]:checked');
    
    // Check if all questions have been answered
    if (answers.length < 7) {
        alert("Please answer all questions");
        return;
    }
    
    let totalStressScore = 0;
    answers.forEach(answer => {
        totalStressScore += parseInt(answer.value);
    });

    // Determine stress level
    let level, color;
    if (totalStressScore <= 7) {
        level = "Low";
        color = "green";
    } else if (totalStressScore <= 14) {
        level = "Moderate";
        color = "yellow";
    } else {
        level = "High";
        color = "red";
    }

    // Save assessment to the backend
    saveStressAssessment(totalStressScore, level);

    // Display the stress level and progress bar
    document.getElementById('stress-level').innerText = level;
    const stressBar = document.getElementById('stress-bar');
    stressBar.innerHTML = `<div id="${level.toLowerCase()}" style="width: ${totalStressScore * 4.76}%"></div>`;
    goToPage('analysis-page');
}

// Function to save stress assessment to backend
async function saveStressAssessment(totalStressScore, stressLevel) {
    if (!currentUser) {
        console.error("No user logged in");
        return;
    }

    const assessment = {
        userId: currentUser.id,
        totalStressScore: totalStressScore,
        stressLevel: stressLevel
        // No need to include assessmentDate as it's set in the backend
    };

    try {
        const response = await fetch(`${API_BASE_URL}/stress-assessment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assessment)
        });

        if (response.ok) {
            // Update the last checked time and current stress level
            updateLastCheckedTime();
        } else {
            const errorText = await response.text();
            console.error("Failed to save assessment: " + errorText);
        }
    } catch (error) {
        console.error("Error saving assessment:", error);
    }
}

// Function to show coping strategies based on stress level
function showCopingStrategies() {
    const stressLevel = document.getElementById('stress-level').innerText.toLowerCase();
    let strategies;

    if (stressLevel === 'low') {
        strategies = `
            <h3>Low Stress</h3>
            <ul>
                <li><b>Mindfulness & Breathing:</b> Practice mindfulness meditation for 5-10 minutes daily and incorporate deep breathing exercises like the 4-7-8 technique to stay present and calm.</li>
                <li><b>Physical Activity:</b> Engage in light exercise, such as walking or yoga, to release tension and improve your mood.</li>
                <li><b>Social & Emotional Support:</b> Spend time with friends or family to strengthen social bonds and listen to relaxing or upbeat music to enhance your mood.</li>
            </ul>`;
    } else if (stressLevel === 'moderate') {
        strategies = `
            <h3>Moderate Stress</h3>
            <ul>
                <li><b>Cognitive Techniques:</b> Utilize Cognitive Behavioral Therapy (CBT) techniques to challenge negative thoughts and replace them with balanced perspectives.</li>
                <li><b>Relaxation & Sleep:</b> Combine progressive muscle relaxation with mindful breathing and ensure you're getting quality sleep (7-9 hours) to recover effectively.</li>
                <li><b>Creative Outlets & Visualization:</b> Engage in creative hobbies like painting or writing to distract and relax, and use visualization to imagine peaceful places or positive outcomes.</li>
            </ul>`;
    } else if (stressLevel === 'high') {
        strategies = `
            <h3>High Stress</h3>
            <ul>
                <li><b>Professional Help:</b> Seek guidance from a therapist or counselor for personalized coping tools.</li>
                <li><b>Intense Physical Activity:</b> Engage in vigorous exercise such as running or high-intensity interval training (HIIT) to release built-up tension.</li>
                <li><b>Grounding & Cold Exposure:</b> Use grounding techniques like the 5-4-3-2-1 method to stay present and reset your stress response with cold exposure, like a cold shower.</li>
                <li><b>Relaxation Apps:</b> Use an app like Calm or Headspace to guide you through stress-relief techniques.</li>
                <li><b>Extended Breathing Exercises:</b> Practice extended deep breathing techniques (box breathing or diaphragmatic breathing) to bring rapid relief.</li>
            </ul>`;
    }

    document.getElementById('coping-strategies').innerHTML = strategies;
    goToPage('management-tips-page');
}

// Function to load and display stress reports for the logged-in user
async function loadStressReports() {
    if (!currentUser) {
        console.error("No user logged in");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/stress-reports/${currentUser.id}`);
        
        if (response.ok) {
            const reports = await response.json();
            displayStressReports(reports);
        } else {
            const errorText = await response.text();
            console.error("Failed to load stress reports: " + errorText);
        }
    } catch (error) {
        console.error("Error loading stress reports:", error);
    }
}

// Function to display stress reports in a table
function displayStressReports(reports) {
    const reportsContainer = document.getElementById('reports-page');
    
    if (reports.length === 0) {
        reportsContainer.innerHTML = `
            <h2>Old Stress Reports</h2>
            <p>You haven't taken any stress tests yet.</p>
            <button type="button" onclick="goToPage('main-page')">Back to Main Page</button>
        `;
        return;
    }

    let tableHtml = `
        <h2>Old Stress Reports</h2>
        <table class="reports-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Stress Level</th>
                    <th>Score</th>
                    <th>Coping Strategies</th>
                </tr>
            </thead>
            <tbody>
    `;

    reports.forEach(report => {
        const date = new Date(report.assessmentDate).toLocaleDateString();
        tableHtml += `
            <tr>
                <td>${date}</td>
                <td class="${report.stressLevel.toLowerCase()}-stress">${report.stressLevel}</td>
                <td>${report.totalStressScore}</td>
                <td><button onclick="showCopingStrategiesForReport('${report.stressLevel}')">View</button></td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
        <button type="button" onclick="goToPage('main-page')">Back to Main Page</button>
    `;

    reportsContainer.innerHTML = tableHtml;
}

// Function to show coping strategies for a specific report
function showCopingStrategiesForReport(stressLevel) {
    document.getElementById('stress-level').innerText = stressLevel;
    showCopingStrategies();
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

    // Since there's no backend endpoint for this yet, just show success message
    alert("Thank you for your message. Our team will contact you soon!");
    
    // Clear form
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-email').value = '';
    document.getElementById('contact-message').value = '';
}

// Event listeners for page navigation
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for navigation
    document.getElementById('proceed-button').addEventListener('click', () => goToPage('login-page'));
    
    // Login page
    document.querySelector('#login-form button').addEventListener('click', login);
    document.querySelector('#login-form a').addEventListener('click', () => goToPage('signup-page'));
    
    // Signup page
    document.querySelector('#signup-form button').addEventListener('click', signup);
    document.querySelector('#signup-form a').addEventListener('click', () => goToPage('login-page'));
    
    // Questionnaire page
    document.querySelector('#questionnaire-form button:first-of-type').addEventListener('click', calculateStressLevel);
    
    // Analysis page
    document.querySelector('#analysis-page button').addEventListener('click', showCopingStrategies);
    
    // Management tips page
    document.querySelector('.consultation-btn').addEventListener('click', () => goToPage('consultation-page'));
    
    // Contact form
    document.querySelector('#contact-form button').addEventListener('click', submitContactForm);
    
    // Make the stress trend card clickable to navigate to reports page
    const stressTrendCard = document.querySelector('.grid-container div:nth-child(2)');
    if (stressTrendCard) {
        stressTrendCard.style.cursor = 'pointer';
        stressTrendCard.addEventListener('click', () => {
            loadStressReports();
            goToPage('reports-page');
        });
    }
});