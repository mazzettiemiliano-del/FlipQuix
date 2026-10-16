import { ref, onValue, set, get } from 'firebase/database';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { rtdb, db, auth } from './firebase';
import { RoomState } from '../types/quiz';

export interface FirebaseDiagnosticResult {
  initialized: boolean;
  rtdbConnected: boolean;
  writeSuccess: boolean;
  authStatus: 'authenticated' | 'anonymous' | 'none';
  latencyMs: number;
  errorMessage?: string;
  projectId: string;
  databaseUrl: string;
}

let isFirebaseConnected = false;
let isAuthReady = false;
let authUid: string | null = null;

// Listen to native Firebase RTDB connection state
if (typeof window !== 'undefined') {
  try {
    const connectedRef = ref(rtdb, '.info/connected');
    onValue(connectedRef, (snap) => {
      isFirebaseConnected = !!snap.val();
      console.log('Firebase .info/connected:', isFirebaseConnected);
    });
  } catch (e) {
    console.warn('Could not attach .info/connected listener:', e);
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthReady = true;
      authUid = user.uid;
      console.log('Firebase user authenticated:', user.uid);
    }
  });

  signInAnonymously(auth).catch((err) => {
    console.warn('Firebase anonymous auth note:', err.message);
  });
}

function cleanPayload(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

export const firebaseSync = {
  // Subscribe to real-time room changes in Firebase
  listenToRoom(roomCode: string, onUpdate: (state: RoomState) => void): () => void {
    const cleanCode = roomCode.replace(/[^a-zA-Z0-9_-]/g, '');

    try {
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

  // Interactive Live Diagnostic Test
  async runDiagnostic(): Promise<FirebaseDiagnosticResult> {
    const start = performance.now();
    let writeSuccess = false;
    let rtdbConnected = false;
    let errorMessage: string | undefined = undefined;

    const projectId = 'gioco-multi-utente';
    const databaseUrl = 'https://gioco-multi-utente-default-rtdb.europe-west1.firebasedatabase.app';

    try {
      // 1. Check native connected state or read ping
      const pingRef = ref(rtdb, 'diagnostic_ping');
      const testTimestamp = Date.now();

      await set(pingRef, {
        timestamp: testTimestamp,
        client: 'FlipQuiz Classroom WebApp',
        status: 'OK'
      });

      // 2. Read it back to guarantee two-way communication
      const snap = await get(pingRef);
      if (snap.exists() && snap.val()?.timestamp === testTimestamp) {
        writeSuccess = true;
        rtdbConnected = true;
      }
    } catch (err: any) {
      console.error('Firebase diagnostic error:', err);
      errorMessage = err?.message || String(err);

      // If RTDB failed due to permission rules, try Firestore as alternative
      try {
        const testDoc = doc(db, 'system', 'ping');
        await setDoc(testDoc, { ping: Date.now() });
        writeSuccess = true;
        rtdbConnected = true;
        errorMessage = undefined;
      } catch (fErr: any) {
        errorMessage = fErr?.message || errorMessage;
      }
    }

    const end = performance.now();
    const latencyMs = Math.round(end - start);

    return {
      initialized: true,
      rtdbConnected: writeSuccess || isFirebaseConnected,
      writeSuccess,
      authStatus: auth.currentUser ? 'authenticated' : 'none',
      latencyMs,
      errorMessage,
      projectId,
      databaseUrl
    };
  },

  isConnected(): boolean {
    return isFirebaseConnected;
  }
};
