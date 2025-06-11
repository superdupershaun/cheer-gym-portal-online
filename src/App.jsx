<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cheer Gym Portal</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Custom styles not covered by Tailwind, or overrides */
        body {
            font-family: 'Inter', sans-serif;
        }
        /* Specific styles for hide/show */
        .hidden {
            display: none !important;
        }
        /* Style for scrollable lists in modal and profile */
        .max-h-40-overflow-auto {
            max-height: 10rem; /* 160px */
            overflow-y: auto;
        }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 font-sans text-gray-900 flex flex-col">
    <div id="app" class="flex flex-col min-h-screen">
        <!-- Header and Mode Switcher -->
        <header class="bg-white shadow-md p-4 flex flex-col sm:flex-row items-center justify-between rounded-b-xl mx-2 mt-2">
            <h1 class="text-3xl font-extrabold text-blue-800 mb-2 sm:mb-0">Cheer Gym Portal</h1>
            <div class="flex space-x-4">
                <button id="checkInModeBtn" class="px-6 py-2 rounded-lg font-semibold transition duration-300 ease-in-out">
                    Check-In
                </button>
                <button id="coachModeBtn" class="px-6 py-2 rounded-lg font-semibold transition duration-300 ease-in-out">
                    Coach Dashboard
                </button>
            </div>
        </header>

        <!-- User ID Display -->
        <div id="userIdDisplay" class="bg-gray-700 text-white text-xs p-2 text-center rounded-b-lg mx-2 mb-2 shadow-inner hidden">
            <p class="font-mono">User ID: <span id="currentUserId" class="font-bold"></span></p>
        </div>

        <!-- Main Content Area -->
        <main class="flex-grow p-4">
            <div id="loadingSpinner" class="flex items-center justify-center min-h-[600px] bg-gray-100 rounded-lg shadow-md hidden">
                <div class="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p class="mt-4 text-gray-700">Loading application...</p>
                </div>
            </div>

            <div id="checkInPortalContainer" class="hidden"></div>
            <div id="coachDashboardContainer" class="hidden"></div>
        </main>

        <!-- Generic Modal for custom alerts -->
        <div id="modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 hidden">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
                <p id="modalMessage" class="text-lg font-semibold text-gray-800 mb-4"></p>
                <div class="flex justify-center space-x-4">
                    <button id="modalConfirmBtn" class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200">
                        OK
                    </button>
                    <button id="modalCancelBtn" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200 hidden">
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <!-- Confirmation/Input Modal -->
        <div id="confirmModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 hidden">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
                <p id="confirmModalMessage" class="text-lg font-semibold text-gray-800 mb-4"></p>
                <input
                    type="password"
                    id="confirmModalInput"
                    class="w-full p-2 border border-gray-300 rounded-md mb-4 text-center"
                    placeholder="Enter passcode"
                />
                <div class="flex justify-center space-x-4">
                    <button id="confirmModalConfirmBtn" class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200">
                        Confirm
                    </button>
                    <button id="confirmModalCancelBtn" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200">
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <!-- Add Manual Check-in Modal -->
        <div id="addManualCheckinModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 hidden">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                <h4 class="text-xl font-semibold text-gray-800 mb-4 text-center">Add Manual Check-in</h4>
                <div class="mb-4">
                    <label for="manualAthlete" class="block text-sm font-medium text-gray-700 mb-1">Athlete</label>
                    <select
                        id="manualAthlete"
                        class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select Athlete</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label for="manualCategory" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        id="manualCategory"
                        class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="team">Team</option>
                        <option value="class">Class</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label for="manualEntity" class="block text-sm font-medium text-gray-700 mb-1">Team/Class Name</label>
                    <select
                        id="manualEntity"
                        class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select Team/Class</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label for="manualTimestamp" class="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
                    <input
                        type="datetime-local"
                        id="manualTimestamp"
                        class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div class="flex justify-end space-x-4">
                    <button id="manualCheckinCancelBtn" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200">
                        Cancel
                    </button>
                    <button id="manualCheckinConfirmBtn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200">
                        Add Check-in
                    </button>
                </div>
            </div>
        </div>

    </div>

    <!-- Firebase SDKs -->
    <script type="module">
        // Firebase Imports
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, setDoc, updateDoc, collection, query, onSnapshot, Timestamp, writeBatch, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // =====================================
        // Global Variables and Constants
        // =====================================
        let firebaseApp;
        let db;
        let auth;
        let userId = null;
        let isAuthReady = false;
        let athletes = [];
        let coaches = [];
        let currentDailyCheckins = [];

        // --- IMPORTANT: Firebase Configuration for GitHub Pages ---
        // For deploying to GitHub Pages, you MUST hardcode your Firebase project config here.
        // The __app_id and __firebase_config variables are ONLY injected by the Canvas environment.
        const myFirebaseConfig = {
           apiKey: "AIzaSyCCS1fFfmH4Y4tXn6Rv7w4baNYrz5VSFLg",
  authDomain: "gym-check-in-d1bf5.firebaseapp.com",
  projectId: "gym-check-in-d1bf5",
  storageBucket: "gym-check-in-d1bf5.firebasestorage.app",
  messagingSenderId: "667813844333",
  appId: "1:667813844333:web:84e6746664e0540c933664",
  measurementId: "G-K7WD5R8DDB"
        };

        const firebaseConfig = myFirebaseConfig;
        const appId = firebaseConfig.projectId; // Use projectId as the application ID for consistency

        // UI State Variables (managed directly via global vars and DOM updates)
        let appMode = 'checkIn'; // 'checkIn' or 'coach'

        // Modals
        let showModal = false;
        let modalMessage = '';
        let modalCallback = null;
        let showConfirmModal = false;
        let confirmModalConfig = { message: '', onConfirm: null, onCancel: null, input: false, inputValue: '' };
        let showAddManualCheckinModal = false;
        let manualCheckinAthleteId = '';
        let manualCheckinCategory = 'team';
        let manualCheckinEntity = '';
        let manualCheckinTimestamp = '';

        // Coach Dashboard specific UI state
        let coachView = 'roster'; // 'roster', 'profiles', 'management', 'checkinLogs'
        let coachRosterCategory = null; // Stores selected category for coach roster view
        let coachRosterName = null; // Stores selected name for coach roster view


        // Check-in Portal specific UI state
        let selectedCategory = null; // 'team' or 'class' (for check-in portal)
        let selectedName = null; // The specific team/class name (for check-in portal)
        let checkInMessage = '';
        let checkInMessageTimeoutRef = null;
        let holdingAthleteId = null;
        let holdProgressMap = {};
        let holdIntervalRefs = {};
        const CHECK_IN_HOLD_DURATION_SECONDS = 1;

        // Coach Dashboard Reset Button Hold state
        let isHoldingReset = false;
        let holdProgress = 0;
        let holdIntervalRef = null;
        const RESET_HOLD_DURATION_SECONDS = 5;

        // Athlete Profile specific UI state
        let searchTerm = '';
        let editingAthlete = null; // Object of athlete being edited/added
        let viewingAthlete = null; // Object of athlete being viewed (read-only)
        let isAddingNewAthlete = false;
        let newSkillName = '';
        let newSkillStatus = 'Not Started';
        let newNote = '';
        let selectedCoachForNote = '';
        let addedByCoach = ''; // For new athlete form

        // Coach Management specific UI state for new coach form
        let newCoachName = '';
        let newCoachEmail = '';
        let newCoachPhone = '';
        let newCoachTeams = [];
        let newCoachClasses = [];
        let editingCoach = null; // Object of coach being edited

        // Camera states
        let cameraMode = false;
        let stream = null;
        let cameraLoading = false;
        let videoElement = null; // Reference to the video element
        let canvasElement = null; // Reference to the canvas element

        // Checkin Logs specific UI state
        let checkinLogs = [];
        let editingLogEntryId = null;
        let currentLogAthletes = []; // Athletes within the currently edited log entry
        let filterAthleteName = '';
        let filterStatus = 'All';
        let filterCategory = 'All';
        let filterEntity = 'All';

        const MASTER_PASSCODE = "cheer123";

        // Initial Data for Teams and Classes
        const teams = ['Sparkle Squad', 'Power Pumas', 'Victory Vipers', 'Cheer Comets'];
        const classes = ['Tumble Basics', 'Jump & Stunt Drills', 'Flexibility Fusion', 'Routine Polish'];

        // Dummy Athlete Data for Seeding
        const dummyAthletes = [
            {
                name: 'Alice Smith',
                teams: ['Sparkle Squad'],
                classes: ['Tumble Basics', 'Flexibility Fusion'],
                skills: [
                    { name: 'Back Handspring', status: 'Mastered' },
                    { name: 'Toe Touch', status: 'Working On' },
                ],
                improvementAreas: 'Needs consistency in back handsprings.',
                coachNotes: [],
                parentName: 'Brenda Smith',
                parentPhone: '555-111-2222',
                parentEmail: 'brenda.s@example.com',
                emergencyContactName: 'David Smith',
                emergencyContactPhone: '555-111-3333',
                isApproved: true,
                addedByCoach: 'System',
                profilePicture: null,
            },
            {
                name: 'Bob Johnson',
                teams: ['Power Pumas'],
                classes: ['Jump & Stunt Drills'],
                skills: [
                    { name: 'Full Twist', status: 'Needs Improvement' },
                    { name: 'Double Toe Touch', status: 'Not Started' },
                ],
                improvementAreas: 'Struggles with coordination in stunts.',
                coachNotes: [],
                parentName: 'Carol Johnson',
                parentPhone: '555-222-3333',
                parentEmail: 'carol.j@example.com',
                emergencyContactName: '',
                emergencyContactPhone: '',
                isApproved: true,
                addedByCoach: 'System',
                profilePicture: null,
            },
            {
                name: 'Charlie Brown',
                teams: ['Sparkle Squad', 'Cheer Comets'],
                classes: ['Tumble Basics'],
                skills: [
                    { name: 'Standing Tuck', status: 'Working On' },
                    { name: 'Pike Jump', status: 'Mastered' },
                ],
                improvementAreas: 'Needs more power in standing tuck for consistent landing.',
                coachNotes: [],
                parentName: 'Diana Brown',
                parentPhone: '555-333-4444',
                parentEmail: 'diana.b@example.com',
                emergencyContactName: 'Evan Brown',
                emergencyContactPhone: '555-333-5555',
                isApproved: true,
                addedByCoach: 'System',
                profilePicture: null,
            },
            {
                name: 'Dana White',
                teams: ['Victory Vipers'],
                classes: ['Routine Polish', 'Flexibility Fusion'],
                skills: [
                    { name: 'Scorpion', status: 'Mastered' },
                    { name: 'Switch Kick', status: 'Working On' },
                ],
                improvementAreas: 'Maintain height on switch kicks.',
                coachNotes: [],
                parentName: 'Frank White',
                parentPhone: '555-444-5555',
                parentEmail: 'frank.w@example.com',
                emergencyContactName: '',
                emergencyContactPhone: '',
                isApproved: true,
                addedByCoach: 'System',
                profilePicture: null,
            },
            {
                name: 'Eve Green',
                teams: ['Power Pumas'],
                classes: ['Jump & Stunt Drills'],
                skills: [
                    { name: 'Basket Toss', status: 'Working On' },
                    { name: 'Heel Stretch', status: 'Mastered' },
                ],
                improvementAreas: 'Needs to trust her bases more for stunts.',
                coachNotes: [],
                parentName: 'George Green',
                parentPhone: '555-555-6666',
                parentEmail: 'george.g@example.com',
                emergencyContactName: '',
                emergencyContactPhone: '',
                isApproved: true,
                addedByCoach: 'System',
                profilePicture: null,
            },
        ];

        // Dummy Coach Data for Seeding
        const dummyCoaches = [
            { name: 'Coach Alex', email: 'alex@example.com', phone: '555-001-0001', isApproved: true, teams: ['Sparkle Squad', 'Power Pumas'], classes: ['Tumble Basics'], firebaseUid: '' },
            { name: 'Coach Ben', email: 'ben@example.com', phone: '555-002-0002', isApproved: true, teams: ['Victory Vipers'], classes: ['Jump & Stunt Drills', 'Routine Polish'], firebaseUid: '', isSuperAdmin: false },
            { name: 'Coach Casey', email: 'casey@example.com', phone: '555-003-0003', isApproved: true, teams: ['Cheer Comets'], classes: ['Flexibility Fusion'], firebaseUid: '', isSuperAdmin: false },
            { name: 'Coach Dylan', email: 'dylan@example.com', phone: '555-004-0004', isApproved: true, teams: [], classes: [], firebaseUid: '', isSuperAdmin: false },
        ];


        // =====================================
        // Helper Functions
        // =====================================

        /**
         * Formats a given phone number string into '###-###-####' format.
         * @param {string} value The raw phone number string.
         * @returns {string} The formatted phone number.
         */
        const formatPhoneNumber = (value) => {
            if (!value) return value;
            const phoneNumber = String(value).replace(/[^\d]/g, ''); // Remove non-digits, ensure string
            const phoneNumberLength = phoneNumber.length;

            if (phoneNumberLength < 4) return phoneNumber;
            if (phoneNumberLength < 7) {
                return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
            }
            return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
        };

        /**
         * Formats a Date object or Firestore Timestamp to a string suitable for datetime-local input (YYYY-MM-DDTHH:mm).
         * @param {Date | Timestamp | null} dateInput The Date object or Firestore Timestamp.
         * @returns {string} The formatted date-time string, or empty string if input is null.
         */
        const formatToDatetimeLocal = (dateInput) => {
            if (!dateInput) return '';
            let date;
            if (dateInput instanceof Timestamp) {
                date = dateInput.toDate();
            } else if (dateInput instanceof Date) {
                date = dateInput;
            } else {
                return '';
            }

            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        /**
         * Clones a Firestore Timestamp object or converts a Date to Timestamp.
         * This is necessary because Firestore Timestamps are immutable.
         * @param {Timestamp | Date} time
         * @returns {Timestamp} A new Timestamp object.
         */
        const cloneTimestamp = (time) => {
            if (time instanceof Timestamp) {
                return new Timestamp(time.seconds, time.nanoseconds);
            } else if (time instanceof Date) {
                return Timestamp.fromDate(time);
            }
            return null;
        };


        // =====================================
        // Modal Functions (Generic Alert and Confirm/Input)
        // =====================================

        const showCustomModal = (message, onConfirmCallback = null, showCancelButton = false, onCancelCallback = null) => {
            modalMessage = message;
            modalCallback = onConfirmCallback;
            showModal = true;

            const modalElement = document.getElementById('modal');
            const modalMessageElement = document.getElementById('modalMessage');
            const modalConfirmBtn = document.getElementById('modalConfirmBtn');
            const modalCancelBtn = document.getElementById('modalCancelBtn');

            modalMessageElement.textContent = modalMessage;

            modalConfirmBtn.onclick = () => {
                showModal = false;
                modalElement.classList.add('hidden');
                if (modalCallback) modalCallback();
            };

            if (showCancelButton) {
                modalCancelBtn.classList.remove('hidden');
                modalCancelBtn.onclick = () => {
                    showModal = false;
                    modalElement.classList.add('hidden');
                    if (onCancelCallback) onCancelCallback();
                };
            } else {
                modalCancelBtn.classList.add('hidden');
            }

            modalElement.classList.remove('hidden');
        };

        const showConfirmWithInputModal = (message, onConfirmCallback, onCancelCallback, inputPlaceholder = '') => {
            showConfirmModal = true;
            confirmModalConfig = {
                message: message,
                onConfirm: onConfirmCallback,
                onCancel: onCancelCallback,
                input: true,
                inputValue: '',
                inputPlaceholder: inputPlaceholder
            };

            const confirmModalElement = document.getElementById('confirmModal');
            const confirmModalMessageElement = document.getElementById('confirmModalMessage');
            const confirmModalInput = document.getElementById('confirmModalInput');
            const confirmModalConfirmBtn = document.getElementById('confirmModalConfirmBtn');
            const confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');

            confirmModalMessageElement.textContent = confirmModalConfig.message;
            confirmModalInput.value = confirmModalConfig.inputValue; // Clear previous input
            confirmModalInput.placeholder = confirmModalConfig.inputPlaceholder || 'Enter value';
            confirmModalInput.type = 'password'; // Always password for security

            confirmModalInput.focus(); // Auto-focus

            confirmModalInput.oninput = (e) => {
                confirmModalConfig.inputValue = e.target.value;
            };

            confirmModalConfirmBtn.onclick = () => {
                showConfirmModal = false;
                confirmModalElement.classList.add('hidden');
                if (confirmModalConfig.onConfirm) confirmModalConfig.onConfirm(confirmModalConfig.inputValue);
            };

            confirmModalCancelBtn.onclick = () => {
                showConfirmModal = false;
                confirmModalElement.classList.add('hidden');
                if (confirmModalConfig.onCancel) confirmModalConfig.onCancel();
            };

            confirmModalElement.classList.remove('hidden');
        };

        // =====================================
        // Firebase Initialization and Data Fetching
        // =====================================

        // Seed initial athlete data
        const seedInitialData = async () => {
            if (!db || !userId || !appId) {
                console.error("Seed Data Error: db, userId, or appId not ready.", {db, userId, appId});
                return;
            }
            const athletesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/athletes`);
            try {
                const batch = writeBatch(db);
                for (const athlete of dummyAthletes) {
                    const docRef = doc(athletesCollectionRef, athlete.name.replace(/\s+/g, '-').toLowerCase());
                    const { isCheckedIn, lastCheckInType, lastCheckInEntity, lastCheckInTimestamp, ...athleteToSave } = athlete;
                    batch.set(docRef, athleteToSave);
                }
                await batch.commit();
                console.log("Initial athlete data seeded successfully!");
            } catch (error) {
                console.error("Error seeding athlete data:", error);
                showCustomModal(`Failed to seed initial athlete data: ${error.message}`);
            }
        };

        // Seed initial coach data
        const seedInitialCoachData = async () => {
            if (!db || !userId || !appId) {
                console.error("Seed Coach Data Error: db, userId, or appId not ready.", {db, userId, appId});
                return;
            }
            const coachesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/coaches`);
            try {
                const batch = writeBatch(db);
                for (const coach of dummyCoaches) {
                    const docRef = doc(coachesCollectionRef, coach.name.replace(/\s+/g, '-').toLowerCase());
                    batch.set(docRef, coach);
                }
                await batch.commit();
                console.log("Initial coach data seeded successfully!");
            } catch (error) {
                console.error("Error seeding coach data:", error);
                showCustomModal(`Failed to seed initial coach data: ${error.message}`);
            }
        };

        const setupFirebaseListeners = () => {
            if (!db || !userId || !appId) {
                console.warn("Skipping Firebase listeners setup: db, userId, or appId not ready.", {db, userId, appId});
                return;
            }

            // Athletes Listener
            const athletesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/athletes`);
            onSnapshot(query(athletesCollectionRef), async (snapshot) => {
                if (snapshot.empty) {
                    console.log("No athletes found, seeding initial data...");
                    await seedInitialData();
                } else {
                    athletes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log("Athletes loaded:", athletes.length); // Diagnostic log
                }
                renderApp(); // Re-render application after data update
            }, (error) => {
                console.error("Error fetching athletes:", error);
                showCustomModal(`Failed to fetch athletes: ${error.message}`);
            });

            // Coaches Listener
            const coachesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/coaches`);
            onSnapshot(query(coachesCollectionRef), async (snapshot) => {
                if (snapshot.empty) {
                    console.log("No coaches found, seeding initial coach data...");
                    await seedInitialCoachData();
                } else {
                    coaches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log("Coaches loaded:", coaches.length); // Diagnostic log
                }
                renderApp(); // Re-render application after data update
            }, (error) => {
                console.error("Error fetching coaches:", error);
                showCustomModal(`Failed to fetch coaches: ${error.message}`);
            });

            // Current Daily Check-ins Listener
            const currentCheckinsRef = collection(db, `artifacts/${appId}/users/${userId}/current_daily_checkins`);
            onSnapshot(query(currentCheckinsRef), (snapshot) => {
                currentDailyCheckins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log("Current daily check-ins loaded:", currentDailyCheckins.length);
                renderCheckInPortal(); // Only re-render check-in section for efficiency
                if (coachView === 'roster') { // Only update roster view if it's currently active
                    renderRosterView(document.getElementById('coachViewContent'));
                }
            }, (error) => {
                console.error("Error fetching current daily check-ins:", error);
                showCustomModal(`Failed to fetch current daily check-ins: ${error.message}`);
            });

            // Check-in Logs Listener
            const logsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/checkin_logs`);
            onSnapshot(query(logsCollectionRef), (snapshot) => {
                checkinLogs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate(), // Convert Firestore Timestamp to Date object
                })).sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
                console.log("Check-in logs loaded:", checkinLogs.length);
                renderCheckinLogsView(); // Re-render check-in logs view
            }, (error) => {
                console.error("Error fetching check-in logs:", error);
                showCustomModal(`Failed to fetch check-in logs: ${error.message}`);
            });
        };

        const initializeFirebase = async () => {
            try {
                console.log("Attempting to initialize Firebase with config:", firebaseConfig);
                firebaseApp = initializeApp(firebaseConfig);
                db = getFirestore(firebaseApp);
                auth = getAuth(firebaseApp);

                onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        userId = user.uid;
                        document.getElementById('currentUserId').textContent = userId;
                        document.getElementById('userIdDisplay').classList.remove('hidden');
                        console.log("Firebase Auth State: User logged in with UID:", userId); // Diagnostic log
                    } else {
                        try {
                            // On GitHub Pages, __initial_auth_token will be undefined.
                            // We explicitly sign in anonymously.
                            await signInAnonymously(auth);
                            console.log("Firebase Auth State: Signed in anonymously. New UID:", auth.currentUser?.uid); // Diagnostic log
                        } catch (error) {
                            console.error("Firebase Auth Error: Failed to sign in anonymously:", error);
                            showCustomModal(`Authentication failed: ${error.message}. Please try again.`);
                        }
                    }
                    isAuthReady = true;
                    document.getElementById('loadingSpinner').classList.add('hidden'); // Hide loading spinner
                    setupFirebaseListeners(); // Start listening to data
                    renderApp(); // Initial render of the app content
                    console.log("Firebase initialized and listeners set up. App rendering."); // Diagnostic log
                });
            } catch (error) {
                console.error("Firebase Initialization Error:", error);
                showCustomModal(`Failed to initialize Firebase: ${error.message}. Please ensure your firebaseConfig is correct and filled in the HTML file.`);
                isAuthReady = true; // Still set true to stop loading UI
                document.getElementById('loadingSpinner').classList.add('hidden');
                renderApp(); // Render what can be rendered, possibly an error state
            }
        };

        // =====================================
        // UI Rendering Functions
        // =====================================

        const renderApp = () => {
            console.log("renderApp called. Current appMode:", appMode); // Diagnostic log
            // Update mode buttons
            const checkInModeBtn = document.getElementById('checkInModeBtn');
            const coachModeBtn = document.getElementById('coachModeBtn');

            checkInModeBtn.className = `px-6 py-2 rounded-lg font-semibold transition duration-300 ease-in-out ${
                appMode === 'checkIn' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
            }`;
            coachModeBtn.className = `px-6 py-2 rounded-lg font-semibold transition duration-300 ease-in-out ${
                appMode === 'coach' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
            }`;

            // Show/hide main containers
            document.getElementById('checkInPortalContainer').classList.toggle('hidden', appMode !== 'checkIn');
            document.getElementById('coachDashboardContainer').classList.toggle('hidden', appMode !== 'coach');

            // Render specific views based on appMode
            if (appMode === 'checkIn') {
                renderCheckInPortal();
            } else if (appMode === 'coach') {
                renderCoachDashboard();
            }

            // Show/hide loading spinner based on auth readiness
            document.getElementById('loadingSpinner').classList.toggle('hidden', isAuthReady);
        };


        // --- CheckInPortal Component Rendering ---
        const renderCheckInPortal = () => {
            const container = document.getElementById('checkInPortalContainer');
            if (!container) {
                console.error("CheckInPortalContainer not found!");
                return;
            }
            console.log("Rendering Check-in Portal. selectedCategory:", selectedCategory, "selectedName:", selectedName); // Diagnostic log

            // Clear previous content
            container.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto min-h-[600px] flex flex-col">
                    <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">Athlete Check-In</h2>
                    <div id="checkInMessageDisplay" class="hidden bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative text-center mb-4 transition-all duration-300 ease-in-out">
                        <p class="font-semibold"></p>
                    </div>
                    <div id="checkInContent" class="flex-grow flex flex-col"></div>
                </div>
            `;

            const checkInContentDiv = container.querySelector('#checkInContent');
            const checkInMessageDisplay = container.querySelector('#checkInMessageDisplay');
            const checkInMessageP = checkInMessageDisplay.querySelector('p');

            if (checkInMessage) {
                checkInMessageP.textContent = checkInMessage;
                checkInMessageDisplay.classList.remove('hidden');
            } else {
                checkInMessageDisplay.classList.add('hidden');
            }

            // If no category is selected (initial state, or after "Back to Categories")
            if (!selectedCategory || !selectedName) { // Ensure both are null/empty to show category selection
                checkInContentDiv.innerHTML = `
                    <p class="text-xl text-center text-gray-700 mb-6">Select your Team or Class:</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 flex-grow">
                        <div class="bg-blue-50 p-4 rounded-lg shadow-inner">
                            <h3 class="text-2xl font-semibold text-blue-700 mb-4 text-center">Teams</h3>
                            <div id="teamButtons" class="flex flex-wrap gap-3 justify-center"></div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg shadow-inner">
                            <h3 class="text-2xl font-semibold text-purple-700 mb-4 text-center">Classes</h3>
                            <div id="classButtons" class="flex flex-wrap gap-3 justify-center"></div>
                        </div>
                    </div>
                    ${(teams.length === 0 && classes.length === 0) ? `<p class="text-center text-gray-600 text-lg mt-4">No teams or classes defined yet. Please add them in the Coach Dashboard.</p>` : ''}
                `;
                const teamButtonsDiv = container.querySelector('#teamButtons');
                teams.forEach(team => {
                    const button = document.createElement('button');
                    button.textContent = team;
                    button.className = 'flex-grow px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transform hover:scale-105 transition duration-300 ease-in-out font-semibold text-lg';
                    button.onclick = () => {
                        selectedCategory = 'team';
                        selectedName = team;
                        renderCheckInPortal(); // This recursive call will now hit the 'else' block
                    };
                    teamButtonsDiv.appendChild(button);
                });

                const classButtonsDiv = container.querySelector('#classButtons');
                classes.forEach(cls => {
                    const button = document.createElement('button');
                    button.textContent = cls;
                    button.className = 'flex-grow px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transform hover:scale-105 transition duration-300 ease-in-out font-semibold text-lg';
                    button.onclick = () => {
                        selectedCategory = 'class';
                        selectedName = cls;
                        renderCheckInPortal(); // This recursive call will now hit the 'else' block
                    };
                    classButtonsDiv.appendChild(button);
                });

            } else { // A category and name are already selected, so render the roster for it
                const currentApprovedAthletes = athletes.filter(athlete => athlete.isApproved);
                const categoryKey = selectedCategory === 'team' ? 'teams' : 'classes';
                const filtered = currentApprovedAthletes.filter(athlete =>
                    athlete[categoryKey] && athlete[categoryKey].includes(selectedName)
                ).sort((a, b) => a.name.localeCompare(b.name));

                checkInContentDiv.innerHTML = `
                    <button id="backToCategoriesBtn" class="self-start mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M12.707 14.707a1 1 0 01-1.414 0L7.293 10.707a1 1 0 010-1.414l3.999-3.999a1 1 0 011.414 1.414L9.414 10l3.293 3.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                        </svg>
                        Back to Categories
                    </button>
                    <h3 class="text-2xl font-bold text-center text-gray-800 mb-6">${selectedName} Roster</h3>
                    <p class="text-sm text-gray-600 text-center mb-4">Hold an athlete's name for ${CHECK_IN_HOLD_DURATION_SECONDS} second to check them in.</p>
                    <ul id="athleteRosterList" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto flex-grow"></ul>
                `;

                container.querySelector('#backToCategoriesBtn').onclick = () => {
                    selectedCategory = null; // Reset to null to show category selection
                    selectedName = null; // Reset name as well
                    checkInMessage = '';
                    renderCheckInPortal(); // Re-render to go back to category view
                };

                const athleteRosterList = container.querySelector('#athleteRosterList');
                if (filtered.length === 0) {
                    athleteRosterList.innerHTML = `<p class="text-center text-gray-600 text-lg">No athletes assigned to this ${selectedCategory} yet.</p>`;
                } else {
                    filtered.forEach(athlete => {
                        const listItem = document.createElement('li');
                        listItem.className = 'relative';

                        const progress = holdProgressMap[athlete.id] || 0;
                        const isHolding = holdingAthleteId === athlete.id;
                        const progressWidth = (progress / CHECK_IN_HOLD_DURATION_SECONDS) * 100;

                        const hasCheckedInForThisEntity = currentDailyCheckins.some(
                            checkin => checkin.athleteId === athlete.id &&
                                       checkin.checkInType === selectedCategory &&
                                       checkin.checkInEntity === selectedName
                        );

                        listItem.innerHTML = `
                            <button
                                data-athlete-id="${athlete.id}"
                                data-athlete-name="${athlete.name}"
                                class="relative w-full px-6 py-4 rounded-xl shadow-md text-center font-semibold text-xl transition-all duration-300 ease-in-out
                                ${hasCheckedInForThisEntity
                                    ? 'bg-green-500 text-white transform scale-105 shadow-lg'
                                    : 'bg-indigo-500 text-white hover:bg-indigo-600 transform hover:scale-105'
                                }"
                            >
                                <div class="absolute inset-0 bg-blue-400 opacity-50" style="width: ${isHolding ? progressWidth : 0}%; transition: width 0.1s linear;"></div>
                                <span class="relative z-10">
                                    ${athlete.name}
                                    ${isHolding && progress > 0 ? `<span class="ml-2 text-sm">(${CHECK_IN_HOLD_DURATION_SECONDS - progress}s)</span>` : ''}
                                    ${hasCheckedInForThisEntity ? `
                                    <span class="absolute top-2 right-2 text-green-800 bg-white rounded-full p-1 text-xs font-bold shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                        </svg>
                                    </span>
                                    ` : ''}
                                </span>
                            </button>
                        `;
                        const athleteButton = listItem.querySelector('button');

                        // Event Listeners for hold-to-check-in
                        const handleMouseDown = () => {
                            if (holdingAthleteId === athlete.id) return; // Prevent multiple holds
                            holdingAthleteId = athlete.id;
                            holdProgressMap[athlete.id] = 0;
                            if (holdIntervalRefs[athlete.id]) {
                                clearInterval(holdIntervalRefs[athlete.id]);
                            }
                            holdIntervalRefs[athlete.id] = setInterval(() => {
                                holdProgressMap[athlete.id]++;
                                if (holdProgressMap[athlete.id] >= CHECK_IN_HOLD_DURATION_SECONDS) {
                                    clearInterval(holdIntervalRefs[athlete.id]);
                                    delete holdIntervalRefs[athlete.id];
                                    handleAthleteCheckIn(athlete.id, athlete.name);
                                    holdingAthleteId = null; // Clear holding state
                                    holdProgressMap[athlete.id] = 0; // Reset for visual feedback
                                }
                                renderCheckInPortal(); // Re-render to show progress
                            }, 1000);
                            renderCheckInPortal(); // Initial render to show hold start
                        };

                        const handleMouseUpLeave = () => {
                            if (holdIntervalRefs[athlete.id]) {
                                clearInterval(holdIntervalRefs[athlete.id]);
                                delete holdIntervalRefs[athlete.id];
                            }
                            holdingAthleteId = null;
                            holdProgressMap[athlete.id] = 0; // Reset progress on release
                            renderCheckInPortal(); // Re-render to clear progress bar
                        };

                        athleteButton.onmousedown = handleMouseDown;
                        athleteButton.onmouseup = handleMouseUpLeave;
                        athleteButton.onmouseleave = handleMouseUpLeave;
                        athleteButton.ontouchstart = handleMouseDown;
                        athleteButton.ontouchend = handleMouseUpLeave;
                        athleteButton.ontouchcancel = handleMouseUpLeave;

                        athleteRosterList.appendChild(listItem);
                    });
                }
            }
        };

        const handleAthleteCheckIn = async (athleteId, athleteName) => {
            if (!db || !userId || !appId) {
                console.error("Check-in Error: db, userId, or appId not ready.", {db, userId, appId});
                showCustomModal("Error: Database or App ID not ready for check-in.");
                return;
            }
            try {
                const currentCheckinsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/current_daily_checkins`);
                await setDoc(doc(currentCheckinsCollectionRef), {
                    athleteId: athleteId,
                    athleteName: athleteName,
                    checkInType: selectedCategory,
                    checkInEntity: selectedName,
                    timestamp: Timestamp.now(),
                });
                checkInMessage = `${athleteName} Checked In!`;
                if (checkInMessageTimeoutRef) {
                    clearTimeout(checkInMessageTimeoutRef);
                }
                checkInMessageTimeoutRef = setTimeout(() => {
                    checkInMessage = '';
                    renderCheckInPortal();
                }, 3000);
                renderCheckInPortal(); // Render immediately to show message
            } catch (error) {
                console.error("Error checking in athlete:", error);
                showCustomModal(`Failed to check in ${athleteName}: ${error.message}`);
            } finally {
                // Ensure hold state is cleared (though handleMouseUpLeave does this already)
                holdingAthleteId = null;
                holdProgressMap[athleteId] = 0;
                renderCheckInPortal(); // Final render to ensure UI is consistent
            }
        };

        // --- CoachDashboard Component Rendering ---
        const renderCoachDashboard = () => {
            const container = document.getElementById('coachDashboardContainer');
            if (!container) {
                console.error("CoachDashboardContainer not found!");
                return;
            }
            console.log("Rendering Coach Dashboard. Current coachView:", coachView); // Diagnostic log

            container.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-6 max-w-6xl mx-auto min-h-[600px] flex flex-col">
                    <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">Coach Dashboard</h2>
                    <div id="coachNavTabs" class="flex justify-center mb-6 space-x-4 flex-wrap gap-2">
                        <button id="rosterViewBtn" class="px-6 py-3 rounded-lg font-semibold transition duration-300 ease-in-out">Attendance View</button>
                        <button id="profilesViewBtn" class="px-6 py-3 rounded-lg font-semibold transition duration-300 ease-in-out">Athlete Profiles</button>
                        <button id="managementViewBtn" class="px-6 py-3 rounded-lg font-semibold transition duration-300 ease-in-out">Coach Management</button>
                        <button id="checkinLogsViewBtn" class="px-6 py-3 rounded-lg font-semibold transition duration-300 ease-in-out">Check-in Logs</button>
                        <button id="coachLogoutBtn" class="px-6 py-3 rounded-lg font-semibold bg-red-500 text-white shadow-lg hover:bg-red-600 transition duration-300 ease-in-out">Logout</button>
                    </div>

                    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                        <h4 class="text-xl font-semibold text-red-800 mb-2">Reset Daily Check-ins</h4>
                        <p class="text-gray-700 mb-3">Hold the button for ${RESET_HOLD_DURATION_SECONDS} seconds to reset all athletes' check-in status for the day. A log will be saved.</p>
                        <button id="resetCheckinsBtn" class="relative w-full px-8 py-3 rounded-lg font-bold text-white overflow-hidden transition-all duration-300 ease-in-out shadow-lg">
                            <div id="resetProgressBar" class="absolute top-0 left-0 h-full bg-red-400 opacity-50" style="width: 0%;"></div>
                            <span class="relative z-10">Hold to Reset Check-ins</span>
                        </button>
                    </div>

                    <div id="coachViewContent" class="flex-grow flex flex-col"></div>
                </div>
            `;

            // Setup navigation buttons
            container.querySelector('#rosterViewBtn').onclick = () => { coachView = 'roster'; renderCoachDashboard(); };
            container.querySelector('#profilesViewBtn').onclick = () => { coachView = 'profiles'; renderCoachDashboard(); };
            container.querySelector('#managementViewBtn').onclick = () => { coachView = 'management'; renderCoachDashboard(); };
            container.querySelector('#checkinLogsViewBtn').onclick = () => { coachView = 'checkinLogs'; renderCoachDashboard(); };
            container.querySelector('#coachLogoutBtn').onclick = handleCoachLogout;

            // Update nav button styles
            container.querySelector('#rosterViewBtn').classList.toggle('bg-indigo-600', coachView === 'roster');
            container.querySelector('#rosterViewBtn').classList.toggle('text-white', coachView === 'roster');
            container.querySelector('#rosterViewBtn').classList.toggle('shadow-lg', coachView === 'roster');
            container.querySelector('#rosterViewBtn').classList.toggle('bg-gray-200', coachView !== 'roster');
            container.querySelector('#rosterViewBtn').classList.toggle('text-gray-700', coachView !== 'roster');
            container.querySelector('#rosterViewBtn').classList.toggle('hover:bg-indigo-100', coachView !== 'roster');

            container.querySelector('#profilesViewBtn').classList.toggle('bg-indigo-600', coachView === 'profiles');
            container.querySelector('#profilesViewBtn').classList.toggle('text-white', coachView === 'profiles');
            container.querySelector('#profilesViewBtn').classList.toggle('shadow-lg', coachView === 'profiles');
            container.querySelector('#profilesViewBtn').classList.toggle('bg-gray-200', coachView !== 'profiles');
            container.querySelector('#profilesViewBtn').classList.toggle('text-gray-700', coachView !== 'profiles');
            container.querySelector('#profilesViewBtn').classList.toggle('hover:bg-indigo-100', coachView !== 'profiles');

            container.querySelector('#managementViewBtn').classList.toggle('bg-indigo-600', coachView === 'management');
            container.querySelector('#managementViewBtn').classList.toggle('text-white', coachView === 'management');
            container.querySelector('#managementViewBtn').classList.toggle('shadow-lg', coachView === 'management');
            container.querySelector('#managementViewBtn').classList.toggle('bg-gray-200', coachView !== 'management');
            container.querySelector('#managementViewBtn').classList.toggle('text-gray-700', coachView !== 'management');
            container.querySelector('#managementViewBtn').classList.toggle('hover:bg-indigo-100', coachView !== 'management');

            container.querySelector('#checkinLogsViewBtn').classList.toggle('bg-indigo-600', coachView === 'checkinLogs');
            container.querySelector('#checkinLogsViewBtn').classList.toggle('text-white', coachView === 'checkinLogs');
            container.querySelector('#checkinLogsViewBtn').classList.toggle('shadow-lg', coachView === 'checkinLogs');
            container.querySelector('#checkinLogsViewBtn').classList.toggle('bg-gray-200', coachView !== 'checkinLogs');
            container.querySelector('#checkinLogsViewBtn').classList.toggle('text-gray-700', coachView !== 'checkinLogs');
            container.querySelector('#checkinLogsViewBtn').classList.toggle('hover:bg-indigo-100', coachView !== 'checkinLogs');


            // Reset Check-ins Button Logic
            const resetCheckinsBtn = container.querySelector('#resetCheckinsBtn');
            const resetProgressBar = container.querySelector('#resetProgressBar');
            const resetBtnText = resetCheckinsBtn.querySelector('span');

            resetCheckinsBtn.className = `relative w-full px-8 py-3 rounded-lg font-bold text-white overflow-hidden transition-all duration-300 ease-in-out shadow-lg ${isHoldingReset ? 'bg-red-700' : 'bg-red-600 hover:bg-red-700'}`;
            resetProgressBar.style.width = `${(holdProgress / RESET_HOLD_DURATION_SECONDS) * 100}%`;
            resetBtnText.textContent = isHoldingReset ? `Holding... ${RESET_HOLD_DURATION_SECONDS - holdProgress}s` : 'Hold to Reset Check-ins';

            const handleResetMouseDown = () => {
                if (!db || !userId || !appId) { showCustomModal("Database or App ID not ready to reset check-ins."); return; }
                isHoldingReset = true;
                holdProgress = 0;
                if (holdIntervalRef) clearInterval(holdIntervalRef);
                holdIntervalRef = setInterval(() => {
                    holdProgress++;
                    if (holdProgress >= RESET_HOLD_DURATION_SECONDS) {
                        clearInterval(holdIntervalRef);
                        handleResetCheckIns();
                    }
                    renderCoachDashboard(); // Re-render to update progress bar
                }, 1000);
                renderCoachDashboard(); // Initial render to show hold start
            };
            const handleMouseUpLeave = () => {
                clearInterval(holdIntervalRef);
                isHoldingReset = false;
                holdProgress = 0;
                renderCoachDashboard(); // Re-render to reset progress bar
            };

            resetCheckinsBtn.onmousedown = handleResetMouseDown;
            resetCheckinsBtn.onmouseup = handleMouseUpLeave;
            resetCheckinsBtn.onmouseleave = handleMouseUpLeave;
            resetCheckinsBtn.ontouchstart = handleResetMouseDown;
            resetCheckinsBtn.ontouchend = handleMouseUpLeave;
            resetCheckinsBtn.ontouchcancel = handleMouseUpLeave;


            const coachViewContentDiv = container.querySelector('#coachViewContent');
            if (!coachViewContentDiv) {
                console.error("#coachViewContent not found inside CoachDashboardContainer!"); // Diagnostic log
                return;
            }
            console.log("coachViewContentDiv found. Proceeding to render sub-view: " + coachView); // Diagnostic log

            if (coachView === 'roster') {
                renderRosterView(coachViewContentDiv);
            } else if (coachView === 'profiles') {
                renderAthleteProfiles(coachViewContentDiv);
            } else if (coachView === 'management') {
                renderCoachManagement(coachViewContentDiv);
            } else if (coachView === 'checkinLogs') {
                renderCheckinLogsView(coachViewContentDiv);
            }
        };

        const handleCoachLogout = async () => {
            if (auth) {
                try {
                    await signOut(auth);
                    showCustomModal("You have been logged out.");
                    // No need to set coachLoggedIn, appMode will implicitly change by auth state.
                    appMode = 'checkIn'; // Go back to check-in view
                    renderApp();
                } catch (error) {
                    console.error("Error logging out:", error);
                    showCustomModal(`Failed to log out: ${error.message}`);
                }
            }
        };

        const handleResetCheckIns = async () => {
            if (!db || !userId || !appId) {
                console.error("Reset Check-ins Error: db, userId, or appId not ready.", {db, userId, appId});
                showCustomModal("Error: Database or App ID not ready for reset.");
                return;
            }
            try {
                const currentCheckinsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/current_daily_checkins`);
                const querySnapshot = await getDocs(query(currentCheckinsCollectionRef));
                const dailyCheckInEvents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const checkinLogRef = collection(db, `artifacts/${appId}/users/${userId}/checkin_logs`);
                await setDoc(doc(checkinLogRef), {
                    timestamp: Timestamp.now(),
                    resetByUserId: userId,
                    dailyCheckInEvents: dailyCheckInEvents.map(event => ({
                        athleteId: event.athleteId,
                        athleteName: event.athleteName,
                        checkInType: event.checkInType,
                        checkInEntity: event.checkInEntity,
                        timestamp: event.timestamp,
                    }))
                });

                const batch = writeBatch(db);
                querySnapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();

                showCustomModal("All daily check-ins have been reset and logged.");
            } catch (error) {
                console.error("Error resetting check-ins:", error);
                showCustomModal(`Failed to reset check-ins: ${error.message}`);
            } finally {
                isHoldingReset = false;
                holdProgress = 0;
                renderCoachDashboard();
            }
        };


        // --- RosterView Component Rendering ---
        const renderRosterView = (parentContainer) => {
            if (!parentContainer) return;

            // Initialize coachRosterCategory and coachRosterName if not already set or invalid
            if (!coachRosterCategory) {
                if (teams.length > 0) {
                    coachRosterCategory = 'team';
                    coachRosterName = teams[0];
                } else if (classes.length > 0) {
                    coachRosterCategory = 'class';
                    coachRosterName = classes[0];
                } else {
                    coachRosterCategory = 'team'; // Default, but no actual entity
                    coachRosterName = ''; // No entity if neither teams nor classes exist
                }
            } else {
                // Ensure selected coachRosterName is still valid for its category
                const currentEntities = coachRosterCategory === 'team' ? teams : classes;
                if (!currentEntities.includes(coachRosterName)) {
                    coachRosterName = currentEntities.length > 0 ? currentEntities[0] : '';
                }
            }

            console.log("Rendering Roster View. coachRosterCategory:", coachRosterCategory, "coachRosterName:", coachRosterName); // Diagnostic log
            console.log("Current athletes length:", athletes.length); // Diagnostic log

            const filteredAthletes = athletes.filter(athlete => {
                const categoryKey = coachRosterCategory === 'team' ? 'teams' : 'classes';
                // Only filter if coachRosterName is not empty and athlete has the category array
                return athlete.isApproved && coachRosterName && athlete[categoryKey] && athlete[categoryKey].includes(coachRosterName);
            }).sort((a, b) => a.name.localeCompare(b.name));

            parentContainer.innerHTML = `
                <div class="flex-grow flex flex-col p-4 bg-gray-50 rounded-lg shadow-inner">
                    <h3 class="text-2xl font-bold text-gray-700 mb-4 text-center">Attendance Overview (Today)</h3>
                    <div class="flex flex-col sm:flex-row justify-center items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-6">
                        <div class="flex space-x-3">
                            <button id="rosterViewTeamBtn" class="px-5 py-2 rounded-lg font-semibold">View Teams</button>
                            <button id="rosterViewClassBtn" class="px-5 py-2 rounded-lg font-semibold">View Classes</button>
                        </div>
                        <select id="rosterEntitySelect" class="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"></select>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white rounded-lg shadow overflow-hidden">
                            <thead class="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Athlete Name</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Last Check-in Time (Today)</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Activities Today</th>
                                </tr>
                            </thead>
                            <tbody id="rosterTableBody"></tbody>
                        </table>
                    </div>
                </div>
            `;

            const rosterViewTeamBtn = parentContainer.querySelector('#rosterViewTeamBtn');
            const rosterViewClassBtn = parentContainer.querySelector('#rosterViewClassBtn');
            const rosterEntitySelect = parentContainer.querySelector('#rosterEntitySelect');
            const rosterTableBody = parentContainer.querySelector('#rosterTableBody');

            rosterViewTeamBtn.className = `px-5 py-2 rounded-lg font-semibold ${coachRosterCategory === 'team' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`;
            rosterViewClassBtn.className = `px-5 py-2 rounded-lg font-semibold ${coachRosterCategory === 'class' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}`;

            rosterViewTeamBtn.onclick = () => { coachRosterCategory = 'team'; coachRosterName = teams[0] || ''; renderRosterView(parentContainer); };
            rosterViewClassBtn.onclick = () => { coachRosterCategory = 'class'; coachRosterName = classes[0] || ''; renderRosterView(parentContainer); };

            // Populate entity select
            rosterEntitySelect.innerHTML = ''; // Clear previous options
            const currentEntities = coachRosterCategory === 'team' ? teams : classes;
            if (currentEntities.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = `No ${coachRosterCategory === 'team' ? 'Teams' : 'Classes'} Available`;
                option.disabled = true;
                rosterEntitySelect.appendChild(option);
            } else {
                currentEntities.forEach(entity => {
                    const option = document.createElement('option');
                    option.value = entity;
                    option.textContent = entity;
                    rosterEntitySelect.appendChild(option);
                });
            }
            if (coachRosterName) {
                rosterEntitySelect.value = coachRosterName; // Re-set the selected value after populating
            } else if (currentEntities.length > 0) {
                 rosterEntitySelect.value = currentEntities[0]; // Default to first if coachRosterName was null or empty
                 coachRosterName = currentEntities[0]; // Update global state
            } else {
                rosterEntitySelect.value = ''; // Ensure nothing is selected if no options
            }


            rosterEntitySelect.onchange = (e) => {
                coachRosterName = e.target.value;
                renderRosterView(parentContainer);
            };

            if (filteredAthletes.length === 0) {
                rosterTableBody.innerHTML = `<tr><td colSpan="4" class="px-6 py-4 text-center text-gray-500">No athletes in this ${coachRosterCategory} matching filters.</td></tr>`;
            } else {
                rosterTableBody.innerHTML = ''; // Clear existing rows
                filteredAthletes.forEach(athlete => {
                    const athleteCheckinsToday = currentDailyCheckins.filter(
                        checkin => checkin.athleteId === athlete.id &&
                                   checkin.checkInType === coachRosterCategory &&
                                   checkin.checkInEntity === coachRosterName
                    ).sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());

                    const hasCheckedInForThisEntity = athleteCheckinsToday.length > 0;
                    const latestCheckin = hasCheckedInForThisEntity ? athleteCheckinsToday[0] : null;

                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50';
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${athlete.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                hasCheckedInForThisEntity ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }">
                                ${hasCheckedInForThisEntity ? 'Checked In' : 'Not Checked In'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${latestCheckin ? new Date(latestCheckin.timestamp.toDate()).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                            ${athleteCheckinsToday.map(checkin => `
                                <div class="text-xs">
                                    ${checkin.checkInEntity} at ${new Date(checkin.timestamp.toDate()).toLocaleTimeString()}
                                </div>
                            `).join('') || "No activities logged today for this category."}
                        </td>
                    `;
                    rosterTableBody.appendChild(row);
                });
            }
        };


        // --- CoachManagement Component Rendering ---
        const renderCoachManagement = (parentContainer) => {
            if (!parentContainer) return;
            console.log("Rendering Coach Management."); // Diagnostic log

            parentContainer.innerHTML = `
                <div class="flex-grow flex flex-col p-4 bg-gray-50 rounded-lg shadow-inner">
                    <h3 class="text-2xl font-bold text-gray-700 mb-4 text-center">Manage Coaches</h3>

                    <!-- Add/Edit Coach Form -->
                    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
                        <h4 class="text-xl font-semibold text-gray-800 mb-4" id="coachFormTitle">Add New Coach</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="coachName" class="block text-sm font-medium text-gray-700 mb-1">Coach Name</label>
                                <input type="text" id="coachName" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Coach Name" />
                            </div>
                            <div>
                                <label for="coachEmail" class="block text-sm font-medium text-gray-700 mb-1">Coach Email</label>
                                <input type="email" id="coachEmail" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="coach@example.com" />
                            </div>
                            <div>
                                <label for="coachPhone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input type="tel" id="coachPhone" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="###-###-####" />
                            </div>
                            <div class="md:col-span-2">
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Assigned Teams</label>
                                    <div id="coachTeamsTagsInput" class="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white min-h-[40px]"></div>
                                </div>
                            </div>
                            <div class="md:col-span-2">
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Assigned Classes</label>
                                    <div id="coachClassesTagsInput" class="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white min-h-[40px]"></div>
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-end space-x-4 mt-4">
                            <button id="coachFormCancelBtn" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-200 font-semibold hidden">Cancel</button>
                            <button id="coachFormSubmitBtn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-semibold">Add Coach</button>
                        </div>
                    </div>

                    <!-- Coaches List -->
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white rounded-lg shadow overflow-hidden">
                            <thead class="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Coach Name</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Teams</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Classes</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="coachesTableBody"></tbody>
                        </table>
                    </div>
                </div>
            `;

            const coachFormTitle = parentContainer.querySelector('#coachFormTitle');
            const coachNameInput = parentContainer.querySelector('#coachName');
            const coachEmailInput = parentContainer.querySelector('#coachEmail');
            const coachPhoneInput = parentContainer.querySelector('#coachPhone');
            const coachTeamsTagsInput = parentContainer.querySelector('#coachTeamsTagsInput');
            const coachClassesTagsInput = parentContainer.querySelector('#coachClassesTagsInput');
            const coachFormCancelBtn = parentContainer.querySelector('#coachFormCancelBtn');
            const coachFormSubmitBtn = parentContainer.querySelector('#coachFormSubmitBtn');
            const coachesTableBody = parentContainer.querySelector('#coachesTableBody');

            // Populate form based on editingCoach state
            if (editingCoach) {
                coachFormTitle.textContent = 'Edit Coach';
                coachNameInput.value = editingCoach.name || '';
                coachEmailInput.value = editingCoach.email || '';
                coachPhoneInput.value = formatPhoneNumber(editingCoach.phone || '');
                coachNameInput.readOnly = true;
                coachEmailInput.readOnly = true;
                coachPhoneInput.readOnly = true;
                coachFormCancelBtn.classList.remove('hidden');
                coachFormSubmitBtn.textContent = 'Update Coach';
            } else {
                coachFormTitle.textContent = 'Add New Coach';
                coachNameInput.value = newCoachName || '';
                coachEmailInput.value = newCoachEmail || '';
                coachPhoneInput.value = formatPhoneNumber(newCoachPhone || '');
                coachNameInput.readOnly = false;
                coachEmailInput.readOnly = false;
                coachPhoneInput.readOnly = false;
                coachFormCancelBtn.classList.add('hidden');
                coachFormSubmitBtn.textContent = 'Add Coach';
            }

            // Coach form input handlers
            coachNameInput.oninput = (e) => { if (editingCoach) editingCoach.name = e.target.value; else newCoachName = e.target.value; };
            coachEmailInput.oninput = (e) => { if (editingCoach) editingCoach.email = e.target.value; else newCoachEmail = e.target.value; };
            coachPhoneInput.oninput = (e) => {
                const formatted = formatPhoneNumber(e.target.value);
                if (editingCoach) editingCoach.phone = formatted; else newCoachPhone = formatted;
                e.target.value = formatted; // Update input value
            };

            // Render TagsInput components
            renderTagsInput(coachTeamsTagsInput, 'Assigned Teams', teams, editingCoach ? editingCoach.teams : newCoachTeams, (newSelection) => {
                if (editingCoach) editingCoach.teams = newSelection; else newCoachTeams = newSelection;
            }, !!editingCoach);

            renderTagsInput(coachClassesTagsInput, 'Assigned Classes', classes, editingCoach ? editingCoach.classes : newCoachClasses, (newSelection) => {
                if (editingCoach) editingCoach.classes = newSelection; else newCoachClasses = newSelection;
            }, !!editingCoach);

            coachFormCancelBtn.onclick = () => { editingCoach = null; newCoachName = ''; newCoachEmail = ''; newCoachPhone = ''; newCoachTeams = []; newCoachClasses = []; renderCoachManagement(parentContainer); };
            coachFormSubmitBtn.onclick = () => {
                if (editingCoach) {
                    handleUpdateCoach(parentContainer);
                } else {
                    handleAddCoach(parentContainer);
                }
            };

            // Populate coaches table
            if (coaches.length === 0) {
                coachesTableBody.innerHTML = `<tr><td colSpan="7" class="px-6 py-4 text-center text-gray-500">No coaches added yet.</td></tr>`;
            } else {
                coachesTableBody.innerHTML = ''; // Clear existing rows
                coaches.forEach(coach => {
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50';
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${coach.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${coach.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formatPhoneNumber(coach.phone)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            ${(coach.teams && coach.teams.length > 0) ? coach.teams.join(', ') : 'N/A'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            ${(coach.classes && coach.classes.length > 0) ? coach.classes.join(', ') : 'N/A'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                coach.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }">
                                ${coach.isApproved ? 'Approved' : 'Pending'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex flex-col space-y-2">
                                ${!coach.isApproved ? `<button class="text-green-600 hover:text-green-900 transition duration-200 text-left approve-coach-btn" data-coach-id="${coach.id}">Approve</button>` : ''}
                                <button class="text-indigo-600 hover:text-indigo-900 transition duration-200 text-left edit-coach-btn" data-coach-id="${coach.id}">Edit</button>
                                <button class="text-red-600 hover:text-red-900 transition duration-200 text-left delete-coach-btn" data-coach-id="${coach.id}">Delete</button>
                            </div>
                        </td>
                    `;
                    coachesTableBody.appendChild(row);
                });

                // Attach event listeners using delegation or by finding elements
                coachesTableBody.querySelectorAll('.approve-coach-btn').forEach(button => {
                    button.onclick = (e) => {
                        const coachId = e.target.dataset.coachId;
                        const coachToApprove = coaches.find(c => c.id === coachId);
                        if (coachToApprove) handleApproveCoach(coachToApprove);
                    };
                });
                coachesTableBody.querySelectorAll('.edit-coach-btn').forEach(button => {
                    button.onclick = (e) => {
                        const coachId = e.target.dataset.coachId;
                        const coachToEdit = coaches.find(c => c.id === coachId);
                        if (coachToEdit) handleEditCoach(coachToEdit);
                    };
                });
                coachesTableBody.querySelectorAll('.delete-coach-btn').forEach(button => {
                    button.onclick = (e) => {
                        const coachId = e.target.dataset.coachId;
                        const coachToDelete = coaches.find(c => c.id === coachId);
                        if (coachToDelete) handleDeleteCoach(coachToDelete);
                    };
                });
            }
        };

        const handleAddCoach = async (parentContainer) => {
            if (!db || !userId || !appId) {
                console.error("Add Coach Error: db, userId, or appId not ready.", {db, userId, appId});
                showCustomModal("Error: Database or App ID not ready to add coach.");
                return;
            }
            if (!newCoachName.trim() || !newCoachEmail.trim()) {
                showCustomModal("Coach Name and Email cannot be empty.");
                return;
            }

            showConfirmWithInputModal(
                "Enter MASTER passcode to add new coach:",
                async (enteredPasscode) => {
                    if (enteredPasscode === MASTER_PASSCODE) {
                        try {
                            const coachesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/coaches`);
                            // doc() with no argument will generate a new unique ID
                            const docRef = doc(coachesCollectionRef);
                            const coachData = {
                                // id: docRef.id, // Firestore automatically adds 'id' as a field if setDoc is used without specific ID, but docRef.id is good for consistency.
                                name: newCoachName.trim(),
                                email: newCoachEmail.trim(),
                                phone: newCoachPhone.trim(), // newCoachPhone should already be formatted by oninput
                                isApproved: false,
                                teams: newCoachTeams,
                                classes: newCoachClasses,
                                firebaseUid: '', // This would typically be populated upon a coach user logging in, but is left empty for now
                            };
                            console.log("Attempting to add coach with data:", coachData); // Diagnostic log
                            await setDoc(docRef, coachData);
                            console.log("Coach successfully added to Firestore with ID:", docRef.id); // Success log
                            showCustomModal("Coach added successfully to Firestore! Awaiting approval.");

                            // Clear form fields after successful add
                            newCoachName = '';
                            newCoachEmail = '';
                            newCoachPhone = ''; // Clear the formatted value too
                            newCoachTeams = [];
                            newCoachClasses = [];
                            renderCoachManagement(parentContainer); // Re-render the form
                        } catch (error) {
                            console.error("Error adding coach:", error);
                            showCustomModal(`Failed to add coach: ${error.message}`);
                        }
                    } else {
                        showCustomModal("Incorrect MASTER passcode. Coach not added.");
                    }
                },
                () => { /* do nothing on cancel */ }
            );
        };

        const handleEditCoach = (coach) => {
            showConfirmWithInputModal(
                "Enter MASTER passcode to edit coach:",
                (enteredPasscode) => {
                    if (enteredPasscode === MASTER_PASSCODE) {
                        editingCoach = { ...coach }; // Create a mutable copy
                        renderCoachManagement(document.getElementById('coachViewContent'));
                    } else {
                        showCustomModal("Incorrect MASTER passcode. You do not have permission to edit this coach.");
                    }
                },
                () => { /* do nothing on cancel */ }
            );
        };

        const handleUpdateCoach = async (parentContainer) => {
            if (!db || !userId || !editingCoach || !appId) {
                console.error("Update Coach Error: db, userId, editingCoach, or appId not ready.", {db, userId, editingCoach, appId});
                showCustomModal("Error: Database, Auth, or coach data not ready to update.");
                return;
            }
            if (!editingCoach.name.trim() || !editingCoach.email.trim()) {
                showCustomModal("Coach Name and Email cannot be empty.");
                return;
            }

            showConfirmWithInputModal(
                "Enter MASTER passcode to confirm update:",
                async (enteredPasscode) => {
                    if (enteredPasscode === MASTER_PASSCODE) {
                        try {
                            const coachRef = doc(db, `artifacts/${appId}/users/${userId}/coaches`, editingCoach.id);
                            await updateDoc(coachRef, {
                                name: editingCoach.name.trim(),
                                email: editingCoach.email.trim(),
                                phone: editingCoach.phone.trim(),
                                teams: editingCoach.teams,
                                classes: editingCoach.classes,
                            });
                            editingCoach = null; // Clear editing state
                            showCustomModal("Coach updated successfully!");
                            renderCoachManagement(parentContainer); // Re-render the table
                        } catch (error) {
                            console.error("Error updating coach:", error);
                            showCustomModal(`Failed to update coach: ${error.message}`);
                        }
                    } else {
                        showCustomModal("Incorrect MASTER passcode. Coach not updated.");
                    }
                },
                () => { /* do nothing on cancel */ }
            );
        };

        const handleApproveCoach = (coach) => {
            showConfirmWithInputModal(
                `Approve ${coach.name}? Enter MASTER passcode:`,
                async (enteredPasscode) => {
                    if (enteredPasscode === MASTER_PASSCODE) {
                        try {
                            const coachRef = doc(db, `artifacts/${appId}/users/${userId}/coaches`, coach.id);
                            await updateDoc(coachRef, { isApproved: true });
                            showCustomModal(`${coach.name} approved successfully!`);
                        }
                        catch (error) {
                            console.error("Error approving coach:", error);
                            showCustomModal(`Failed to approve coach: ${error.message}`);
                        }
                    } else {
                        showCustomModal("Incorrect MASTER passcode. Approval denied.");
                    }
                },
                () => { /* do nothing on cancel */ }
            );
        };

        const handleDeleteCoach = (coach) => {
            showConfirmWithInputModal(
                `Are you sure you want to delete ${coach.name}?\nThis action cannot be undone. Enter MASTER passcode to confirm:`,
                async (enteredPasscode) => {
                    if (enteredPasscode === MASTER_PASSCODE) {
                        try {
                            const coachRef = doc(db, `artifacts/${appId}/users/${userId}/coaches`, coach.id);
                            await deleteDoc(coachRef);
                            showCustomModal(`${coach.name} deleted successfully!`);
                        } catch (error) {
                            console.error("Error deleting coach:", error);
                            showCustomModal(`Failed to delete coach: ${error.message}`);
                        }
                    } else {
                        showCustomModal("Incorrect MASTER passcode. Coach not deleted.");
                    }
                },
                () => { /* do nothing on cancel */ }
            );
        };

        // --- AthleteProfiles Component Rendering ---
        const renderAthleteProfiles = (parentContainer) => {
            if (!parentContainer) return;
            console.log("Rendering Athlete Profiles."); // Diagnostic log


            const approvedAthletes = athletes.filter(athlete => athlete.isApproved);
            const pendingAthletes = athletes.filter(athlete => !athlete.isApproved);

            const filteredAthletes = approvedAthletes.filter(athlete =>
                athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).sort((a, b) => a.name.localeCompare(b.name));

            parentContainer.innerHTML = `
                <div class="flex-grow flex flex-col p-4 bg-gray-50 rounded-lg shadow-inner">
                    <h3 class="text-2xl font-bold text-gray-700 mb-4 text-center">Athlete Profiles</h3>

                    <!-- Search and Add New -->
                    <div class="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
                        <input type="text" id="athleteSearchTerm" placeholder="Search approved athletes by name..." class="p-3 border border-gray-300 rounded-md shadow-sm w-full sm:w-1/2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value="${searchTerm}">
                        <button id="addNewAthleteBtn" class="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300 ease-in-out font-semibold flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                            </svg>
                            Add New Athlete
                        </button>
                    </div>

                    <div id="pendingAthletesSection"></div>
                    <div id="athleteListOrDetailView" class="flex-grow"></div>
                </div>
            `;

            const athleteSearchTermInput = parentContainer.querySelector('#athleteSearchTerm');
            athleteSearchTermInput.oninput = (e) => {
                searchTerm = e.target.value;
                renderAthleteProfiles(parentContainer);
            };
            parentContainer.querySelector('#addNewAthleteBtn').onclick = handleAddNewAthlete;

            const pendingAthletesSection = parentContainer.querySelector('#pendingAthletesSection');
            if (pendingAthletes.length > 0) {
                pendingAthletesSection.innerHTML = `
                    <div class="bg-yellow-50 rounded-lg shadow-inner p-4 mb-6 border border-yellow-200">
                        <h4 class="text-xl font-semibold text-yellow-800 mb-4">Pending Athletes for Approval</h4>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white rounded-lg shadow overflow-hidden">
                                <thead class="bg-yellow-100 border-b border-yellow-200">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Athlete Name</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Added By</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="pendingAthletesTableBody"></tbody>
                            </table>
                        </div>
                    </div>
                `;
                const pendingAthletesTableBody = pendingAthletesSection.querySelector('#pendingAthletesTableBody');
                pendingAthletesTableBody.innerHTML = ''; // Clear existing rows
                pendingAthletes.forEach(athlete => {
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-yellow-50';
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${athlete.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${athlete.addedByCoach || 'N/A'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex space-x-2">
                                <button class="text-green-600 hover:text-green-900 transition duration-200 approve-athlete-btn" data-athlete-id="${athlete.id}">Approve</button>
                                <button class="ml-4 text-indigo-600 hover:text-indigo-900 transition duration-200 edit-athlete-btn" data-athlete-id="${athlete.id}">Edit</button>
                            </div>
                        </td>
                    `;
                    pendingAthletesTableBody.appendChild(row);
                });
                pendingAthletesTableBody.querySelectorAll('.approve-athlete-btn').forEach(button => {
                    button.onclick = (e) => {
                        const athleteId = e.target.dataset.athleteId;
                        const athleteToApprove = athletes.find(a => a.id === athleteId);
                        if (athleteToApprove) handleApproveAthlete(athleteToApprove);
                    };
                });
                pendingAthletesTableBody.querySelectorAll('.edit-athlete-btn').forEach(button => {
                    button.onclick = (e) => {
                        const athleteId = e.target.dataset.athleteId;
                        const athleteToEdit = athletes.find(a => a.id === athleteId);
                        if (athleteToEdit) handleEditAthlete(athleteToEdit);
                    };
                });
            } else {
                pendingAthletesSection.innerHTML = ''; // Hide if no pending athletes
            }


            const athleteListOrDetailView = parentContainer.querySelector('#athleteListOrDetailView');
            if (editingAthlete || viewingAthlete || isAddingNewAthlete) {
                renderAthleteProfileDetail(athleteListOrDetailView, editingAthlete || viewingAthlete, !editingAthlete);
            } else {
                athleteListOrDetailView.innerHTML = `
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white rounded-lg shadow overflow-hidden">
                            <thead class="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Athlete Name</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Teams</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Classes</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="approvedAthletesTableBody"></tbody>
                        </table>
                    </div>
                `;
                const approvedAthletesTableBody = athleteListOrDetailView.querySelector('#approvedAthletesTableBody');
                if (filteredAthletes.length === 0) {
                    approvedAthletesTableBody.innerHTML = `<tr><td colSpan="4" class="px-6 py-4 text-center text-gray-500">No approved athletes found.</td></tr>`;
                } else {
                    filteredAthletes.forEach(athlete => {
                        const row = document.createElement('tr');
                        row.className = 'hover:bg-gray-50';
                        row.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${athlete.name}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                ${(athlete.teams && athlete.teams.join(', ')) || ''}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                ${(athlete.classes && athlete.classes.join(', ')) || ''}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div class="flex space-x-2">
                                    <button class="text-blue-600 hover:text-blue-900 transition duration-200 view-athlete-btn" data-athlete-id="${athlete.id}">View</button>
                                    <button class="text-indigo-600 hover:text-indigo-900 transition duration-200 edit-athlete-btn" data-athlete-id="${athlete.id}">Edit</button>
                                </div>
                            </td>
                        `;
                        approvedAthletesTableBody.appendChild(row);
                    });
                    approvedAthletesTableBody.querySelectorAll('.view-athlete-btn').forEach(button => {
                        button.onclick = (e) => {
                            const athleteId = e.target.dataset.athleteId;
                            const athleteToView = athletes.find(a => a.id === athleteId);
                            if (athleteToView) handleViewAthlete(athleteToView);
                        };
                    });
                    approvedAthletesTableBody.querySelectorAll('.edit-athlete-btn').forEach(button => {
                        button.onclick = (e) => {
                            const athleteId = e.target.dataset.athleteId;
                            const athleteToEdit = athletes.find(a => a.id === athleteId);
                            if (athleteToEdit) handleEditAthlete(athleteToEdit);
                        };
                    });
                }
            }
        };

        const handleAddNewAthlete = () => {
            isAddingNewAthlete = true;
            editingAthlete = {
                id: '', name: '', teams: [], classes: [], skills: [], improvementAreas: '', coachNotes: [],
                parentName: '', parentPhone: '', parentEmail: '', emergencyContactName: '', emergencyContactPhone: '',
                isApproved: false, addedByCoach: '', profilePicture: null,
            };
            viewingAthlete = null;
            renderAthleteProfiles(document.getElementById('coachViewContent'));
        };

        const handleEditAthlete = (athlete) => {
            showConfirmWithInputModal(
                "Enter MASTER passcode to edit:",
                (enteredPasscode) => {
                    if (enteredPasscode === MASTER_PASSCODE) {
                        editingAthlete = { ...athlete }; // Mutable copy
                        viewingAthlete = null;
                        isAddingNewAthlete = false;
                        renderAthleteProfiles(document.getElementById('coachViewContent'));
                    } else {
                        showCustomModal("Incorrect MASTER passcode. You do not have permission to edit.");
                    }
                },
                () => { /* do nothing on cancel */ }
            );
        };

        const handleViewAthlete = (athlete) => {
            viewingAthlete = athlete;
            editingAthlete = null;
            isAddingNewAthlete = false;
            renderAthleteProfiles(document.getElementById('coachViewContent'));
        };

        const handleApproveAthlete = (athlete) => {
            showConfirmWithInputModal(
                `Approve ${athlete.name}? Enter MASTER passcode:`,
                async (enteredPasscode) => {
                    if (enteredPasscode === MASTER_PASSCODE) {
                        try {
                            const athleteRef = doc(db, `artifacts/${appId}/users/${userId}/athletes`, athlete.id);
                            await updateDoc(athleteRef, { isApproved: true });
                            showCustomModal(`${athlete.name} approved successfully!`);
                            renderAthleteProfiles(document.getElementById('coachViewContent')); // Re-render to update pending list
                        } catch (error) {
                            console.error("Error approving athlete:", error);
                            showCustomModal(`Failed to approve athlete: ${error.message}`);
                        }
                    } else {
                        showCustomModal("Incorrect MASTER passcode. Approval denied.");
                    }
                },
                () => { /* do nothing on cancel */ }
            );
        };


        // --- TagsInput Component Rendering (for multi-select) ---
        const renderTagsInput = (parentDiv, labelText, options, selectedOptions, onChangeCallback, readOnly) => {
            parentDiv.innerHTML = ''; // Clear previous content
            const label = document.createElement('label');
            label.className = 'block text-sm font-medium text-gray-700 mb-2';
            label.textContent = labelText;
            parentDiv.appendChild(label);

            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white min-h-[40px]';
            parentDiv.appendChild(tagsContainer);

            options.forEach(option => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = option;
                button.disabled = readOnly;
                button.className = `px-4 py-1 rounded-full text-sm font-semibold transition-colors duration-200 ${
                    selectedOptions.includes(option)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`;

                if (selectedOptions.includes(option) && !readOnly) {
                    const span = document.createElement('span');
                    span.className = 'ml-1 text-xs';
                    span.textContent = 'x';
                    button.appendChild(span);
                }

                button.onclick = () => {
                    if (readOnly) return;
                    const newSelection = selectedOptions.includes(option)
                        ? selectedOptions.filter(item => item !== option)
                        : [...selectedOptions, option];
                    onChangeCallback(newSelection);
                    // Re-render the specific tags input to reflect changes
                    renderTagsInput(parentDiv, labelText, options, newSelection, onChangeCallback, readOnly);
                };
                tagsContainer.appendChild(button);
            });

            if (!readOnly) {
                const hint = document.createElement('p');
                hint.className = 'text-xs text-gray-500 mt-1';
                hint.textContent = 'Tap to add or remove.';
                parentDiv.appendChild(hint);
            }
        };


        // --- AthleteProfileDetail Component Rendering ---
        const renderAthleteProfileDetail = (parentContainer, athleteToDisplay, readOnly) => {
            if (!parentContainer) return;
            console.log("Rendering Athlete Profile Detail. ReadOnly:", readOnly); // Diagnostic log

            // Use a copy of the athlete object for editing
            const currentAthleteData = editingAthlete || viewingAthlete || {
                id: '', name: '', teams: [], classes: [], skills: [], improvementAreas: '', coachNotes: [],
                parentName: '', parentPhone: '', parentEmail: '', emergencyContactName: '', emergencyContactPhone: '',
                isApproved: false, addedByCoach: '', profilePicture: null
            };

            // Ensure arrays are initialized if missing
            currentAthleteData.teams = currentAthleteData.teams || [];
            currentAthleteData.classes = currentAthleteData.classes || [];
            currentAthleteData.skills = currentAthleteData.skills || [];
            currentAthleteData.coachNotes = currentAthleteData.coachNotes || [];

            // Populate addedByCoach for new athletes if not set
            if (!currentAthleteData.id && !addedByCoach) {
                // If there are approved coaches, set the first one as default for addedByCoach
                const approvedCoaches = coaches.filter(coach => coach.isApproved);
                if (approvedCoaches.length > 0) {
                    addedByCoach = approvedCoaches[0].name;
                }
            }


            parentContainer.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl p-6 border border-gray-200">
                    <h3 class="text-2xl font-bold text-indigo-700 mb-6 text-center">
                        ${readOnly ? `Viewing ${currentAthleteData.name}'s Profile` : (currentAthleteData.id ? `Edit ${currentAthleteData.name}'s Profile` : 'Add New Athlete')}
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <!-- Basic Info -->
                        <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 class="text-xl font-semibold text-gray-800 mb-4">Basic Information</h4>
                            <div class="mb-4 text-center">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                                <div id="profilePictureContainer" class="mb-2 w-32 h-32 rounded-full overflow-hidden mx-auto border-2 border-gray-300 flex items-center justify-center bg-gray-200">
                                    ${currentAthleteData.profilePicture ? `<img src="${currentAthleteData.profilePicture}" alt="Profile" class="w-full h-full object-cover" />` : `<span class="text-gray-500 text-sm">No Picture</span>`}
                                </div>
                                ${!readOnly ? `
                                <div class="mt-2">
                                    <div class="flex justify-center space-x-2 mb-3">
                                        <button type="button" id="uploadPhotoBtn" class="px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200"></button>
                                        <button type="button" id="takeSelfieBtn" class="px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200"></button>
                                    </div>
                                    <div id="cameraControls" class="${!cameraMode ? 'hidden' : ''}">
                                        <div id="cameraLoader" class="flex flex-col items-center justify-center h-32 ${!cameraLoading ? 'hidden' : ''}">
                                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                            <p class="mt-2 text-sm text-gray-600">Starting camera...</p>
                                        </div>
                                        <div id="cameraPreview" class="${cameraLoading || !stream ? 'hidden' : ''}">
                                            <video id="videoElement" autoplay playsinline muted class="w-full max-w-xs mx-auto rounded-lg shadow-md mb-2 block" style="transform: scaleX(-1);"></video>
                                            <canvas id="canvasElement" class="hidden"></canvas>
                                            <button type="button" id="takePhotoBtn" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200 mt-2">Capture Photo</button>
                                        </div>
                                        <p id="cameraErrorMsg" class="text-sm text-red-500 text-center hidden"></p>
                                    </div>
                                    <input type="file" id="imageUploadInput" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mt-2 ${cameraMode ? 'hidden' : ''}" />
                                    ${currentAthleteData.profilePicture ? `<button type="button" id="removePhotoBtn" class="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200 text-sm">Remove Photo</button>` : ''}
                                </div>
                                ` : ''}
                            </div>
                            <div class="mb-4">
                                <label for="athleteName" class="block text-sm font-medium text-gray-700 mb-1">Athlete Name *</label>
                                <input type="text" id="athleteName" name="name" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Athlete Name" value="${currentAthleteData.name || ''}" ${readOnly ? 'readonly' : ''} required />
                            </div>

                            ${!currentAthleteData.id ? `
                            <div class="mb-4">
                                <label for="addedByCoachSelect" class="block text-sm font-medium text-gray-700 mb-1">Added By Coach *</label>
                                <select id="addedByCoachSelect" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" ${coaches.filter(c => c.isApproved).length === 0 ? 'disabled' : ''}>
                                    <option value="">Select Coach</option>
                                    ${coaches.filter(c => c.isApproved).map(coach => `<option value="${coach.name}" ${addedByCoach === coach.name ? 'selected' : ''}>${coach.name}</option>`).join('')}
                                </select>
                            </div>
                            ` : ''}

                            <div id="athleteTeamsTagsInput"></div>
                            <div id="athleteClassesTagsInput"></div>
                        </div>

                        <!-- Contact Info -->
                        <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 class="text-xl font-semibold text-gray-800 mb-4">Contact Information</h4>
                            <div class="mb-4">
                                <label for="parentName" class="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label>
                                <input type="text" id="parentName" name="parentName" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Parent/Guardian Name" value="${currentAthleteData.parentName || ''}" ${readOnly ? 'readonly' : ''} />
                            </div>
                            <div class="mb-4">
                                <label for="parentPhone" class="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Phone</label>
                                <input type="tel" id="parentPhone" name="parentPhone" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="###-###-####" value="${formatPhoneNumber(currentAthleteData.parentPhone || '')}" ${readOnly ? 'readonly' : ''} />
                            </div>
                            <div class="mb-4">
                                <label for="parentEmail" class="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Email</label>
                                <input type="email" id="parentEmail" name="parentEmail" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="parent@example.com" value="${currentAthleteData.parentEmail || ''}" ${readOnly ? 'readonly' : ''} />
                            </div>
                            <div class="mb-4">
                                <label for="emergencyContactName" class="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                                <input type="text" id="emergencyContactName" name="emergencyContactName" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Emergency Contact Name" value="${currentAthleteData.emergencyContactName || ''}" ${readOnly ? 'readonly' : ''} />
                            </div>
                            <div>
                                <label for="emergencyContactPhone" class="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                                <input type="tel" id="emergencyContactPhone" name="emergencyContactPhone" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="###-###-####" value="${formatPhoneNumber(currentAthleteData.emergencyContactPhone || '')}" ${readOnly ? 'readonly' : ''} />
                            </div>
                        </div>
                    </div>

                    <!-- Skills Section -->
                    <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
                        <h4 class="text-xl font-semibold text-gray-800 mb-4">Skills</h4>
                        ${!readOnly ? `
                        <div class="mb-4">
                            <label for="newSkillName" class="block text-sm font-medium text-gray-700 mb-1">Add New Skill</label>
                            <div class="flex space-x-2">
                                <input type="text" id="newSkillName" placeholder="Skill Name (e.g., Back Handspring)" class="flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value="${newSkillName}">
                                <select id="newSkillStatus" class="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                                    <option value="Not Started" ${newSkillStatus === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                    <option value="Working On" ${newSkillStatus === 'Working On' ? 'selected' : ''}>Working On</option>
                                    <option value="Needs Improvement" ${newSkillStatus === 'Needs Improvement' ? 'selected' : ''}>Needs Improvement</option>
                                    <option value="Mastered" ${newSkillStatus === 'Mastered' ? 'selected' : ''}>Mastered</option>
                                </select>
                                <button id="addSkillBtn" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200">Add</button>
                            </div>
                        </div>
                        ` : ''}
                        <ul id="skillsList" class="space-y-2"></ul>
                    </div>

                    <!-- Improvement Areas -->
                    <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
                        <h4 class="text-xl font-semibold text-gray-800 mb-4">Improvement Areas</h4>
                        <textarea id="improvementAreas" name="improvementAreas" rows="3" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Notes on specific areas for improvement..." ${readOnly ? 'readonly' : ''}>${currentAthleteData.improvementAreas || ''}</textarea>
                    </div>

                    <!-- Coach Notes -->
                    <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
                        <h4 class="text-xl font-semibold text-gray-800 mb-4">Coach Notes</h4>
                        <div class="mb-4">
                            <label for="coachNotesSelector" class="block text-sm font-medium text-gray-700 mb-1">Coach</label>
                            <select id="coachNotesSelector" class="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 mb-2">
                                ${coaches.filter(c => c.isApproved).length === 0 ? '<option value="">No approved coaches available</option>' : ''}
                                <option value="">Select Coach</option>
                                ${coaches.filter(c => c.isApproved).map(coach => `<option value="${coach.name}" ${selectedCoachForNote === coach.name ? 'selected' : ''}>${coach.name}</option>`).join('')}
                            </select>
                            <textarea id="newNoteTextarea" rows="2" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Add a new note..." value="${newNote}"></textarea>
                            <button id="addNoteBtn" class="mt-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition duration-200">Add</button>
                        </div>
                        <ul id="coachNotesList" class="space-y-2 max-h-40-overflow-auto"></ul>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-end space-x-4 mt-6">
                        <button id="cancelAthleteEditBtn" class="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-200 font-semibold">
                            ${readOnly ? 'Close View' : 'Cancel'}
                        </button>
                        ${!readOnly ? `
                        <button id="saveAthleteProfileBtn" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 font-semibold">
                            Save Profile
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;

            // Elements references
            const athleteNameInput = parentContainer.querySelector('#athleteName');
            const addedByCoachSelect = parentContainer.querySelector('#addedByCoachSelect');
            const parentNameInput = parentContainer.querySelector('#parentName');
            const parentPhoneInput = parentContainer.querySelector('#parentPhone');
            const parentEmailInput = parentContainer.querySelector('#parentEmail');
            const emergencyContactNameInput = parentContainer.querySelector('#emergencyContactName');
            const emergencyContactPhoneInput = parentContainer.querySelector('#emergencyContactPhone');
            const improvementAreasTextarea = parentContainer.querySelector('#improvementAreas');

            // Set up event listeners for input fields
            athleteNameInput.oninput = (e) => { currentAthleteData.name = e.target.value; };
            if (addedByCoachSelect) { // This element only exists for new athlete creation
                addedByCoachSelect.onchange = (e) => { addedByCoach = e.target.value; };
            }
            parentNameInput.oninput = (e) => { currentAthleteData.parentName = e.target.value; };
            parentPhoneInput.oninput = (e) => {
                const formatted = formatPhoneNumber(e.target.value);
                currentAthleteData.parentPhone = formatted;
                e.target.value = formatted; // Update input value
            };
            parentEmailInput.oninput = (e) => { currentAthleteData.parentEmail = e.target.value; };
            emergencyContactNameInput.oninput = (e) => { currentAthleteData.emergencyContactName = e.target.value; };
            emergencyContactPhoneInput.oninput = (e) => {
                const formatted = formatPhoneNumber(e.target.value);
                currentAthleteData.emergencyContactPhone = formatted;
                e.target.value = formatted; // Update input value
            };
            improvementAreasTextarea.oninput = (e) => { currentAthleteData.improvementAreas = e.target.value; };

            // Render TagsInput components
            const athleteTeamsTagsInput = parentContainer.querySelector('#athleteTeamsTagsInput');
            renderTagsInput(athleteTeamsTagsInput, 'Teams', teams, currentAthleteData.teams, (newSelection) => {
                currentAthleteData.teams = newSelection;
            }, readOnly);

            const athleteClassesTagsInput = parentContainer.querySelector('#athleteClassesTagsInput');
            renderTagsInput(athleteClassesTagsInput, 'Classes', classes, currentAthleteData.classes, (newSelection) => {
                currentAthleteData.classes = newSelection;
            }, readOnly);

            // Profile Picture Logic
            if (!readOnly) {
                const profilePictureContainer = parentContainer.querySelector('#profilePictureContainer');
                profilePictureContainer.innerHTML = currentAthleteData.profilePicture ? `<img src="${currentAthleteData.profilePicture}" alt="Profile" class="w-full h-full object-cover" />` : `<span class="text-gray-500 text-sm">No Picture</span>`;

                const uploadPhotoBtn = parentContainer.querySelector('#uploadPhotoBtn');
                const takeSelfieBtn = parentContainer.querySelector('#takeSelfieBtn');
                const imageUploadInput = parentContainer.querySelector('#imageUploadInput');
                const removePhotoBtn = parentContainer.querySelector('#removePhotoBtn');
                const cameraControls = parentContainer.querySelector('#cameraControls');
                const cameraLoader = parentContainer.querySelector('#cameraLoader');
                const cameraPreview = parentContainer.querySelector('#cameraPreview');
                const cameraErrorMsg = parentContainer.querySelector('#cameraErrorMsg');
                const takePhotoBtn = parentContainer.querySelector('#takePhotoBtn');

                videoElement = parentContainer.querySelector('#videoElement');
                canvasElement = parentContainer.querySelector('#canvasElement'); // Update global reference

                // Camera/Upload Mode Button Styling
                uploadPhotoBtn.className = `px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
                    !cameraMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`;
                uploadPhotoBtn.textContent = 'Upload Photo';
                takeSelfieBtn.className = `px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
                    cameraMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`;
                takeSelfieBtn.textContent = 'Take Selfie';

                // Toggle Camera/Upload Mode
                uploadPhotoBtn.onclick = () => { cameraMode = false; stopCamera(); renderAthleteProfileDetail(parentContainer, athleteToDisplay, readOnly); };
                takeSelfieBtn.onclick = () => { cameraMode = true; renderAthleteProfileDetail(parentContainer, athleteToDisplay, readOnly); };

                // Show/Hide Camera/Upload Controls
                imageUploadInput.classList.toggle('hidden', cameraMode);
                cameraControls.classList.toggle('hidden', !cameraMode);

                // Handle Camera UI based on state
                if (cameraMode) {
                    cameraLoader.classList.toggle('hidden', !cameraLoading);
                    cameraPreview.classList.toggle('hidden', cameraLoading || !stream);
                    if (stream) cameraErrorMsg.classList.add('hidden');
                    if (!stream && !cameraLoading) cameraErrorMsg.classList.remove('hidden');
                    takePhotoBtn.onclick = takePhoto;
                    // Auto-start camera if in camera mode and not already streaming
                    if (!stream && !cameraLoading) startCamera(cameraErrorMsg);
                } else {
                    stopCamera(); // Ensure camera is off when not in camera mode
                }

                imageUploadInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            currentAthleteData.profilePicture = reader.result; // Update data
                            renderAthleteProfileDetail(parentContainer, athleteToDisplay, readOnly); // Re-render
                        };
                        reader.readAsDataURL(file);
                    } else {
                        currentAthleteData.profilePicture = null;
                        renderAthleteProfileDetail(parentContainer, athleteToDisplay, readOnly);
                    }
                };

                if (removePhotoBtn) {
                    removePhotoBtn.onclick = () => {
                        currentAthleteData.profilePicture = null;
                        renderAthleteProfileDetail(parentContainer, athleteToDisplay, readOnly);
                    };
                }
            }


            // Skills Section
            const skillsList = parentContainer.querySelector('#skillsList');
            if (currentAthleteData.skills && currentAthleteData.skills.length > 0) {
                skillsList.innerHTML = ''; // Clear previous skills
                currentAthleteData.skills.forEach((skill, index) => {
                    const listItem = document.createElement('li');
                    listItem.className = 'flex items-center space-x-2 bg-white p-3 rounded-md shadow-sm border border-gray-100';
                    listItem.innerHTML = `
                        <input type="text" class="flex-grow p-1 border border-gray-300 rounded-md text-sm" value="${skill.name}" ${readOnly ? 'readonly' : ''} />
                        <select class="p-1 border border-gray-300 rounded-md text-sm" ${readOnly ? 'disabled' : ''}>
                            <option value="Not Started" ${skill.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                            <option value="Working On" ${skill.status === 'Working On' ? 'selected' : ''}>Working On</option>
                            <option value="Needs Improvement" ${skill.status === 'Needs Improvement' ? 'selected' : ''}>Needs Improvement</option>
                            <option value="Mastered" ${skill.status === 'Mastered' ? 'selected' : ''}>Mastered</option>
                        </select>
                        ${!readOnly ? `
                        <button class="text-red-500 hover:text-red-700 transition duration-200 delete-skill-btn" data-index="${index}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 4a1 1 0 100 2h4a1 1 0 100-2H8z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        ` : ''}
                    `;
                    listItem.querySelector('input').oninput = (e) => {
                        currentAthleteData.skills[index].name = e.target.value;
                    };
                    listItem.querySelector('select').onchange = (e) => {
                        currentAthleteData.skills[index].status = e.target.value;
                    };
                    if (!readOnly) {
                        listItem.querySelector('.delete-skill-btn').onclick = (e) => {
                            const indexToRemove = parseInt(e.currentTarget.dataset.index);
                            currentAthleteData.skills = currentAthleteData.skills.filter((_, i) => i !== indexToRemove);
                            renderAthleteProfileDetail(parentContainer, athleteToDisplay, readOnly);
                        };
                    }
                    skillsList.appendChild(listItem);
                });
            } else {
                skillsList.innerHTML = `<p class="text-gray-600 text-sm">No skills added yet.</p>`;
            }

            if (!readOnly) {
                const newSkillNameInput = parentContainer.querySelector('#newSkillName');
                const newSkillStatusSelect = parentContainer.querySelector('#newSkillStatus');
                const addSkillBtn = parentContainer.querySelector('#addSkillBtn');

                if (newSkillNameInput) newSkillNameInput.value = newSkillName;
                if (newSkillStatusSelect) newSkillStatusSelect.value = newSkillStatus;

                if (newSkillNameInput) newSkillNameInput.oninput = (e) => { newSkillName = e.target.value; };
                if (newSkillStatusSelect) newSkillStatusSelect.onchange = (e) => { newSkillStatus = e.target.value; };
                if (addSkillBtn) addSkillBtn.onclick = () => {
                    if (newSkillName.trim()) {
                        currentAthleteData.skills.push({ name: newSkillName.trim(), status: newSkillStatus });
                        newSkillName = '';
                        newSkillStatus = 'Not Started';
                        renderAthleteProfileDetail(parentContainer, athleteToDisplay, readOnly);
                    }
                };
            }

            // Coach Notes Section
            const coachNotesSelector = parentContainer.querySelector('#coachNotesSelector');
            const newNoteTextarea = parentContainer.querySelector('#newNoteTextarea');
            const addNoteBtn = parentContainer.querySelector('#addNoteBtn');
            const coachNotesList = parentContainer.querySelector('#coachNotesList');

            // Set up coach selector for notes
            coachNotesSelector.innerHTML = '';
            const approvedCoaches = coaches.filter(c => c.isApproved);
            if (approvedCoaches.length === 0) {
                coachNotesSelector.innerHTML = '<option value="">No approved coaches available</option>';
            } else {
                coachNotesSelector.innerHTML = '<option value="">Select Coach</option>';
                approvedCoaches.forEach(coach => {
                    const option = document.createElement('option');
                    option.value = coach.name;
                    option.textContent = coach.name;
                    if (selectedCoachForNote === coach.name) {
                        option.selected = true;
                    }
                    coachNotesSelector.appendChild(option);
                });
            }
            if (!selectedCoachForNote || !approvedCoaches.some(coach => coach.name === selectedCoachForNote)) {
              if (approvedCoaches.length > 0) {
                selectedCoachForNote = approvedCoaches[0].name;
                coachNotesSelector.value = selectedCoachForNote;
              } else {
                selectedCoachForNote = '';
                coachNotesSelector.value = '';
              }
            }


            coachNotesSelector.onchange = (e) => { selectedCoachForNote = e.target.value; };
            newNoteTextarea.value = newNote;
            newNoteTextarea.oninput = (e) => { newNote = e.target.value; };
            addNoteBtn.onclick = () => {
                if (!newNote.trim()) {
                    showCustomModal("Please enter text for the note.");
                    return;
                }
                if (!selectedCoachForNote) {
                    showCustomModal("Please select a coach from the dropdown. If no coaches are listed, ensure coaches are added and approved in 'Coach Management'.");
                    return;
                }
                currentAthleteData.coachNotes.push({ timestamp: Timestamp.now(), note: newNote.trim(), coachName: selectedCoachForNote });
                newNote = ''; // Clear input
                renderAthleteProfileDetail(parentContainer, athleteToDisplay, readOnly); // Re-render notes list
            };

            if (currentAthleteData.coachNotes && currentAthleteData.coachNotes.length > 0) {
                coachNotesList.innerHTML = '';
                currentAthleteData.coachNotes
                    .sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0)) // Sort by most recent first
                    .forEach((noteObj, index) => {
                        const listItem = document.createElement('li');
                        listItem.className = 'bg-white p-3 rounded-md shadow-sm border border-gray-100';
                        listItem.innerHTML = `
                            <p class="text-xs text-gray-500 mb-1">
                                <span class="font-semibold text-gray-700">${noteObj.coachName || 'Unknown Coach'}</span> - ${noteObj.timestamp ? new Date(noteObj.timestamp.toDate()).toLocaleString() : 'N/A'}
                            </p>
                            <p class="text-sm text-gray-800">${noteObj.note}</p>
                            ${!readOnly ? `
                            <button class="text-red-500 hover:text-red-700 text-sm mt-1 float-right delete-note-btn" data-index="${index}">Delete Note</button>
                            ` : ''}
                        `;
                        if (!readOnly) {
                            listItem.querySelector('.delete-note-btn').onclick = (e) => {
                                const indexToRemove = parseInt(e.currentTarget.dataset.index);
                                currentAthleteData.coachNotes = currentAthleteData.coachNotes.filter((_, i) => i !== indexToRemove);
                                renderAthleteProfileDetail(parentContainer, athleteToDisplay, readOnly);
                            };
                        }
                        coachNotesList.appendChild(listItem);
                    });
            } else {
                coachNotesList.innerHTML = `<p class="text-gray-600 text-sm">No coach notes available.</p>`;
            }

            // Action Buttons
            const cancelAthleteEditBtn = parentContainer.querySelector('#cancelAthleteEditBtn');
            const saveAthleteProfileBtn = parentContainer.querySelector('#saveAthleteProfileBtn');

            cancelAthleteEditBtn.onclick = () => {
                editingAthlete = null;
                viewingAthlete = null;
                isAddingNewAthlete = false;
                newSkillName = ''; // Clear fields for next use
                newSkillStatus = 'Not Started';
                newNote = '';
                selectedCoachForNote = '';
                addedByCoach = ''; // Clear for new athlete forms
                renderAthleteProfiles(document.getElementById('coachViewContent'));
                stopCamera(); // Stop camera on cancel
            };

            if (saveAthleteProfileBtn) {
                saveAthleteProfileBtn.onclick = () => {
                    if (!currentAthleteData.name.trim()) {
                        showCustomModal("Athlete Name is required.");
                        return;
                    }
                    if (!currentAthleteData.id && !addedByCoach.trim()) { // Only required for new athletes if coaches exist
                        const approvedCoachesExist = coaches.filter(c => c.isApproved).length > 0;
                        if (approvedCoachesExist) {
                             showCustomModal("Please select the coach who added this athlete.");
                             return;
                        }
                    }

                    const athleteToSave = { ...currentAthleteData };
                    if (!athleteToSave.id) { // Only set addedByCoach if it's a new athlete
                        athleteToSave.addedByCoach = addedByCoach;
                    }

                    // Convert Timestamps in coachNotes if they were manipulated into Date objects
                    athleteToSave.coachNotes = athleteToSave.coachNotes.map(note => ({
                        ...note,
                        timestamp: cloneTimestamp(note.timestamp)
                    }));

                    handleSaveAthlete(athleteToSave);
                    stopCamera(); // Stop camera on save
                };
            }
        };

        const handleSaveAthlete = async (athleteData) => {
            console.log("Attempting to save athlete. Current states: db=", db, "userId=", userId, "appId=", appId);
            if (!db || !userId || !appId) {
                console.error("Save Athlete Error: db, userId, or appId not ready.", {db, userId, appId});
                showCustomModal("Error: Database or App ID not ready to save athlete. Please check console for more details.");
                return;
            }
            try {
                if (athleteData.id) {
                    const athleteRef = doc(db, `artifacts/${appId}/users/${userId}/athletes`, athleteData.id);
                    // Filter out any temporary UI fields like 'isEditable' if they were added
                    const { isEditable, ...dataToSave } = athleteData;
                    await updateDoc(athleteRef, dataToSave);
                    showCustomModal(`${athleteData.name}'s profile updated successfully!`);
                } else {
                    const newAthleteRef = doc(collection(db, `artifacts/${appId}/users/${userId}/athletes`));
                    await setDoc(newAthleteRef, { ...athleteData, id: newAthleteRef.id, isApproved: false });
                    showCustomModal(`${athleteData.name} added successfully! Awaiting approval.`);
                }
                editingAthlete = null;
                viewingAthlete = null;
                isAddingNewAthlete = false;
                newSkillName = '';
                newSkillStatus = 'Not Started';
                newNote = '';
                selectedCoachForNote = '';
                addedByCoach = ''; // Clear for new athlete forms
                renderAthleteProfiles(document.getElementById('coachViewContent'));
            } catch (error) {
                console.error("Error saving athlete:", error);
                showCustomModal(`Failed to save athlete: ${error.message}`);
            }
        };

        const startCamera = async (errorElement) => {
            if (readOnly) return;
            cameraLoading = true;
            errorElement.classList.add('hidden'); // Hide previous errors
            renderAthleteProfileDetail(document.getElementById('coachViewContent'), editingAthlete || viewingAthlete, false); // Re-render to show loading

            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                if (videoElement) {
                    videoElement.srcObject = mediaStream;
                    await videoElement.play();
                }
                stream = mediaStream;
                cameraLoading = false;
            } catch (err) {
                console.error("Error accessing camera:", err);
                let errorMessage = "Failed to access camera. ";
                if (err.name === "NotFoundError" || err.name === "NotReadableError") {
                    errorMessage += "No camera found or it's in use by another application.";
                } else if (err.name === "NotAllowedError" || err.name === "SecurityError") {
                    errorMessage += "Camera access was denied. Please check your browser's site permissions.";
                } else {
                    errorMessage += `Error: ${err.message}`;
                }
                errorElement.textContent = errorMessage + " You can still use 'Upload Photo' to select an image from your device.";
                errorElement.classList.remove('hidden');
                cameraLoading = false;
                cameraMode = false; // Fallback to file upload mode on error
            }
            renderAthleteProfileDetail(document.getElementById('coachViewContent'), editingAthlete || viewingAthlete, false); // Re-render after camera attempt
        };

        const stopCamera = () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
        };

        const takePhoto = () => {
            if (readOnly) return;
            if (videoElement && canvasElement) {
                const video = videoElement;
                const canvas = canvasElement;
                const context = canvas.getContext('2d');

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageDataURL = canvas.toDataURL('image/png');

                editingAthlete.profilePicture = imageDataURL; // Update athlete data
                stopCamera(); // Stop camera after taking photo
                renderAthleteProfileDetail(document.getElementById('coachViewContent'), editingAthlete, false); // Re-render to show photo
            }
        };


        // --- CheckinLogsView Component Rendering ---
        const renderCheckinLogsView = (parentContainer) => {
            if (!parentContainer) return;
            console.log("Rendering Check-in Logs View."); // Diagnostic log

            parentContainer.innerHTML = `
                <div class="flex-grow flex flex-col p-4 bg-gray-50 rounded-lg shadow-inner">
                    <h3 class="text-2xl font-bold text-gray-700 mb-4 text-center">Daily Check-in History</h3>

                    <!-- Filters -->
                    <div class="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <input type="text" id="filterAthleteName" placeholder="Filter by athlete name..." class="p-2 border border-gray-300 rounded-md shadow-sm w-full sm:flex-grow focus:ring-blue-500 focus:border-blue-500 text-gray-800" value="${filterAthleteName}">
                        <select type="text" id="filterStatus" class="p-2 border border-gray-300 rounded-md shadow-sm w-full sm:w-auto focus:ring-blue-500 focus:border-blue-500 text-gray-800">
                            <option value="All" ${filterStatus === 'All' ? 'selected' : ''}>All Statuses</option>
                            <option value="Checked In" ${filterStatus === 'Checked In' ? 'selected' : ''}>Checked In</option>
                            <option value="Missed" ${filterStatus === 'Missed' ? 'selected' : ''}>Missed</option>
                        </select>
                        <div class="flex w-full sm:w-auto space-x-2 justify-center">
                            <button id="filterCategoryAll" class="px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200"></button>
                            <button id="filterCategoryTeam" class="px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200"></button>
                            <button id="filterCategoryClass" class="px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200"></button>
                        </div>
                        <select id="filterEntity" class="p-2 border border-gray-300 rounded-md shadow-sm w-full sm:w-auto focus:ring-blue-500 focus:border-blue-500 text-gray-800 ${filterCategory === 'All' ? 'hidden' : ''}"></select>
                    </div>

                    <div id="checkinLogsDisplay" class="space-y-6 flex-grow"></div>
                </div>
            `;

            const filterAthleteNameInput = parentContainer.querySelector('#filterAthleteName');
            const filterStatusSelect = parentContainer.querySelector('#filterStatus');
            const filterCategoryAllBtn = parentContainer.querySelector('#filterCategoryAll');
            const filterCategoryTeamBtn = parentContainer.querySelector('#filterCategoryTeam');
            const filterCategoryClassBtn = parentContainer.querySelector('#filterCategoryClass');
            const filterEntitySelect = parentContainer.querySelector('#filterEntity');
            const checkinLogsDisplay = parentContainer.querySelector('#checkinLogsDisplay');

            // Set filter button styles and text
            filterCategoryAllBtn.textContent = 'All Categories';
            filterCategoryAllBtn.className = `px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${filterCategory === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
            filterCategoryTeamBtn.textContent = 'Filter by Team';
            filterCategoryTeamBtn.className = `px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${filterCategory === 'team' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
            filterCategoryClassBtn.textContent = 'Filter by Class';
            filterCategoryClassBtn.className = `px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${filterCategory === 'class' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;

            // Event Listeners for Filters
            filterAthleteNameInput.oninput = (e) => { filterAthleteName = e.target.value; renderCheckinLogsView(parentContainer); };
            filterStatusSelect.onchange = (e) => { filterStatus = e.target.value; renderCheckinLogsView(parentContainer); };
            filterCategoryAllBtn.onclick = () => { filterCategory = 'All'; filterEntity = 'All'; renderCheckinLogsView(parentContainer); };
            filterCategoryTeamBtn.onclick = () => { filterCategory = 'team'; filterEntity = teams[0] || 'All'; renderCheckinLogsView(parentContainer); };
            filterCategoryClassBtn.onclick = () => { filterCategory = 'class'; filterEntity = classes[0] || 'All'; renderCheckinLogsView(parentContainer); };

            if (filterCategory !== 'All') {
                filterEntitySelect.classList.remove('hidden');
                filterEntitySelect.innerHTML = `<option value="All">All ${filterCategory === 'team' ? 'Teams' : 'Classes'}</option>`;
                (filterCategory === 'team' ? teams : classes).forEach(entity => {
                    const option = document.createElement('option');
                    option.value = entity;
                    option.textContent = entity;
                    filterEntitySelect.appendChild(option);
                });
                filterEntitySelect.value = filterEntity;
                filterEntitySelect.onchange = (e) => { filterEntity = e.target.value; renderCheckinLogsView(parentContainer); };
            } else {
                filterEntitySelect.classList.add('hidden');
            }


            const currentFilteredLogs = checkinLogs.map(log => {
                const approvedAthletes = athletes.filter(a => a.isApproved);
                const checkedInAthleteEventsForLog = log.dailyCheckInEvents || [];
                let currentLogCombinedEvents = [];

                approvedAthletes.forEach(athlete => {
                    const athleteId = athlete.id;
                    const athleteNameLower = athlete.name.toLowerCase();

                    if (!athleteNameLower.includes(filterAthleteName.toLowerCase())) {
                        return;
                    }

                    const athleteTeams = athlete.teams || [];
                    const athleteClasses = athlete.classes || [];

                    let expectedEntities = [];
                    if (filterCategory === 'All' || filterCategory === 'team') {
                        const relevantTeams = filterEntity === 'All' ? athleteTeams : athleteTeams.filter(t => t === filterEntity);
                        expectedEntities = [...expectedEntities, ...relevantTeams.map(team => ({ type: 'team', name: team }))];
                    }
                    if (filterCategory === 'All' || filterCategory === 'class') {
                        const relevantClasses = filterEntity === 'All' ? athleteClasses : athleteClasses.filter(c => c === filterEntity);
                        expectedEntities = [...expectedEntities, ...relevantClasses.map(cls => ({ type: 'class', name: cls }))];
                    }

                    expectedEntities.forEach(expected => {
                        const hasActualCheckin = checkedInAthleteEventsForLog.some(event =>
                            event.athleteId === athleteId &&
                            event.checkInType === expected.type &&
                            event.checkInEntity === expected.name
                        );

                        if (hasActualCheckin) {
                            if (filterStatus === 'Checked In' || filterStatus === 'All') {
                                const actualCheckinEvent = checkedInAthleteEventsForLog.find(event =>
                                    event.athleteId === athleteId &&
                                    event.checkInType === expected.type &&
                                    event.checkInEntity === expected.name
                                );
                                currentLogCombinedEvents.push({
                                    athleteId: athleteId,
                                    athleteName: athlete.name,
                                    checkInType: expected.type,
                                    checkInEntity: expected.name,
                                    timestamp: actualCheckinEvent.timestamp,
                                    status: 'Checked In'
                                });
                            }
                        } else {
                            if (filterStatus === 'Missed' || filterStatus === 'All') {
                                const isAlreadyAddedAsCheckedIn = currentLogCombinedEvents.some(item =>
                                    item.athleteId === athleteId &&
                                    item.checkInType === expected.type &&
                                    item.checkInEntity === expected.name &&
                                    item.status === 'Checked In'
                                );

                                if (!isAlreadyAddedAsCheckedIn) {
                                    currentLogCombinedEvents.push({
                                        athleteId: athleteId,
                                        athleteName: athlete.name,
                                        checkInType: expected.type,
                                        checkInEntity: expected.name,
                                        timestamp: null,
                                        status: 'Missed'
                                    });
                                }
                            }
                        }
                    });
                });

                const uniqueEventsMap = new Map();
                currentLogCombinedEvents.forEach(event => {
                    const key = `${event.athleteId}_${event.checkInType}_${event.checkInEntity}_${event.status}`;
                    uniqueEventsMap.set(key, event);
                });
                const finalEvents = Array.from(uniqueEventsMap.values());

                finalEvents.sort((a, b) => {
                    if (a.status === 'Missed' && b.status !== 'Missed') return 1;
                    if (a.status !== 'Missed' && b.status === 'Missed') return -1;
                    const nameComparison = a.athleteName.localeCompare(b.athleteName);
                    if (nameComparison !== 0) return nameComparison;
                    const timestampA = a.timestamp ? (a.timestamp instanceof Timestamp ? a.timestamp.toDate().getTime() : a.timestamp.getTime()) : 0;
                    const timestampB = b.timestamp ? (b.timestamp instanceof Timestamp ? b.timestamp.toDate().getTime() : b.timestamp.getTime()) : 0;
                    return timestampA - timestampB;
                });

                if (finalEvents.length > 0) {
                    return { ...log, filteredDailyCheckInEvents: finalEvents };
                }
                return null;
            }).filter(Boolean);


            if (currentFilteredLogs.length === 0) {
                checkinLogsDisplay.innerHTML = `<p class="text-center text-gray-600 text-lg">No check-in logs found matching your filters yet.</p>`;
            } else {
                checkinLogsDisplay.innerHTML = '';
                currentFilteredLogs.forEach(log => {
                    const logEntryDiv = document.createElement('div');
                    logEntryDiv.className = 'bg-white rounded-lg shadow-md p-4 border border-gray-200';
                    logEntryDiv.innerHTML = `
                        <div class="flex justify-between items-center mb-3">
                            <p class="text-lg font-semibold text-gray-800">
                                Reset on: ${log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                            </p>
                            <div class="flex space-x-2">
                                <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm edit-log-btn" data-log-id="${log.id}">Edit Log</button>
                                <button class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200 text-sm add-manual-checkin-btn" data-log-id="${log.id}" style="display: none;">Add Manual Check-in</button>
                                <button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 text-sm save-log-changes-btn" data-log-id="${log.id}" style="display: none;">Save Changes</button>
                                <button class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200 text-sm cancel-log-edit-btn" data-log-id="${log.id}" style="display: none;">Cancel</button>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600 mb-2">Reset by User ID: ${log.resetByUserId}</p>
                        <h5 class="font-medium text-gray-700 mb-2">Checked-in Athletes:</h5>
                        <ul class="space-y-1 text-sm text-gray-800" id="logAthletesList-${log.id}"></ul>
                    `;
                    checkinLogsDisplay.appendChild(logEntryDiv);

                    const logAthletesList = logEntryDiv.querySelector(`#logAthletesList-${log.id}`);
                    if (log.filteredDailyCheckInEvents.length === 0) {
                        logAthletesList.innerHTML = `<p class="text-sm text-gray-500 italic">No athletes in this log entry matching current filters.</p>`;
                    } else {
                        log.filteredDailyCheckInEvents.forEach((event, index) => {
                            const listItem = document.createElement('li');
                            listItem.className = `list-disc list-inside ${event.status === 'Missed' ? 'text-red-700' : ''}`;
                            if (editingLogEntryId === log.id) {
                                listItem.innerHTML = `
                                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-2 rounded-md mb-2">
                                        <div class="flex-grow flex flex-col sm:flex-row sm:items-center w-full sm:w-auto">
                                            <input type="text" class="flex-grow p-1 border border-gray-300 rounded-md text-sm mr-2 mb-2 sm:mb-0" value="${event.athleteName || ''}" />
                                            ${event.status !== 'Missed' ? `<input type="datetime-local" class="p-1 border border-gray-300 rounded-md text-sm" value="${formatToDatetimeLocal(event.timestamp)}" />` : ''}
                                        </div>
                                        <button class="text-red-500 hover:text-red-700 text-xs mt-2 sm:mt-0 sm:ml-4 remove-athlete-from-log-btn" data-index="${index}">Remove</button>
                                    </div>
                                `;
                                const nameInput = listItem.querySelector('input[type="text"]');
                                const timeInput = listItem.querySelector('input[type="datetime-local"]');
                                const removeBtn = listItem.querySelector('.remove-athlete-from-log-btn');

                                if (nameInput) nameInput.oninput = (e) => handleUpdateAthleteFieldInLog(index, 'athleteName', e.target.value);
                                if (timeInput) timeInput.onchange = (e) => handleUpdateAthleteFieldInLog(index, 'timestamp', e.target.value);
                                if (removeBtn) removeBtn.onclick = () => handleRemoveAthleteFromLog(index);

                            } else {
                                listItem.textContent = `${event.athleteName} (${event.checkInType}: ${event.checkInEntity}) - ${event.timestamp ? new Date(event.timestamp.toDate()).toLocaleTimeString() : (event.status === 'Missed' ? 'Missed' : 'N/A')}`;
                            }
                            logAthletesList.appendChild(listItem);
                        });
                    }

                    // Event listeners for edit buttons
                    const editLogBtn = logEntryDiv.querySelector('.edit-log-btn');
                    const addManualCheckinBtn = logEntryDiv.querySelector('.add-manual-checkin-btn');
                    const saveLogChangesBtn = logEntryDiv.querySelector('.save-log-changes-btn');
                    const cancelLogEditBtn = logEntryDiv.querySelector('.cancel-log-edit-btn');

                    if (editingLogEntryId === log.id) {
                        editLogBtn.style.display = 'none';
                        addManualCheckinBtn.style.display = '';
                        saveLogChangesBtn.style.display = '';
                        cancelLogEditBtn.style.display = '';
                        // Set currentLogAthletes for the editor
                        currentLogAthletes = log.dailyCheckInEvents ?
                            JSON.parse(JSON.stringify(log.dailyCheckInEvents)).map(event => ({
                                ...event,
                                timestamp: event.timestamp ? new Timestamp(event.timestamp.seconds, event.timestamp.nanoseconds).toDate() : null
                            })) : [];
                        // Set initial manual check-in timestamp based on the log's original timestamp
                        manualCheckinTimestamp = formatToDatetimeLocal(log.timestamp || new Date());
                    } else {
                        editLogBtn.style.display = '';
                        addManualCheckinBtn.style.display = 'none';
                        saveLogChangesBtn.style.display = 'none';
                        cancelLogEditBtn.style.display = 'none';
                    }

                    editLogBtn.onclick = () => handleEditLog(log);
                    addManualCheckinBtn.onclick = () => handleAddManualCheckinClick(log.id); // Pass log ID for context
                    saveLogChangesBtn.onclick = handleSaveLogChanges;
                    cancelLogEditBtn.onclick = handleCancelLogEdit;
                });
            }
        };

        const handleAddManualCheckinClick = (logId) => {
            editingLogEntryId = logId; // Make sure we're operating on the correct log
            showAddManualCheckinModal = true;
            // Populate manual check-in modal dropdowns
            const manualAthleteSelect = document.getElementById('manualAthlete');
            const manualCategorySelect = document.getElementById('manualCategory');
            const manualEntitySelect = document.getElementById('manualEntity');
            const manualTimestampInput = document.getElementById('manualTimestamp');

            manualAthleteSelect.innerHTML = '<option value="">Select Athlete</option>';
            athletes.filter(a => a.isApproved).sort((a, b) => a.name.localeCompare(b.name)).forEach(athlete => {
                const option = document.createElement('option');
                option.value = athlete.id;
                option.textContent = athlete.name;
                manualAthleteSelect.appendChild(option);
            });
            manualAthleteSelect.value = ''; // Reset selection

            manualCategorySelect.value = manualCheckinCategory; // Retain current category
            manualCategorySelect.onchange = (e) => { manualCheckinCategory = e.target.value; updateManualEntityOptions(); };
            manualEntitySelect.onchange = (e) => { manualCheckinEntity = e.target.value; };

            updateManualEntityOptions(); // Populate entity options based on initial category
            manualTimestampInput.value = formatToDatetimeLocal(new Date()); // Default to current time

            document.getElementById('addManualCheckinModal').classList.remove('hidden');

            // Set up buttons in the manual check-in modal
            document.getElementById('manualCheckinCancelBtn').onclick = handleCancelManualCheckin;
            document.getElementById('manualCheckinConfirmBtn').onclick = handleConfirmManualCheckin;
        };

        const updateManualEntityOptions = () => {
            const manualEntitySelect = document.getElementById('manualEntity');
            manualEntitySelect.innerHTML = `<option value="">Select ${manualCheckinCategory === 'team' ? 'Team' : 'Class'}</option>`;
            const optionsToUse = manualCheckinCategory === 'team' ? teams : classes;
            optionsToUse.forEach(entity => {
                const option = document.createElement('option');
                option.value = entity;
                option.textContent = entity;
                manualEntitySelect.appendChild(option);
            });
            manualCheckinEntity = optionsToUse[0] || ''; // Set default entity after update
            manualEntitySelect.value = manualCheckinEntity; // Update select value
        };


        const handleConfirmManualCheckin = async () => {
            const manualAthleteSelect = document.getElementById('manualAthlete');
            const manualCategorySelect = document.getElementById('manualCategory');
            const manualEntitySelect = document.getElementById('manualEntity');
            const manualTimestampInput = document.getElementById('manualTimestamp');

            const selectedAthleteId = manualAthleteSelect.value;
            const selectedCategoryType = manualCategorySelect.value;
            const selectedEntityName = manualEntitySelect.value;
            const selectedTimestamp = manualTimestampInput.value;

            if (!selectedAthleteId || !selectedCategoryType || !selectedEntityName || !selectedTimestamp) {
                showCustomModal("Please fill all fields for the manual check-in.");
                return;
            }

            const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);
            if (!selectedAthlete) {
                showCustomModal("Selected athlete not found.");
                return;
            }

            const alreadyExists = currentLogAthletes.some(
                event => event.athleteId === selectedAthleteId &&
                         event.checkInType === selectedCategoryType &&
                         event.checkInEntity === selectedEntityName
            );

            if (alreadyExists) {
                showCustomModal("This athlete is already recorded for this team/class in this log. Please edit the existing entry or choose a different activity.");
                return;
            }

            const newEntry = {
                athleteId: selectedAthleteId,
                athleteName: selectedAthlete.name,
                checkInType: selectedCategoryType,
                checkInEntity: selectedEntityName,
                timestamp: new Date(selectedTimestamp), // Convert datetime-local string to Date object
            };

            currentLogAthletes.push(newEntry); // Add to the array for the current log being edited
            showAddManualCheckinModal = false;
            document.getElementById('addManualCheckinModal').classList.add('hidden');
            renderCheckinLogsView(document.getElementById('coachViewContent')); // Re-render to show updated log entry
        };

        const handleCancelManualCheckin = () => {
            showAddManualCheckinModal = false;
            document.getElementById('addManualCheckinModal').classList.add('hidden');
        };

        const handleEditLog = (logEntry) => {
            showConfirmWithInputModal(
                "Enter MASTER passcode to edit this log entry:",
                (enteredPasscode) => {
                    if (enteredPasscode === MASTER_PASSCODE) {
                        editingLogEntryId = logEntry.id;
                        currentLogAthletes = logEntry.dailyCheckInEvents ?
                            JSON.parse(JSON.stringify(logEntry.dailyCheckInEvents)).map(event => ({
                                ...event,
                                timestamp: event.timestamp ? new Timestamp(event.timestamp.seconds, event.timestamp.nanoseconds).toDate() : null
                            })) : [];
                        renderCheckinLogsView(document.getElementById('coachViewContent'));
                    } else {
                        showCustomModal("Incorrect MASTER passcode. You do not have permission to edit this log.");
                    }
                },
                () => {}
            );
        };

        const handleRemoveAthleteFromLog = (indexToRemove) => {
            currentLogAthletes = currentLogAthletes.filter((_, index) => index !== indexToRemove);
            renderCheckinLogsView(document.getElementById('coachViewContent'));
        };

        const handleUpdateAthleteFieldInLog = (index, field, value) => {
            if (field === 'timestamp') {
                currentLogAthletes[index][field] = value ? new Date(value) : null;
            } else {
                currentLogAthletes[index][field] = value;
            }
        };

        const handleSaveLogChanges = async () => {
            if (!db || !userId || !editingLogEntryId || !appId) {
                console.error("Save Log Changes Error: db, userId, editingLogEntryId, or appId not ready.", {db, userId, editingLogEntryId, appId});
                return;
            }

            try {
                const logDocRef = doc(db, `artifacts/${appId}/users/${userId}/checkin_logs`, editingLogEntryId);
                const eventsToSave = currentLogAthletes.map(event => {
                    const { status, ...rest } = event; // Don't save status field
                    return {
                        ...rest,
                        timestamp: event.timestamp ? Timestamp.fromDate(event.timestamp) : null
                    };
                });

                await updateDoc(logDocRef, {
                    dailyCheckInEvents: eventsToSave,
                    lastEdited: Timestamp.now(),
                });
                showCustomModal("Check-in log updated successfully!");
                editingLogEntryId = null;
                currentLogAthletes = [];
                renderCheckinLogsView(document.getElementById('coachViewContent'));
            } catch (error) {
                console.error("Error saving log changes:", error);
                showCustomModal(`Failed to save log changes: ${error.message}`);
            }
        };

        const handleCancelLogEdit = () => {
            editingLogEntryId = null;
            currentLogAthletes = [];
            renderCheckinLogsView(document.getElementById('coachViewContent'));
        };


        // =====================================
        // Event Listeners for Top-Level UI
        // =====================================
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('loadingSpinner').classList.remove('hidden'); // Show loading spinner
            initializeFirebase();

            document.getElementById('checkInModeBtn').onclick = () => {
                appMode = 'checkIn';
                // Reset check-in selected category/name when switching mode
                selectedCategory = null;
                selectedName = null;
                renderApp();
            };
            document.getElementById('coachModeBtn').onclick = () => {
                appMode = 'coach';
                renderApp();
            };
        });
    </script>
</body>
</html>
