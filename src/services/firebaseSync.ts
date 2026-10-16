import { ref, onValue, set, get, update } from 'firebase/database';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { rtdb, db, auth } from './firebase';
import {
  RoomState,
  Player,
  Question,
  AnswerSubmission,
  DrawingSubmission,
  GamePhase
} from '../types/quiz';

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
const connectionListeners: ((connected: boolean) => void)[] = [];

function notifyConnectionChange(connected: boolean) {
  isFirebaseConnected = connected;
  connectionListeners.forEach((fn) => {
    try {
      fn(connected);
    } catch (e) {
      console.warn('Connection listener error:', e);
    }
  });
}

// Listen to native Firebase RTDB connection state
if (typeof window !== 'undefined') {
  try {
    const connectedRef = ref(rtdb, '.info/connected');
    onValue(connectedRef, (snap) => {
      const val = !!snap.val();
      notifyConnectionChange(val);
      console.log('Firebase RTDB .info/connected:', val);
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
  // Check live connection state
  isConnected(): boolean {
    return isFirebaseConnected;
  },

  // Subscribe to connection state changes
  listenToConnection(callback: (connected: boolean) => void): () => void {
    connectionListeners.push(callback);
    callback(isFirebaseConnected);
    return () => {
      const idx = connectionListeners.indexOf(callback);
      if (idx !== -1) connectionListeners.splice(idx, 1);
    };
  },

  // Initialize room in Firebase RTDB if not existing yet
  async initRoom(defaultState: RoomState): Promise<RoomState> {
    const cleanCode = defaultState.roomCode.replace(/[^a-zA-Z0-9_-]/g, '');
    try {
      const roomRef = ref(rtdb, `rooms/${cleanCode}`);
      const snap = await get(roomRef);
      if (snap.exists()) {
        const data = snap.val();
        if (data && data.phase && data.questions) {
          notifyConnectionChange(true);
          return data as RoomState;
        }
      }
      // If room doesn't exist, create it with initial questions & state
      const payload = cleanPayload(defaultState);
      await set(roomRef, payload);
      notifyConnectionChange(true);
      return defaultState;
    } catch (err) {
      console.warn('Firebase initRoom failed, using default state:', err);
      return defaultState;
    }
  },

  // Subscribe to real-time room changes in Firebase RTDB
  listenToRoom(roomCode: string, onUpdate: (state: RoomState) => void): () => void {
    const cleanCode = roomCode.replace(/[^a-zA-Z0-9_-]/g, '');

    try {
      const roomRef = ref(rtdb, `rooms/${cleanCode}`);
      const unsubscribeRtdb = onValue(
        roomRef,
        (snapshot) => {
          if (snapshot.exists()) {
            notifyConnectionChange(true);
            const data = snapshot.val();
            if (data && data.phase) {
              // Ensure objects exist
              data.players = data.players || {};
              data.questions = data.questions || [];
              data.answersThisTurn = data.answersThisTurn || {};
              data.drawingsThisTurn = data.drawingsThisTurn || {};
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
      console.warn('Firebase RTDB error, falling back to Firestore:', e);
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
            notifyConnectionChange(true);
            const data = snapshot.data();
            if (data && data.phase) {
              data.players = data.players || {};
              data.questions = data.questions || [];
              data.answersThisTurn = data.answersThisTurn || {};
              data.drawingsThisTurn = data.drawingsThisTurn || {};
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

  // Push complete room state to Firebase
  async pushRoomState(state: RoomState): Promise<boolean> {
    const cleanCode = state.roomCode.replace(/[^a-zA-Z0-9_-]/g, '');
    const payload = cleanPayload(state);

    let success = false;
    try {
      const roomRef = ref(rtdb, `rooms/${cleanCode}`);
      await set(roomRef, payload);
      notifyConnectionChange(true);
      success = true;
    } catch (e) {
      try {
        const roomDoc = doc(db, 'rooms', cleanCode);
        await setDoc(roomDoc, payload, { merge: true });
        notifyConnectionChange(true);
        success = true;
      } catch (err) {
        console.warn('Firebase sync write note:', (err as any)?.message);
      }
    }
    return success;
  },

  // Student joining room: register player in Firebase
  async joinPlayer(roomCode: string, player: Player): Promise<boolean> {
    const cleanCode = roomCode.replace(/[^a-zA-Z0-9_-]/g, '');
    try {
      const playerRef = ref(rtdb, `rooms/${cleanCode}/players/${player.id}`);
      await set(playerRef, cleanPayload(player));
      notifyConnectionChange(true);
      return true;
    } catch (e) {
      console.warn('joinPlayer error:', e);
      return false;
    }
  },

  // Student submitting question: add to repository
  async submitQuestion(roomCode: string, question: Question): Promise<boolean> {
    const cleanCode = roomCode.replace(/[^a-zA-Z0-9_-]/g, '');
    try {
      const questionsRef = ref(rtdb, `rooms/${cleanCode}/questions`);
      const snap = await get(questionsRef);
      const existing: Question[] = snap.exists() ? snap.val() : [];
      const updated = [cleanPayload(question), ...existing];
      await set(questionsRef, updated);
      notifyConnectionChange(true);
      return true;
    } catch (e) {
      console.warn('submitQuestion error:', e);
      return false;
    }
  },

  // Student answering: register answer & award points
  async submitAnswer(
    roomCode: string,
    submission: AnswerSubmission,
    pointsAwarded: number,
    isCorrect: boolean
  ): Promise<boolean> {
    const cleanCode = roomCode.replace(/[^a-zA-Z0-9_-]/g, '');
    try {
      // 1. Record answer in answersThisTurn
      const answerRef = ref(
        rtdb,
        `rooms/${cleanCode}/answersThisTurn/${submission.playerId}`
      );
      await set(answerRef, cleanPayload(submission));

      // 2. Update player's score and streak in Firebase
      const playerRef = ref(rtdb, `rooms/${cleanCode}/players/${submission.playerId}`);
      const snap = await get(playerRef);
      if (snap.exists()) {
        const player = snap.val() as Player;
        const newScore = (player.score || 0) + pointsAwarded;
        const newStreak = isCorrect ? (player.streak || 0) + 1 : 0;
        await update(playerRef, { score: newScore, streak: newStreak });
      } else {
        // If player was not in Firebase, create player record
        await set(playerRef, {
          id: submission.playerId,
          name: submission.playerName,
          avatar: '🚀',
          score: pointsAwarded,
          streak: isCorrect ? 1 : 0,
          isSimulated: false
        });
      }

      notifyConnectionChange(true);
      return true;
    } catch (e) {
      console.warn('submitAnswer Firebase error:', e);
      return false;
    }
  },

  // Student saving drawing for Draw & Vote
  async saveDrawing(roomCode: string, drawing: DrawingSubmission): Promise<boolean> {
    const cleanCode = roomCode.replace(/[^a-zA-Z0-9_-]/g, '');
    try {
      const drawRef = ref(
        rtdb,
        `rooms/${cleanCode}/drawingsThisTurn/${drawing.playerId}`
      );
      await set(drawRef, cleanPayload(drawing));
      notifyConnectionChange(true);
      return true;
    } catch (e) {
      console.warn('saveDrawing Firebase error:', e);
      return false;
    }
  },

  // Student voting for peer drawing
  async voteDrawing(
    roomCode: string,
    voterId: string,
    artistId: string
  ): Promise<boolean> {
    const cleanCode = roomCode.replace(/[^a-zA-Z0-9_-]/g, '');
    try {
      const votesRef = ref(
        rtdb,
        `rooms/${cleanCode}/drawingsThisTurn/${artistId}/votes`
      );
      const snap = await get(votesRef);
      const currentVotes: string[] = snap.exists() ? snap.val() || [] : [];
      if (!currentVotes.includes(voterId)) {
        const updatedVotes = [...currentVotes, voterId];
        await set(votesRef, updatedVotes);

        // Award +25 points to the artist
        const artistRef = ref(rtdb, `rooms/${cleanCode}/players/${artistId}`);
        const artistSnap = await get(artistRef);
        if (artistSnap.exists()) {
          const artist = artistSnap.val() as Player;
          await update(artistRef, { score: (artist.score || 0) + 25 });
        }
      }
      notifyConnectionChange(true);
      return true;
    } catch (e) {
      console.warn('voteDrawing Firebase error:', e);
      return false;
    }
  },

  // Change game phase (e.g. lobby -> question_intro -> question_active -> question_results -> leaderboard -> podium)
  async setPhase(
    roomCode: string,
    phase: GamePhase,
    currentQuestionIndex?: number,
    turnDuration?: number
  ): Promise<boolean> {
    const cleanCode = roomCode.replace(/[^a-zA-Z0-9_-]/g, '');
    try {
      const updates: any = {
        phase
      };

      if (currentQuestionIndex !== undefined) {
        updates.currentQuestionIndex = currentQuestionIndex;
      }

      if (phase === 'question_intro' || phase === 'question_active') {
        updates.turnStartTime = Date.now();
        if (turnDuration) updates.turnDuration = turnDuration;
      }

      // Reset turn answers when starting intro or active question
      if (phase === 'question_intro') {
        updates.answersThisTurn = {};
      }

      const roomRef = ref(rtdb, `rooms/${cleanCode}`);
      await update(roomRef, updates);
      notifyConnectionChange(true);
      return true;
    } catch (e) {
      console.warn('setPhase Firebase error:', e);
      return false;
    }
  },

  // Reset room to lobby
  async resetRoom(roomCode: string): Promise<boolean> {
    const cleanCode = roomCode.replace(/[^a-zA-Z0-9_-]/g, '');
    try {
      const roomRef = ref(rtdb, `rooms/${cleanCode}`);
      await update(roomRef, {
        phase: 'lobby',
        currentQuestionIndex: 0,
        answersThisTurn: {}
      });
      notifyConnectionChange(true);
      return true;
    } catch (e) {
      console.warn('resetRoom Firebase error:', e);
      return false;
    }
  },

  // Interactive Live Diagnostic Test
  async runDiagnostic(): Promise<FirebaseDiagnosticResult> {
    const start = performance.now();
    let writeSuccess = false;
    let rtdbConnected = false;
    let errorMessage: string | undefined = undefined;

    const projectId = 'gioco-multi-utente';
    const databaseUrl =
      'https://gioco-multi-utente-default-rtdb.europe-west1.firebasedatabase.app';

    try {
      // 1. Write ping to test_connection
      const pingRef = ref(rtdb, 'diagnostic_ping');
      const testTimestamp = Date.now();

      await set(pingRef, {
        timestamp: testTimestamp,
        client: 'FlipQuiz Classroom WebApp',
        status: 'OK'
      });

      // 2. Read it back
      const snap = await get(pingRef);
      if (snap.exists() && snap.val()?.timestamp === testTimestamp) {
        writeSuccess = true;
        rtdbConnected = true;
        notifyConnectionChange(true);
      }
    } catch (err: any) {
      console.error('Firebase diagnostic error:', err);
      errorMessage = err?.message || String(err);

      try {
        const testDoc = doc(db, 'system', 'ping');
        await setDoc(testDoc, { ping: Date.now() });
        writeSuccess = true;
        rtdbConnected = true;
        errorMessage = undefined;
        notifyConnectionChange(true);
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
  }
};
