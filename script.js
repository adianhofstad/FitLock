// ===== Global State =====
let appState = {
    workouts: [],
    currentBelt: 'White',
    selectedIntensity: 3,
    currentFilter: 'all',
    currentCategory: 'all'
};

// ===== Data Storage =====
const STORAGE_KEY = 'bjj_fitness_data';

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        appState = { ...appState, ...JSON.parse(data) };
    }
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeNavigation();
    initializeWorkoutForm();
    updateDashboard();
    renderTechniques();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
    }, 1500);

    // Set today's date in workout form
    document.getElementById('workoutDate').valueAsDate = new Date();

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    }
});

// ===== Navigation =====
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.dataset.view;
            navigateTo(targetView);
        });
    });
}

function navigateTo(viewName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}View`).classList.add('active');

    // Load view-specific data
    if (viewName === 'workouts') {
        renderWorkouts();
    } else if (viewName === 'techniques') {
        renderTechniques();
    }
}

// ===== Dashboard =====
function updateDashboard() {
    updateStats();
    renderTrainingSplit();
    renderRecentActivity();
}

function updateStats() {
    // Calculate week streak
    const weekStreak = calculateWeekStreak();
    document.getElementById('weekStreak').textContent = weekStreak;

    // Calculate total hours
    const totalHours = Math.round(appState.workouts.reduce((sum, w) => sum + w.duration, 0) / 60);
    document.getElementById('totalHours').textContent = totalHours;

    // Calculate sessions this month
    const thisMonth = appState.workouts.filter(w => {
        const workoutDate = new Date(w.date);
        const now = new Date();
        return workoutDate.getMonth() === now.getMonth() &&
               workoutDate.getFullYear() === now.getFullYear();
    }).length;
    document.getElementById('sessionsMonth').textContent = thisMonth;

    // Current belt
    document.getElementById('currentBelt').textContent = appState.currentBelt;
}

function calculateWeekStreak() {
    if (appState.workouts.length === 0) return 0;

    const sortedWorkouts = [...appState.workouts].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    let streak = 0;
    let currentWeek = getWeekNumber(new Date());

    for (const workout of sortedWorkouts) {
        const workoutWeek = getWeekNumber(new Date(workout.date));
        if (workoutWeek === currentWeek) {
            streak = Math.max(streak, 1);
        } else if (workoutWeek === currentWeek - 1) {
            currentWeek = workoutWeek;
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function renderRecentActivity() {
    const container = document.getElementById('recentActivity');

    if (appState.workouts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No training sessions yet</p>
                <p class="empty-subtitle">Start logging your workouts!</p>
            </div>
        `;
        return;
    }

    const recentWorkouts = [...appState.workouts]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    container.innerHTML = recentWorkouts.map(workout => `
        <div class="activity-item">
            <div class="activity-icon">${getWorkoutIcon(workout.type)}</div>
            <div class="activity-details">
                <div class="activity-title">${formatWorkoutType(workout.type)}</div>
                <div class="activity-meta">
                    ${formatDate(workout.date)} • ${workout.duration} min • Intensity: ${workout.intensity}/4
                </div>
            </div>
        </div>
    `).join('');
}

function renderTrainingSplit() {
    const container = document.getElementById('splitCalendar');

    // Get current week (Mon-Sun)
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekDays = days.map((dayName, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);

        // Get workouts for this day
        const dateString = date.toISOString().split('T')[0];
        const dayWorkouts = appState.workouts.filter(w => w.date === dateString);

        // Check if it's today
        const isToday = dateString === today.toISOString().split('T')[0];

        // Get workout types for this day
        const workoutTypes = dayWorkouts.map(w => {
            if (w.type === 'bjj') return 'BJJ';
            if (w.type === 'weights') return 'Weights';
            if (w.type === 'competition') return 'Comp';
            if (w.type === 'private') return 'Private';
            return '';
        }).filter(t => t);

        return {
            name: dayName,
            date: date.getDate(),
            isToday,
            workouts: workoutTypes,
            hasWorkouts: dayWorkouts.length > 0
        };
    });

    container.innerHTML = weekDays.map(day => `
        <div class="day-card ${day.isToday ? 'selected' : ''}">
            <div class="day-name">${day.name}</div>
            <div class="day-date">${day.date}</div>
            ${day.workouts.length > 0 ? `
                <div class="day-activities">${day.workouts.join(', ')}</div>
            ` : `
                <div class="day-activities">Rest</div>
            `}
        </div>
    `).join('');
}

// ===== Workout Tracking =====
function initializeWorkoutForm() {
    const form = document.getElementById('workoutForm');
    const intensityButtons = document.querySelectorAll('.intensity-btn');

    // Intensity selector
    intensityButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            intensityButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appState.selectedIntensity = parseInt(btn.dataset.intensity);
        });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const workout = {
            id: Date.now(),
            date: document.getElementById('workoutDate').value,
            type: document.getElementById('workoutType').value,
            duration: parseInt(document.getElementById('workoutDuration').value),
            intensity: appState.selectedIntensity,
            notes: document.getElementById('workoutNotes').value
        };

        appState.workouts.push(workout);
        saveData();
        updateDashboard();
        closeModal();

        // Show success message
        showToast('Training session logged successfully!');

        // Navigate to workouts view
        navigateTo('workouts');
    });

    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            appState.currentFilter = tab.dataset.filter;
            renderWorkouts();
        });
    });
}

function renderWorkouts() {
    const container = document.getElementById('workoutsList');

    let filteredWorkouts = appState.workouts;
    if (appState.currentFilter !== 'all') {
        filteredWorkouts = appState.workouts.filter(w => w.type === appState.currentFilter);
    }

    if (filteredWorkouts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No ${appState.currentFilter === 'all' ? '' : appState.currentFilter} training sessions yet</p>
                <p class="empty-subtitle">Log your first workout!</p>
            </div>
        `;
        return;
    }

    const sortedWorkouts = [...filteredWorkouts].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    container.innerHTML = sortedWorkouts.map(workout => `
        <div class="workout-card">
            <div class="workout-header">
                <div>
                    <div class="workout-type">${formatWorkoutType(workout.type)}</div>
                    <div class="workout-date">${formatDate(workout.date)}</div>
                </div>
            </div>
            <div class="workout-stats">
                <div class="workout-stat">
                    <span>⏱️</span>
                    <span>${workout.duration} min</span>
                </div>
                <div class="workout-stat">
                    <span>💪</span>
                    <span>Intensity: ${workout.intensity}/4</span>
                </div>
            </div>
            ${workout.notes ? `<div class="workout-notes">"${workout.notes}"</div>` : ''}
        </div>
    `).join('');
}

function showLogWorkout() {
    document.getElementById('logWorkoutModal').classList.remove('hidden');
    document.getElementById('workoutForm').reset();
    document.getElementById('workoutDate').valueAsDate = new Date();

    // Reset intensity selector
    document.querySelectorAll('.intensity-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.intensity === '3') {
            btn.classList.add('active');
        }
    });
    appState.selectedIntensity = 3;
}

function closeModal() {
    document.getElementById('logWorkoutModal').classList.add('hidden');
}

// ===== Techniques Library =====
const techniquesData = [
    // Guard Techniques
    { name: 'Closed Guard', category: 'guard', difficulty: 1, description: 'Fundamental position where you control opponent with legs wrapped around their waist.' },
    { name: 'Open Guard', category: 'guard', difficulty: 2, description: 'Dynamic guard using hooks and grips to control distance and create sweeps.' },
    { name: 'Spider Guard', category: 'guard', difficulty: 3, description: 'Advanced guard controlling opponent\'s sleeves with feet on biceps.' },
    { name: 'De La Riva Guard', category: 'guard', difficulty: 3, description: 'Hook-based guard controlling one leg and creating off-balancing opportunities.' },
    { name: 'Half Guard', category: 'guard', difficulty: 2, description: 'One leg trapped, creating opportunities for sweeps and back takes.' },
    { name: 'Butterfly Guard', category: 'guard', difficulty: 2, description: 'Both feet as hooks inside opponent\'s thighs for powerful sweeps.' },

    // Guard Passing
    { name: 'Toreando Pass', category: 'passing', difficulty: 2, description: 'Bullfighter-style pass controlling opponent\'s legs and moving around guard.' },
    { name: 'Knee Slice Pass', category: 'passing', difficulty: 2, description: 'Slicing knee through center while controlling hip and shoulder.' },
    { name: 'Over-Under Pass', category: 'passing', difficulty: 2, description: 'One arm over, one arm under, driving forward to pass guard.' },
    { name: 'X-Pass', category: 'passing', difficulty: 3, description: 'Cross-facing pass while controlling near leg for stable position.' },
    { name: 'Leg Drag', category: 'passing', difficulty: 2, description: 'Dragging opponent\'s leg across to eliminate guard and take side control.' },
    { name: 'Stack Pass', category: 'passing', difficulty: 2, description: 'Driving opponent\'s knees to chest to collapse guard structure.' },

    // Submissions
    { name: 'Armbar', category: 'submissions', difficulty: 1, description: 'Hyperextending elbow by controlling arm with legs and hips.' },
    { name: 'Triangle Choke', category: 'submissions', difficulty: 2, description: 'Blood choke using legs to trap head and arm in triangular formation.' },
    { name: 'Rear Naked Choke', category: 'submissions', difficulty: 1, description: 'Classic blood choke from back control, arm under chin.' },
    { name: 'Kimura', category: 'submissions', difficulty: 2, description: 'Shoulder lock with figure-four grip on opponent\'s arm.' },
    { name: 'Guillotine', category: 'submissions', difficulty: 2, description: 'Front headlock choke wrapping arm around neck.' },
    { name: 'Americana', category: 'submissions', difficulty: 1, description: 'Shoulder lock from top position, bending arm backward.' },
    { name: 'Ezekiel Choke', category: 'submissions', difficulty: 2, description: 'Lapel or sleeve choke from inside opponent\'s guard.' },
    { name: 'Bow and Arrow', category: 'submissions', difficulty: 3, description: 'Lapel choke from back control using leg pressure.' },

    // Sweeps
    { name: 'Scissor Sweep', category: 'sweeps', difficulty: 1, description: 'Classic sweep from closed guard using scissoring leg motion.' },
    { name: 'Flower Sweep', category: 'sweeps', difficulty: 1, description: 'Hip bump into armbar-style sweep from closed guard.' },
    { name: 'Butterfly Sweep', category: 'sweeps', difficulty: 2, description: 'Using butterfly hooks to lift and sweep opponent overhead.' },
    { name: 'X-Guard Sweep', category: 'sweeps', difficulty: 3, description: 'Advanced sweep using X-hook configuration under opponent.' },
    { name: 'Deep Half Sweep', category: 'sweeps', difficulty: 3, description: 'Sweeping from deep half guard position with back against mat.' },

    // Takedowns
    { name: 'Double Leg Takedown', category: 'takedowns', difficulty: 1, description: 'Wrestling takedown attacking both legs simultaneously.' },
    { name: 'Single Leg Takedown', category: 'takedowns', difficulty: 1, description: 'Isolating and attacking one leg for takedown.' },
    { name: 'Osoto Gari', category: 'takedowns', difficulty: 2, description: 'Judo throw sweeping outside leg while off-balancing backward.' },
    { name: 'Uchi Mata', category: 'takedowns', difficulty: 3, description: 'Inner thigh throw, lifting opponent with leg sweep.' },
    { name: 'Drop Seoi Nage', category: 'takedowns', difficulty: 3, description: 'Shoulder throw dropping to knees while pulling opponent over.' },

    // Escapes
    { name: 'Elbow Escape (Shrimp)', category: 'escapes', difficulty: 1, description: 'Fundamental hip escape creating space to recover guard.' },
    { name: 'Bridge and Roll', category: 'escapes', difficulty: 1, description: 'Explosive bridge to reverse mount position.' },
    { name: 'Back Escape', category: 'escapes', difficulty: 2, description: 'Escaping back control by clearing hooks and turning.' },
    { name: 'Headlock Escape', category: 'escapes', difficulty: 2, description: 'Defending and escaping from side control headlock.' }
];

function renderTechniques() {
    const container = document.getElementById('techniquesList');
    const searchInput = document.getElementById('techniqueSearch');

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = techniquesData.filter(tech =>
            tech.name.toLowerCase().includes(searchTerm) ||
            tech.description.toLowerCase().includes(searchTerm)
        );
        displayTechniques(filtered);
    });

    // Category filtering
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appState.currentCategory = btn.dataset.category;
            filterAndDisplayTechniques();
        });
    });

    filterAndDisplayTechniques();
}

function filterAndDisplayTechniques() {
    let filtered = techniquesData;

    if (appState.currentCategory !== 'all') {
        filtered = techniquesData.filter(t => t.category === appState.currentCategory);
    }

    displayTechniques(filtered);
}

function displayTechniques(techniques) {
    const container = document.getElementById('techniquesList');

    if (techniques.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No techniques found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = techniques.map(tech => `
        <div class="technique-card">
            <div class="technique-header">
                <div class="technique-name">${tech.name}</div>
                <div class="technique-category">${formatCategory(tech.category)}</div>
            </div>
            <div class="technique-description">${tech.description}</div>
            <div class="technique-difficulty">
                <span>Difficulty:</span>
                <div class="difficulty-dots">
                    ${Array(4).fill(0).map((_, i) =>
                        `<div class="difficulty-dot ${i < tech.difficulty ? 'filled' : ''}"></div>`
                    ).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Conditioning Programs =====
const conditioningPrograms = {
    warmup: {
        title: 'BJJ Warm-up Drills',
        duration: '10-15 minutes',
        exercises: [
            { name: 'Shrimping (Hip Escapes)', reps: '10 each side' },
            { name: 'Forward & Backward Rolls', reps: '5 each direction' },
            { name: 'Bridge Walk', reps: '20 steps' },
            { name: 'Sprawls', reps: '10 reps' },
            { name: 'Sit-throughs', reps: '10 each side' },
            { name: 'Arm Circles & Shoulder Rotations', reps: '30 seconds' },
            { name: 'Hip Rotations', reps: '10 each direction' },
            { name: 'Neck Bridges', reps: '10 reps (hold 2 sec)' }
        ]
    },
    strength: {
        title: 'BJJ Strength Training',
        duration: '30-45 minutes',
        exercises: [
            { name: 'Pull-ups', reps: '3 sets x 8-12 reps' },
            { name: 'Push-ups (Wide & Close Grip)', reps: '3 sets x 15-20 reps' },
            { name: 'Deadlifts', reps: '4 sets x 6-8 reps' },
            { name: 'Squats', reps: '4 sets x 8-12 reps' },
            { name: 'Overhead Press', reps: '3 sets x 8-10 reps' },
            { name: 'Rows (Barbell or Dumbbell)', reps: '3 sets x 10-12 reps' },
            { name: 'Farmer Carries', reps: '3 sets x 40m' },
            { name: 'Plank (Front & Side)', reps: '3 sets x 60 seconds' },
            { name: 'Turkish Get-ups', reps: '3 sets x 5 each side' }
        ]
    },
    cardio: {
        title: 'Cardio & Endurance',
        duration: '20-30 minutes',
        exercises: [
            { name: 'Jump Rope', reps: '5 rounds x 3 min (1 min rest)' },
            { name: 'Burpees', reps: '4 sets x 15 reps' },
            { name: 'High Knees', reps: '4 sets x 45 seconds' },
            { name: 'Mountain Climbers', reps: '4 sets x 30 seconds' },
            { name: 'Sprints', reps: '8 rounds x 30 sec (30 sec rest)' },
            { name: 'Shadow Drilling', reps: '5 rounds x 2 min' },
            { name: 'Wrestling Shots', reps: '3 sets x 20 reps' },
            { name: 'Sprawl to Stand-up', reps: '4 sets x 10 reps' }
        ]
    },
    recovery: {
        title: 'Recovery & Flexibility',
        duration: '15-20 minutes',
        exercises: [
            { name: 'Foam Rolling - Legs', reps: '2 min each leg' },
            { name: 'Foam Rolling - Back', reps: '3 minutes' },
            { name: 'Pigeon Stretch', reps: 'Hold 90 seconds each side' },
            { name: 'Butterfly Stretch', reps: 'Hold 60 seconds' },
            { name: 'Seated Forward Fold', reps: 'Hold 60 seconds' },
            { name: 'Hip Flexor Stretch', reps: 'Hold 45 seconds each side' },
            { name: 'Shoulder Dislocates', reps: '15 reps' },
            { name: 'Child\'s Pose', reps: 'Hold 90 seconds' },
            { name: 'Cat-Cow Stretch', reps: '10 slow reps' },
            { name: 'Lying Twist', reps: 'Hold 45 seconds each side' }
        ]
    }
};

function showProgram(programKey) {
    const program = conditioningPrograms[programKey];
    const container = document.getElementById('programDetails');

    container.innerHTML = `
        <button onclick="hideProgram()" style="background: var(--accent-color); color: white; border: none; padding: 8px 16px; border-radius: 20px; margin-bottom: 16px; cursor: pointer;">
            ← Back to Programs
        </button>
        <h2 style="font-size: 1.5rem; margin-bottom: 8px; color: var(--accent-light);">${program.title}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Duration: ${program.duration}</p>
        <ul class="exercise-list">
            ${program.exercises.map(exercise => `
                <li class="exercise-item">
                    <div>
                        <div class="exercise-name">${exercise.name}</div>
                        <div class="exercise-reps">${exercise.reps}</div>
                    </div>
                </li>
            `).join('')}
        </ul>
        <button onclick="startTimer()" class="action-btn primary" style="margin-top: 20px;">
            <span class="btn-icon">⏱️</span>
            Start Timer
        </button>
    `;

    container.classList.remove('hidden');
    document.querySelector('.program-selector').style.display = 'none';
}

function hideProgram() {
    document.getElementById('programDetails').classList.add('hidden');
    document.querySelector('.program-selector').style.display = 'grid';
}

function startTimer() {
    showToast('Timer feature coming soon! Use your phone timer for now.');
}

// ===== GrappleGPT Integration =====
async function askAI(questionType) {
    const responses = {
        'training-plan': generateTrainingPlan(),
        'technique-focus': generateTechniqueFocus(),
        'conditioning': generateConditioningAdvice(),
        'recovery': generateRecoveryAdvice()
    };

    const response = responses[questionType];
    displayAIResponse(response);
}

function generateTrainingPlan() {
    const sessionsThisWeek = appState.workouts.filter(w => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(w.date) >= weekAgo;
    }).length;

    const totalSessions = appState.workouts.length;

    let plan = `<h3>Personalized Training Plan</h3>`;

    if (totalSessions < 10) {
        plan += `
            <p>Since you're getting started, here's a beginner-friendly plan:</p>
            <ul>
                <li><strong>3-4 sessions per week</strong> - Build consistency without overtraining</li>
                <li><strong>Focus on fundamentals:</strong> Closed guard, basic escapes, and positional control</li>
                <li><strong>Drilling:</strong> Spend 20 minutes each session on technique repetition</li>
                <li><strong>Live rolling:</strong> Start light, 2-3 rounds at 50-70% intensity</li>
                <li><strong>Conditioning:</strong> Add 2 sessions of basic cardio (jump rope, running)</li>
            </ul>
            <p><strong>This week's goal:</strong> Master the hip escape (shrimp) and practice it before every session.</p>
        `;
    } else if (sessionsThisWeek >= 4) {
        plan += `
            <p>Great consistency! Here's your intermediate plan:</p>
            <ul>
                <li><strong>4-5 technical sessions</strong> with live rolling</li>
                <li><strong>Competition training:</strong> Add 1 hard sparring session</li>
                <li><strong>Strength work:</strong> 2 sessions focusing on pulling power and grip</li>
                <li><strong>Active recovery:</strong> 1 session of yoga or mobility work</li>
                <li><strong>Position focus:</strong> This week, work on half guard sweeps and passes</li>
            </ul>
            <p><strong>Pro tip:</strong> Record one roll per week and review it to spot patterns.</p>
        `;
    } else {
        plan += `
            <p>Let's build back your momentum:</p>
            <ul>
                <li><strong>Goal: 3-4 sessions this week</strong></li>
                <li><strong>Start with drilling-focused classes</strong> to rebuild timing</li>
                <li><strong>Light rolling</strong> for the first 2 sessions</li>
                <li><strong>Add one conditioning session</strong> to boost your gas tank</li>
                <li><strong>Focus area:</strong> Guard retention and basic submissions</li>
            </ul>
            <p><strong>Reminder:</strong> Consistency beats intensity. Show up regularly!</p>
        `;
    }

    return plan;
}

function generateTechniqueFocus() {
    const belt = appState.currentBelt;
    const recentWorkouts = appState.workouts.slice(-5);

    let response = `<h3>Technique Recommendations for ${belt} Belt</h3>`;

    if (belt === 'White') {
        response += `
            <p>As a white belt, focus on these essential techniques:</p>
            <ul>
                <li><strong>Top Priority:</strong> Positional escapes (side control, mount, back)</li>
                <li><strong>Guard Work:</strong> Closed guard maintenance and basic sweeps</li>
                <li><strong>Submissions:</strong> Armbar from guard, rear naked choke</li>
                <li><strong>Defense:</strong> Defending common submissions (armbar, triangle, choke)</li>
            </ul>
            <p><strong>This month's challenge:</strong> Successfully execute a scissor sweep in live rolling.</p>
        `;
    } else {
        response += `
            <p>Continue developing your game with these techniques:</p>
            <ul>
                <li><strong>Guard Development:</strong> Add spider guard and De La Riva to your arsenal</li>
                <li><strong>Passing:</strong> Master toreando and knee slice passes</li>
                <li><strong>Submissions:</strong> Work on kimura, guillotine, and bow & arrow choke</li>
                <li><strong>Advanced Concepts:</strong> Chain submissions and sweeps together</li>
            </ul>
            <p><strong>Drill of the week:</strong> Flow between open guard variations with a partner.</p>
        `;
    }

    return response;
}

function generateConditioningAdvice() {
    return `
        <h3>BJJ Conditioning Program</h3>
        <p>Based on your training frequency, here's what I recommend:</p>

        <h4>Weekly Structure:</h4>
        <ul>
            <li><strong>Monday:</strong> BJJ Training + Grip Work</li>
            <li><strong>Tuesday:</strong> Strength Training (Pull/Push focused)</li>
            <li><strong>Wednesday:</strong> BJJ Training</li>
            <li><strong>Thursday:</strong> High-Intensity Intervals (Sprints, Burpees)</li>
            <li><strong>Friday:</strong> BJJ Training + Open Mat</li>
            <li><strong>Saturday:</strong> Active Recovery (Yoga, Light Drilling)</li>
            <li><strong>Sunday:</strong> Rest or Light Cardio</li>
        </ul>

        <h4>Key Focus Areas:</h4>
        <ul>
            <li><strong>Grip Strength:</strong> Dead hangs, farmer carries, gi pull-ups</li>
            <li><strong>Core:</strong> Planks, turkish get-ups, hanging leg raises</li>
            <li><strong>Explosive Power:</strong> Box jumps, medicine ball slams</li>
            <li><strong>Cardio Endurance:</strong> 5-minute rolling rounds, sprints</li>
        </ul>

        <p><strong>Pro tip:</strong> Your conditioning should complement, not replace, mat time. Don't overtrain!</p>
    `;
}

function generateRecoveryAdvice() {
    return `
        <h3>Recovery & Injury Prevention</h3>
        <p>Recovery is just as important as training. Here's your recovery protocol:</p>

        <h4>Daily Recovery Routine:</h4>
        <ul>
            <li><strong>Morning:</strong> 5-10 minutes of movement flow and stretching</li>
            <li><strong>Post-Training:</strong> 10 minutes of targeted stretching (hips, shoulders, neck)</li>
            <li><strong>Evening:</strong> Foam rolling for 15 minutes</li>
            <li><strong>Sleep:</strong> Aim for 7-9 hours per night</li>
        </ul>

        <h4>Weekly Recovery Sessions:</h4>
        <ul>
            <li><strong>Mobility Work:</strong> 30-minute session focusing on hip and shoulder mobility</li>
            <li><strong>Active Recovery:</strong> Light swimming, cycling, or walking</li>
            <li><strong>Massage/Bodywork:</strong> Once per month if possible</li>
        </ul>

        <h4>Injury Prevention:</h4>
        <ul>
            <li><strong>Warm-up:</strong> Never skip warm-ups, especially shrimping and bridging</li>
            <li><strong>Tap Early:</strong> Ego is the enemy - tap to joint locks early</li>
            <li><strong>Know Your Limits:</strong> Take rest days when your body tells you to</li>
            <li><strong>Prehab Exercises:</strong> Face pulls, band rotations, neck strengthening</li>
        </ul>

        <h4>Nutrition for Recovery:</h4>
        <ul>
            <li><strong>Protein:</strong> 1.6-2.2g per kg bodyweight daily</li>
            <li><strong>Hydration:</strong> Drink 3-4 liters of water daily</li>
            <li><strong>Anti-inflammatory Foods:</strong> Fish, berries, leafy greens, turmeric</li>
            <li><strong>Post-Training:</strong> Protein + carbs within 30 minutes</li>
        </ul>

        <p><strong>Remember:</strong> You don't get better during training, you get better during recovery!</p>
    `;
}

async function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();

    if (!message) return;

    // Show loading state
    displayAIResponse('<p>Thinking... 🤔</p>');

    try {
        // Call Hugging Face API for AI-powered response
        const response = await generateAIResponse(message);
        displayAIResponse(response);
    } catch (error) {
        displayAIResponse(`
            <p>I'm having trouble connecting right now, but here's some general advice:</p>
            <p>${generateFallbackResponse(message)}</p>
        `);
    }

    input.value = '';
}

async function generateAIResponse(userMessage) {
    const apiUrl = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';

    const prompt = `You are an expert Brazilian Jiu-Jitsu coach and fitness trainer. A student asks: "${userMessage}". Provide helpful, specific advice in 2-3 paragraphs. Focus on practical tips.`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                max_new_tokens: 200,
                temperature: 0.7,
                top_p: 0.9,
                return_full_text: false
            }
        })
    });

    const data = await response.json();
    let aiText = data[0]?.generated_text || '';

    // Clean up response
    aiText = aiText.replace(/^(Answer:|Response:|Coach:)/i, '').trim();

    return `<p>${aiText}</p>`;
}

function generateFallbackResponse(message) {
    const keywords = message.toLowerCase();

    if (keywords.includes('guard')) {
        return 'Focus on maintaining guard control with active grips and hip movement. Don\'t let your opponent settle into a passing position.';
    } else if (keywords.includes('pass')) {
        return 'Good guard passing requires pressure, patience, and proper grips. Start with fundamental passes like the toreando and knee slice.';
    } else if (keywords.includes('submit')) {
        return 'Master positional control first. Submissions come naturally once you can hold dominant positions. Focus on high-percentage subs like RNC and armbar.';
    } else if (keywords.includes('cardio') || keywords.includes('conditioning')) {
        return 'Build your cardio with high-intensity intervals and regular rolling. Jump rope, burpees, and sprints are excellent BJJ-specific cardio work.';
    } else {
        return 'Keep training consistently, focus on fundamentals, and don\'t forget to drill techniques regularly. Position before submission!';
    }
}

function displayAIResponse(html) {
    const container = document.getElementById('aiResponse');
    container.innerHTML = html;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===== Utility Functions =====
function getWorkoutIcon(type) {
    // Icons removed - using clean design without emojis
    return '';
}

function formatWorkoutType(type) {
    const names = {
        'bjj': 'BJJ Session',
        'weights': 'Weight Training',
        'competition': 'Competition',
        'private': 'Private Lesson'
    };
    return names[type] || type;
}

function formatCategory(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--success-color);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: slideUp 0.3s ease-in-out;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-in-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make functions globally available
window.showLogWorkout = showLogWorkout;
window.closeModal = closeModal;
window.navigateTo = navigateTo;
window.showProgram = showProgram;
window.hideProgram = hideProgram;
window.startTimer = startTimer;
window.askAI = askAI;
window.sendAIMessage = sendAIMessage;
