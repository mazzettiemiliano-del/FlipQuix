import { ref, onValue, set, update, get } from 'firebase/database';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { rtdb, db, auth } from './firebase';
import { RoomState } from '../types/quiz';

let isFirebaseConnected = false;
let isAuthReady = false;

// Attempt anonymous authentication for Firebase if enabled
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthReady = true;
      console.log('Firebase user authenticated:', user.uid);
    }
  });

  signInAnonymously(auth).catch((err) => {
    // If anonymous auth is disabled in project, it's fine, public rules might be active
    console.warn('Firebase anonymous auth note:', err.message);
  });
}

// Clean object for Firebase (no undefined, circular refs or invalid keys)
function cleanPayload(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

export const firebaseSync = {
  // Subscribe to real-time room changes in Firebase
  listenToRoom(roomCode: string, onUpdate: (state: RoomState) => void): () => void {
    const cleanCode = roomCode.replace(/[^a-zA-Z0-9_-]/g, '');

    try {
      // 1. Try Firebase Realtime Database first (sub-millisecond speed)
      const roomRef = ref(rtdb, `rooms/${cleanCode}`);
      const unsubscribeRtdb = onValue(
        roomRef,
        (snapshot) => {
          if (snapshot.exists()) {
            isFirebaseConnected = true;
            const data = snapshot.val();
            if (data && data.phase) {
              onUpdate(data as RoomState);
            }
          }
        },
        (error) => {
          console.warn('Realtime Database listener note:', error.message);
          // Fallback to Firestore if Realtime Database has permission restrictions
          this.listenToFirestore(cleanCode, onUpdate);
        }
      );

      return () => {
        unsubscribeRtdb();
      };
    } catch (e) {
      console.warn('Firebase RTDB error, falling back to Firestore/SSE:', e);
      return this.listenToFirestore(cleanCode, onUpdate);
    }
  },

  listenToFirestore(roomCode: string, onUpdate: (state: RoomState) => void): () => void {
    try {
      const roomDoc = doc(db, 'rooms', roomCode);
      const unsub = onSnapshot(
        roomDoc,
        (snapshot) => {
          if (snapshot.exists()) {
            isFirebaseConnected = true;
            const data = snapshot.data();
            if (data && data.phase) {
              onUpdate(data as RoomState);
            }
          }
        },
        (error) => {
          console.warn('Firestore snapshot note:', error.message);
        }
      );
      return unsub;
    } catch (e) {
      console.warn('Firestore fallback not active:', e);
      return () => {};
    }
  },

  // Save full room state to Firebase
  async pushRoomState(state: RoomState): Promise<boolean> {
    const cleanCode = state.roomCode.replace(/[^a-zA-Z0-9_-]/g, '');
    const payload = cleanPayload(state);

    let success = false;

    // Push to RTDB
    try {
      const roomRef = ref(rtdb, `rooms/${cleanCode}`);
      await set(roomRef, payload);
      isFirebaseConnected = true;
      success = true;
    } catch (e) {
      // Push to Firestore as backup
      try {
        const roomDoc = doc(db, 'rooms', cleanCode);
        await setDoc(roomDoc, payload, { merge: true });
        isFirebaseConnected = true;
        success = true;
      } catch (err) {
        console.warn('Firebase sync write note:', (err as any)?.message);
      }
    }

    return success;
  },

  isConnected(): boolean {
    return isFirebaseConnected;
  }
};
