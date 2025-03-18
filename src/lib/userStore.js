import { create } from 'zustand';
import { auth } from './firebase'; 
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase'; 

export const useUserStore = create((set, get) => ({
  currentUser: null,
  isLoading: true,
  
  // Fetch user data from Firestore
  fetchUserInfo: async (uid) => {
    if (!uid) return set({ currentUser: null, isLoading: false });
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        set({ currentUser: docSnap.data(), isLoading: false });
        
        // Listen for real-time updates of the user's status
        onSnapshot(docRef, (docSnapshot) => {
          set((state) => ({
            currentUser: {
              ...state.currentUser,
              status: docSnapshot.data().status, // Update status in real-time
            }
          }));
        });
      } else {
        set({ currentUser: null, isLoading: false }); // No user data found
      }
    } catch (err) {
      console.error(err);
      set({ currentUser: null, isLoading: false });
    }
  },

  // Initialize the auth listener to track the user's authentication state
  initAuthListener: () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const fetchUserInfo = get().fetchUserInfo;
        fetchUserInfo(user.uid); // Fetch user info when user is authenticated

        // Ensure status is updated to online when the user is authenticated
        await updateDoc(doc(db, "users", user.uid), {
          status: 'online',
          lastSeen: null, 
        });
      } else {
        // Before removing the user from state, update their status to offline
        const currentState = get();
        if (currentState.currentUser) {
          await updateDoc(doc(db, "users", currentState.currentUser.id), {
            status: 'offline',
            lastSeen: Date.now(), // Set lastSeen time to when they log out
          });
        }

        set({ currentUser: null, isLoading: false });
      }
    });
  },

  // Update user status
  updateStatus: async (status) => {
    const currentUser = get().currentUser;
    if (currentUser) {
      await updateDoc(doc(db, "users", currentUser.id), {
        status: status,
      });
      set((state) => ({
        currentUser: {
          ...state.currentUser,
          status: status,
        }
      }));
    }
  },
}));