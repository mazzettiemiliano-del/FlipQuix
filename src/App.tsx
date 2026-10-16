import React, { useState, useEffect, useRef } from 'react';
import {
  RoomState,
  Question,
  Player,
  AnswerSubmission,
  DrawingSubmission,
  GamePhase
} from './types/quiz';
import { INITIAL_QUESTIONS } from './data/initialQuestions';
import { TeacherMonitor } from './components/TeacherMonitor';
import { StudentDevice } from './components/StudentDevice';
import { ArchitectureGuideModal } from './components/ArchitectureGuideModal';
import { sound } from './utils/audio';
import { api } from './services/api';
import { firebaseSync } from './services/firebaseSync';
import {
  Monitor,
  Smartphone,
  BookOpen,
  Sparkles,
  HelpCircle,
  Users,
  Play
} from 'lucide-react';

export default function App() {
  // View mode for testing: Teacher Monitor (LIM) vs Student Mobile
  const [viewRole, setViewRole] = useState<'teacher' | 'student'>('teacher');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // App URL for QR codes
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://flipquiz.app';

  // Current student session (if playing on student view)
  const [myPlayerId, setMyPlayerId] = useState<string>('player-me');
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);

  // Core Room State
  const [roomState, setRoomState] = useState<RoomState>({
    roomCode: 'FLIP-101',
    roomName: 'Classe 3B • Scienze e Storia',
    phase: 'lobby',
    currentQuestionIndex: 0,
    questions: INITIAL_QUESTIONS,
    players: {
      'player-demo-1': {
        id: 'player-demo-1',
        name: 'Marco R.',
        score: 120,
        streak: 2,
        avatar: '🚀',
        isSimulated: true
      },
      'player-demo-2': {
        id: 'player-demo-2',
        name: 'Giulia V.',
        score: 95,
        streak: 1,
        avatar: '🦊',
        isSimulated: true
      },
      'player-demo-3': {
        id: 'player-demo-3',
        name: 'Sofia M.',
        score: 140,
        streak: 3,
        avatar: '🌟',
        isSimulated: true
      }
    },
    answersThisTurn: {},
    drawingsThisTurn: {
      'player-demo-1': {
        playerId: 'player-demo-1',
        playerName: 'Marco R.',
        dataUrl:
          'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80',
        votes: ['player-demo-2']
      },
      'player-demo-2': {
        playerId: 'player-demo-2',
        playerName: 'Giulia V.',
        dataUrl:
          'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500&auto=format&fit=crop&q=80',
        votes: []
      }
    },
    turnStartTime: 0,
    turnDuration: 25,
    settings: {
      basePoints: 50,
      fastFingerBonus1: 20,
      fastFingerBonus2: 15,
      fastFingerBonus3: 10,
      defaultTimeLimit: 25,
      soundEnabled: true
    }
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botAnswerTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Real-time synchronization subscription on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('flipquiz_my_player');
      if (saved) {
        const parsed: Player = JSON.parse(saved);
        setMyPlayer(parsed);
        setMyPlayerId(parsed.id);
      }
    } catch (e) {
      console.warn('Could not read saved player from storage:', e);
    }

    const unsubApi = api.subscribeToRoom((serverState) => {
      setRoomState(serverState);
    });

    const unsubFirebase = firebaseSync.listenToRoom(roomState.roomCode, (firebaseState) => {
      setRoomState(firebaseState);
    });

    api.getRoom().then((data) => {
      if (data) setRoomState(data);
    });

    return () => {
      unsubApi();
      unsubFirebase();
    };
  }, []);

  // Keep myPlayer score and streak in sync with roomState.players
  const activeStudent: Player | null =
    myPlayer && roomState.players[myPlayer.id]
      ? roomState.players[myPlayer.id]
      : myPlayer;

  // Automatically transition from question_intro (3 seconds) to question_active
  useEffect(() => {
    if (roomState.phase === 'question_intro') {
      const introTimer = setTimeout(() => {
        const currentQ = roomState.questions[roomState.currentQuestionIndex];
        const duration = currentQ ? currentQ.timeLimit : 25;

        setRoomState((prev) => {
          const updated: RoomState = {
            ...prev,
            phase: 'question_active',
            turnStartTime: Date.now(),
            turnDuration: duration,
            answersThisTurn: {}
          };
          api.broadcastLocal(updated);
          return updated;
        });
      }, 3200);

      return () => clearTimeout(introTimer);
    }
  }, [roomState.phase, roomState.currentQuestionIndex, roomState.questions]);

  // Handle countdown during question_active
  useEffect(() => {
    if (roomState.phase === 'question_active') {
      const currentQ = roomState.questions[roomState.currentQuestionIndex];
      const duration = (currentQ?.timeLimit || 25) * 1000;

      // Simulate bot answers during active question
      clearBotTimeouts();
      const simulatedPlayers = Object.values(roomState.players).filter((p) => p.isSimulated);

      simulatedPlayers.forEach((bot) => {
        const randomDelay = Math.random() * (duration * 0.55) + 1200;
        const willBeCorrect = Math.random() > 0.3; // 70% chance correct

        const timeout = setTimeout(() => {
          registerAnswer(bot.id, bot.name, willBeCorrect, randomDelay / 1000);
        }, randomDelay);

        botAnswerTimeouts.current.push(timeout);
      });

      // End of question timer
      timerRef.current = setTimeout(() => {
        handleEndQuestionTimer();
      }, duration);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        clearBotTimeouts();
      };
    }
  }, [roomState.phase, roomState.currentQuestionIndex]);

  const clearBotTimeouts = () => {
    botAnswerTimeouts.current.forEach((t) => clearTimeout(t));
    botAnswerTimeouts.current = [];
  };

  const handleEndQuestionTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearBotTimeouts();

    setRoomState((prev) => {
      const currentQ = prev.questions[prev.currentQuestionIndex];
      const nextPhase: GamePhase =
        currentQ && currentQ.type === 'draw_vote' ? 'draw_gallery' : 'question_results';
      const updated: RoomState = {
        ...prev,
        phase: nextPhase
      };
      api.broadcastLocal(updated);
      return updated;
    });

    api.endTimerNow();
  };

  // Register an answer submission (from real student or bot)
  const registerAnswer = (
    playerId: string,
    playerName: string,
    isCorrect: boolean,
    timeSpent: number,
    payload?: any
  ) => {
    setRoomState((prev) => {
      // Don't register twice
      if (prev.answersThisTurn[playerId]) return prev;

      const currentQ = prev.questions[prev.currentQuestionIndex];
      const basePoints = currentQ ? currentQ.points : 50;

      // Count previous correct answers to calculate speed rank (1st, 2nd, 3rd)
      const prevCorrectCount = Object.values(prev.answersThisTurn).filter(
        (a) => a.isCorrect
      ).length;

      let speedRank: number | undefined = undefined;
      let bonus = 0;

      if (isCorrect) {
        if (prevCorrectCount === 0) {
          speedRank = 1;
          bonus = prev.settings.fastFingerBonus1; // +20
        } else if (prevCorrectCount === 1) {
          speedRank = 2;
          bonus = prev.settings.fastFingerBonus2; // +15
        } else if (prevCorrectCount === 2) {
          speedRank = 3;
          bonus = prev.settings.fastFingerBonus3; // +10
        }
      }

      const pointsAwarded = isCorrect ? basePoints + bonus : 0;

      const submission: AnswerSubmission = {
        playerId,
        playerName,
        submittedAt: Date.now(),
        isCorrect,
        timeSpent,
        pointsAwarded,
        speedRank,
        answerPayload: payload
      };

      const updatedAnswers = {
        ...prev.answersThisTurn,
        [playerId]: submission
      };

      // Update player score and streak
      const existingPlayer = prev.players[playerId];
      let updatedPlayers = prev.players;

      if (existingPlayer) {
        updatedPlayers = {
          ...prev.players,
          [playerId]: {
            ...existingPlayer,
            score: existingPlayer.score + pointsAwarded,
            streak: isCorrect ? existingPlayer.streak + 1 : 0
          }
        };
      }

      const updatedState: RoomState = {
        ...prev,
        answersThisTurn: updatedAnswers,
        players: updatedPlayers
      };

      api.broadcastLocal(updatedState);
      return updatedState;
    });
  };

  // Student joining room
  const handleJoinRoom = (name: string, avatar: string, pin: string) => {
    const newPlayerId = `p-${Date.now()}`;
    const newPlayer: Player = {
      id: newPlayerId,
      name,
      avatar,
      score: 0,
      streak: 0,
      isSimulated: false
    };

    setMyPlayerId(newPlayerId);
    setMyPlayer(newPlayer);
    try {
      localStorage.setItem('flipquiz_my_player', JSON.stringify(newPlayer));
    } catch (e) {}

    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        players: {
          ...prev.players,
          [newPlayerId]: newPlayer
        }
      };
      api.broadcastLocal(updated);
      return updated;
    });

    api.join(name, avatar, pin);
  };

  // Student submitting new question to repository
  const handleSubmitQuestion = (question: Question) => {
    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        questions: [question, ...prev.questions]
      };
      api.broadcastLocal(updated);
      return updated;
    });
    api.submitQuestion(question);
    sound.playCorrect();
  };

  // Student answering current question
  const handleSubmitAnswer = (isCorrect: boolean, payload?: any) => {
    const player = activeStudent || {
      id: myPlayerId,
      name: 'Studente',
      avatar: '🚀',
      score: 0,
      streak: 0
    };

    const timeSpent =
      roomState.turnStartTime > 0 ? (Date.now() - roomState.turnStartTime) / 1000 : 2.0;

    // Immediate local recording & sound feedback
    registerAnswer(player.id, player.name, isCorrect, timeSpent, payload);
    sound.playFastFinger();

    // Broadcast to server and other devices
    api.submitAnswer(player.id, player.name, isCorrect, timeSpent, payload);
  };

  // Student saving drawing
  const handleSaveDrawing = (dataUrl: string) => {
    const player = activeStudent || myPlayer;
    if (!player) return;

    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        drawingsThisTurn: {
          ...prev.drawingsThisTurn,
          [player.id]: {
            playerId: player.id,
            playerName: player.name,
            dataUrl,
            votes: []
          }
        }
      };
      api.broadcastLocal(updated);
      return updated;
    });

    api.saveDrawing(player.id, player.name, dataUrl);
  };

  // Peer voting for drawing
  const handleVoteDrawing = (targetPlayerId: string) => {
    const player = activeStudent || myPlayer;
    if (!player) return;

    setRoomState((prev) => {
      const currentDrawing = prev.drawingsThisTurn[targetPlayerId];
      if (!currentDrawing) return prev;

      const votes = currentDrawing.votes.includes(player.id)
        ? currentDrawing.votes
        : [...currentDrawing.votes, player.id];

      // Award +25 points to artist for each star received
      const artist = prev.players[targetPlayerId];
      const updatedPlayers = artist
        ? {
            ...prev.players,
            [targetPlayerId]: {
              ...artist,
              score: artist.score + 25
            }
          }
        : prev.players;

      const updated: RoomState = {
        ...prev,
        players: updatedPlayers,
        drawingsThisTurn: {
          ...prev.drawingsThisTurn,
          [targetPlayerId]: {
            ...currentDrawing,
            votes
          }
        }
      };

      api.broadcastLocal(updated);
      return updated;
    });

    api.voteDrawing(player.id, targetPlayerId);
  };

  // Teacher starting quiz
  const handleStartGame = () => {
    if (roomState.questions.length === 0) return;
    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        phase: 'question_intro',
        currentQuestionIndex: 0,
        answersThisTurn: {},
        turnStartTime: Date.now()
      };
      api.broadcastLocal(updated);
      return updated;
    });
    api.startGame();
  };

  // Teacher progressing to next step
  const handleNextQuestion = () => {
    if (roomState.phase === 'question_results' || roomState.phase === 'draw_gallery') {
      setRoomState((prev) => {
        const updated: RoomState = {
          ...prev,
          phase: 'leaderboard'
        };
        api.broadcastLocal(updated);
        return updated;
      });
    } else if (roomState.phase === 'leaderboard') {
      const nextIdx = roomState.currentQuestionIndex + 1;
      if (nextIdx < roomState.questions.length) {
        setRoomState((prev) => {
          const updated: RoomState = {
            ...prev,
            phase: 'question_intro',
            currentQuestionIndex: nextIdx,
            answersThisTurn: {},
            turnStartTime: Date.now()
          };
          api.broadcastLocal(updated);
          return updated;
        });
      } else {
        setRoomState((prev) => {
          const updated: RoomState = {
            ...prev,
            phase: 'podium'
          };
          api.broadcastLocal(updated);
          return updated;
        });
      }
    }
    api.nextStep();
  };

  // Teacher updating points and time limit for a question
  const handleUpdateQuestionPointsAndTime = (
    qId: string,
    points: number,
    timeLimit: number
  ) => {
    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === qId ? { ...q, points, timeLimit } : q
        )
      };
      api.broadcastLocal(updated);
      return updated;
    });
  };

  // Teacher deleting question
  const handleDeleteQuestion = (qId: string) => {
    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        questions: prev.questions.filter((q) => q.id !== qId)
      };
      api.broadcastLocal(updated);
      return updated;
    });
  };

  // Teacher adding simulated classmate bots
  const handleAddSimulatedStudents = (count: number) => {
    const names = ['Matteo P.', 'Federica S.', 'Lorenzo B.', 'Elena D.', 'Davide M.', 'Chiara L.'];
    const avatars = ['🚀', '🦊', '🌟', '⚡', '🐼', '🎨'];
    const newBots: Record<string, Player> = {};

    for (let i = 0; i < count; i++) {
      const id = `bot-${Date.now()}-${i}`;
      const name = names[i % names.length];
      const avatar = avatars[i % avatars.length];
      newBots[id] = {
        id,
        name,
        avatar,
        score: Math.floor(Math.random() * 80) + 20,
        streak: 1,
        isSimulated: true
      };
    }

    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        players: {
          ...prev.players,
          ...newBots
        }
      };
      api.broadcastLocal(updated);
      return updated;
    });

    api.simulateStudents(count);
  };

  // Sound toggle
  const handleToggleSound = () => {
    setRoomState((prev) => {
      const nextVal = !prev.settings.soundEnabled;
      sound.setEnabled(nextVal);
      return {
        ...prev,
        settings: {
          ...prev.settings,
          soundEnabled: nextVal
        }
      };
    });
  };

  // Reset session to lobby
  const handleResetGame = () => {
    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        phase: 'lobby',
        currentQuestionIndex: 0,
        answersThisTurn: {}
      };
      api.broadcastLocal(updated);
      return updated;
    });
    api.resetGame();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Universal Classroom Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-40 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">FlipQuiz</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                  PanQuiz Flipped Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gli studenti creano da banco • Il docente avvia live sulla LIM
              </p>
            </div>
          </div>

          {/* Mode Switcher: LIM vs Smartphone */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setViewRole('teacher')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                viewRole === 'teacher'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Schermo Docente (LIM)
            </button>

            <button
              onClick={() => setViewRole('student')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                viewRole === 'student'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Dispositivo Studente (Banco)
            </button>
          </div>

          {/* Firebase Connection & Guide Buttons */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 shadow-sm"
              title="Firebase sincronizzato in tempo reale (gioco-multi-utente)"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Firebase RTDB</span>
            </div>

            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guida & Architettura
            </button>
          </div>
        </div>
      </header>

      {/* Main Interactive Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col">
        {viewRole === 'teacher' ? (
          <TeacherMonitor
            roomState={roomState}
            appUrl={appUrl}
            onStartGame={handleStartGame}
            onNextQuestion={handleNextQuestion}
            onEndQuestionTimerNow={handleEndQuestionTimer}
            onUpdateQuestionPointsAndTime={handleUpdateQuestionPointsAndTime}
            onDeleteQuestion={handleDeleteQuestion}
            onAddSimulatedStudents={handleAddSimulatedStudents}
            onToggleSound={handleToggleSound}
            onResetGame={handleResetGame}
          />
        ) : (
          <StudentDevice
            roomState={roomState}
            myPlayer={activeStudent}
            onJoinRoom={handleJoinRoom}
            onSubmitQuestion={handleSubmitQuestion}
            onSubmitAnswer={handleSubmitAnswer}
            onSaveDrawing={handleSaveDrawing}
            onVoteDrawing={handleVoteDrawing}
            onStartQuiz={handleStartGame}
          />
        )}
      </main>

      {/* Architecture & Pedagogical Guide Modal */}
      <ArchitectureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
