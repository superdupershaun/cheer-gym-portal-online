import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

// Lucide React icons for a modern look
import { User, Users, Calendar, Settings, ChevronLeft, CheckCircle2, XCircle, BarChart2, Plus, Edit, Trash2, Camera, Image, X } from 'lucide-react';

// --- Global Firebase and App Constants ---
// Use the Firebase configuration provided by the Canvas environment
// --- Global Firebase and App Constants ---
// PLACE YOUR FIREBASE CONFIG HERE:
const firebaseConfig = {
  apiKey: "AIzaSyCCS1fFfmH4Y4tXn6Rv7w4baNYrz5VSFLg",
  authDomain: "gym-check-in-d1bf5.firebaseapp.com",
  projectId: "gym-check-in-d1bf5",
  storageBucket: "gym-check-in-d1bf5.firebasestorage.app",
  messagingSenderId: "667813844333",
  appId: "1:667813844333:web:84e6746664e0540c933664",
  measurementId: "G-K7WD5R8DDB"
};
// End Firebase config

// Use the app ID provided by the Canvas environment, with a fallback
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Use the initial auth token provided by the Canvas environment, with a fallback
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


// --- Firebase Initialization ---
let app;
let db;
let auth;

try {
  // Ensure firebaseConfig is not empty before initializing
  if (Object.keys(firebaseConfig).length > 0 && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    console.error("Firebase configuration is missing or incomplete. Cannot initialize Firebase.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Fallback or error display if Firebase fails to initialize
}

// --- Firestore Collection Paths ---
const publicDataPath = `/artifacts/${appId}/public/data`;
const privateUserDataPath = (userId) => `/artifacts/${appId}/users/${userId}`;

const COLLECTIONS = {
  ATHLETES: 'athletes',
  COACHES: 'coaches',
  CURRENT_CHECKINS: 'current_checkins',
  HISTORICAL_CHECKIN_LOGS: 'historical_checkin_logs',
  APP_METADATA: 'app_metadata' // For seeding check
};

// --- Seed Data ---
const initialSeedData = {
  coaches: [
    { id: 'coach-alex', name: 'Coach Alex', email: 'alex@cheergym.com', phone: '555-111-2222', teams: ['Sparkle Squad', 'Power Pumas'], classes: ['Tumble Basics'], isApproved: true, passcode: '1234' },
    { id: 'coach-jessica', name: 'Coach Jessica', email: 'jessica@cheergym.com', phone: '555-333-4444', teams: ['Power Pumas'], classes: ['Jump Drills'], isApproved: true, passcode: '0000' },
  ],
  athletes: [
    { id: 'athlete-1', name: 'Emily Smith', teams: ['Sparkle Squad', 'Power Pumas'], classes: ['Tumble Basics'], skills: [{ name: 'Back Handspring', status: 'Working On' }], improvementAreas: 'Needs stronger jumps.', coachNotes: [], parentName: 'Sarah Smith', parentPhone: '555-123-4567', parentEmail: 'sarah@example.com', emergencyContactName: 'John Smith', emergencyContactPhone: '555-765-4321', isApproved: true, addedByCoach: 'Coach Alex', profilePicture: 'https://placehold.co/100x100/A0DAFB/FFFFFF?text=ES' },
    { id: 'athlete-2', name: 'Mia Johnson', teams: ['Sparkle Squad'], classes: ['Jump Drills'], skills: [{ name: 'Round-off', status: 'Mastered' }], improvementAreas: 'More flexibility.', coachNotes: [], parentName: 'David Johnson', parentPhone: '555-987-6543', parentEmail: 'david@example.com', emergencyContactName: 'Laura Johnson', emergencyContactPhone: '555-432-1098', isApproved: true, addedByCoach: 'Coach Jessica', profilePicture: 'https://placehold.co/100x100/F0B27A/FFFFFF?text=MJ' },
    { id: 'athlete-3', name: 'Olivia Brown', teams: ['Power Pumas'], classes: ['Tumble Basics'], skills: [{ name: 'Flyer Skills', status: 'Not Started' }], improvementAreas: 'Build confidence.', coachNotes: [], parentName: 'Robert Brown', parentPhone: '555-555-1212', parentEmail: 'robert@example.com', emergencyContactName: 'Maria Brown', emergencyContactPhone: '555-212-5555', isApproved: true, addedByCoach: 'Coach Alex', profilePicture: 'https://placehold.co/100x100/96CEB4/FFFFFF?text=OB' },
    { id: 'athlete-pending-1', name: 'Sophia Miller', teams: ['Sparkle Squad'], classes: [], skills: [], improvementAreas: '', coachNotes: [], parentName: 'Chris Miller', parentPhone: '555-100-2000', parentEmail: 'chris@example.com', emergencyContactName: 'Pat Miller', emergencyContactPhone: '555-200-1000', isApproved: false, addedByCoach: 'Coach Alex', profilePicture: 'https://placehold.co/100x100/DBE2EF/36454F?text=SM' },
  ],
};

const MASTER_PASSCODE = 'cheer123'; // Master admin passcode

// --- Utility Components ---

// A simple loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    <span className="ml-2 text-gray-700">Loading...</span>
  </div>
);

// A customizable modal for messages or confirmations
const Modal = ({ isOpen, title, children, onClose, showCloseButton = true }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto relative transform transition-all scale-100 opacity-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
        {children}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

// A simple toast notification component
const ToastNotification = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />;

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50`}
      role="alert"
    >
      {icon}
      <span className="ml-2">{message}</span>
      <button onClick={onClose} className="ml-4 text-white opacity-90 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
};

// NEW: Generic Confirmation Modal Component
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel} showCloseButton={false}>
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};


// --- Main Application Component ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRole, setUserRole] = useState('none'); // 'none', 'coach', 'admin'
  const [isAuthReady, setIsAuthReady] = useState(false); // Tracks Firebase auth readiness
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showAppToast = useCallback((message, type = 'success', duration = 3000) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    const timer = setTimeout(() => {
      setShowToast(false);
      setToastMessage('');
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  // Firebase Initialization and Auth Listener
  useEffect(() => {
    // Only proceed if app and auth objects are available
    if (!app || !auth) {
      console.error("Firebase app or auth not initialized. Please check Firebase configuration.");
      // Set authReady to true if Firebase isn't configured, to allow UI to proceed (though data won't work)
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        // Seed initial data if not already seeded
        await seedInitialData(user.uid);
        // We'll determine role after successful login via passcode
      } else {
        // Sign in anonymously if no token or user
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Error signing in:", error);
          showAppToast(`Authentication failed: ${error.message}`, 'error');
        }
      }
      setIsAuthReady(true); // Auth state is now ready
    });

    return () => unsubscribe(); // Cleanup auth listener
  }, [auth]); // Depend on 'auth' to re-run if it becomes available later

  // --- Data Seeding Logic ---
  const seedInitialData = async (uid) => {
    if (!db || !uid) return;

    const metadataDocRef = doc(db, privateUserDataPath(uid), COLLECTIONS.APP_METADATA, 'seed_status');
    try {
      const docSnap = await getDoc(metadataDocRef);

      if (!docSnap.exists() || !docSnap.data()?.seeded) {
        console.log("Seeding initial data...");

        const batch = [];

        // Coaches
        for (const coach of initialSeedData.coaches) {
          batch.push(setDoc(doc(db, privateUserDataPath(uid), COLLECTIONS.COACHES, coach.id), coach));
        }
        // Athletes
        for (const athlete of initialSeedData.athletes) {
          batch.push(setDoc(doc(db, privateUserDataPath(uid), COLLECTIONS.ATHLETES, athlete.id), athlete));
        }

        await Promise.all(batch);
        await setDoc(metadataDocRef, { seeded: true, timestamp: new Date() });
        console.log("Initial data seeded successfully.");
      } else {
        console.log("Data already seeded.");
      }
    } catch (e) {
      console.error("Error seeding initial data:", e);
      showAppToast(`Error seeding data: ${e.message}`, 'error');
    }
  };

  // --- Login Logic ---
  const handleLogin = async (passcode) => {
    // Ensure auth and db are initialized before attempting login
    if (!auth || !db || !currentUserId) {
      showAppToast("App is not fully initialized. Please wait or check console for Firebase errors.", 'error');
      return false;
    }

    if (passcode === MASTER_PASSCODE) {
      setIsAuthenticated(true);
      setUserRole('admin');
      showAppToast("Logged in as Admin!");
      return true;
    }

    try {
      // Check if it's a valid coach passcode
      const coachesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES);
      const q = query(coachesRef, where('passcode', '==', passcode), where('isApproved', '==', true));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setIsAuthenticated(true);
        setUserRole('coach');
        showAppToast("Logged in as Coach!");
        return true;
      } else {
        showAppToast("Invalid Passcode.", 'error');
        return false;
      }
    } catch (error) {
      console.error("Error during login:", error);
      showAppToast(`Login error: ${error.message}`, 'error');
      return false;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('none');
    // Optionally sign out from Firebase auth if desired, but for Canvas context,
    // keeping anonymous session active is often fine.
    // auth.signOut();
    showAppToast("Logged out successfully.");
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-600">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col items-center justify-center p-4">
      {!isAuthenticated ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <MainAppContent
          currentUserId={currentUserId}
          userRole={userRole}
          onLogout={handleLogout}
          db={db}
          showAppToast={showAppToast}
        />
      )}
      <ToastNotification message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      {/* Display currentUserId in the UI for multi-user apps as per instructions */}
      {isAuthenticated && (
        <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white bg-opacity-75 p-1 rounded">
          User ID: {currentUserId}
        </div>
      )}
    </div>
  );
}

// --- Login Screen Component ---
const LoginScreen = ({ onLogin }) => {
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await onLogin(passcode);
    if (!success) {
      setPasscode(''); // Clear passcode on failure
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200">
      <h2 className="text-3xl font-extrabold text-center text-indigo-700 mb-6">Cheer Gym Portal</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="passcode" className="block text-sm font-medium text-gray-700 mb-1">
            Enter Passcode
          </label>
          <input
            type="password"
            id="passcode"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg tracking-widest text-center"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            required
            maxLength="10" // Master passcode is 'cheer123' (8 chars), coach passcodes are 4. Max 10 chars is safe.
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold text-lg shadow-md hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ease-in-out transform hover:scale-105"
          disabled={isLoading}
        >
          {isLoading ? 'Logging In...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

// --- Main Application Content (After Login) ---
const MainAppContent = ({ currentUserId, userRole, onLogout, db, showAppToast }) => {
  const [viewMode, setViewMode] = useState('check-in'); // 'check-in' or 'coach-dashboard'

  useEffect(() => {
    if (userRole === 'coach' || userRole === 'admin') {
      setViewMode('coach-dashboard'); // Redirect to coach dashboard if logged in as coach/admin
    } else {
      setViewMode('check-in'); // Default to check-in if somehow not admin/coach
    }
  }, [userRole]);

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 min-h-[80vh] flex flex-col">
      <header className="p-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-t-xl shadow-md flex justify-between items-center">
        <h1 className="text-3xl font-extrabold">Cheer Portal</h1>
        <div className="flex items-center space-x-4">
          {userRole !== 'none' && (
            <span className="text-sm font-medium opacity-80 capitalize">Logged in as {userRole}</span>
          )}
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="flex bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setViewMode('check-in')}
          className={`flex-1 py-3 px-4 text-center font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-200 ${viewMode === 'check-in' ? 'border-b-4 border-indigo-600 text-indigo-700 bg-gray-100' : ''}`}
        >
          <Users className="inline-block mr-2" size={20} /> Check-In
        </button>
        {(userRole === 'coach' || userRole === 'admin') && (
          <button
            onClick={() => setViewMode('coach-dashboard')}
            className={`flex-1 py-3 px-4 text-center font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-200 ${viewMode === 'coach-dashboard' ? 'border-b-4 border-indigo-600 text-indigo-700 bg-gray-100' : ''}`}
        >
          <Settings className="inline-block mr-2" size={20} /> Coach Dashboard
        </button>
        )}
      </nav>

      <main className="flex-1 p-6 overflow-auto">
        {viewMode === 'check-in' && (
          <CheckInMode
            db={db}
            currentUserId={currentUserId}
            showAppToast={showAppToast}
          />
        )}
        {viewMode === 'coach-dashboard' && (userRole === 'coach' || userRole === 'admin') && (
          <CoachDashboard
            db={db}
            currentUserId={currentUserId}
            userRole={userRole}
            showAppToast={showAppToast}
          />
        )}
      </main>
    </div>
  );
};

// --- Check-In Mode Component ---
const CheckInMode = ({ db, currentUserId, showAppToast }) => {
  const [selectedCategory, setSelectedCategory] = useState(null); // 'Team' or 'Class'
  const [selectedEntity, setSelectedEntity] = useState(null); // e.g., 'Sparkle Squad'
  const [athletes, setAthletes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currentCheckins, setCurrentCheckins] = useState([]);
  const [holdingAthleteId, setHoldingAthleteId] = useState(null);
  const [holdProgressMap, setHoldProgressMap] = useState({}); // { athleteId: progressPercentage }
  const holdIntervalRef = useRef({}); // Ref to store interval IDs for each athlete

  const [isMouseDown, setIsMouseDown] = useState(false); // NEW: Track if mouse button is down

  const CHECK_IN_HOLD_TIME = 1000; // 1 second for hold to check-in

  // Fetch teams and classes for selection
  useEffect(() => {
    if (!db || !currentUserId) return;

    const fetchEntities = async () => {
      try {
        const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
        const q = query(athletesRef, where('isApproved', '==', true));
        const querySnapshot = await getDocs(q);

        const allTeams = new Set();
        const allClasses = new Set();

        querySnapshot.forEach(docSnap => {
          const athlete = docSnap.data();
          athlete.teams.forEach(team => allTeams.add(team));
          athlete.classes.forEach(cls => allClasses.add(cls));
        });
        setTeams(Array.from(allTeams).sort());
        setClasses(Array.from(allClasses).sort());
      } catch (error) {
        console.error("Error fetching entities:", error);
        showAppToast(`Error loading teams/classes: ${error.message}`, 'error');
      }
    };
    fetchEntities();
  }, [db, currentUserId, showAppToast]);

  // Fetch athletes based on selected category and entity
  useEffect(() => {
    if (!db || !currentUserId || !selectedCategory || !selectedEntity) {
      setAthletes([]);
      return;
    }

    const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
    let q;
    if (selectedCategory === 'Team') {
      q = query(athletesRef, where('teams', 'array-contains', selectedEntity), where('isApproved', '==', true));
    } else { // Class
      q = query(athletesRef, where('classes', 'array-contains', selectedEntity), where('isApproved', '==', true));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAthletes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort athletes alphabetically by name
      setAthletes(fetchedAthletes.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching athletes:", error);
      showAppToast(`Error loading athletes: ${error.message}`, 'error');
    });

    return () => unsubscribe();
  }, [db, currentUserId, selectedCategory, selectedEntity, showAppToast]);

  // Listen for current check-ins in real-time
  useEffect(() => {
    if (!db || !currentUserId || !selectedCategory || !selectedEntity) {
      setCurrentCheckins([]);
      return;
    }

    const checkinsRef = collection(db, publicDataPath, COLLECTIONS.CURRENT_CHECKINS);
    const q = query(
      checkinsRef,
      where('checkInType', '==', selectedCategory.toLowerCase()),
      where('checkInEntity', '==', selectedEntity)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCheckins = snapshot.docs.map(doc => doc.data());
      setCurrentCheckins(fetchedCheckins);
    }, (error) => {
      console.error("Error fetching current check-ins:", error);
      showAppToast(`Error loading check-ins: ${error.message}`, 'error');
    });

    return () => unsubscribe();
  }, [db, currentUserId, selectedCategory, selectedEntity, showAppToast]);

  // FIX: Add Logging to handleHoldStart
  const handleHoldStart = (athleteId, athleteName) => {
    console.log(`🔥 [Hold Start] Athlete: ${athleteName} (${athleteId})`);

    if (!db || !currentUserId) {
      console.warn("❌ Database or user ID not available.");
      showAppToast("App not ready.", 'error');
      return;
    }

    // Clear existing interval if it exists
    if (holdIntervalRef.current[athleteId]) {
      clearInterval(holdIntervalRef.current[athleteId]);
    }

    setHoldingAthleteId(athleteId);
    setHoldProgressMap(prev => ({ ...prev, [athleteId]: 0 }));

    const startTime = Date.now();

    holdIntervalRef.current[athleteId] = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / CHECK_IN_HOLD_TIME) * 100);
      setHoldProgressMap(prev => ({ ...prev, [athleteId]: progress }));

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current[athleteId]);
        delete holdIntervalRef.current[athleteId];
        console.log(`✅ [Hold Complete] Triggering check-in for ${athleteName}`);
        handleCheckIn(athleteId, athleteName);
        setHoldingAthleteId(null);
      }
    }, 50);
  };

  const handleHoldEnd = (athleteId) => {
    if (holdIntervalRef.current[athleteId]) {
      clearInterval(holdIntervalRef.current[athleteId]);
      delete holdIntervalRef.current[athleteId];
    }
    setHoldingAthleteId(null);
    setHoldProgressMap(prev => ({ ...prev, [athleteId]: 0 })); // Reset progress
  };

  // FIX: Add Logging to handleCheckIn
  const handleCheckIn = async (athleteId, athleteName) => {
    console.log(`📥 [Check-In Start] Athlete: ${athleteName} (${athleteId})`);

    if (!db || !currentUserId || !selectedCategory || !selectedEntity) {
      console.warn("❌ Missing check-in prerequisites:", { db, currentUserId, selectedCategory, selectedEntity });
      showAppToast("Selection incomplete for check-in.", 'error');
      return;
    }

    const timestamp = new Date();
    const checkinsRef = collection(db, publicDataPath, COLLECTIONS.CURRENT_CHECKINS);
    const checkinId = `${athleteId}_${selectedCategory.toLowerCase()}_${selectedEntity}_${timestamp.getTime()}`;
    const checkinData = {
      athleteId,
      athleteName,
      checkInType: selectedCategory.toLowerCase(),
      checkInEntity: selectedEntity,
      timestamp: timestamp.toISOString()
    };

    try {
      await setDoc(doc(checkinsRef, checkinId), checkinData);
      console.log(`✅ [Check-In Success] ${athleteName} checked in`);
      showAppToast(`Checked in ${athleteName} for ${selectedEntity}!`);
    } catch (err) {
      console.error(`🔥 [Check-In Error] ${athleteName}:`, err);
      showAppToast(`Check-in failed: ${err.message}`, 'error');
    }
  };

  const isCheckedIn = (athleteId) => {
    return currentCheckins.some(
      checkin => checkin.athleteId === athleteId &&
      checkin.checkInType === selectedCategory.toLowerCase() &&
      checkin.checkInEntity === selectedEntity
    );
  };

  if (!selectedCategory) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <h2 className="text-3xl font-bold text-center text-gray-800">Select Check-In Category</h2>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full max-w-md">
          <button
            onClick={() => setSelectedCategory('Team')}
            className="flex-1 bg-indigo-500 text-white py-4 px-6 rounded-lg text-xl font-semibold shadow-lg hover:bg-indigo-600 transition duration-300 ease-in-out transform hover:scale-105"
          >
            <Users className="inline-block mr-2" size={24} /> Team
          </button>
          <button
            onClick={() => setSelectedCategory('Class')}
            className="flex-1 bg-purple-500 text-white py-4 px-6 rounded-lg text-xl font-semibold shadow-lg hover:bg-purple-600 transition duration-300 ease-in-out transform hover:scale-105"
          >
            <Calendar className="inline-block mr-2" size={24} /> Class
          </button>
        </div>
      </div>
    );
  }

  if (!selectedEntity) {
    const entities = selectedCategory === 'Team' ? teams : classes;
    return (
      <div className="flex flex-col items-center h-full p-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className="self-start mb-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center hover:bg-gray-300 transition duration-200"
        >
          <ChevronLeft size={20} className="mr-2" /> Back
        </button>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Select {selectedCategory}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
          {entities.length === 0 ? (
            <p className="text-center text-gray-600 col-span-full">No {selectedCategory.toLowerCase()}es available.</p>
          ) : (
            entities.map(entity => (
              <button
                key={entity}
                onClick={() => setSelectedEntity(entity)}
                className="bg-white border border-gray-200 rounded-lg p-4 text-center font-medium shadow hover:shadow-md transition duration-200 transform hover:scale-105 text-lg"
              >
                {entity}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <button
        onClick={() => setSelectedEntity(null)}
        className="self-start mb-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center hover:bg-gray-300 transition duration-200"
      >
        <ChevronLeft size={20} className="mr-2" /> Back to {selectedCategory} Selection
      </button>
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Check-In for: <span className="text-indigo-600">{selectedEntity}</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl mx-auto">
        {athletes.length === 0 ? (
          <p className="text-center text-gray-600 col-span-full">No athletes found for this {selectedCategory.toLowerCase()}.</p>
        ) : (
          athletes.map(athlete => {
            const checkedIn = isCheckedIn(athlete.id);
            const holding = holdingAthleteId === athlete.id;
            const progress = holding ? (holdProgressMap[athlete.id] || 0) : 0;

            return (
              <div
                key={athlete.id}
                className={`relative bg-white rounded-lg p-4 shadow-md overflow-hidden transition-all duration-300 ease-in-out
                  ${checkedIn ? 'border-2 border-green-500 bg-green-50' : 'border border-gray-200'}
                  ${holding ? 'scale-105 shadow-xl' : ''}
                `}
              >
                {/* Progress bar overlay */}
                {holding && (
                  <div
                    className="absolute inset-0 bg-indigo-200 opacity-50 z-0 transition-all duration-50"
                    style={{ width: `${progress}%` }}
                  ></div>
                )}
                {/* FIX: Add console.log on UI Button */}
                <button
                  className={`relative z-10 w-full text-left py-2 px-3 rounded-lg
                    ${checkedIn ? 'text-green-800' : 'text-gray-800'}
                    ${holding ? 'pointer-events-none' : 'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}
                  `}
                  onMouseDown={() => {
                    setIsMouseDown(true); // Set mouse down state
                    console.log("[MouseDown] Start hold");
                    handleHoldStart(athlete.id, athlete.name);
                  }}
                  onMouseUp={() => {
                    setIsMouseDown(false); // Clear mouse down state
                    console.log("[MouseUp] End hold");
                    handleHoldEnd(athlete.id);
                  }}
                  onMouseLeave={() => {
                    // Only end hold if mouse is not still down
                    if (!isMouseDown) {
                      console.log("[MouseLeave] Cancel hold (mouse up)");
                      handleHoldEnd(athlete.id);
                    } else {
                      console.log("[MouseLeave] Mouse still down, not canceling hold.");
                    }
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    console.log("[TouchStart] Start hold");
                    handleHoldStart(athlete.id, athlete.name);
                  }}
                  onTouchEnd={() => {
                    console.log("[TouchEnd] End hold");
                    handleHoldEnd(athlete.id);
                  }}
                  onTouchCancel={() => {
                    console.log("[TouchCancel] Cancel hold");
                    handleHoldEnd(athlete.id);
                  }}
                >
                  <div className="flex items-center">
                    <img
                      src={athlete.profilePicture || `https://placehold.co/50x50/cccccc/333333?text=${athlete.name.charAt(0)}}`}
                      alt={athlete.name}
                      className="w-12 h-12 rounded-full mr-4 object-cover border border-gray-300"
                    />
                    <span className="text-xl font-semibold truncate">{athlete.name}</span>
                    {checkedIn && (
                      <CheckCircle2 className="ml-auto text-green-600" size={24} />
                    )}
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- Coach Dashboard Component ---
const CoachDashboard = ({ db, currentUserId, userRole, showAppToast }) => {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'athlete-profiles', 'coach-management', 'check-in-logs'
  const [isResetting, setIsResetting] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);
  const resetIntervalRef = useRef(null);

  const RESET_HOLD_TIME = 3000; // 3 seconds to hold for reset

  const handleResetHoldStart = () => {
    setIsResetting(true);
    setResetProgress(0);
    const startTime = Date.now();

    resetIntervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      // FIX: Changed 'elapsed' to 'elapsedTime'
      const progress = Math.min(100, (elapsedTime / RESET_HOLD_TIME) * 100); 
      setResetProgress(progress);

      if (progress === 100) {
        clearInterval(resetIntervalRef.current);
        resetIntervalRef.current = null;
        resetDailyCheckins();
        setIsResetting(false);
      }
    }, 50);
  };

  const handleResetHoldEnd = () => {
    if (resetIntervalRef.current) {
      clearInterval(resetIntervalRef.current);
      resetIntervalRef.current = null;
    }
    setIsResetting(false);
    setResetProgress(0);
  };

  const resetDailyCheckins = async () => {
    if (!db || !currentUserId) {
      showAppToast("App not ready.", 'error');
      return;
    }
    showAppToast("Attempting to reset daily check-ins...", 'info');
    console.log("Attempting to reset daily check-ins...");
    try {
      const currentCheckinsRef = collection(db, publicDataPath, COLLECTIONS.CURRENT_CHECKINS);
      console.log("Fetching current check-ins for reset...");
      const querySnapshot = await getDocs(currentCheckinsRef);
      console.log(`Found ${querySnapshot.docs.length} check-ins to process.`);

      const checkinEventsToLog = [];
      const batchDelete = [];

      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        checkinEventsToLog.push(data); // Collect data for historical log
        batchDelete.push(deleteDoc(doc(currentCheckinsRef, docSnap.id)));
      });

      console.log("Executing batch delete for current check-ins...");
      await Promise.all(batchDelete); // Execute all deletions
      console.log("Current check-ins successfully deleted.");

      // Log to historical records if there were any check-ins
      if (checkinEventsToLog.length > 0) {
        console.log("Logging to historical records...");
        const historicalLogsRef = collection(db, publicDataPath, COLLECTIONS.HISTORICAL_CHECKIN_LOGS);
        await addDoc(historicalLogsRef, {
          timestamp: new Date().toISOString(),
          resetByUserId: currentUserId,
          dailyCheckInEvents: checkinEventsToLog.map(({ athleteId, athleteName, checkInType, checkInEntity, timestamp }) => ({
            athleteId,
            athleteName,
            checkInType,
            checkInEntity,
            timestamp
          })), // Remove individual checkin ID
        });
        console.log("Historical log added successfully.");
      } else {
        console.log("No current check-ins to log historically.");
      }

      showAppToast("Daily check-ins reset and logged!");
      console.log("Daily check-ins reset and logged successfully.");
    } catch (error) {
      console.error("Error resetting daily check-ins:", error);
      showAppToast(`Failed to reset: ${error.message}`, 'error');
    } finally {
      // Ensure state is reset regardless of success or failure
      setIsResetting(false);
      setResetProgress(0);
      console.log("Reset state cleanup complete.");
    }
  };

  const isAdminUser = userRole === 'admin'; // Explicitly define for disabled prop

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-center mb-6">
        <button
          className={`relative bg-red-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out transform ${isResetting ? 'scale-105' : 'hover:scale-105'} overflow-hidden`}
          onMouseDown={handleResetHoldStart}
          onMouseUp={handleResetHoldEnd}
          onMouseLeave={handleResetHoldEnd}
          onTouchStart={(e) => { e.preventDefault(); handleResetHoldStart(); }}
          onTouchEnd={handleResetHoldEnd}
          onTouchCancel={handleResetHoldEnd}
          disabled={!isAdminUser} // Only admin can reset
        >
          {isResetting && (
            <div
              className="absolute inset-0 bg-red-800 opacity-50 z-0 transition-all duration-50"
              style={{ width: `${resetProgress}%` }} // FIX: Use resetProgress here
            ></div>
          )}
          <span className="relative z-10">
            {isResetting ? `Hold to Reset (${Math.round(resetProgress)}%)` : 'Reset Daily Check-ins'}
          </span>
          {!isAdminUser && (
            <span className="absolute inset-0 flex items-center justify-center text-xs bg-gray-500 bg-opacity-75 rounded-full z-20">Admin Only</span>
          )}
        </button>
      </div>

      <nav className="flex bg-gray-50 border-b border-gray-200 rounded-t-lg overflow-hidden mb-6">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-3 px-4 text-center font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-200 ${activeTab === 'attendance' ? 'border-b-4 border-indigo-600 text-indigo-700 bg-gray-100' : ''}`}
        >
          <BarChart2 className="inline-block mr-2" size={20} /> Attendance
        </button>
        <button
          onClick={() => setActiveTab('athlete-profiles')}
          className={`flex-1 py-3 px-4 text-center font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-200 ${activeTab === 'athlete-profiles' ? 'border-b-4 border-indigo-600 text-indigo-700 bg-gray-100' : ''}`}
        >
          <User className="inline-block mr-2" size={20} /> Athlete Profiles
        </button>
        <button
          onClick={() => setActiveTab('coach-management')}
          className={`flex-1 py-3 px-4 text-center font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-200 ${activeTab === 'coach-management' ? 'border-b-4 border-indigo-600 text-indigo-700 bg-gray-100' : ''}`}
        >
          <Users className="inline-block mr-2" size={20} /> Coach Management
        </button>
        <button
          onClick={() => setActiveTab('check-in-logs')}
          className={`flex-1 py-3 px-4 text-center font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-200 ${activeTab === 'check-in-logs' ? 'border-b-4 border-indigo-600 text-indigo-700 bg-gray-100' : ''}`}
        >
          <Calendar className="inline-block mr-2" size={20} /> Check-in Logs
        </button>
      </nav>

      <div className="flex-1 overflow-auto bg-white rounded-b-xl p-4 shadow-inner">
        {activeTab === 'attendance' && <AttendanceView db={db} currentUserId={currentUserId} showAppToast={showAppToast} />}
        {activeTab === 'athlete-profiles' && <AthleteProfiles db={db} currentUserId={currentUserId} userRole={userRole} showAppToast={showAppToast} />}
        {activeTab === 'coach-management' && <CoachManagement db={db} currentUserId={currentUserId} userRole={userRole} showAppToast={showAppToast} />}
        {activeTab === 'check-in-logs' && <CheckinLogs db={db} currentUserId={currentUserId} userRole={userRole} showAppToast={showAppToast} />}
      </div>
    </div>
  );
};

// --- Attendance View Component ---
const AttendanceView = ({ db, currentUserId, showAppToast }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [teams, setTeams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [athletes, setAthletes] = useState([]); // Athletes belonging to selected entity
  const [currentCheckins, setCurrentCheckins] = useState([]); // Check-ins for *today*

  // Fetch teams and classes for selection
  useEffect(() => {
    if (!db || !currentUserId) return;
    const fetchEntities = async () => {
      try {
        const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
        const q = query(athletesRef, where('isApproved', '==', true));
        const querySnapshot = await getDocs(q);

        const allTeams = new Set();
        const allClasses = new Set();

        querySnapshot.forEach(docSnap => {
          const athlete = docSnap.data();
          athlete.teams.forEach(team => allTeams.add(team));
          athlete.classes.forEach(cls => allClasses.add(cls));
        });
        setTeams(Array.from(allTeams).sort());
        setClasses(Array.from(allClasses).sort());
      } catch (error) {
        console.error("Error fetching entities:", error);
        showAppToast(`Error loading teams/classes: ${error.message}`, 'error');
      }
    };
    fetchEntities();
  }, [db, currentUserId, showAppToast]);

  // Listen for athletes in selected entity
  useEffect(() => {
    if (!db || !currentUserId || !selectedCategory || !selectedEntity) {
      setAthletes([]);
      return;
    }
    const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
    let q;
    if (selectedCategory === 'Team') {
      q = query(athletesRef, where('teams', 'array-contains', selectedEntity), where('isApproved', '==', true));
    } else { // Class
      q = query(athletesRef, where('classes', 'array-contains', selectedEntity), where('isApproved', '==', true));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAthletes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAthletes(fetchedAthletes.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching athletes for attendance:", error);
      showAppToast(`Error loading athletes: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, currentUserId, selectedCategory, selectedEntity, showAppToast]);

  // Listen for current daily check-ins
  useEffect(() => {
    if (!db || !currentUserId || !selectedCategory || !selectedEntity) {
      setCurrentCheckins([]);
      return;
    }
    const checkinsRef = collection(db, publicDataPath, COLLECTIONS.CURRENT_CHECKINS);
    const q = query(
      checkinsRef,
      where('checkInType', '==', selectedCategory.toLowerCase()),
      where('checkInEntity', '==', selectedEntity)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCheckins = snapshot.docs.map(doc => doc.data());
      setCurrentCheckins(fetchedCheckins);
    }, (error) => {
      console.error("Error fetching current check-ins:", error);
      showAppToast(`Error loading check-ins: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, currentUserId, selectedCategory, selectedEntity, showAppToast]);

  const getAthleteStatus = (athleteId) => {
    const checkins = currentCheckins.filter(c => c.athleteId === athleteId);
    if (checkins.length > 0) {
      const lastCheckin = checkins.reduce((prev, current) =>
        new Date(prev.timestamp) > new Date(current.timestamp) ? prev : current
      );
      return {
        status: 'Checked In',
        lastCheckinTime: new Date(lastCheckin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        activities: checkins.map(c => `${c.checkInEntity} (${new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`).join(', ')
      };
    }
    return { status: 'Not Checked In', lastCheckinTime: 'N/A', activities: 'N/A' };
  };

  if (!selectedCategory) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800">Select Category to View Attendance</h3>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full max-w-md">
          <button
            onClick={() => setSelectedCategory('Team')}
            className="flex-1 bg-indigo-500 text-white py-4 px-6 rounded-lg text-xl font-semibold shadow-lg hover:bg-indigo-600 transition duration-300 ease-in-out transform hover:scale-105"
          >
            <Users className="inline-block mr-2" size={24} /> Team
          </button>
          <button
            onClick={() => setSelectedCategory('Class')}
            className="flex-1 bg-purple-500 text-white py-4 px-6 rounded-lg text-xl font-semibold shadow-lg hover:bg-purple-600 transition duration-300 ease-in-out transform hover:scale-105"
          >
            <Calendar className="inline-block mr-2" size={24} /> Class
          </button>
        </div>
      </div>
    );
  }

  if (!selectedEntity) {
    const entities = selectedCategory === 'Team' ? teams : classes;
    return (
      <div className="flex flex-col items-center h-full p-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className="self-start mb-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center hover:bg-gray-300 transition duration-200"
        >
          <ChevronLeft size={20} className="mr-2" /> Back
        </button>
        <h3 className="text-2xl font-semibold text-center text-gray-800 mb-6">Select {selectedCategory}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
          {entities.length === 0 ? (
            <p className="text-center text-gray-600 col-span-full">No {selectedCategory.toLowerCase()}es available.</p>
          ) : (
            entities.map(entity => (
              <button
                key={entity}
                onClick={() => setSelectedEntity(entity)}
                className="bg-white border border-gray-200 rounded-lg p-4 text-center font-medium shadow hover:shadow-md transition duration-200 transform hover:scale-105 text-lg"
              >
                {entity}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <button
        onClick={() => setSelectedEntity(null)}
        className="self-start mb-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center hover:bg-gray-300 transition duration-200"
      >
        <ChevronLeft size={20} className="mr-2" /> Back to {selectedCategory} Selection
      </button>
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Attendance for: <span className="text-indigo-600">{selectedEntity}</span>
      </h2>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Check-in</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {athletes.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  No athletes found for this {selectedCategory.toLowerCase()}.
                </td>
              </tr>
            ) : (
              athletes.map(athlete => {
                const { status, lastCheckinTime, activities } = getAthleteStatus(athlete.id);
                const isCheckedIn = status === 'Checked In';
                return (
                  <tr key={athlete.id} className={isCheckedIn ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                      <img
                        src={athlete.profilePicture || `https://placehold.co/30x30/cccccc/333333?text=${athlete.name.charAt(0)}`}
                        alt={athlete.name}
                        className="w-8 h-8 rounded-full mr-3 object-cover border border-gray-200"
                      />
                      {athlete.name}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isCheckedIn ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}`}>
                      {status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lastCheckinTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {activities}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// --- Athlete Profiles Component ---
const AthleteProfiles = ({ db, currentUserId, userRole, showAppToast }) => {
  const [athletes, setAthletes] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null); // null or athlete object for editing
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState(null);

  // Fetch athletes in real-time
  useEffect(() => {
    if (!db || !currentUserId) return;
    const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
    const unsubscribe = onSnapshot(athletesRef, (snapshot) => {
      const fetchedAthletes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAthletes(fetchedAthletes.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching athletes:", error);
      showAppToast(`Error loading athletes: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, currentUserId, showAppToast]);

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(filterText.toLowerCase()) ||
    athlete.teams.some(team => team.toLowerCase().includes(filterText.toLowerCase())) ||
    athlete.classes.some(cls => cls.toLowerCase().includes(filterText.toLowerCase()))
  );

  const handleAddAthleteClick = () => {
    setEditingAthlete(null); // Ensure we are adding, not editing
    setShowAddAthleteModal(true);
  };

  const handleEditAthleteClick = (athlete) => {
    setEditingAthlete(athlete);
    setShowAddAthleteModal(true);
  };

  const handleDeleteAthleteClick = (athlete) => {
    setAthleteToDelete(athlete);
    setConfirmDelete(true);
  };

  const confirmDeleteAthlete = async () => {
    if (!db || !currentUserId || !athleteToDelete) return;

    try {
      await deleteDoc(doc(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES, athleteToDelete.id));
      showAppToast(`Athlete ${athleteToDelete.name} deleted successfully!`);
    } catch (error) {
      console.error("Error deleting athlete:", error);
      showAppToast(`Failed to delete athlete: ${error.message}`, 'error');
    } finally {
      setConfirmDelete(false);
      setAthleteToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Athlete Profiles</h3>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <input
          type="text"
          placeholder="Filter athletes by name, team, or class..."
          className="w-full sm:w-2/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        {(userRole === 'coach' || userRole === 'admin') && (
          <button
            onClick={handleAddAthleteClick}
            className="w-full sm:w-auto bg-indigo-600 text-white py-2 px-6 rounded-lg font-semibold shadow-md hover:bg-indigo-700 flex items-center justify-center transition duration-200"
          >
            <Plus size={20} className="mr-2" /> Add New Athlete
          </button>
        )}
      </div>

      {filteredAthletes.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No athletes found matching your criteria.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAthletes.map(athlete => (
            <div key={athlete.id} className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col">
              <div className="flex items-center mb-4">
                <img
                  src={athlete.profilePicture || `https://placehold.co/80x80/cccccc/333333?text=${athlete.name.charAt(0)}`}
                  alt={athlete.name}
                  className="w-20 h-20 rounded-full mr-4 object-cover border-2 border-indigo-300"
                />
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{athlete.name}</h4>
                  <p className={`text-sm font-semibold ${athlete.isApproved ? 'text-green-600' : 'text-red-600'}`}>
                    {athlete.isApproved ? 'Approved' : 'Pending Approval'}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-2"><span className="font-semibold">Teams:</span> {athlete.teams.join(', ') || 'N/A'}</p>
              <p className="text-gray-700 mb-2"><span className="font-semibold">Classes:</span> {athlete.classes.join(', ') || 'N/A'}</p>
              <p className="text-gray-700 mb-4"><span className="font-semibold">Improvement Areas:</span> {athlete.improvementAreas || 'N/A'}</p>

              {/* Skills Section */}
              {athlete.skills && athlete.skills.length > 0 && (
                <div className="mb-4">
                  <p className="font-semibold text-gray-800 mb-2">Skills Progress:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {athlete.skills.map((skill, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        {skill.name}: <span className={`font-semibold ${skill.status === 'Mastered' ? 'text-green-600' : skill.status === 'Working On' ? 'text-blue-600' : 'text-gray-600'}`}>{skill.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coach Notes Section */}
              {athlete.coachNotes && athlete.coachNotes.length > 0 && (
                <div className="mb-4">
                  <p className="font-semibold text-gray-800 mb-2">Coach Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {athlete.coachNotes.map((note, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        {note.date}: {note.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-auto flex justify-end space-x-2 pt-4 border-t border-gray-100">
                {(userRole === 'coach' || userRole === 'admin') && (
                  <>
                    <button
                      onClick={() => handleEditAthleteClick(athlete)}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="Edit Athlete"
                    >
                      <Edit size={20} />
                    </button>
                    {userRole === 'admin' && ( // Only admin can delete
                      <button
                        onClick={() => handleDeleteAthleteClick(athlete)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete Athlete"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddAthleteModal && (
        <AthleteFormModal
          db={db}
          currentUserId={currentUserId}
          showAppToast={showAppToast}
          onClose={() => setShowAddAthleteModal(false)}
          athleteToEdit={editingAthlete}
          userRole={userRole}
        />
      )}

      <ConfirmationModal
        isOpen={confirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete athlete ${athleteToDelete?.name}? This action cannot be undone.`}
        onConfirm={confirmDeleteAthlete}
        onCancel={() => setConfirmDelete(false)}
        confirmText="Delete"
      />
    </div>
  );
};


// --- Athlete Form Modal (Add/Edit Athlete) ---
const AthleteFormModal = ({ db, currentUserId, showAppToast, onClose, athleteToEdit, userRole }) => {
  const [name, setName] = useState('');
  const [teams, setTeams] = useState(''); // Comma-separated string
  const [classes, setClasses] = useState(''); // Comma-separated string
  const [skills, setSkills] = useState([{ name: '', status: 'Not Started' }]);
  const [improvementAreas, setImprovementAreas] = useState('');
  const [coachNotes, setCoachNotes] = useState([]); // Array of {date, text}
  const [newNoteText, setNewNoteText] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');

  const isEditing = !!athleteToEdit;

  useEffect(() => {
    if (athleteToEdit) {
      setName(athleteToEdit.name || '');
      setTeams(athleteToEdit.teams ? athleteToEdit.teams.join(', ') : '');
      setClasses(athleteToEdit.classes ? athleteToEdit.classes.join(', ') : '');
      setSkills(athleteToEdit.skills && athleteToEdit.skills.length > 0 ? athleteToEdit.skills : [{ name: '', status: 'Not Started' }]);
      setImprovementAreas(athleteToEdit.improvementAreas || '');
      setCoachNotes(athleteToEdit.coachNotes || []);
      setParentName(athleteToEdit.parentName || '');
      setParentPhone(athleteToEdit.parentPhone || '');
      setParentEmail(athleteToEdit.parentEmail || '');
      setEmergencyContactName(athleteToEdit.emergencyContactName || '');
      setEmergencyContactPhone(athleteToEdit.emergencyContactPhone || '');
      setIsApproved(athleteToEdit.isApproved || false);
      setProfilePicture(athleteToEdit.profilePicture || '');
    }
  }, [athleteToEdit]);

  const handleAddSkill = () => {
    setSkills([...skills, { name: '', status: 'Not Started' }]);
  };

  const handleSkillChange = (index, field, value) => {
    const newSkills = [...skills];
    newSkills[index][field] = value;
    setSkills(newSkills);
  };

  const handleRemoveSkill = (index) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setSkills(newSkills);
  };

  const handleAddNote = () => {
    if (newNoteText.trim()) {
      const newNote = {
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        text: newNoteText.trim()
      };
      setCoachNotes([...coachNotes, newNote]);
      setNewNoteText('');
    }
  };

  const handleRemoveNote = (index) => {
    const newNotes = coachNotes.filter((_, i) => i !== index);
    setCoachNotes(newNotes);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!db || !currentUserId) {
      showAppToast("App not ready.", 'error');
      return;
    }

    const athleteData = {
      name: name.trim(),
      teams: teams.split(',').map(t => t.trim()).filter(Boolean),
      classes: classes.split(',').map(c => c.trim()).filter(Boolean),
      skills: skills.filter(s => s.name.trim()),
      improvementAreas: improvementAreas.trim(),
      coachNotes: coachNotes,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      isApproved: isApproved,
      profilePicture: profilePicture || `https://placehold.co/100x100/cccccc/333333?text=${name.charAt(0)}`,
    };

    try {
      if (isEditing) {
        await setDoc(doc(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES, athleteToEdit.id), athleteData);
        showAppToast(`Athlete ${name} updated successfully!`);
      } else {
        // Add athlete without a specific ID, let Firestore generate one
        await addDoc(collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES), {
          ...athleteData,
          addedByCoach: userRole === 'coach' ? 'Coach' : 'Admin', // Track who added/approved
        });
        showAppToast(`Athlete ${name} added successfully!`);
      }
      onClose();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} athlete:`, error);
      showAppToast(`Failed to ${isEditing ? 'update' : 'add'} athlete: ${error.message}`, 'error');
    }
  };

  return (
    <Modal isOpen={true} title={isEditing ? "Edit Athlete Profile" : "Add New Athlete"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Athlete Name</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Profile Picture URL (optional)</label>
          <input type="url" id="profilePicture" value={profilePicture} onChange={(e) => setProfilePicture(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            {profilePicture && (
              <img src={profilePicture} alt="Profile Preview" className="w-20 h-20 rounded-full mt-2 object-cover" />
            )}
        </div>
        <div>
          <label htmlFor="teams" className="block text-sm font-medium text-gray-700">Teams (comma-separated)</label>
          <input type="text" id="teams" value={teams} onChange={(e) => setTeams(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label htmlFor="classes" className="block text-sm font-medium text-gray-700">Classes (comma-separated)</label>
          <input type="text" id="classes" value={classes} onChange={(e) => setClasses(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label htmlFor="improvementAreas" className="block text-sm font-medium text-gray-700">Improvement Areas</label>
          <textarea id="improvementAreas" value={improvementAreas} onChange={(e) => setImprovementAreas(e.target.value)} rows="3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>

        {/* Skills Section */}
        <div className="border border-gray-200 rounded-md p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Skills Progress</h4>
          {skills.map((skill, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                placeholder="Skill Name"
                value={skill.name}
                onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              />
              <select
                value={skill.status}
                onChange={(e) => handleSkillChange(index, 'status', e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              >
                <option value="Not Started">Not Started</option>
                <option value="Working On">Working On</option>
                <option value="Mastered">Mastered</option>
              </select>
              <button type="button" onClick={() => handleRemoveSkill(index)} className="text-red-500 hover:text-red-700">
                <X size={18} />
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddSkill} className="mt-2 bg-gray-200 text-gray-700 py-1 px-3 rounded-md text-sm hover:bg-gray-300">
            Add Skill
          </button>
        </div>

        {/* Coach Notes Section */}
        <div className="border border-gray-200 rounded-md p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Coach Notes</h4>
          {coachNotes.map((note, index) => (
            <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md mb-2">
              <span className="text-sm text-gray-700">{note.date}: {note.text}</span>
              <button type="button" onClick={() => handleRemoveNote(index)} className="text-red-500 hover:text-red-700">
                <X size={16} />
              </button>
            </div>
          ))}
          <div className="flex space-x-2 mt-2">
            <input
              type="text"
              placeholder="Add new note"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 text-sm"
            />
            <button type="button" onClick={handleAddNote} className="bg-blue-500 text-white py-1 px-3 rounded-md text-sm hover:bg-blue-600">
              Add
            </button>
          </div>
        </div>

        {/* Parent/Emergency Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">Parent/Guardian Name</label>
            <input type="text" id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700">Parent/Guardian Phone</label>
            <input type="tel" id="parentPhone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700">Parent/Guardian Email</label>
            <input type="email" id="parentEmail" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
            <input type="text" id="emergencyContactName" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
            <input type="tel" id="emergencyContactPhone" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
        </div>

        {userRole === 'admin' && ( // Only admin can approve/disapprove
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isApproved"
              checked={isApproved}
              onChange={(e) => setIsApproved(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isApproved" className="ml-2 block text-sm text-gray-900">Approved</label>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition">
            Cancel
          </button>
          <button type="submit"
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition">
            {isEditing ? 'Save Changes' : 'Add Athlete'}
          </button>
        </div>
      </form>
    </Modal>
  );
};


// --- Coach Management Component ---
const CoachManagement = ({ db, currentUserId, userRole, showAppToast }) => {
  const [coaches, setCoaches] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null); // null or coach object for editing
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [coachToDelete, setCoachToDelete] = useState(null);

  // Fetch coaches in real-time
  useEffect(() => {
    if (!db || !currentUserId) return;
    const coachesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES);
    const unsubscribe = onSnapshot(coachesRef, (snapshot) => {
      const fetchedCoaches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoaches(fetchedCoaches.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching coaches:", error);
      showAppToast(`Error loading coaches: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, currentUserId, showAppToast]);

  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(filterText.toLowerCase()) ||
    coach.email.toLowerCase().includes(filterText.toLowerCase()) ||
    coach.teams.some(team => team.toLowerCase().includes(filterText.toLowerCase())) ||
    coach.classes.some(cls => cls.toLowerCase().includes(filterText.toLowerCase()))
  );

  const handleAddCoachClick = () => {
    setEditingCoach(null);
    setShowAddCoachModal(true);
  };

  const handleEditCoachClick = (coach) => {
    setEditingCoach(coach);
    setShowAddCoachModal(true);
  };

  const handleDeleteCoachClick = (coach) => {
    setCoachToDelete(coach);
    setConfirmDelete(true);
  };

  const confirmDeleteCoach = async () => {
    if (!db || !currentUserId || !coachToDelete) return;

    try {
      await deleteDoc(doc(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES, coachToDelete.id));
      showAppToast(`Coach ${coachToDelete.name} deleted successfully!`);
    } catch (error) {
      console.error("Error deleting coach:", error);
      showAppToast(`Failed to delete coach: ${error.message}`, 'error');
    } finally {
      setConfirmDelete(false);
      setCoachToDelete(null);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="text-center py-10 text-gray-600">
        <p className="text-lg font-semibold">Admin access required to manage coaches.</p>
        <p className="text-sm">Please log in as an administrator to view this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Coach Management</h3>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <input
          type="text"
          placeholder="Filter coaches by name, email, team, or class..."
          className="w-full sm:w-2/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <button
          onClick={handleAddCoachClick}
          className="w-full sm:w-auto bg-indigo-600 text-white py-2 px-6 rounded-lg font-semibold shadow-md hover:bg-indigo-700 flex items-center justify-center transition duration-200"
        >
          <Plus size={20} className="mr-2" /> Add New Coach
        </button>
      </div>

      {filteredCoaches.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No coaches found matching your criteria.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map(coach => (
            <div key={coach.id} className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col">
              <h4 className="text-xl font-bold text-gray-900 mb-2">{coach.name}</h4>
              <p className="text-gray-700 text-sm mb-1">Email: {coach.email}</p>
              <p className="text-700 text-sm mb-2">Phone: {coach.phone}</p>
              <p className="text-gray-700 text-sm mb-2"><span className="font-semibold">Passcode:</span> {coach.passcode}</p>
              <p className={`text-sm font-semibold mb-2 ${coach.isApproved ? 'text-green-600' : 'text-red-600'}`}>
                {coach.isApproved ? 'Approved' : 'Pending Approval'}
              </p>
              <p className="text-gray-700 text-sm mb-2"><span className="font-semibold">Teams:</span> {coach.teams.join(', ') || 'N/A'}</p>
              <p className="text-gray-700 text-sm mb-4"><span className="font-semibold">Classes:</span> {coach.classes.join(', ') || 'N/A'}</p>

              <div className="mt-auto flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEditCoachClick(coach)}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                  title="Edit Coach"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDeleteCoachClick(coach)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete Coach"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddCoachModal && (
        <CoachFormModal
          db={db}
          currentUserId={currentUserId}
          showAppToast={showAppToast}
          onClose={() => setShowAddCoachModal(false)}
          coachToEdit={editingCoach}
        />
      )}

      <ConfirmationModal
        isOpen={confirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete coach ${coachToDelete?.name}? This action cannot be undone.`}
        onConfirm={confirmDeleteCoach}
        onCancel={() => setConfirmDelete(false)}
        confirmText="Delete"
      />
    </div>
  );
};

// --- Coach Form Modal (Add/Edit Coach) ---
const CoachFormModal = ({ db, currentUserId, showAppToast, onClose, coachToEdit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [teams, setTeams] = useState(''); // Comma-separated string
  const [classes, setClasses] = useState(''); // Comma-separated string
  const [isApproved, setIsApproved] = useState(false);

  const isEditing = !!coachToEdit;

  useEffect(() => {
    if (coachToEdit) {
      setName(coachToEdit.name || '');
      setEmail(coachToEdit.email || '');
      setPhone(coachToEdit.phone || '');
      setPasscode(coachToEdit.passcode || '');
      setTeams(coachToEdit.teams ? coachToEdit.teams.join(', ') : '');
      setClasses(coachToEdit.classes ? coachToEdit.classes.join(', ') : '');
      setIsApproved(coachToEdit.isApproved || false);
    }
  }, [coachToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!db || !currentUserId) {
      showAppToast("App not ready.", 'error');
      return;
    }

    const coachData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      passcode: passcode.trim(),
      teams: teams.split(',').map(t => t.trim()).filter(Boolean),
      classes: classes.split(',').map(c => c.trim()).filter(Boolean),
      isApproved: isApproved,
    };

    try {
      if (isEditing) {
        await setDoc(doc(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES, coachToEdit.id), coachData);
        showAppToast(`Coach ${name} updated successfully!`);
      } else {
        // For new coaches, generate a simple ID if none provided, or use a specific one
        const coachId = `coach-${Date.now()}`; // Simple unique ID
        await setDoc(doc(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES, coachId), coachData);
        showAppToast(`Coach ${name} added successfully!`);
      }
      onClose();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} coach:`, error);
      showAppToast(`Failed to ${isEditing ? 'update' : 'add'} coach: ${error.message}`, 'error');
    }
  };

  return (
    <Modal isOpen={true} title={isEditing ? "Edit Coach Profile" : "Add New Coach"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="coachName" className="block text-sm font-medium text-gray-700">Coach Name</label>
          <input type="text" id="coachName" value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label htmlFor="coachEmail" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" id="coachEmail" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label htmlFor="coachPhone" className="block text-sm font-medium text-gray-700">Phone</label>
          <input type="tel" id="coachPhone" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label htmlFor="coachPasscode" className="block text-sm font-medium text-gray-700">Passcode</label>
          <input type="text" id="coachPasscode" value={passcode} onChange={(e) => setPasscode(e.target.value)} required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label htmlFor="coachTeams" className="block text-sm font-medium text-gray-700">Teams (comma-separated)</label>
          <input type="text" id="coachTeams" value={teams} onChange={(e) => setTeams(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label htmlFor="coachClasses" className="block text-sm font-medium text-gray-700">Classes (comma-separated)</label>
          <input type="text" id="coachClasses" value={classes} onChange={(e) => setClasses(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="coachIsApproved"
            checked={isApproved}
            onChange={(e) => setIsApproved(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="coachIsApproved" className="ml-2 block text-sm text-gray-900">Approved</label>
        </div>
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition">
            Cancel
          </button>
          <button type="submit"
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition">
            {isEditing ? 'Save Changes' : 'Add Coach'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// --- Check-in Logs Component ---
const CheckinLogs = ({ db, currentUserId, userRole, showAppToast }) => {
  const [historicalLogs, setHistoricalLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null); // For viewing details of a specific daily log

  useEffect(() => {
    if (!db || !currentUserId) return;
    const logsRef = collection(db, publicDataPath, COLLECTIONS.HISTORICAL_CHECKIN_LOGS);
    const unsubscribe = onSnapshot(logsRef, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort logs by timestamp in descending order (most recent first)
      setHistoricalLogs(fetchedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    }, (error) => {
      console.error("Error fetching historical check-in logs:", error);
      showAppToast(`Error loading logs: ${e.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, currentUserId, showAppToast]);

  const viewLogDetails = (log) => {
    setSelectedLog(log);
  };

  if (userRole !== 'admin') {
    return (
      <div className="text-center py-10 text-gray-600">
        <p className="text-lg font-semibold">Admin access required to view check-in logs.</p>
        <p className="text-sm">Please log in as an administrator to view this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Daily Check-in Logs</h3>

      {historicalLogs.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No historical check-in logs available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {historicalLogs.map(log => (
            <div key={log.id} className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col">
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Log Date: {new Date(log.timestamp).toLocaleDateString()}
              </h4>
              <p className="text-gray-700 text-sm mb-2">
                Reset By: {log.resetByUserId || 'N/A'}
              </p>
              <p className="text-gray-700 text-sm mb-4">
                Total Check-ins: {log.dailyCheckInEvents?.length || 0}
              </p>
              <div className="mt-auto flex justify-end">
                <button
                  onClick={() => viewLogDetails(log)}
                  className="bg-indigo-500 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-indigo-600 transition"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLog && (
        <Modal isOpen={true} title={`Check-in Log Details for ${new Date(selectedLog.timestamp).toLocaleDateString()}`} onClose={() => setSelectedLog(null)}>
          <div className="max-h-[60vh] overflow-y-auto">
            <p className="text-gray-700 mb-4"><strong>Total Athletes Checked In:</strong> {selectedLog.dailyCheckInEvents?.length || 0}</p>
            {selectedLog.dailyCheckinEvents && selectedLog.dailyCheckinEvents.length > 0 ? (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
                {selectedLog.dailyCheckInEvents.map((event, index) => (
                  <li key={index} className="p-3">
                    <p className="font-semibold text-gray-800">{event.athleteName}</p>
                    <p className="text-sm text-gray-600">
                      Type: <span className="capitalize">{event.checkInType}</span>, Entity: {event.checkInEntity}
                    </p>
                    <p className="text-xs text-gray-500">
                      Time: {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-center">No check-ins recorded for this log.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
