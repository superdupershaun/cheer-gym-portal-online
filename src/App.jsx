import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

// Lucide React icons for a modern look
import { User, Users, Calendar, Settings, ChevronLeft, CheckCircle2, XCircle, BarChart2, Plus, Edit, Trash2, Camera, Image, X } from 'lucide-react';

// --- Global Firebase and App Constants ---
// Use the Firebase configuration provided by the Canvas environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

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
                      src={athlete.profilePicture || `https://placehold.co/50x50/cccccc/333333?text=${athlete.name.charAt(0)}`}
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
      <h3 className="text-2xl font-bold text-center text-indigo-700 mb-6">
        Attendance for {selectedEntity} ({selectedCategory})
      </h3>
      <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Athlete Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Check-in Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activities Today
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {athletes.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  No athletes found for this {selectedCategory.toLowerCase()}.
                </td>
              </tr>
            ) : (
              athletes.map(athlete => {
                const { status, lastCheckinTime, activities } = getAthleteStatus(athlete.id);
                return (
                  <tr key={athlete.id} className={status === 'Checked In' ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={athlete.profilePicture || `https://placehold.co/40x40/cccccc/333333?text=${athlete.name.charAt(0)}`}
                          alt={athlete.name}
                          className="w-8 h-8 rounded-full mr-3 object-cover"
                        />
                        <div className="text-sm font-medium text-gray-900">{athlete.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status === 'Checked In' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lastCheckinTime}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [isEditingAthlete, setIsEditingAthlete] = useState(false); // Correctly defined state for AthleteProfiles
  const [showDeleteAthleteConfirm, setShowDeleteAthleteConfirm] = useState(false); // NEW: State for confirmation modal
  const [athleteToDelete, setAthleteToDelete] = useState(null); // NEW: Store athlete ID for deletion

  // Fetch all athletes and listen for real-time updates
  useEffect(() => {
    if (!db || !currentUserId) return;
    const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
    const unsubscribe = onSnapshot(athletesRef, (snapshot) => {
      const fetchedAthletes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAthletes(fetchedAthletes.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching athletes for profiles:", error);
      showAppToast(`Error loading athletes: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, currentUserId, showAppToast]);

  const approvedAthletes = athletes.filter(a => a.isApproved);
  const pendingAthletes = athletes.filter(a => !a.isApproved);

  const filteredApprovedAthletes = approvedAthletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveAthlete = async (athleteId) => {
    const canApprove = userRole === 'admin';
    if (!db || !currentUserId || !canApprove) {
      showAppToast("Permission denied. Only Admin can approve athletes.", 'error');
      return;
    }
    showAppToast("Approving athlete...", 'info');
    try {
      const athleteDocRef = doc(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES, athleteId);
      await updateDoc(athleteDocRef, { isApproved: true });
      showAppToast("Athlete approved successfully!");
    } catch (error) {
      console.error("Error approving athlete:", error);
      showAppToast(`Failed to approve: ${error.message}`, 'error');
    }
  };

  // NEW: Function to open confirmation modal
  const confirmDeleteAthlete = (athleteId) => {
    setAthleteToDelete(athleteId);
    setShowDeleteAthleteConfirm(true);
  };

  // NEW: Actual delete logic, called from confirmation modal
  const executeDeleteAthlete = async () => {
    const canDelete = userRole === 'admin';
    if (!db || !currentUserId || !canDelete || !athleteToDelete) {
      showAppToast("Permission denied or athlete not selected.", 'error');
      return;
    }
    showAppToast("Deleting athlete...", 'info');
    try {
      const athleteDocRef = doc(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES, athleteToDelete);
      await deleteDoc(athleteDocRef);
      showAppToast("Athlete deleted successfully!");
    }
    catch (error) {
      console.error("Error deleting athlete:", error);
      showAppToast(`Failed to delete: ${error.message}`, 'error');
    } finally {
      setShowDeleteAthleteConfirm(false);
      setAthleteToDelete(null);
    }
  };


  const handleOpenProfile = (athlete) => {
    setSelectedAthlete(athlete);
    setIsEditingAthlete(false); // Default to view mode when opening profile
  };

  const handleCloseProfile = () => {
    setSelectedAthlete(null);
    setIsEditingAthlete(false); // Ensure edit mode is off when closing
  };

  const handleEditProfileToggle = () => {
    const canEdit = userRole === 'admin';
    if (canEdit) {
      setIsEditingAthlete(prev => !prev);
    } else {
      showAppToast("Only Admin can edit athlete profiles.", 'error');
    }
  };

  const canAddAthlete = userRole === 'admin'; // For the 'Add New Athlete' button

  return (
    <div className="p-4">
      <h3 className="text-2xl font-bold text-center text-indigo-700 mb-6">Athlete Profiles</h3>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search approved athletes by name..."
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => setShowAddAthleteModal(true)}
          className="bg-indigo-600 text-white py-2 px-5 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-105 flex items-center"
          disabled={!canAddAthlete}
        >
          <Plus size={20} className="mr-2" /> Add New Athlete
          {!canAddAthlete && <span className="ml-2 text-xs opacity-75"> (Admin Only)</span>}
        </button>
      </div>

      {pendingAthletes.length > 0 && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
          <h4 className="text-xl font-semibold text-yellow-800 mb-4">Pending Athletes for Approval</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-yellow-200">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Added By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-yellow-200">
                {pendingAthletes.map(athlete => (
                  <tr key={athlete.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{athlete.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{athlete.addedByCoach || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApproveAthlete(athlete.id)}
                        className={`text-green-600 hover:text-green-900 mr-3 ${!canAddAthlete ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!canAddAthlete}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => confirmDeleteAthlete(athlete.id)}
                        className={`text-red-600 hover:text-red-900 ${!canAddAthlete ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!canAddAthlete}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h4 className="text-xl font-semibold text-gray-800 mb-4">Approved Athletes</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApprovedAthletes.length === 0 ? (
          <p className="col-span-full text-center text-gray-600">No approved athletes found.</p>
        ) : (
          filteredApprovedAthletes.map(athlete => (
            <div
              key={athlete.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex items-center space-x-4 hover:shadow-md transition cursor-pointer"
              onClick={() => handleOpenProfile(athlete)}
            >
              <img
                src={athlete.profilePicture || `https://placehold.co/60x60/cccccc/333333?text=${athlete.name.charAt(0)}`}
                alt={athlete.name}
                className="w-16 h-16 rounded-full object-cover border-4 border-gray-300"
              />
              <div>
                <p className="text-lg font-semibold text-gray-900">{athlete.name}</p>
                <p className="text-sm text-gray-600">{athlete.teams.join(', ')} / {athlete.classes.join(', ')}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showAddAthleteModal} title="Add New Athlete" onClose={() => setShowAddAthleteModal(false)} showCloseButton={true}>
        <AddEditAthleteForm
          db={db}
          currentUserId={currentUserId}
          onClose={() => setShowAddAthleteModal(false)}
          showAppToast={showAppToast}
          isNew={true}
          // When adding new, no initialData or athleteId
          isEditing={true} // New athletes are always "editable" for initial input
          setParentIsEditing={() => {}} // No external state change needed for new form
          userRole={userRole}
        />
      </Modal>

      {selectedAthlete && (
        <Modal isOpen={!!selectedAthlete} title={isEditingAthlete ? "Edit Athlete Profile" : "View Athlete Profile"} onClose={handleCloseProfile} showCloseButton={true}>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleEditProfileToggle}
              className={`py-2 px-4 rounded-lg flex items-center transition duration-200
                ${isEditingAthlete ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-indigo-500 text-white hover:bg-indigo-600'}
                ${!canAddAthlete ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={!canAddAthlete}
            >
              {isEditingAthlete ? <X size={18} className="mr-2" /> : <Edit size={18} className="mr-2" />}
              {isEditingAthlete ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
          <AddEditAthleteForm
            db={db}
            currentUserId={currentUserId}
            onClose={handleCloseProfile}
            showAppToast={showAppToast}
            isNew={false}
            initialData={selectedAthlete}
            isEditing={isEditingAthlete} // Pass current editing state
            setParentIsEditing={setIsEditingAthlete} // Pass the setter to allow form to control parent's editing state
            athleteId={selectedAthlete.id}
            userRole={userRole} // Pass userRole for access control within the form
          />
        </Modal>
      )}

      {/* NEW: Confirmation Modal for Athlete Deletion */}
      <ConfirmationModal
        isOpen={showDeleteAthleteConfirm}
        title="Confirm Deletion"
        message="Are you sure you want to delete this athlete? This action cannot be undone."
        onConfirm={executeDeleteAthlete}
        onCancel={() => setShowDeleteAthleteConfirm(false)}
        confirmText="Delete"
      />
    </div>
  );
};

// --- Add/Edit Athlete Form Component ---
const AddEditAthleteForm = ({ db, currentUserId, onClose, showAppToast, isNew, initialData, isEditing, setParentIsEditing, athleteId, userRole }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    teams: [],
    classes: [],
    skills: [], // { name: string, status: string }
    improvementAreas: '',
    coachNotes: [],
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    isApproved: isNew ? false : (initialData?.isApproved || false), // New athletes start as pending
    addedByCoach: '', // Will be filled by current coach
    profilePicture: ''
  });
  const [allTeams, setAllTeams] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillStatus, setNewSkillStatus] = useState('Not Started');
  const [newCoachNote, setNewCoachNote] = useState('');
  const [imageUploadMethod, setImageUploadMethod] = useState(null); // 'file' or 'camera'
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const canEditForm = userRole === 'admin'; // For form fields inside AddEditAthleteForm

  // Fetch all available teams and classes for multi-select
  useEffect(() => {
    if (!db || !currentUserId) return;
    const fetchAllEntities = async () => {
      try {
        const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
        const querySnapshot = await getDocs(query(athletesRef, where('isApproved', '==', true))); // Only consider approved for existing teams/classes
        const teamsSet = new Set();
        const classesSet = new Set();
        querySnapshot.forEach(docSnap => {
          docSnap.data().teams?.forEach(t => teamsSet.add(t));
          docSnap.data().classes?.forEach(c => classesSet.add(c));
        });
        setAllTeams(Array.from(teamsSet).sort());
        setAllClasses(Array.from(classesSet).sort());
      } catch (error) {
        console.error("Error fetching all teams/classes:", error);
      }
    };
    fetchAllEntities();
  }, [db, currentUserId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const { group } = e.target.dataset;
      let updatedArray = [...formData[group]];
      if (checked) {
        updatedArray.push(value);
      } else {
        updatedArray = updatedArray.filter(item => item !== value);
      }
      setFormData({ ...formData, [group]: updatedArray });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddSkill = () => {
    if (newSkillName.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { name: newSkillName.trim(), status: newSkillStatus }]
      });
      setNewSkillName('');
      setNewSkillStatus('Not Started');
    }
  };

  const handleUpdateSkillStatus = (index, newStatus) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index].status = newStatus;
    setFormData({ ...formData, skills: updatedSkills });
  };

  const handleRemoveSkill = (index) => {
    const updatedSkills = formData.skills.filter((_, i) => i !== index);
    setFormData({ ...formData, skills: updatedSkills });
  };

  const handleAddCoachNote = async () => {
    if (newCoachNote.trim()) {
      // Fetch current coach's name
      let coachName = "Unknown Coach";
      try {
        // Only attempt to fetch coach name if auth and db are initialized
        if (auth && db) {
          const coachesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES);
          // Try to find coach by current user's UID first if authenticated
          if (auth.currentUser?.uid) {
            const coachDoc = await getDoc(doc(coachesRef, auth.currentUser.uid));
            if (coachDoc.exists()) {
              coachName = coachDoc.data().name;
            }
          }
          // Fallback if not found by UID or if not logged in as a specific coach,
          // check if current user is admin (MASTER_PASSCODE)
          if (coachName === "Unknown Coach" && userRole === 'admin') {
            const q = query(coachesRef, where('passcode', '==', MASTER_PASSCODE)); // Assuming master passcode is tied to a coach
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              coachName = querySnapshot.docs[0].data().name;
            }
          }
        }
      } catch (e) {
        console.warn("Could not fetch coach name for note:", e);
      }

      setFormData({
        ...formData,
        coachNotes: [
          ...formData.coachNotes,
          { timestamp: new Date().toISOString(), note: newCoachNote.trim(), coachName: coachName }
        ]
      });
      setNewCoachNote('');
    }
  };

  const handleRemoveCoachNote = (index) => {
    const updatedNotes = formData.coachNotes.filter((_, i) => i !== index);
    setFormData({ ...formData, coachNotes: updatedNotes });
  };

  const handleProfilePictureUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result }); // Base64
        setImageUploadMethod(null); // Close modal
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setFormData({ ...formData, profilePicture: '' });
  };

  const startCamera = async () => {
    setImageUploadMethod('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      showAppToast(`Could not access camera: ${err.message}. Please ensure permissions are granted.`, 'error');
      setImageUploadMethod(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageDataUrl = canvasRef.current.toDataURL('image/png');
      setFormData({ ...formData, profilePicture: imageDataUrl });
      // Stop camera stream
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      setImageUploadMethod(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const athleteCollectionRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
      let coachName = "Unknown Coach";
      // Try to get current coach's name if not an admin
      try {
        // Only attempt to fetch coach name if auth and db are initialized
        if (auth && db) {
          const coachesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES);
          // Try to find coach by current user's UID first if authenticated
          if (auth.currentUser?.uid) {
            const coachDoc = await getDoc(doc(coachesRef, auth.currentUser.uid));
            if (coachDoc.exists()) {
              coachName = coachDoc.data().name;
            }
          }
          // Fallback if not found by UID or if not logged in as a specific coach,
          // check if current user is admin (MASTER_PASSCODE)
          if (coachName === "Unknown Coach" && userRole === 'admin') {
            const q = query(coachesRef, where('passcode', '==', MASTER_PASSCODE));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              coachName = querySnapshot.docs[0].data().name;
            }
          }
        }
      } catch (e) {
        console.warn("Could not fetch coach name for new athlete:", e);
      }

      if (isNew) {
        // Add new athlete
        await addDoc(athleteCollectionRef, { ...formData, addedByCoach: coachName });
        showAppToast("Athlete added successfully!");
      } else {
        // Update existing athlete
        const canSave = userRole === 'admin';
        if (!canSave) {
          showAppToast("Permission denied. Only Admin can save edits.", 'error');
          setIsLoading(false);
          return;
        }
        const athleteDocRef = doc(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES, athleteId);
        await updateDoc(athleteDocRef, formData);
        showAppToast("Athlete updated successfully!");
        // Use the passed setParentIsEditing function to update the parent's state
        if (setParentIsEditing) {
            setParentIsEditing(false);
        }
      }
      onClose(); // Close modal after successful operation
    } catch (error) {
      console.error("Error saving athlete:", error);
      showAppToast(`Failed to save athlete: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormEditable = isEditing || isNew;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      {/* Profile Picture */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={formData.profilePicture || `https://placehold.co/120x120/cccccc/333333?text=${formData.name.charAt(0) || '?'}`}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 shadow-md mb-4"
        />
        {isFormEditable && (
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center hover:bg-gray-300 transition"
            >
              <Image size={18} className="mr-2" /> Upload
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleProfilePictureUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={startCamera}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center hover:bg-gray-300 transition"
            >
              <Camera size={18} className="mr-2" /> Camera
            </button>
            {formData.profilePicture && (
              <button
                type="button"
                onClick={handleRemoveProfilePicture}
                className="bg-red-100 text-red-700 py-2 px-4 rounded-lg flex items-center hover:bg-red-200 transition"
              >
                <Trash2 size={18} className="mr-2" /> Remove
              </button>
            )}
          </div>
        )}
      </div>

      {/* Camera/File Upload Modal */}
      <Modal isOpen={imageUploadMethod === 'camera'} title="Take a Photo" onClose={() => { setImageUploadMethod(null); if(videoRef.current && videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop()); }}>
        <div className="flex flex-col items-center">
          <video ref={videoRef} autoPlay playsInline className="w-full max-w-sm rounded-lg border border-gray-300"></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
          <button
            type="button"
            onClick={takePhoto}
            className="mt-4 bg-indigo-500 text-white py-2 px-4 rounded-lg flex items-center hover:bg-indigo-600 transition"
          >
            <Camera size={20} className="mr-2" /> Take Photo
          </button>
        </div>
      </Modal>

      {/* Basic Info */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Athlete Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEditable || !canEditForm} />
      </div>

      {isNew && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Added By Coach</label>
          {/* This will be filled automatically on submit based on currentUserId */}
          <p className="mt-1 text-gray-500 text-sm italic">Will be auto-filled by current coach.</p>
        </div>
      )}

      {/* Teams and Classes (Multi-select) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Teams</label>
          <div className="mt-1 border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto bg-gray-50">
            {allTeams.map(team => (
              <div key={team} className="flex items-center">
                <input
                  type="checkbox"
                  id={`team-${team}`}
                  name="teams"
                  value={team}
                  data-group="teams"
                  checked={formData.teams.includes(team)}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  disabled={!isFormEditable || !canEditForm}
                />
                <label htmlFor={`team-${team}`} className="ml-2 text-sm text-gray-900">{team}</label>
              </div>
            ))}
            {allTeams.length === 0 && <p className="text-sm text-gray-500">No teams available yet.</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Classes</label>
          <div className="mt-1 border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto bg-gray-50">
            {allClasses.map(cls => (
              <div key={cls} className="flex items-center">
                <input
                  type="checkbox"
                  id={`class-${cls}`}
                  name="classes"
                  value={cls}
                  data-group="classes"
                  checked={formData.classes.includes(cls)}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  disabled={!isFormEditable || !canEditForm}
                />
                <label htmlFor={`class-${cls}`} className="ml-2 text-sm text-gray-900">{cls}</label>
              </div>
            ))}
            {allClasses.length === 0 && <p className="text-sm text-gray-500">No classes available yet.</p>}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Contact Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">Parent/Guardian Name</label>
          <input type="text" name="parentName" value={formData.parentName} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEditable || !canEditForm} />
        </div>
        <div>
          <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700">Parent Phone</label>
          <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEditable || !canEditForm} />
        </div>
        <div>
          <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700">Parent Email</label>
          <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEditable || !canEditForm} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
          <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEditable || !canEditForm} />
        </div>
        <div>
          <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
          <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEditable || !canEditForm} />
        </div>
      </div>

      {/* Skills */}
      <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Skills</h4>
      <div className="space-y-3">
        {formData.skills.map((skill, index) => (
          <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span className="font-medium text-gray-900 flex-1">{skill.name}</span>
            {isFormEditable && canEditForm ? (
              <select
                value={skill.status}
                onChange={(e) => handleUpdateSkillStatus(index, e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm p-1 text-sm"
              >
                <option>Not Started</option>
                <option>Working On</option>
                <option>Needs Improvement</option>
                <option>Mastered</option>
              </select>
            ) : (
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                skill.status === 'Mastered' ? 'bg-green-100 text-green-800' :
                skill.status === 'Working On' ? 'bg-blue-100 text-blue-800' :
                skill.status === 'Needs Improvement' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>{skill.status}</span>
            )}
            {isFormEditable && canEditForm && (
              <button type="button" onClick={() => handleRemoveSkill(index)} className="text-red-500 hover:text-red-700">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {isFormEditable && canEditForm && (
          <div className="flex space-x-2 mt-4">
            <input
              type="text"
              placeholder="New Skill Name"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
            />
            <select
              value={newSkillStatus}
              onChange={(e) => setNewSkillStatus(e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option>Not Started</option>
              <option>Working On</option>
              <option>Needs Improvement</option>
              <option>Mastered</option>
            </select>
            <button type="button" onClick={handleAddSkill} className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-600 transition">
              <Plus size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Improvement Areas */}
      <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Improvement Areas</h4>
      <textarea
        name="improvementAreas"
        value={formData.improvementAreas}
        onChange={handleChange}
        rows="3"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        placeholder="Notes on areas for improvement..."
        disabled={!isFormEditable || !canEditForm}
      ></textarea>

      {/* Coach Notes */}
      <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Coach Notes</h4>
      <div className="space-y-3">
        {formData.coachNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((note, index) => (
          <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{note.coachName}</span> on {new Date(note.timestamp).toLocaleDateString()} at {new Date(note.timestamp).toLocaleTimeString()}
            </p>
            <p className="text-gray-800 mt-1">{note.note}</p>
            {isFormEditable && canEditForm && (
              <button type="button" onClick={() => handleRemoveCoachNote(index)} className="text-red-500 hover:text-red-700 text-sm mt-2">
                Remove Note
              </button>
            )}
          </div>
        ))}
        {isFormEditable && canEditForm && (
          <div className="flex space-x-2 mt-4">
            <textarea
              value={newCoachNote}
              onChange={(e) => setNewCoachNote(e.target.value)}
              rows="2"
              placeholder="Add new coach note..."
              className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
            ></textarea>
            <button type="button" onClick={handleAddCoachNote} className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-600 transition">
              <Plus size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Save/Cancel Buttons */}
      {(isFormEditable || isNew) && (
        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 text-gray-800 py-2 px-5 rounded-lg font-semibold shadow-md hover:bg-gray-400 transition"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-600 text-white py-2 px-5 rounded-lg font-semibold shadow-md hover:bg-green-700 transition"
            disabled={isLoading || !canEditForm} // Only admin can save edits
          >
            {isLoading ? 'Saving...' : (isNew ? 'Add Athlete' : 'Save Changes')}
          </button>
        </div>
      )}
    </form>
  );
};


// --- Coach Management Component ---
const CoachManagement = ({ db, currentUserId, userRole, showAppToast }) => {
  const [coaches, setCoaches] = useState([]);
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isEditingCoach, setIsEditingCoach] = useState(false); // Correctly defined state for CoachManagement
  const [showDeleteCoachConfirm, setShowDeleteCoachConfirm] = useState(false); // NEW: State for confirmation modal
  const [coachToDelete, setCoachToDelete] = useState(null); // NEW: Store coach ID for deletion

  // Fetch all coaches and listen for real-time updates
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

  const handleApproveCoach = async (coachId) => {
    const canApprove = userRole === 'admin';
    if (!canApprove) {
      showAppToast("Permission denied. Only Admin can approve coaches.", 'error');
      return;
    }
    showAppToast("Approving coach...", 'info');
    try {
      const coachDocRef = doc(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES, coachId);
      await updateDoc(coachDocRef, { isApproved: true });
      showAppToast("Coach approved successfully!");
    } catch (error) {
      console.error("Error approving coach:", error);
      showAppToast(`Failed to approve: ${error.message}`, 'error');
    }
  };

  // NEW: Function to open confirmation modal
  const confirmDeleteCoach = (coachId) => {
    setCoachToDelete(coachId);
    setShowDeleteCoachConfirm(true);
  };

  // NEW: Actual delete logic, called from confirmation modal
  const executeDeleteCoach = async () => {
    const canDelete = userRole === 'admin';
    if (!canDelete || !db || !currentUserId || !coachToDelete) {
      showAppToast("Permission denied or coach not selected.", 'error');
      return;
    }
    showAppToast("Deleting coach...", 'info');
    try {
      const coachDocRef = doc(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES, coachToDelete);
      await deleteDoc(coachDocRef);
      showAppToast("Coach deleted successfully!");
    } catch (error) {
      console.error("Error deleting coach:", error);
      showAppToast(`Failed to delete: ${error.message}`, 'error');
    } finally {
      setShowDeleteCoachConfirm(false);
      setCoachToDelete(null);
    }
  };

  const handleOpenEditCoach = (coach) => {
    const canEdit = userRole === 'admin';
    if (canEdit) {
      setSelectedCoach(coach);
      setIsEditingCoach(true);
    } else {
      showAppToast("Only Admin can edit coach profiles.", 'error');
    }
  };

  const handleCloseEditCoach = () => {
    setSelectedCoach(null);
    setIsEditingCoach(false);
  };

  const canManageCoaches = userRole === 'admin'; // For general coach management actions

  return (
    <div className="p-4">
      <h3 className="text-2xl font-bold text-center text-indigo-700 mb-6">Coach Management</h3>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowAddCoachModal(true)}
          className="bg-indigo-600 text-white py-2 px-5 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-105 flex items-center"
          disabled={!canManageCoaches}
        >
          <Plus size={20} className="mr-2" /> Add New Coach
          {!canManageCoaches && <span className="ml-2 text-xs opacity-75"> (Admin Only)</span>}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teams / Classes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passcode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coaches.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  No coaches found.
                </td>
              </tr>
            ) : (
              coaches.map(coach => (
                <tr key={coach.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coach.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coach.email}
                    <br />
                    {coach.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Teams: {coach.teams?.join(', ') || 'N/A'}
                    <br />
                    Classes: {coach.classes?.join(', ') || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${coach.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {coach.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coach.passcode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!coach.isApproved && (
                      <button
                        onClick={() => handleApproveCoach(coach.id)}
                        className={`text-green-600 hover:text-green-900 mr-3 ${!canManageCoaches ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!canManageCoaches}
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditCoach(coach)}
                      className={`text-indigo-600 hover:text-indigo-900 mr-3 ${!canManageCoaches ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!canManageCoaches}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDeleteCoach(coach.id)}
                      className={`text-red-600 hover:text-red-900 ${!canManageCoaches ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!canManageCoaches}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showAddCoachModal || isEditingCoach} title={isEditingCoach ? "Edit Coach" : "Add New Coach"} onClose={handleCloseEditCoach} showCloseButton={true}>
        <AddEditCoachForm
          db={db}
          currentUserId={currentUserId}
          onClose={handleCloseEditCoach}
          showAppToast={showAppToast}
          isNew={!isEditingCoach}
          initialData={selectedCoach}
          userRole={userRole}
        />
      </Modal>

      {/* NEW: Confirmation Modal for Coach Deletion */}
      <ConfirmationModal
        isOpen={showDeleteCoachConfirm}
        title="Confirm Deletion"
        message="Are you sure you want to delete this coach? This action cannot be undone."
        onConfirm={executeDeleteCoach}
        onCancel={() => setShowDeleteCoachConfirm(false)}
        confirmText="Delete"
      />
    </div>
  );
};

// --- Add/Edit Coach Form Component ---
const AddEditCoachForm = ({ db, currentUserId, onClose, showAppToast, isNew, initialData, userRole }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    email: '',
    phone: '',
    teams: [],
    classes: [],
    isApproved: isNew ? false : (initialData?.isApproved || false),
    passcode: ''
  });
  const [allTeams, setAllTeams] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const canEditCoachForm = userRole === 'admin';

  // Fetch all available teams and classes for multi-select
  useEffect(() => {
    if (!db || !currentUserId) return;
    const fetchAllEntities = async () => {
      try {
        const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
        const querySnapshot = await getDocs(query(athletesRef, where('isApproved', '==', true))); // Only consider approved for existing teams/classes
        const teamsSet = new Set();
        const classesSet = new Set();
        querySnapshot.forEach(docSnap => {
          docSnap.data().teams?.forEach(t => teamsSet.add(t));
          docSnap.data().classes?.forEach(c => classesSet.add(c));
        });
        setAllTeams(Array.from(teamsSet).sort());
        setAllClasses(Array.from(classesSet).sort());
      } catch (error) {
        console.error("Error fetching all teams/classes for coach form:", error);
      }
    };
    fetchAllEntities();
  }, [db, currentUserId]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const { group } = e.target.dataset;
      let updatedArray = [...formData[group]];
      if (checked) {
        updatedArray.push(value);
      } else {
        updatedArray = updatedArray.filter(item => item !== value);
      }
      setFormData({ ...formData, [group]: updatedArray });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEditCoachForm) {
      showAppToast("Permission denied. Only Admin can add/edit coaches.", 'error');
      return;
    }
    setIsLoading(true);
    try {
      const coachesCollectionRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES);
      if (isNew) {
        await addDoc(coachesCollectionRef, formData);
        showAppToast("Coach added successfully!");
      } else {
        const coachDocRef = doc(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES, initialData.id);
        await updateDoc(coachDocRef, formData);
        showAppToast("Coach updated successfully!");
      }
      onClose();
    }
    catch (error) {
      console.error("Error saving coach:", error);
      showAppToast(`Failed to save coach: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Coach Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!canEditCoachForm} />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!canEditCoachForm} />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
        <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!canEditCoachForm} />
      </div>
      <div>
        <label htmlFor="passcode" className="block text-sm font-medium text-gray-700">4-digit Passcode</label>
        <input type="text" name="passcode" value={formData.passcode} onChange={handleChange} required maxLength="4" pattern="\d{4}"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!canEditCoachForm} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Assigned Teams</label>
          <div className="mt-1 border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto bg-gray-50">
            {allTeams.map(team => (
              <div key={team} className="flex items-center">
                <input
                  type="checkbox"
                  id={`coach-team-${team}`}
                  name="teams"
                  value={team}
                  data-group="teams"
                  checked={formData.teams.includes(team)}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  disabled={!canEditCoachForm}
                />
                <label htmlFor={`coach-team-${team}`} className="ml-2 text-sm text-gray-900">{team}</label>
              </div>
            ))}
            {allTeams.length === 0 && <p className="text-sm text-gray-500">No teams available yet.</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Assigned Classes</label>
          <div className="mt-1 border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto bg-gray-50">
            {allClasses.map(cls => (
              <div key={cls} className="flex items-center">
                <input
                  type="checkbox"
                  id={`coach-class-${cls}`}
                  name="classes"
                  value={cls}
                  data-group="classes"
                  checked={formData.classes.includes(cls)}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  disabled={!canEditCoachForm}
                />
                <label htmlFor={`coach-class-${cls}`} className="ml-2 text-sm text-gray-900">{cls}</label>
              </div>
            ))}
            {allClasses.length === 0 && <p className="text-sm text-gray-500">No classes available yet.</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 text-gray-800 py-2 px-5 rounded-lg font-semibold shadow-md hover:bg-gray-400 transition"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-green-600 text-white py-2 px-5 rounded-lg font-semibold shadow-md hover:bg-green-700 transition"
          disabled={isLoading || !canEditCoachForm}
        >
          {isLoading ? 'Saving...' : (isNew ? 'Add Coach' : 'Save Changes')}
        </button>
      </div>
    </form>
  );
};

// --- Check-in Logs Component ---
const CheckinLogs = ({ db, currentUserId, userRole, showAppToast }) => {
  const [historicalLogs, setHistoricalLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isEditingLog, setIsEditingLog] = useState(false); // Correctly defined state for CheckinLogs
  const [filterAthleteName, setFilterAthleteName] = useState('');
  const [filterCheckinStatus, setFilterCheckinStatus] = useState('All'); // 'All', 'Checked In', 'Missed'
  const [filterCategory, setFilterCategory] = useState('All'); // 'All', 'Team', 'Class'
  const [filterEntity, setFilterEntity] = useState('All'); // Specific team/class name
  const [allTeams, setAllTeams] = useState([]);
  const [allClasses, setAllClasses] = useState([]);

  // Fetch historical check-in logs
  useEffect(() => {
    if (!db || !currentUserId) return;
    const logsRef = collection(db, publicDataPath, COLLECTIONS.HISTORICAL_CHECKIN_LOGS);
    const unsubscribe = onSnapshot(logsRef, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort logs by timestamp (most recent first)
      setHistoricalLogs(fetchedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    }, (error) => {
      console.error("Error fetching historical logs:", error);
      showAppToast(`Error loading logs: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, currentUserId, showAppToast]);

  // Fetch all available teams and classes for filters
  useEffect(() => {
    if (!db || !currentUserId) return;
    const fetchAllEntities = async () => {
      try {
        const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
        const querySnapshot = await getDocs(query(athletesRef, where('isApproved', '==', true)));
        const teamsSet = new Set();
        const classesSet = new Set();
        querySnapshot.forEach(docSnap => {
          docSnap.data().teams?.forEach(t => teamsSet.add(t));
          docSnap.data().classes?.forEach(c => classesSet.add(c));
        });
        setAllTeams(Array.from(teamsSet).sort());
        setAllClasses(Array.from(classesSet).sort());
      } catch (error) {
        console.error("Error fetching all teams/classes for logs filter:", error);
      }
    };
    fetchAllEntities();
  }, [db, currentUserId]);

  const handleOpenLog = (log) => {
    setSelectedLog(log);
    setIsEditingLog(false); // Default to view mode when opening log
  };

  const handleCloseLog = () => {
    setSelectedLog(null);
    setIsEditingLog(false); // Ensure edit mode is off when closing
  };

  const handleEditLogToggle = () => {
    const canEdit = userRole === 'admin';
    if (canEdit) {
      setIsEditingLog(prev => !prev);
    } else {
      showAppToast("Only Admin can edit check-in logs.", 'error');
    }
  };

  const handleRemoveCheckinEvent = (logIndex, eventIndex) => {
    const canEdit = userRole === 'admin';
    if (!canEdit) {
      showAppToast("Permission denied. Only Admin can edit logs.", 'error');
      return;
    }
    const updatedLog = { ...selectedLog };
    updatedLog.dailyCheckInEvents = updatedLog.dailyCheckInEvents.filter((_, i) => i !== eventIndex);
    setSelectedLog(updatedLog); // Update local state for immediate UI reflection
  };

  const handleAddCheckinEvent = async (logId, athleteId, category, entity, timestampStr) => {
    const canEdit = userRole === 'admin';
    if (!canEdit) {
      showAppToast("Permission denied. Only Admin can edit logs.", 'error');
      return;
    }
    const athleteDoc = await getDoc(doc(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES, athleteId));
    if (!athleteDoc.exists()) {
        showAppToast("Athlete not found.", 'error');
        return;
    }
    const athleteName = athleteDoc.data().name;

    const newEvent = {
        athleteId,
        athleteName,
        checkInType: category.toLowerCase(),
        checkInEntity: entity,
        timestamp: new Date(timestampStr).toISOString(),
    };
    const updatedLog = { ...selectedLog, dailyCheckInEvents: [...selectedLog.dailyCheckInEvents, newEvent] };
    setSelectedLog(updatedLog); // Update local state
    showAppToast("Event added locally. Remember to save changes.", 'info');
  };

  const handleSaveLogEdits = async () => {
    const canSave = userRole === 'admin';
    if (!canSave) {
      showAppToast("Permission denied. Only Admin can save log edits.", 'error');
      return;
    }
    if (!selectedLog) return;
    showAppToast("Saving log changes...", 'info');
    try {
      const logDocRef = doc(db, publicDataPath, COLLECTIONS.HISTORICAL_CHECKIN_LOGS, selectedLog.id);
      await updateDoc(logDocRef, {
        dailyCheckInEvents: selectedLog.dailyCheckInEvents,
        lastEdited: new Date().toISOString()
      });
      showAppToast("Log updated successfully!");
      setIsEditingLog(false);
    } catch (error) {
      console.error("Error saving log edits:", error);
      showAppToast(`Failed to save log: ${error.message}`, 'error');
    }
  };

  const filteredLogs = historicalLogs.filter(log => {
    let matches = true;

    // Filter by Entity (Team/Class) and Category if specified
    if (filterEntity !== 'All' && filterCategory !== 'All') {
      const isEntityMatch = log.dailyCheckInEvents.some(event =>
        event.checkInEntity === filterEntity && event.checkInType === filterCategory.toLowerCase()
      );
      if (!isEntityMatch) matches = false;
    } else if (filterCategory !== 'All') { // Only filter by category if entity is 'All'
      const isCategoryMatch = log.dailyCheckinEvents.some(event =>
        event.checkInType === filterCategory.toLowerCase()
      );
      if (!isCategoryMatch) matches = false;
    }

    // Filter by Athlete Name
    if (filterAthleteName) {
      const lowerCaseFilter = filterAthleteName.toLowerCase();
      const athleteFoundInLog = log.dailyCheckInEvents.some(event =>
        event.athleteName.toLowerCase().includes(lowerCaseFilter)
      );
      if (!athleteFoundInLog) matches = false;
    }

    // Handle 'Missed' status: An athlete is 'Missed' if they are assigned to the entity/category
    // but *not* present in the check-in events for that log. This requires knowing all athletes.
    // This is complex for a historical log without knowing the exact roster at that past moment.
    // For now, I'll interpret 'Missed' as: if an athlete is selected in the filter, and *not* found in the events of this log.
    // This is a simplification due to the complex historical data requirement.
    if (filterCheckinStatus === 'Missed' && filterAthleteName) {
      const athleteCheckedInThisLog = log.dailyCheckinEvents.some(event =>
        event.athleteName.toLowerCase().includes(filterAthleteName.toLowerCase())
      );
      if (athleteCheckedInThisLog) matches = false; // If they are in the log, they are not 'missed' for this log filter
      // If filterAthleteName is empty, 'Missed' isn't really meaningful here without external context.
    } else if (filterCheckinStatus === 'Checked In' && filterAthleteName) {
      const athleteCheckedInThisLog = log.dailyCheckinEvents.some(event =>
        event.athleteName.toLowerCase().includes(filterAthleteName.toLowerCase())
      );
      if (!athleteCheckedInThisLog) matches = false;
    } else if (filterCheckinStatus === 'Checked In' && !filterAthleteName) {
        // If filter is 'Checked In' but no specific athlete, ensure the log actually has check-ins.
        if (log.dailyCheckinEvents.length === 0) matches = false;
    }

    return matches;
  });

  const canEditLog = userRole === 'admin';

  return (
    <div className="p-4">
      <h3 className="text-2xl font-bold text-center text-indigo-700 mb-6">Historical Check-in Logs</h3>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
        <div>
          <label htmlFor="filterAthlete" className="block text-sm font-medium text-gray-700">Athlete Name</label>
          <input
            type="text"
            id="filterAthlete"
            value={filterAthleteName}
            onChange={(e) => setFilterAthleteName(e.target.value)}
            placeholder="Filter by athlete name"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="filterStatus"
            value={filterCheckinStatus}
            onChange={(e) => setFilterCheckinStatus(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="All">All</option>
            <option value="Checked In">Checked In</option>
            {/* The "Missed" filter logic would be very complex and require external context (full roster of that day).
                For now, I'll interpret 'Missed' as: if an athlete is selected in the filter, and *not* found in the events of this log.
                This is a simplification due to the complex historical data requirement.
            <option value="Missed">Missed (requires athlete name filter)</option>
            */}
          </select>
        </div>
        <div>
          <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="filterCategory"
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setFilterEntity('All'); }}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="All">All</option>
            <option value="Team">Team</option>
            <option value="Class">Class</option>
          </select>
        </div>
        {(filterCategory === 'Team' || filterCategory === 'Class') && (
          <div>
            <label htmlFor="filterEntity" className="block text-sm font-medium text-gray-700">{filterCategory} Name</label>
            <select
              id="filterEntity"
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="All">All {filterCategory}s</option>
              {(category === 'Team' ? allTeams : allClasses).map(ent => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reset Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reset By User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entries Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  No historical check-in logs found matching your filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(log.timestamp).toLocaleString()}
                    {log.lastEdited && <span className="block text-xs text-gray-500 italic">(Edited {new Date(log.lastEdited).toLocaleString()})</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.resetByUserId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.dailyCheckInEvents?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenLog(log)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <Modal isOpen={!!selectedLog} title="Check-in Log Details" onClose={handleCloseLog} showCloseButton={true}>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleEditLogToggle}
              className={`py-2 px-4 rounded-lg flex items-center transition duration-200
                ${isEditingLog ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-indigo-500 text-white hover:bg-indigo-600'}
                ${!canEditLog ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={!canEditLog}
            >
              {isEditingLog ? <X size={18} className="mr-2" /> : <Edit size={18} className="mr-2" />}
              {isEditingLog ? 'Cancel Edit' : 'Edit Log'}
            </button>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <p className="text-gray-700"><strong>Reset At:</strong> {new Date(selectedLog.timestamp).toLocaleString()}</p>
            <p className="text-gray-700"><strong>Reset By:</strong> {selectedLog.resetByUserId}</p>
            {selectedLog.lastEdited && <p className="text-gray-700"><strong>Last Edited:</strong> {new Date(selectedLog.lastEdited).toLocaleString()}</p>}

            <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Check-in Events</h4>
            {selectedLog.dailyCheckInEvents && selectedLog.dailyCheckInEvents.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      {isEditingLog && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedLog.dailyCheckInEvents.map((event, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{event.athleteName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{event.checkInType}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{event.checkInEntity}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</td>
                        {isEditingLog && (
                          <td className="px-4 py-2 whitespace-nowrap">
                            <button
                              onClick={() => handleRemoveCheckinEvent(selectedLog.id, index)}
                              className="text-red-600 hover:text-red-900"
                              disabled={!canEditLog}
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No check-in events recorded for this log.</p>
            )}

            {isEditingLog && (
                <AddCheckinEventForm
                    db={db}
                    currentUserId={currentUserId}
                    onAddEvent={(athleteId, category, entity, timestamp) => handleAddCheckinEvent(selectedLog.id, athleteId, category, entity, timestamp)}
                    showAppToast={showAppToast}
                />
            )}

            {isEditingLog && (
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={handleCloseLog} // Closes modal without saving
                  className="bg-gray-300 text-gray-800 py-2 px-5 rounded-lg font-semibold shadow-md hover:bg-gray-400 transition"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={handleSaveLogEdits}
                  className="bg-green-600 text-white py-2 px-5 rounded-lg font-semibold shadow-md hover:bg-green-700 transition"
                  disabled={!canEditLog}
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Add Check-in Event Form for Logs ---
const AddCheckinEventForm = ({ db, currentUserId, onAddEvent, showAppToast }) => {
    const [athleteId, setAthleteId] = useState('');
    const [category, setCategory] = useState('');
    const [entity, setEntity] = useState('');
    const [timestamp, setTimestamp] = useState('');
    const [allAthletes, setAllAthletes] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [allClasses, setAllClasses] = useState([]);

    useEffect(() => {
        if (!db || !currentUserId) return;
        const fetchAllData = async () => {
            try {
                // Fetch all approved athletes
                const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
                const approvedAthletesSnap = await getDocs(query(athletesRef, where('isApproved', '==', true)));
                setAllAthletes(approvedAthletesSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));

                // Collect all teams and classes from athletes
                const teamsSet = new Set();
                const classesSet = new Set();
                approvedAthletesSnap.docs.forEach(docSnap => {
                    docSnap.data().teams?.forEach(t => teamsSet.add(t));
                    docSnap.data().classes?.forEach(c => classesSet.add(c));
                });
                setAllTeams(Array.from(teamsSet).sort());
                setAllClasses(Array.from(classesSet).sort());
            } catch (error) {
                console.error("Error fetching data for AddCheckinEventForm:", error);
                showAppToast(`Error loading data: ${error.message}`, 'error');
            }
        };
        fetchAllData();
    }, [db, currentUserId, showAppToast]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!athleteId || !category || !entity || !timestamp) {
            showAppToast("Please fill all fields.", 'error');
            return;
        }
        onAddEvent(athleteId, category, entity, timestamp);
        // Clear form after adding
        setAthleteId('');
        setCategory('');
        setEntity('');
        setTimestamp('');
    };

    return (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="text-md font-semibold text-blue-800 mb-4">Manually Add Check-in Event</h5>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="addAthlete" className="block text-sm font-medium text-gray-700">Athlete</label>
                    <select
                        id="addAthlete"
                        value={athleteId}
                        onChange={(e) => setAthleteId(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    >
                        <option value="">Select Athlete</option>
                        {allAthletes.map(athlete => (
                            <option key={athlete.id} value={athlete.id}>{athlete.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="addCategory" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        id="addCategory"
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); setEntity(''); }}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    >
                        <option value="">Select Category</option>
                        <option value="Team">Team</option>
                        <option value="Class">Class</option>
                    </select>
                </div>
                {(category === 'Team' || category === 'Class') && (
                    <div>
                        <label htmlFor="addEntity" className="block text-sm font-medium text-gray-700">{category} Name</label>
                        <select
                            id="addEntity"
                            value={entity}
                            onChange={(e) => setEntity(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        >
                            <option value="">Select {category}</option>
                            {(category === 'Team' ? allTeams : allClasses).map(ent => (
                                <option key={ent} value={ent}>{ent}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                    <label htmlFor="addTimestamp" className="block text-sm font-medium text-gray-700">Timestamp</label>
                    <input
                        type="datetime-local"
                        id="addTimestamp"
                        value={timestamp}
                        onChange={(e) => setTimestamp(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                </div>
                <div className="md:col-span-2 flex justify-end">
                    <button
                        type="submit"
                        className="bg-indigo-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-600 transition flex items-center"
                    >
                        <Plus size={18} className="mr-2" /> Add Event
                    </button>
                </div>
            </form>
        </div>
    );
};
