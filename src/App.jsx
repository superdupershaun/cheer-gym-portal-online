import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

// Lucide React icons for a modern look
import { User, Users, Calendar, Settings, ChevronLeft, CheckCircle2, XCircle, BarChart2, Plus, Edit, Trash2, Tag, BookOpen, Layers, GraduationCap, X, Smartphone, Tablet, Monitor } from 'lucide-react';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCCS1fFfmH4Y4tXn6Rv7w4baNYrz5VSFLg",
  authDomain: "gym-check-in-d1bf5.firebaseapp.com",
  projectId: "gym-check-in-d1bf5",
  storageBucket: "gym-check-in-d1bf5.firebasestorage.app",
  messagingSenderId: "667813844333",
  appId: "1:667813844333:web:84e6746664e0540c933664",
  measurementId: "G-K7WD5R8DDB"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- SHARED ADMIN USER ID ---
const SHARED_USER_ID = "admin";

// Firebase app, database, and auth instances will be initialized once.
let app;
let db;
let auth;

// --- Firestore Collection Paths and Names (Global Constants) ---
const PUBLIC_DATA_PATH = `/artifacts/${appId}/public/data`;
const PRIVATE_USER_DATA_PATH = (userId) => `/artifacts/${appId}/users/${userId}`;

// Centralized collection names for Firestore.
const COLLECTIONS = {
  ATHLETES: 'athletes',
  COACHES: 'coaches',
  CURRENT_CHECKINS: 'current_checkins',
  HISTORICAL_CHECKIN_LOGS: 'historical_checkin_logs',
  APP_METADATA: 'app_metadata',
  LOOKUP_CATEGORIES: 'lookup_categories',
  LOOKUP_ENTITIES: 'lookup_entities',
};

// Seed Data (Reverted to original structure)
const initialSeedData = {
  categories: [
    { id: 'team', name: 'Team', icon: 'Users' },
    { id: 'class', name: 'Class', icon: 'BookOpen' },
    { id: 'rec', name: 'Rec', icon: 'Tag' },
    { id: 'training', name: 'Training', icon: 'Calendar' }
  ],
  entities: [
    { id: 'sparkle-squad', name: 'Sparkle Squad', categoryId: 'team' },
    { id: 'power-pumas', name: 'Power Pumas', categoryId: 'team' },
    { id: 'tumble-basics', name: 'Tumble Basics', categoryId: 'class' },
    { id: 'jump-drills', name: 'Jump Drills', categoryId: 'class' },
    { id: 'weekend-warriors', categoryId: 'rec', name: 'Weekend Warriors' },
    { id: 'conditioning-101', categoryId: 'training', name: 'Conditioning 101' }
  ],
  coaches: [
    { id: 'coach-alex', name: 'Coach Alex', email: 'alex@cheergym.com', phone: '5551112222', associatedEntities: [{ id: 'sparkle-squad', name: 'Sparkle Squad', categoryId: 'team' }, { id: 'power-pumas', name: 'Power Pumas', categoryId: 'team' }, { id: 'tumble-basics', name: 'Tumble Basics', categoryId: 'class' }], isApproved: true, passcode: '1234' },
    { id: 'coach-jessica', name: 'Coach Jessica', email: 'jessica@cheergym.com', phone: '5553334444', associatedEntities: [{ id: 'power-pumas', name: 'Power Pumas', categoryId: 'team' }, { id: 'jump-drills', name: 'Jump Drills', categoryId: 'class' }], isApproved: true, passcode: '0000' },
  ],
  athletes: [
    { id: 'athlete-1', name: 'Emily Smith', associatedEntities: [{ id: 'sparkle-squad', name: 'Sparkle Squad', categoryId: 'team' }, { id: 'power-pumas', name: 'Power Pumas', categoryId: 'team' }, { id: 'tumble-basics', name: 'Tumble Basics', categoryId: 'class' }], skills: [{ name: 'Back Handspring', status: 'Working On' }], improvementAreas: 'Needs stronger jumps.', coachNotes: [{ date: '2023-10-26', text: 'Great improvement on conditioning.' }], isApproved: true, addedByCoach: 'Coach Alex', profilePicture: 'https://placehold.co/100x100/A0DAFB/FFFFFF?text=ES', guardianFirstName: 'John', guardianLastName: 'Smith', guardianPhone: '555-123-4567' },
    { id: 'athlete-2', name: 'Mia Johnson', associatedEntities: [{ id: 'sparkle-squad', name: 'Sparkle Squad', categoryId: 'team' }, { id: 'jump-drills', name: 'Jump Drills', categoryId: 'class' }], skills: [{ name: 'Round-off', status: 'Mastered' }], improvementAreas: 'More flexibility.', coachNotes: [{ date: '2023-11-01', text: 'Showing leadership qualities.' }], isApproved: true, addedByCoach: 'Coach Jessica', profilePicture: 'https://placehold.co/100x100/F0B27A/FFFFFF?text=MJ', guardianFirstName: 'Sarah', guardianLastName: 'Johnson', guardianPhone: '555-987-6543' },
    { id: 'athlete-3', name: 'Olivia Brown', associatedEntities: [{ id: 'power-pumas', name: 'Power Pumas', categoryId: 'team' }, { id: 'tumble-basics', name: 'Tumble Basics', categoryId: 'class' }], skills: [{ name: 'Flyer Skills', status: 'Not Started' }], improvementAreas: 'Build confidence.', coachNotes: [], isApproved: true, addedByCoach: 'Coach Alex', profilePicture: 'https://placehold.co/100x100/96CEB4/FFFFFF?text=OB', guardianFirstName: 'David', guardianLastName: 'Brown', guardianPhone: '555-234-5678' },
    { id: 'athlete-pending-1', name: 'Sophia Miller', associatedEntities: [], skills: [], improvementAreas: '', coachNotes: [], isApproved: false, addedByCoach: 'Coach Alex', profilePicture: 'https://placehold.co/100x100/DBE2EF/36454F?text=SM', guardianFirstName: '', guardianLastName: '', guardianPhone: '' },
  ],
};

const MASTER_PASSCODE = 'cheer123';

// --- Utility Functions ---
const formatPhoneNumber = (phoneNumberString) => {
  if (!phoneNumberString) return '';
  const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return cleaned;
};

// --- Utility Components ---
const Icon = ({ name, size = 20, className = "" }) => {
  const icons = {
    User, Users, Calendar, Settings, ChevronLeft, CheckCircle2, XCircle, BarChart2, Plus, Edit, Trash2, Tag, BookOpen, Layers, GraduationCap, X, Smartphone, Tablet, Monitor,
  };
  const LucideIcon = icons[name];
  return LucideIcon ? <LucideIcon size={size} className={className} /> : null;
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    <span className="ml-2 text-gray-700">Loading...</span>
  </div>
);

const Modal = ({ isOpen, title, children, onClose, showCloseButton = true }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto relative transform transition-all scale-100 opacity-100" onClick={e => e.stopPropagation()}>
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
  // --- CHANGED: Always use SHARED_USER_ID for all Firestore operations ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId] = useState(SHARED_USER_ID);
  const [userRole, setUserRole] = useState('none');
  const [loggedInUserName, setLoggedInUserName] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [firebaseInitError, setFirebaseInitError] = useState(null);
  const [deviceType, setDeviceType] = useState('pc');

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

  // Function to seed initial data into Firestore
  const seedInitialData = async (uid) => {
    if (!db || !uid) return;
    const metadataDocRef = doc(db, PRIVATE_USER_DATA_PATH(uid), COLLECTIONS.APP_METADATA, 'seed_status');
    try {
      const docSnap = await getDoc(metadataDocRef);
      if (!docSnap.exists() || !docSnap.data()?.seeded) {
        const batchPromises = [];
        for (const category of initialSeedData.categories) {
          batchPromises.push(setDoc(doc(db, PUBLIC_DATA_PATH, COLLECTIONS.LOOKUP_CATEGORIES, category.id), category));
        }
        for (const entity of initialSeedData.entities) {
          batchPromises.push(setDoc(doc(db, PUBLIC_DATA_PATH, COLLECTIONS.LOOKUP_ENTITIES, entity.id), entity));
        }
        for (const coach of initialSeedData.coaches) {
          batchPromises.push(setDoc(doc(db, PRIVATE_USER_DATA_PATH(uid), COLLECTIONS.COACHES, coach.id), coach));
        }
        for (const athlete of initialSeedData.athletes) {
          batchPromises.push(setDoc(doc(db, PRIVATE_USER_DATA_PATH(uid), COLLECTIONS.ATHLETES, athlete.id), athlete));
        }
        await Promise.all(batchPromises);
        await setDoc(metadataDocRef, { seeded: true, timestamp: new Date() });
      }
    } catch (e) {
      showAppToast(`Error seeding data: ${e.message}`, 'error');
    }
  };

  // Firebase Initialization and Auth Listener
  useEffect(() => {
    if (!app) {
      try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
      } catch (error) {
        const errorMessage = `Error initializing Firebase: ${error.message}. Please check your Firebase config.`;
        setFirebaseInitError(errorMessage);
        setIsAuthReady(true);
        return;
      }
    }
    // --- CHANGED: Always use SHARED_USER_ID for all Firestore operations ---
    seedInitialData(SHARED_USER_ID).then(() => setIsAuthReady(true));
  }, []);

  // --- Login Logic ---
  const handleLogin = async (passcode) => {
    if (!auth || !db || !currentUserId) {
      showAppToast("App is not fully initialized. Please wait or check console for Firebase errors.", 'error');
      return false;
    }
    if (passcode === MASTER_PASSCODE) {
      setIsAuthenticated(true);
      setUserRole('admin');
      setLoggedInUserName('Admin');
      showAppToast("Logged in as Admin!");
      return true;
    }
    try {
      const coachesRef = collection(db, PRIVATE_USER_DATA_PATH(currentUserId), COLLECTIONS.COACHES);
      const q = query(coachesRef, where('passcode', '==', passcode), where('isApproved', '==', true));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const coachData = querySnapshot.docs[0].data();
        setIsAuthenticated(true);
        setUserRole('coach');
        setLoggedInUserName(coachData.name);
        showAppToast(`Logged in as Coach ${coachData.name}!`);
        return true;
      } else {
        showAppToast("Invalid Passcode.", 'error');
        return false;
      }
    } catch (error) {
      showAppToast(`Login error: ${error.message}`, 'error');
      return false;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('none');
    setLoggedInUserName(null);
    showAppToast("Logged out successfully.");
  };

  if (firebaseInitError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 text-red-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Application Initialization Error</h2>
        <p className="text-center">{firebaseInitError}</p>
        <p className="mt-4 text-sm text-red-600">Please ensure your Firebase configuration is correct and reload the page.</p>
      </div>
    );
  }

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
          loggedInUserName={loggedInUserName}
          onLogout={handleLogout}
          db={db}
          publicDataPath={PUBLIC_DATA_PATH}
          privateUserDataPath={PRIVATE_USER_DATA_PATH}
          COLLECTIONS={COLLECTIONS}
          showAppToast={showAppToast}
          deviceType={deviceType}
          setDeviceType={setDeviceType}
        />
      )}
      <ToastNotification message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      {isAuthenticated && (
        <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white bg-opacity-75 p-1 rounded">
          User ID: {currentUserId}
        </div>
      )}
    </div>
  );
}

// ...rest of your components remain unchanged...

// --- Login Screen Component ---
const LoginScreen = ({ onLogin }) => {
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await onLogin(passcode);
    if (!success) {
      setPasscode('');
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
            maxLength="10"
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
const MainAppContent = ({ currentUserId, userRole, loggedInUserName, onLogout, db, publicDataPath, privateUserDataPath, COLLECTIONS, showAppToast, deviceType, setDeviceType }) => {
  const [viewMode, setViewMode] = useState('check-in');

  useEffect(() => {
    // Set initial view mode based on user role
    if (userRole === 'coach' || userRole === 'admin') {
      setViewMode('coach-dashboard');
    } else {
      setViewMode('check-in');
    }
  }, [userRole]);

  // Determine max-width class based on deviceType
  const getMaxWidthClass = () => {
    switch (deviceType) {
      case 'phone':
        return 'max-w-md'; // Simulates phone width
      case 'tablet':
        return 'max-w-3xl'; // Simulates tablet width
      case 'pc':
      default:
        return 'max-w-6xl'; // Simulates PC width
    }
  };

  return (
    <div className={`w-full mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 min-h-[80vh] flex flex-col ${getMaxWidthClass()}`}>
      <header className="p-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-t-xl shadow-md flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-3xl font-extrabold">Cheer Portal</h1>
        <div className="flex items-center space-x-4">
          {userRole !== 'none' && (
            <span className="text-sm font-medium opacity-80 capitalize">Logged in as {loggedInUserName || userRole}</span>
          )}
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Device Selector */}
      <div className="flex justify-center p-2 bg-gray-100 border-b border-gray-200">
        <div className="flex space-x-2 bg-white rounded-full p-1 shadow-inner">
          <button
            onClick={() => setDeviceType('phone')}
            className={`flex items-center px-4 py-2 rounded-full font-medium text-sm transition-colors duration-200 ${deviceType === 'phone' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Icon name="Smartphone" size={16} className="mr-1" /> Phone
          </button>
          <button
            onClick={() => setDeviceType('tablet')}
            className={`flex items-center px-4 py-2 rounded-full font-medium text-sm transition-colors duration-200 ${deviceType === 'tablet' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Icon name="Tablet" size={16} className="mr-1" /> Tablet
          </button>
          <button
            onClick={() => setDeviceType('pc')}
            className={`flex items-center px-4 py-2 rounded-full font-medium text-sm transition-colors duration-200 ${deviceType === 'pc' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Icon name="Monitor" size={16} className="mr-1" /> PC
          </button>
        </div>
      </div>

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
            publicDataPath={publicDataPath}
            privateUserDataPath={privateUserDataPath}
            COLLECTIONS={COLLECTIONS}
            showAppToast={showAppToast}
            deviceType={deviceType} // Pass deviceType
          />
        )}
        {viewMode === 'coach-dashboard' && (userRole === 'coach' || userRole === 'admin') && (
          <CoachDashboard
            db={db}
            currentUserId={currentUserId}
            userRole={userRole}
            loggedInUserName={loggedInUserName}
            publicDataPath={publicDataPath}
            privateUserDataPath={privateUserDataPath}
            COLLECTIONS={COLLECTIONS}
            showAppToast={showAppToast}
            deviceType={deviceType} // Pass deviceType
          />
        )}
      </main>
    </div>
  );
};

// --- Check-In Mode Component ---
const CheckInMode = ({ db, currentUserId, publicDataPath, privateUserDataPath, COLLECTIONS, showAppToast, deviceType }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [categories, setCategories] = useState([]);
  const [entities, setEntities] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [currentCheckins, setCurrentCheckins] = useState([]);
  const [holdingAthleteId, setHoldingAthleteId] = useState(null);
  const [holdProgressMap, setHoldProgressMap] = useState({});
  const holdIntervalRef = useRef({});

  const CHECK_IN_HOLD_TIME = 1000; // 1 second for hold to check-in

  // Fetch all categories from public data
  useEffect(() => {
    if (!db) return;
    const categoriesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES);
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching categories:", error);
      showAppToast(`Error loading categories: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES, showAppToast]);

  // Fetch entities based on selected category from public data
  useEffect(() => {
    if (!db || !selectedCategory?.id) {
      setEntities([]);
      return;
    }
    const entitiesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES);
    const q = query(entitiesRef, where('categoryId', '==', selectedCategory.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching entities for category:", error);
      showAppToast(`Error loading entities: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES, selectedCategory, showAppToast]);


  // Fetch approved athletes associated with the selected entity from private user data
  useEffect(() => {
    if (!db || !currentUserId || !selectedEntity?.id) {
      setAthletes([]);
      return;
    }
    const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
    const q = query(athletesRef, where('associatedEntities', 'array-contains', { id: selectedEntity.id, name: selectedEntity.name, categoryId: selectedEntity.categoryId }), where('isApproved', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAthletes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAthletes(fetchedAthletes.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching athletes:", error);
      showAppToast(`Error loading athletes: ${error.message}`, 'error');
    });

    return () => unsubscribe();
  }, [db, currentUserId, privateUserDataPath, COLLECTIONS.ATHLETES, selectedEntity, showAppToast]);

  // Listen for current check-ins in real-time from public data
  useEffect(() => {
    if (!db || !currentUserId || !selectedCategory?.id || !selectedEntity?.id) {
      setCurrentCheckins([]);
      return;
    }

    const checkinsRef = collection(db, publicDataPath, COLLECTIONS.CURRENT_CHECKINS);
    const q = query(
      checkinsRef,
      where('checkInCategoryId', '==', selectedCategory.id),
      where('checkInEntityId', '==', selectedEntity.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCheckins = snapshot.docs.map(doc => doc.data());
      setCurrentCheckins(fetchedCheckins);
    }, (error) => {
      console.error("Error fetching current check-ins:", error);
      showAppToast(`Error loading check-ins: ${error.message}`, 'error');
    });

    return () => unsubscribe();
  }, [db, currentUserId, publicDataPath, COLLECTIONS.CURRENT_CHECKINS, selectedCategory, selectedEntity, showAppToast]);

  // Handle touch/mouse hold start for check-in
  const handleHoldStart = (athleteId, athleteName) => {
    if (!db || !currentUserId) {
      showAppToast("App not ready.", 'error');
      return;
    }

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
        handleCheckIn(athleteId, athleteName);
        setHoldingAthleteId(null);
      }
    }, 50);
  };

  // Handle touch/mouse hold end (release)
  const handleHoldEnd = (athleteId) => {
    if (holdIntervalRef.current[athleteId]) {
      clearInterval(holdIntervalRef.current[athleteId]);
      delete holdIntervalRef.current[athleteId];
    }
    setHoldingAthleteId(null);
    setHoldProgressMap(prev => ({ ...prev, [athleteId]: 0 }));
  };

  // Perform the check-in operation
  const handleCheckIn = async (athleteId, athleteName) => {
    if (!db || !currentUserId || !selectedCategory?.id || !selectedEntity?.id) {
      showAppToast("Selection incomplete for check-in.", 'error');
      return;
    }

    const timestamp = new Date();
    const checkinsRef = collection(db, publicDataPath, COLLECTIONS.CURRENT_CHECKINS);
    // Create a unique ID for the check-in document
    const checkinId = `${athleteId}_${selectedCategory.id}_${selectedEntity.id}_${timestamp.getTime()}`;
    const checkinData = {
      athleteId,
      athleteName,
      checkInCategoryId: selectedCategory.id,
      checkInCategoryName: selectedCategory.name,
      checkInEntityId: selectedEntity.id,
      checkInEntityName: selectedEntity.name,
      timestamp: timestamp.toISOString() // Store timestamp as ISO string for consistency
    };

    try {
      await setDoc(doc(checkinsRef, checkinId), checkinData);
      showAppToast(`Checked in ${athleteName} for ${selectedEntity.name}!`);
    } catch (err) {
      console.error(`Check-in failed: ${err.message}`, 'error');
      showAppToast(`Check-in failed: ${err.message}`, 'error');
    }
  };

  // Check if an athlete is currently checked in for the selected entity/category
  const isCheckedIn = (athleteId) => {
    return currentCheckins.some(
      checkin => checkin.athleteId === athleteId &&
      checkin.checkInCategoryId === selectedCategory.id &&
      checkin.checkInEntityId === selectedEntity.id
    );
  };

  // Determine grid columns based on deviceType for category and entity selection
  const getCategoryGridColsClass = () => {
    switch (deviceType) {
      case 'phone': return 'grid-cols-1';
      case 'tablet': return 'grid-cols-2';
      case 'pc': return 'grid-cols-4';
      default: return 'grid-cols-2'; // Default for wider screens
    }
  };

  const getEntityGridColsClass = () => {
    switch (deviceType) {
      case 'phone': return 'grid-cols-1';
      case 'tablet': return 'grid-cols-2';
      case 'pc': return 'grid-cols-3';
      default: return 'grid-cols-2'; // Default for wider screens
    }
  };

  const getAthleteGridColsClass = () => {
    switch (deviceType) {
      case 'phone': return 'grid-cols-1';
      case 'tablet': return 'grid-cols-2';
      case 'pc': return 'grid-cols-3';
      default: return 'grid-cols-2';
    }
  };

  // Render category selection screen
  if (!selectedCategory) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 p-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Select Check-In Category</h2>
        <div className={`grid ${getCategoryGridColsClass()} gap-6 w-full max-w-2xl`}>
          {categories.length === 0 ? (
            <p className="col-span-full text-center text-gray-600 text-lg">No categories defined. Please contact an admin.</p>
          ) : (
            categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-2xl p-6 text-center font-semibold text-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105
                           aspect-square" // Make buttons square for aesthetic
              >
                <Icon name={category.icon} size={48} className="mb-3 text-indigo-600" />
                {category.name}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Render entity selection screen for the chosen category
  if (!selectedEntity) {
    return (
      <div className="flex flex-col h-full p-4">
        <button
          onClick={() => { setSelectedCategory(null); setSelectedEntity(null); }}
          className="self-start mb-6 bg-gray-200 text-gray-700 py-3 px-6 rounded-full flex items-center hover:bg-gray-300 transition duration-200 shadow-md text-lg font-semibold"
        >
          <ChevronLeft size={24} className="mr-3" /> Back to Categories
        </button>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Select {selectedCategory.name}</h2>
        <div className={`grid ${getEntityGridColsClass()} gap-6 w-full max-w-3xl mx-auto`}>
          {entities.length === 0 ? (
            <p className="text-center text-gray-600 col-span-full text-lg">No {selectedCategory.name.toLowerCase()}s available. Please contact an an admin.</p>
          ) : (
            entities.map(entity => (
              <button
                key={entity.id}
                onClick={() => setSelectedEntity(entity)}
                className="bg-white border border-gray-200 rounded-2xl p-6 text-center font-bold text-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105
                           aspect-video flex items-center justify-center" // Make buttons rectangular
              >
                {entity.name}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Render athlete list for check-in
  return (
    <div className="flex flex-col h-full p-4">
      <button
        onClick={() => setSelectedEntity(null)}
        className="self-start mb-6 bg-gray-200 text-gray-700 py-3 px-6 rounded-full flex items-center hover:bg-gray-300 transition duration-200 shadow-md text-lg font-semibold"
      >
        <ChevronLeft size={24} className="mr-3" /> Back to {selectedCategory.name} Selection
      </button>
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Check-In for: <span className="text-indigo-600">{selectedEntity.name} ({selectedCategory.name})</span>
      </h2>
      <div className={`grid ${getAthleteGridColsClass()} gap-6 w-full max-w-5xl mx-auto`}>
        {athletes.length === 0 ? (
          <p className="text-center text-gray-600 col-span-full text-lg py-10">No approved athletes found for this {selectedEntity.name}.</p>
        ) : (
          athletes.map(athlete => {
            const checkedIn = isCheckedIn(athlete.id);
            const holding = holdingAthleteId === athlete.id;
            const progress = holding ? (holdProgressMap[athlete.id] || 0) : 0;

            return (
              <div
                key={athlete.id}
                className={`relative bg-white rounded-2xl p-6 shadow-xl overflow-hidden transition-all duration-300 ease-in-out cursor-pointer
                  ${checkedIn ? 'border-4 border-green-500 bg-green-50' : 'border-2 border-gray-200'}
                  ${holding ? 'scale-105 shadow-2xl' : 'hover:shadow-lg hover:scale-[1.02]'}
                `}
                onMouseDown={() => handleHoldStart(athlete.id, athlete.name)}
                onMouseUp={() => handleHoldEnd(athlete.id)}
                onMouseLeave={() => handleHoldEnd(athlete.id)}
                onTouchStart={(e) => { e.preventDefault(); handleHoldStart(athlete.id, athlete.name); }}
                onTouchEnd={() => handleHoldEnd(athlete.id)}
                onTouchCancel={() => handleHoldEnd(athlete.id)}
              >
                {/* Progress bar overlay for hold-to-check-in */}
                {holding && (
                  <div
                    className="absolute inset-x-0 bottom-0 h-2 bg-indigo-500 opacity-75 z-0 transition-all duration-50"
                    style={{ width: `${progress}%` }}
                  ></div>
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <img
                    src={athlete.profilePicture || `https://placehold.co/120x120/cccccc/333333?text=${athlete.name ? athlete.name.charAt(0) : '?'}`}
                    alt={athlete.name}
                    className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-indigo-300 shadow-md"
                  />
                  <span className="text-2xl font-bold text-gray-900 truncate w-full px-2">{athlete.name}</span>
                  {checkedIn && (
                    <div className="mt-2 flex items-center text-green-700 font-semibold text-lg">
                      <CheckCircle2 size={24} className="mr-2" /> Checked In
                    </div>
                  )}
                  {holding && (
                    <span className="mt-2 text-indigo-700 text-lg font-semibold">Holding...</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- Coach Dashboard Component ---
const CoachDashboard = ({ db, currentUserId, userRole, loggedInUserName, publicDataPath, privateUserDataPath, COLLECTIONS, showAppToast, deviceType }) => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [isResetting, setIsResetting] = useState(false); // Changed initial state to boolean
  const [resetProgress, setResetProgress] = useState(0);
  const resetIntervalRef = useRef(null);

  const RESET_HOLD_TIME = 3000; // 3 seconds for hold to reset

  // Handle hold start for resetting daily check-ins
  const handleResetHoldStart = () => {
    setIsResetting(true);
    setResetProgress(0);
    const startTime = Date.now();

    resetIntervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(100, (elapsedTime / RESET_HOLD_TIME) * 100);
      setResetProgress(progress);

      if (progress === 100) {
        clearInterval(resetIntervalRef.current);
        resetIntervalRef.current = null;
        resetDailyCheckins();
        setIsResetting(false);
      }
    }, 50); // Update progress every 50ms
  };

  // Handle hold end (release) for resetting
  const handleResetHoldEnd = () => {
    if (resetIntervalRef.current) {
      clearInterval(resetIntervalRef.current);
      resetIntervalRef.current = null;
    }
    setIsResetting(false);
    setResetProgress(0);
  };

  // Logic to reset daily check-ins and log them historically
  const resetDailyCheckins = async () => {
    if (!db || !currentUserId) {
      showAppToast("App not ready for reset operation.", 'error');
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
      const batchDeletePromises = [];

      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        checkinEventsToLog.push(data);
        batchDeletePromises.push(deleteDoc(doc(currentCheckinsRef, docSnap.id)));
      });

      console.log("Executing batch delete for current check-ins...");
      await Promise.all(batchDeletePromises); // Execute all delete operations concurrently
      console.log("Current check-ins successfully deleted.");

      if (checkinEventsToLog.length > 0) {
        console.log("Logging to historical records...");
        const historicalLogsRef = collection(db, publicDataPath, COLLECTIONS.HISTORICAL_CHECKIN_LOGS);
        // Add a single document containing all events from the day's reset
        await addDoc(historicalLogsRef, {
          timestamp: new Date().toISOString(),
          resetByUserId: currentUserId,
          dailyCheckInEvents: checkinEventsToLog.map(({ athleteId, athleteName, checkInCategoryId, checkInCategoryName, checkInEntityId, checkInEntityName, timestamp }) => ({
            athleteId,
            athleteName,
            checkInCategoryId,
            checkInCategoryName,
            checkInEntityId,
            checkInEntityName,
            timestamp
          })),
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
      setIsResetting(false); // Ensure resetting state is false regardless of success/failure
      setResetProgress(0);
      console.log("Reset state cleanup complete.");
    }
  };

  const isAdminUser = userRole === 'admin';

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
          disabled={!isAdminUser} // Only admins can reset
        >
          {isResetting && (
            <div
              className="absolute inset-0 bg-red-800 opacity-50 z-0 transition-all duration-50"
              style={{ width: `${resetProgress}%` }}
            ></div>
          )}
          <span className="relative z-10">
            {isResetting ? `Hold to Reset (${Math.round(resetProgress)}%)` : 'Reset Daily Check-ins'}
          </span>
          {!isAdminUser && (
            // Overlay to indicate admin-only if not admin
            <span className="absolute inset-0 flex items-center justify-center text-xs bg-gray-500 bg-opacity-75 rounded-full z-20">Admin Only</span>
          )}
        </button>
      </div>

      {/* Navigation tabs for Coach Dashboard */}
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
        {isAdminUser && (
          <button
            onClick={() => setActiveTab('categories-entities')}
            className={`flex-1 py-3 px-4 text-center font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-200 ${activeTab === 'categories-entities' ? 'border-b-4 border-indigo-600 text-indigo-700 bg-gray-100' : ''}`}
          >
            <Layers className="inline-block mr-2" size={20} /> Categories & Entities
          </button>
        )}
      </nav>

      {/* Content area for active tab */}
      <div className="flex-1 overflow-auto bg-white rounded-b-xl p-4 shadow-inner">
        {activeTab === 'attendance' && <AttendanceView db={db} currentUserId={currentUserId} publicDataPath={publicDataPath} privateUserDataPath={privateUserDataPath} COLLECTIONS={COLLECTIONS} showAppToast={showAppToast} deviceType={deviceType} />}
        {activeTab === 'athlete-profiles' && <AthleteProfiles db={db} currentUserId={currentUserId} userRole={userRole} loggedInUserName={loggedInUserName} publicDataPath={publicDataPath} privateUserDataPath={privateUserDataPath} COLLECTIONS={COLLECTIONS} showAppToast={showAppToast} deviceType={deviceType} />}
        {activeTab === 'coach-management' && <CoachManagement db={db} currentUserId={currentUserId} userRole={userRole} publicDataPath={publicDataPath} privateUserDataPath={privateUserDataPath} COLLECTIONS={COLLECTIONS} showAppToast={showAppToast} deviceType={deviceType} />}
        {activeTab === 'check-in-logs' && <CheckinLogs db={db} currentUserId={currentUserId} userRole={userRole} publicDataPath={publicDataPath} privateUserDataPath={privateUserDataPath} COLLECTIONS={COLLECTIONS} showAppToast={showAppToast} deviceType={deviceType} />}
        {activeTab === 'categories-entities' && isAdminUser && <CategoryEntityManagement db={db} currentUserId={currentUserId} publicDataPath={publicDataPath} privateUserDataPath={privateUserDataPath} COLLECTIONS={COLLECTIONS} showAppToast={showAppToast} deviceType={deviceType} />}
      </div>
    </div>
  );
};

// --- Attendance View Component ---
const AttendanceView = ({ db, currentUserId, publicDataPath, privateUserDataPath, COLLECTIONS, showAppToast, deviceType }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [categories, setCategories] = useState([]);
  const [entities, setEntities] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [currentCheckins, setCurrentCheckins] = useState([]);

  // Fetch all categories from public data
  useEffect(() => {
    if (!db) return;
    const categoriesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES);
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching categories:", error);
      showAppToast(`Error loading categories: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES, showAppToast]);

  // Fetch entities based on selected category from public data
  useEffect(() => {
    if (!db || !selectedCategory?.id) {
      setEntities([]);
      return;
    }
    const entitiesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES);
    const q = query(entitiesRef, where('categoryId', '==', selectedCategory.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching entities for category:", error);
      showAppToast(`Error loading entities: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES, selectedCategory, showAppToast]);


  // Fetch approved athletes associated with the selected entity from private user data
  useEffect(() => {
    if (!db || !currentUserId || !selectedEntity?.id) {
      setAthletes([]);
      return;
    }
    const athletesRef = collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES);
    const q = query(athletesRef, where('associatedEntities', 'array-contains', { id: selectedEntity.id, name: selectedEntity.name, categoryId: selectedEntity.categoryId }), where('isApproved', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAthletes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAthletes(fetchedAthletes.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching athletes:", error);
      showAppToast(`Error loading athletes: ${error.message}`, 'error');
    });

    return () => unsubscribe();
  }, [db, currentUserId, privateUserDataPath, COLLECTIONS.ATHLETES, selectedEntity, showAppToast]);

  // Listen for current check-ins in real-time from public data
  useEffect(() => {
    if (!db || !currentUserId || !selectedCategory?.id || !selectedEntity?.id) {
      setCurrentCheckins([]);
      return;
    }

    const checkinsRef = collection(db, publicDataPath, COLLECTIONS.CURRENT_CHECKINS);
    const q = query(
      checkinsRef,
      where('checkInCategoryId', '==', selectedCategory.id),
      where('checkInEntityId', '==', selectedEntity.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCheckins = snapshot.docs.map(doc => doc.data());
      setCurrentCheckins(fetchedCheckins);
    }, (error) => {
      console.error("Error fetching current check-ins:", error);
      showAppToast(`Error loading check-ins: ${error.message}`, 'error');
    });

    return () => unsubscribe();
  }, [db, currentUserId, publicDataPath, COLLECTIONS.CURRENT_CHECKINS, selectedCategory, selectedEntity, showAppToast]);

  const getAthleteStatus = (athleteId) => {
    const checkins = currentCheckins.filter(c => c.athleteId === athleteId);
    if (checkins.length > 0) {
      const lastCheckin = checkins.reduce((prev, current) =>
        new Date(prev.timestamp) > new Date(current.timestamp) ? prev : current
      );
      return {
        status: 'Checked In',
        lastCheckinTime: new Date(lastCheckin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        activities: checkins.map(c => `${c.checkInEntityName} (${c.checkInCategoryName}: ${new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`).join(', ')
      };
    }
    return { status: 'Not Checked In', lastCheckinTime: 'N/A', activities: 'N/A' };
  };

  if (!selectedCategory) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800">Select Category to View Attendance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-2xl">
          {categories.length === 0 ? (
            <p className="col-span-full text-center text-gray-600">No categories defined. Please contact an admin.</p>
          ) : (
            categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg p-4 text-center font-semibold shadow-lg hover:bg-gray-50 transition duration-300 ease-in-out transform hover:scale-105 text-lg"
              >
                <Icon name={category.icon} size={32} className="mb-2 text-indigo-600" />
                {category.name}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (!selectedEntity) {
    return (
      <div className="flex flex-col items-center h-full p-4">
        <button
          onClick={() => { setSelectedCategory(null); setSelectedEntity(null); }}
          className="self-start mb-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center hover:bg-gray-300 transition duration-200"
        >
          <ChevronLeft size={20} className="mr-2" /> Back to Categories
        </button>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Select {selectedCategory.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
          {entities.length === 0 ? (
            <p className="text-center text-gray-600 col-span-full">No {selectedCategory.name.toLowerCase()}s available. Please contact an admin.</p>
          ) : (
            entities.map(entity => (
              <button
                key={entity.id}
                onClick={() => setSelectedEntity(entity)}
                className="bg-white border border-gray-200 rounded-lg p-4 text-center font-medium shadow hover:shadow-md transition duration-200 transform hover:scale-105 text-lg"
              >
                {entity.name}
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
        <ChevronLeft size={20} className="mr-2" /> Back to {selectedCategory.name} Selection
      </button>
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Attendance for: <span className="text-indigo-600">{selectedEntity.name} ({selectedCategory.name})</span>
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
                  No athletes found for this {selectedCategory.name.toLowerCase()} {selectedEntity.name}.
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
                        src={athlete.profilePicture || `https://placehold.co/30x30/cccccc/333333?text=${athlete.name ? athlete.name.charAt(0) : '?'}`}
                        alt={athlete.name}
                        className="w-8 h-8 rounded-full mr-3 object-cover border border-gray-200"
                      />
                      {athlete.name}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isCheckedIn ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}`}>
                      {status}
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
const AthleteProfiles = ({ db, currentUserId, userRole, loggedInUserName, publicDataPath, privateUserDataPath, COLLECTIONS, showAppToast, deviceType }) => {
  const [athletes, setAthletes] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState(null);

  // Fetch athletes in real-time from private user data
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
  }, [db, currentUserId, privateUserDataPath, COLLECTIONS.ATHLETES, showAppToast]);

  // Filter athletes based on search text
  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(filterText.toLowerCase()) ||
    (athlete.associatedEntities && athlete.associatedEntities.some(entity =>
      entity.name?.toLowerCase().includes(filterText.toLowerCase()) ||
      entity.categoryId?.toLowerCase().includes(filterText.toLowerCase())
    )) ||
    (athlete.guardianFirstName && athlete.guardianFirstName.toLowerCase().includes(filterText.toLowerCase())) ||
    (athlete.guardianLastName && athlete.guardianLastName.toLowerCase().includes(filterText.toLowerCase())) ||
    (athlete.guardianPhone && athlete.guardianPhone.toLowerCase().includes(filterText.toLowerCase()))
  );

  const handleAddAthleteClick = () => {
    setEditingAthlete(null);
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
          placeholder="Filter athletes by name, team, class, or guardian info..."
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
                  src={athlete.profilePicture || `https://placehold.co/80x80/cccccc/333333?text=${athlete.name ? athlete.name.charAt(0) : '?'}`}
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
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Associated with:</span>{' '}
                {athlete.associatedEntities && athlete.associatedEntities.length > 0
                  ? athlete.associatedEntities.map(e => `${e.name} (${e.categoryId})`).join(', ')
                  : 'N/A'}
              </p>

              {/* Parent/Guardian Contact Info Display */}
              {(athlete.guardianFirstName || athlete.guardianLastName || athlete.guardianPhone) && (
                <div className="mb-4">
                  <p className="font-semibold text-gray-800 mb-1">Parent/Guardian Contact:</p>
                  {athlete.guardianFirstName && athlete.guardianLastName && (
                    <p className="text-gray-700 text-sm">
                      Name: {athlete.guardianFirstName} {athlete.guardianLastName}
                    </p>
                  )}
                  {athlete.guardianPhone && (
                    <p className="text-gray-700 text-sm">
                      Phone: {formatPhoneNumber(athlete.guardianPhone)}
                    </p>
                  )}
                </div>
              )}

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
                        {note.date}: {note.text} {note.coachName && <span className="text-gray-500 text-xs">({note.coachName})</span>}
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
                    {userRole === 'admin' && (
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
          loggedInUserName={loggedInUserName}
          publicDataPath={publicDataPath}
          privateUserDataPath={privateUserDataPath}
          COLLECTIONS={COLLECTIONS}
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
const AthleteFormModal = ({ db, currentUserId, showAppToast, onClose, athleteToEdit, userRole, loggedInUserName, publicDataPath, privateUserDataPath, COLLECTIONS }) => {
  const [name, setName] = useState('');
  const [associatedEntities, setAssociatedEntities] = useState([]);
  const [skills, setSkills] = useState([{ name: '', status: 'Not Started' }]);
  const [improvementAreas, setImprovementAreas] = useState('');
  const [coachNotes, setCoachNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');
  // New state for guardian info
  const [guardianFirstName, setGuardianFirstName] = useState('');
  const [guardianLastName, setGuardianLastName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');


  const [allCategories, setAllCategories] = useState([]);
  const [allEntities, setAllEntities] = useState([]);

  const isEditing = !!athleteToEdit;
  const isAdmin = userRole === 'admin';
  const isCoach = userRole === 'coach';

  // Fetch all categories and entities for dropdowns from public data
  useEffect(() => {
    if (!db) return;
    const categoriesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES);
    const entitiesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES);

    const unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
      setAllCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubscribeEntities = onSnapshot(entitiesRef, (snapshot) => {
      setAllEntities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeCategories();
      unsubscribeEntities();
    };
  }, [db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES, COLLECTIONS.LOOKUP_ENTITIES]);

  // Populate form fields if editing an existing athlete
  useEffect(() => {
    if (athleteToEdit) {
      setName(athleteToEdit.name || '');
      setAssociatedEntities(athleteToEdit.associatedEntities || []);
      setSkills(athleteToEdit.skills && athleteToEdit.skills.length > 0 ? athleteToEdit.skills : [{ name: '', status: 'Not Started' }]);
      setImprovementAreas(athleteToEdit.improvementAreas || '');
      setCoachNotes(athleteToEdit.coachNotes || []);
      setIsApproved(athleteToEdit.isApproved || false);
      setProfilePicture(athleteToEdit.profilePicture || '');
      setGuardianFirstName(athleteToEdit.guardianFirstName || '');
      setGuardianLastName(athleteToEdit.guardianLastName || '');
      setGuardianPhone(athleteToEdit.guardianPhone || '');
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
        text: newNoteText.trim(),
        coachName: loggedInUserName || 'Unknown Coach', // Add coach's name to the note
      };
      setCoachNotes([...coachNotes, newNote]);
      setNewNoteText('');
    }
  };

  const handleRemoveNote = (index) => {
    const newNotes = coachNotes.filter((_, i) => i !== index);
    setCoachNotes(newNotes);
  };

  // Phone number formatting for guardian
  const handleGuardianPhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 3 && value.length <= 6)
      value = value.replace(/(\d{3})(\d+)/, "$1-$2");
    else if (value.length > 6)
      value = value.replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3");
    setGuardianPhone(value.slice(0, 12));
  };


  // Handle selection/deselection of associated entities
  const handleEntitySelection = (entityId, categoryId, isChecked) => {
    const entity = allEntities.find(e => e.id === entityId && e.categoryId === categoryId);
    if (!entity) return;

    if (isChecked) {
      // Add entity if not already associated
      if (!associatedEntities.some(e => e.id === entity.id && e.categoryId === categoryId)) {
        setAssociatedEntities(prev => [...prev, { id: entity.id, name: entity.name, categoryId: entity.categoryId }]);
      }
    } else {
      // Remove entity if unselected
      setAssociatedEntities(prev => prev.filter(e => !(e.id === entity.id && e.categoryId === categoryId)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!db || !currentUserId) {
      showAppToast("App not ready.", 'error');
      return;
    }

    // Prepare athlete data based on user role and editing status
    let athleteData = {
      skills: skills.filter(s => s.name.trim()), // Filter out empty skill names
      improvementAreas: improvementAreas.trim(),
      coachNotes: coachNotes,
    };

    if (isEditing) {
      // For existing athlete, copy current data, then apply allowed edits
      athleteData = { ...athleteToEdit, ...athleteData };

      if (isAdmin) {
        // Admin can edit all fields
        athleteData.name = name.trim();
        athleteData.profilePicture = profilePicture || `https://placehold.co/100x100/cccccc/333333?text=${name ? name.charAt(0) : '?' }`;
        athleteData.associatedEntities = associatedEntities;
        athleteData.isApproved = isApproved;
        athleteData.guardianFirstName = guardianFirstName.trim();
        athleteData.guardianLastName = guardianLastName.trim();
        athleteData.guardianPhone = guardianPhone.trim();
      } else if (isCoach) {
        // Coaches can only edit improvementAreas, skills, and add coachNotes
        // Other fields remain as they were
      }
    } else {
      // For new athlete, all fields are set
      athleteData = {
        name: name.trim(),
        associatedEntities: associatedEntities,
        skills: skills.filter(s => s.name.trim()),
        improvementAreas: improvementAreas.trim(),
        coachNotes: coachNotes,
        isApproved: isApproved,
        profilePicture: profilePicture || `https://placehold.co/100x100/cccccc/333333?text=${name ? name.charAt(0) : '?' }`,
        addedByCoach: loggedInUserName || userRole,
        guardianFirstName: guardianFirstName.trim(),
        guardianLastName: guardianLastName.trim(),
        guardianPhone: guardianPhone.trim(),
      };
    }


    try {
      if (isEditing) {
        // Update existing athlete
        await setDoc(doc(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES, athleteToEdit.id), athleteData);
        showAppToast(`Athlete ${name} updated successfully!`);
      } else {
        // Add new athlete
        await addDoc(collection(db, privateUserDataPath(currentUserId), COLLECTIONS.ATHLETES), athleteData);
        showAppToast(`Athlete ${name} added successfully!`);
      }
      onClose(); // Close modal on successful submission
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'add'} athlete:`, error);
      showAppToast(`Failed to ${isEditing ? 'update' : 'add'} athlete: ${error.message}`, 'error');
    }
  };

  return (
    <Modal isOpen={true} title={isEditing ? "Edit Athlete Profile" : "Add New Athlete"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info (Editable by Admin, only viewable by Coach if editing) */}
        <div className={isEditing && isCoach && !isAdmin ? "opacity-60 pointer-events-none" : ""}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Athlete Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required={isAdmin || !isEditing} disabled={isEditing && isCoach && !isAdmin}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Profile Picture URL (optional)</label>
            <input type="url" id="profilePicture" value={profilePicture} onChange={(e) => setProfilePicture(e.target.value)} disabled={isEditing && isCoach && !isAdmin}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              {profilePicture && (
                <img src={profilePicture || `https://placehold.co/100x100/cccccc/333333?text=${name ? name.charAt(0) : '?'}`} alt="Profile Preview" className="w-20 h-20 rounded-full mt-2 object-cover" />
              )}
          </div>
          
          {/* Associated Entities Section */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Associated Teams/Classes/Groups</h4>
            {allCategories.map(category => (
              <div key={category.id} className="mb-4">
                <p className="font-semibold text-gray-700 mb-2">{category.name}s:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allEntities.filter(entity => entity.categoryId === category.id).length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-full">No {category.name.toLowerCase()} entities available.</p>
                  ) : (
                    allEntities.filter(entity => entity.categoryId === category.id).map(entity => (
                      <label key={entity.id} className="inline-flex items-center text-sm text-gray-700">
                        <input
                          type="checkbox"
                          value={entity.id}
                          checked={associatedEntities.some(e => e.id === entity.id && e.categoryId === category.id)}
                          onChange={(e) => handleEntitySelection(entity.id, category.id, e.target.checked)}
                          className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                          disabled={isEditing && isCoach && !isAdmin}
                        />
                        <span className="ml-2">{entity.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Parent/Guardian Contact Info */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Parent/Guardian Contact Info</h4>
            <div>
              <label htmlFor="guardianFirstName" className="block text-sm font-medium text-gray-700">Guardian First Name</label>
              <input type="text" id="guardianFirstName" value={guardianFirstName} onChange={(e) => setGuardianFirstName(e.target.value)} disabled={isEditing && isCoach && !isAdmin}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div className="mt-2">
              <label htmlFor="guardianLastName" className="block text-sm font-medium text-gray-700">Guardian Last Name</label>
              <input type="text" id="guardianLastName" value={guardianLastName} onChange={(e) => setGuardianLastName(e.target.value)} disabled={isEditing && isCoach && !isAdmin}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div className="mt-2">
              <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700">Guardian Phone Number</label>
              <input type="text" id="guardianPhone" value={guardianPhone} onChange={handleGuardianPhoneChange} placeholder="###-###-####" maxLength={12} disabled={isEditing && isCoach && !isAdmin}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isApproved"
                checked={isApproved}
                onChange={(e) => setIsApproved(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isApproved" className="ml-2 block text-sm text-gray-900 font-semibold">Approved</label>
            </div>
          )}
        </div>

        {/* Improvement Areas (Editable by Admin & Coach) */}
        <div>
          <label htmlFor="improvementAreas" className="block text-sm font-medium text-gray-700">Improvement Areas</label>
          <textarea id="improvementAreas" value={improvementAreas} onChange={(e) => setImprovementAreas(e.target.value)} rows="3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>

        {/* Skills Section (Editable by Admin & Coach) */}
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

        {/* Coach Notes Section (Editable by Admin & Coach) */}
        <div className="border border-gray-200 rounded-md p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Coach Notes</h4>
          {coachNotes.map((note, index) => (
            <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md mb-2">
              <span className="text-sm text-gray-700">{note.date}: {note.text} {note.coachName && <span className="text-gray-500 text-xs">({note.coachName})</span>}</span>
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
const CoachManagement = ({ db, currentUserId, userRole, publicDataPath, privateUserDataPath, COLLECTIONS, showAppToast, deviceType }) => {
  const [coaches, setCoaches] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [coachToDelete, setCoachToDelete] = useState(null);

  // Fetch coaches in real-time from private user data
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
  }, [db, currentUserId, privateUserDataPath, COLLECTIONS.COACHES, showAppToast]);

  // Filter coaches based on search text
  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(filterText.toLowerCase()) ||
    coach.email.toLowerCase().includes(filterText.toLowerCase()) ||
    (coach.associatedEntities && coach.associatedEntities.some(entity =>
      entity.name?.toLowerCase().includes(filterText.toLowerCase()) ||
      entity.categoryId?.toLowerCase().includes(filterText.toLowerCase())
    ))
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
        {userRole === 'admin' && ( // Only admins can add new coaches
          <button
            onClick={handleAddCoachClick}
            className="w-full sm:w-auto bg-indigo-600 text-white py-2 px-6 rounded-lg font-semibold shadow-md hover:bg-indigo-700 flex items-center justify-center transition duration-200"
          >
            <Plus size={20} className="mr-2" /> Add New Coach
          </button>
        )}
      </div>

      {filteredCoaches.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No coaches found matching your criteria.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map(coach => (
            <div key={coach.id} className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col">
              <h4 className="text-xl font-bold text-gray-900 mb-2">{coach.name}</h4>
              <p className="text-gray-700 text-sm mb-1">Email: {coach.email}</p>
              <p className="text-gray-700 text-sm mb-2">Phone: {formatPhoneNumber(coach.phone)}</p>
              {userRole === 'admin' && ( // Passcode visible only to admins
                <p className="text-gray-700 text-sm mb-2"><span className="font-semibold">Passcode:</span> {coach.passcode}</p>
              )}
              <p className={`text-sm font-semibold mb-2 ${coach.isApproved ? 'text-green-600' : 'text-red-600'}`}>
                {coach.isApproved ? 'Approved' : 'Pending Approval'}
              </p>
              <p className="text-gray-700 text-sm mb-2">
                <span className="font-semibold">Associated with:</span>{' '}
                {coach.associatedEntities && coach.associatedEntities.length > 0
                  ? coach.associatedEntities.map(e => `${e.name} (${e.categoryId})`).join(', ')
                  : 'N/A'}
              </p>

              {userRole === 'admin' && ( // Edit and Delete buttons visible only to admins
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
              )}
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
          publicDataPath={publicDataPath}
          privateUserDataPath={privateUserDataPath}
          COLLECTIONS={COLLECTIONS}
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
const CoachFormModal = ({ db, currentUserId, showAppToast, onClose, coachToEdit, publicDataPath, privateUserDataPath, COLLECTIONS }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [associatedEntities, setAssociatedEntities] = useState([]);
  const [isApproved, setIsApproved] = useState(false);

  // For dropdowns
  const [allCategories, setAllCategories] = useState([]);
  const [allEntities, setAllEntities] = useState([]);

  const isEditing = !!coachToEdit;

  // Fetch all categories and entities for dropdowns from public data
  useEffect(() => {
    if (!db) return;
    const categoriesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES);
    const entitiesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES);

    const unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
      setAllCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubscribeEntities = onSnapshot(entitiesRef, (snapshot) => {
      setAllEntities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeCategories();
      unsubscribeEntities();
    };
  }, [db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES, COLLECTIONS.LOOKUP_ENTITIES]);

  // Populate form fields if editing an existing coach
  useEffect(() => {
    if (coachToEdit) {
      setName(coachToEdit.name || '');
      setEmail(coachToEdit.email || '');
      setPhone(coachToEdit.phone || '');
      setPasscode(coachToEdit.passcode || '');
      setAssociatedEntities(coachToEdit.associatedEntities || []);
      setIsApproved(coachToEdit.isApproved || false);
    }
  }, [coachToEdit]);

  // Phone number formatting: ###-###-####
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 3 && value.length <= 6)
      value = value.replace(/(\d{3})(\d+)/, "$1-$2");
    else if (value.length > 6)
      value = value.replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3");
    setPhone(value.slice(0, 12));
  };


  const handleEntitySelection = (entityId, categoryId, isChecked) => {
    const entity = allEntities.find(e => e.id === entityId && e.categoryId === categoryId);
    if (!entity) return;

    if (isChecked) {
      // Add entity if not already associated
      if (!associatedEntities.some(e => e.id === entity.id && e.categoryId === categoryId)) {
        setAssociatedEntities(prev => [...prev, { id: entity.id, name: entity.name, categoryId: entity.categoryId }]);
      }
    } else {
      // Remove entity if unselected
      setAssociatedEntities(prev => prev.filter(e => !(e.id === entity.id && e.categoryId === categoryId)));
    }
  };

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
      associatedEntities: associatedEntities,
      isApproved: isApproved,
    };

    try {
      if (isEditing) {
        await setDoc(doc(db, privateUserDataPath(currentUserId), COLLECTIONS.COACHES, coachToEdit.id), coachData);
        showAppToast(`Coach ${name} updated successfully!`);
      } else {
        const coachId = `coach-${Date.now()}`;
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
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
          <input
            type="text"
            id="coachPhone"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="###-###-####"
            maxLength={12}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="coachPasscode" className="block text-sm font-medium text-gray-700">Passcode</label>
          <input type="text" id="coachPasscode" value={passcode} onChange={(e) => setPasscode(e.target.value)} required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        {/* Associated Entities Section */}
        <div className="border border-gray-200 rounded-md p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Associated Teams/Classes/Groups</h4>
          {allCategories.map(category => (
            <div key={category.id} className="mb-4">
              <p className="font-semibold text-gray-700 mb-2">{category.name}s:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allEntities.filter(entity => entity.categoryId === category.id).length === 0 ? (
                  <p className="text-sm text-gray-500 col-span-full">No {category.name.toLowerCase()} entities available.</p>
                ) : (
                  allEntities.filter(entity => entity.categoryId === category.id).map(entity => (
                    <label key={entity.id} className="inline-flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        value={entity.id}
                        checked={associatedEntities.some(e => e.id === entity.id && e.categoryId === category.id)}
                        onChange={(e) => handleEntitySelection(entity.id, category.id, e.target.checked)}
                        className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      />
                      <span className="ml-2">{entity.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          ))}
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
const CheckinLogs = ({ db, currentUserId, userRole, publicDataPath, privateUserDataPath, COLLECTIONS, showAppToast, deviceType }) => {
  const [historicalLogs, setHistoricalLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filterAthleteName, setFilterAthleteName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const [allCategories, setAllCategories] = useState([]);
  const [allEntities, setAllEntities] = useState([]);

  // Fetch all categories and entities for filter dropdowns from public data
  useEffect(() => {
    if (!db) return;
    const categoriesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES);
    const entitiesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES);

    const unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
      setAllCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.name.localeCompare(b.name)));
    });
    const unsubscribeEntities = onSnapshot(entitiesRef, (snapshot) => {
      setAllEntities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.name.localeCompare(b.name)));
    });

    return () => {
      unsubscribeCategories();
      unsubscribeEntities();
    };
  }, [db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES, COLLECTIONS.LOOKUP_ENTITIES]);


  // Fetch historical check-in logs from public data
  useEffect(() => {
    if (!db || !currentUserId) return;
    const logsRef = collection(db, publicDataPath, COLLECTIONS.HISTORICAL_CHECKIN_LOGS);
    const unsubscribe = onSnapshot(logsRef, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort logs by timestamp in descending order (most recent first)
      setHistoricalLogs(fetchedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    }, (error) => {
      console.error("Error fetching historical check-in logs:", error);
      showAppToast(`Error loading logs: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, currentUserId, publicDataPath, COLLECTIONS.HISTORICAL_CHECKIN_LOGS, showAppToast]);

  const viewLogDetails = (log) => {
    setSelectedLog(log);
    // Reset filters when viewing new log details
    setFilterAthleteName('');
    setFilterCategory('');
    setFilterEntity('');
  };

  // Filter check-in events within a selected log based on user input
  const filteredCheckInEvents = selectedLog?.dailyCheckInEvents?.filter(event => {
    const matchesAthlete = filterAthleteName ? event.athleteName.toLowerCase().includes(filterAthleteName.toLowerCase()) : true;
    const matchesCategory = filterCategory ? event.checkInCategoryId === filterCategory : true;
    const matchesEntity = filterEntity ? event.checkInEntityId === filterEntity : true;
    return matchesAthlete && matchesCategory && matchesEntity;
  }) || [];

  // Restrict access to admin only
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
          <div className="flex flex-col sm:flex-row sm:space-x-4 mb-4 space-y-4 sm:space-y-0 flex-wrap">
            <input
              type="text"
              placeholder="Filter by athlete name"
              value={filterAthleteName}
              onChange={(e) => setFilterAthleteName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
            />
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setFilterEntity(''); }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-indigo-500 focus:border-indigo-500 text-base"
            >
              <option value="">Filter by Category</option>
              {allCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-indigo-500 focus:border-indigo-500 text-base"
              disabled={!filterCategory} // Disable entity filter until a category is selected
            >
              <option value="">Filter by Entity</option>
              {allEntities.filter(entity => entity.categoryId === filterCategory).map(entity => (
                <option key={entity.id} value={entity.id}>{entity.name}</option>
              ))}
            </select>
          </div>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2"> {/* Added pr-2 for scrollbar */}
            <p className="text-gray-700 font-medium mb-4"><strong>Total Filtered Check-ins:</strong> {filteredCheckInEvents.length}</p>
            {filteredCheckInEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCheckInEvents.map((event, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-md">
                    <p className="font-bold text-gray-900 text-lg mb-1">{event.athleteName}</p>
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-semibold capitalize">{event.checkInCategoryName}</span>: {event.checkInEntityName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Checked In: {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No check-ins found for the applied filters in this log.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};


// --- New Component: Category and Entity Management ---
const CategoryEntityManagement = ({ db, currentUserId, publicDataPath, privateUserDataPath, COLLECTIONS, showAppToast, deviceType }) => {
  const [categories, setCategories] = useState([]);
  const [entities, setEntities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [showEntityModal, setShowEntityModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [confirmDeleteEntity, setConfirmDeleteEntity] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);

  // Fetch all categories from public data
  useEffect(() => {
    if (!db) return;
    const categoriesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES);
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching categories:", error);
      showAppToast(`Error loading categories: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES, showAppToast]);

  // Fetch entities for the selected category from public data
  useEffect(() => {
    if (!db || !selectedCategory?.id) {
      setEntities([]);
      return;
    }
    const entitiesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES);
    const q = query(entitiesRef, where('categoryId', '==', selectedCategory.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("Error fetching entities:", error);
      showAppToast(`Error loading entities: ${error.message}`, 'error');
    });
    return () => unsubscribe();
  }, [db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES, selectedCategory, showAppToast]);


  // --- Category Handlers ---
  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategoryClick = (category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategoryClick = (category) => {
    setCategoryToDelete(category);
    setConfirmDeleteCategory(true);
  };

  const confirmDeleteSelectedCategory = async () => {
    if (!db || !categoryToDelete) return;

    try {
      const entitiesRef = collection(db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES);
      // Check if there are any entities associated with this category
      const q = query(entitiesRef, where('categoryId', '==', categoryToDelete.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        showAppToast(`Cannot delete category "${categoryToDelete.name}" because it has associated entities. Delete entities first.`, 'error');
        setConfirmDeleteCategory(false);
        setCategoryToDelete(null);
        return;
      }

      await deleteDoc(doc(db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES, categoryToDelete.id));
      showAppToast(`Category "${categoryToDelete.name}" deleted successfully!`);
    } catch (error) {
      console.error("Error deleting category:", error);
      showAppToast(`Failed to delete category: ${error.message}`, 'error');
    } finally {
      setConfirmDeleteCategory(false);
      setCategoryToDelete(null);
    }
  };

  // --- Entity Handlers ---
  const handleAddEntityClick = () => {
    setEditingEntity(null);
    setShowEntityModal(true);
  };

  const handleEditEntityClick = (entity) => {
    setEditingEntity(entity);
    setShowEntityModal(true);
  };

  const handleDeleteEntityClick = (entity) => {
    setEntityToDelete(entity);
    setConfirmDeleteEntity(true);
  };

  const confirmDeleteSelectedEntity = async () => {
    if (!db || !entityToDelete) return;

    try {
      await deleteDoc(doc(db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES, entityToDelete.id));
      showAppToast(`Entity "${entityToDelete.name}" deleted successfully!`);
    } catch (error) {
      console.error("Error deleting entity:", error);
      showAppToast(`Failed to delete entity: ${error.message}`, 'error');
    } finally {
      setConfirmDeleteEntity(false);
      setEntityToDelete(null);
    }
  };


  return (
    <div className="space-y-8 p-4">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Categories & Entities Management</h3>

      {/* Category Management Section */}
      <div className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xl font-semibold text-gray-800">Manage Categories</h4>
          <button
            onClick={handleAddCategoryClick}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold shadow-md hover:bg-indigo-700 flex items-center transition"
          >
            <Plus size={18} className="mr-2" /> Add Category
          </button>
        </div>
        
        {categories.length === 0 ? (
          <p className="text-center text-gray-600 py-4">No categories defined yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(category => (
              <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                  <Icon name={category.icon} size={24} className="mr-3 text-purple-600" />
                  <span className="font-medium text-gray-800">{category.name}</span>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEditCategoryClick(category)} className="text-blue-500 hover:text-blue-700" title="Edit Category"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteCategoryClick(category)} className="text-red-500 hover:text-red-700" title="Delete Category"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entity Management Section */}
      <div className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
        <h4 className="text-xl font-semibold text-gray-800 mb-4">Manage Entities</h4>
        <div className="mb-4">
          <label htmlFor="select-category-for-entities" className="block text-sm font-medium text-gray-700 mb-2">Select Category to Manage Entities:</label>
          <select
            id="select-category-for-entities"
            value={selectedCategory?.id || ''}
            onChange={(e) => setSelectedCategory(categories.find(c => c.id === e.target.value))}
            className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
          >
            <option value="">-- Select a Category --</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        {selectedCategory && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-lg font-semibold text-gray-700">Entities for {selectedCategory.name}</h5>
              <button
                onClick={handleAddEntityClick}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold shadow-md hover:bg-indigo-700 flex items-center transition"
              >
                <Plus size={18} className="mr-2" /> Add Entity
              </button>
            </div>
            {entities.length === 0 ? (
              <p className="text-center text-gray-600 py-4">No entities defined for this category yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.map(entity => (
                  <div key={entity.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
                    <span className="font-medium text-gray-800">{entity.name}</span>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditEntityClick(entity)} className="text-blue-500 hover:text-blue-700" title="Edit Entity"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteEntityClick(entity)} className="text-red-500 hover:text-red-700" title="Delete Entity"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals for Categories */}
      {showCategoryModal && (
        <CategoryFormModal
          db={db}
          showAppToast={showAppToast}
          onClose={() => setShowCategoryModal(false)}
          categoryToEdit={editingCategory}
          publicDataPath={publicDataPath}
          COLLECTIONS={COLLECTIONS}
        />
      )}
      <ConfirmationModal
        isOpen={confirmDeleteCategory}
        title="Confirm Category Deletion"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? All associated entities will also be deleted. This action cannot be undone.`}
        onConfirm={confirmDeleteSelectedCategory}
        onCancel={() => setConfirmDeleteCategory(false)}
        confirmText="Delete Category"
      />

      {/* Modals for Entities */}
      {showEntityModal && selectedCategory && (
        <EntityFormModal
          db={db}
          showAppToast={showAppToast}
          onClose={() => setShowEntityModal(false)}
          entityToEdit={editingEntity}
          categoryId={selectedCategory.id}
          publicDataPath={publicDataPath}
          COLLECTIONS={COLLECTIONS}
        />
      )}
      <ConfirmationModal
        isOpen={confirmDeleteEntity}
        title="Confirm Entity Deletion"
        message={`Are you sure you want to delete the entity "${entityToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDeleteSelectedEntity}
        onCancel={() => setConfirmDeleteEntity(false)}
        confirmText="Delete Entity"
      />
    </div>
  );
};


// --- New Component: Category Form Modal (Add/Edit Category) ---
const CategoryFormModal = ({ db, showAppToast, onClose, categoryToEdit, publicDataPath, COLLECTIONS }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag'); // Default icon

  const isEditing = !!categoryToEdit;

  // List of available Lucide React icons (ensure these names match the 'Icon' component's mapping)
  const availableIcons = ['Users', 'BookOpen', 'Tag', 'Calendar', 'Layers', 'GraduationCap', 'Settings', 'BarChart2', 'User', 'Smartphone', 'Tablet', 'Monitor'];

  // Populate form fields if editing an existing category
  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
      setIcon(categoryToEdit.icon || 'Tag');
    }
  }, [categoryToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!db) {
      showAppToast("App not ready.", 'error');
      return;
    }

    // Generate ID from name, or use existing ID if editing
    const categoryId = isEditing ? categoryToEdit.id : name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!categoryId) {
      showAppToast("Category name cannot be empty.", 'error');
      return;
    }

    const categoryData = {
      name: name.trim(),
      icon: icon,
    };

    try {
      if (isEditing) {
        // Update existing category
        await setDoc(doc(db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES, categoryId), categoryData);
        showAppToast(`Category "${name}" updated successfully!`);
      } else {
        // Check if category with this ID already exists (to prevent duplicates by ID)
        const docSnap = await getDoc(doc(db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES, categoryId));
        if (docSnap.exists()) {
          showAppToast(`Category "${name}" already exists. Please choose a different name.`, 'error');
          return;
        }
        // Add new category
        await setDoc(doc(db, publicDataPath, COLLECTIONS.LOOKUP_CATEGORIES, categoryId), categoryData);
        showAppToast(`Category "${name}" added successfully!`);
      }
      onClose(); // Close modal on successful submission
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} category:`, error);
      showAppToast(`Failed to ${isEditing ? 'update' : 'add'} category: ${error.message}`, 'error');
    }
  };

  return (
    <Modal isOpen={true} title={isEditing ? "Edit Category" : "Add New Category"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">Category Name</label>
          <input type="text" id="categoryName" value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label htmlFor="categoryIcon" className="block text-sm font-medium text-gray-700">Category Icon</label>
          <select id="categoryIcon" value={icon} onChange={(e) => setIcon(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
            <option value="">Select an icon</option>
            {availableIcons.map(iconName => (
              <option key={iconName} value={iconName}>{iconName}</option>
            ))}
          </select>
          <div className="mt-2 flex items-center space-x-2 text-gray-600">
            Preview: <Icon name={icon} size={24} />
          </div>
        </div>
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition">
            Cancel
          </button>
          <button type="submit"
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition">
            {isEditing ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
};


// --- New Component: Entity Form Modal (Add/Edit Entity) ---
const EntityFormModal = ({ db, showAppToast, onClose, entityToEdit, categoryId, publicDataPath, COLLECTIONS }) => {
  const [name, setName] = useState('');

  const isEditing = !!entityToEdit;

  // Populate form fields if editing an existing entity
  useEffect(() => {
    if (entityToEdit) {
      setName(entityToEdit.name || '');
    }
  }, [entityToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!db || !categoryId) {
      showAppToast("App not ready or category not selected.", 'error');
      return;
    }

    // Generate ID from name, or use existing ID if editing
    const entityId = isEditing ? entityToEdit.id : name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!entityId) {
      showAppToast("Entity name cannot be empty.", 'error');
      return;
    }

    const entityData = {
      name: name.trim(),
      categoryId: categoryId, // Associate entity with the selected category
    };

    try {
      if (isEditing) {
        // Update existing entity
        await setDoc(doc(db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES, entityId), entityData);
        showAppToast(`Entity "${name}" updated successfully!`);
      } else {
        // Check if entity with this ID already exists within this category
        const docSnap = await getDoc(doc(db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES, entityId));
        // Only consider it a duplicate if it exists AND belongs to the same category
        if (docSnap.exists() && docSnap.data().categoryId === categoryId) {
          showAppToast(`Entity "${name}" already exists in this category. Please choose a different name.`, 'error');
          return;
        }
        // Add new entity
        await setDoc(doc(db, publicDataPath, COLLECTIONS.LOOKUP_ENTITIES, entityId), entityData);
        showAppToast(`Entity "${name}" added successfully!`);
      }
      onClose(); // Close modal on successful submission
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'add'} entity:`, error);
      showAppToast(`Failed to ${isEditing ? 'update' : 'add'} entity: ${error.message}`, 'error');
    }
  };

  return (
    <Modal isOpen={true} title={isEditing ? "Edit Entity" : `Add New Entity for ${categoryId}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="entityName" className="block text-sm font-medium text-gray-700">Entity Name</label>
          <input type="text" id="entityName" value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div className="text-sm text-gray-600">
          Category: <span className="font-semibold">{categoryId}</span> {/* Display the category for context */}
        </div>
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition">
            Cancel
          </button>
          <button type="submit"
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition">
            {isEditing ? 'Save Changes' : 'Add Entity'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
