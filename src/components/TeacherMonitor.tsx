import React, { useState, useEffect } from 'react';
import {
  RoomState,
  Question,
  Player,
  AnswerSubmission,
  DrawingSubmission
} from '../types/quiz';
import { QRCodeDisplay } from './QRCodeDisplay';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Play,
  Settings,
  Users,
  Trophy,
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX,
  PlusCircle,
  HelpCircle,
  Trash2,
  RotateCcw,
  Zap,
  Star
} from 'lucide-react';

interface TeacherMonitorProps {
  roomState: RoomState;
  appUrl: string;
  onStartGame: () => void;
  onNextQuestion: () => void;
  onEndQuestionTimerNow: () => void;
  onUpdateQuestionPointsAndTime: (qId: string, points: number, timeLimit: number) => void;
  onDeleteQuestion: (qId: string) => void;
  onAddSimulatedStudents: (count: number) => void;
  onToggleSound: () => void;
  onResetGame: () => void;
}

export const TeacherMonitor: React.FC<TeacherMonitorProps> = ({
  roomState,
  appUrl,
  onStartGame,
  onNextQuestion,
  onEndQuestionTimerNow,
  onUpdateQuestionPointsAndTime,
  onDeleteQuestion,
  onAddSimulatedStudents,
  onToggleSound,
  onResetGame
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedConfigQId, setSelectedConfigQId] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState<number>(50);
  const [editTime, setEditTime] = useState<number>(25);

  const playersList = Object.values(roomState.players);
  const currentQ = roomState.questions[roomState.currentQuestionIndex];
  const answersList = Object.values(roomState.answersThisTurn);
  const drawingsList = Object.values(roomState.drawingsThisTurn);

  // Sound effects on phase transitions
  useEffect(() => {
    if (roomState.phase === 'question_intro') {
      sound.playFastFinger();
    } else if (roomState.phase === 'podium') {
      sound.playFanfare();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
  }, [roomState.phase]);

  // Ranked leaderboard
  const sortedPlayers = [...playersList].sort((a, b) => b.score - a.score);

  // Fastest fingers
  const fastestFingers = [...answersList]
    .filter((a) => a.isCorrect)
    .sort((a, b) => a.submittedAt - b.submittedAt)
    .slice(0, 3);

  // Open config for a question
  const openQuestionConfig = (q: Question) => {
    setSelectedConfigQId(q.id);
    setEditPoints(q.points);
    setEditTime(q.timeLimit);
    setIsConfigOpen(true);
  };

  const saveQuestionConfig = () => {
    if (selectedConfigQId) {
      onUpdateQuestionPointsAndTime(selectedConfigQId, editPoints, editTime);
      setIsConfigOpen(false);
    }
  };

  return (
    <div className="w-full min-h-[85vh] flex flex-col justify-between text-slate-100">
      {/* Top Classroom Bar */}
      <div className="flex items-center justify-between p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md mb-6">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-black text-sm tracking-widest text-white shadow">
            {roomState.roomCode}
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white">FlipQuiz Live Monitor</h1>
            <p className="text-xs text-slate-400">Schermo Proiezione Docente / LIM</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-xl border transition-colors ${
              roomState.settings.soundEnabled
                ? 'bg-slate-800 border-slate-700 text-indigo-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="Attiva/Disattiva effetti sonori"
          >
            {roomState.settings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition-colors"
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            Configurazione Docente
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 rounded-xl border border-slate-800 text-xs font-bold text-slate-300">
            <Users className="w-4 h-4 text-emerald-400" />
            {playersList.length} Studenti
          </div>
        </div>
      </div>

      {/* Main Screen Content by Phase */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* PHASE 1: LOBBY & REPOSITORY */}
        {roomState.phase === 'lobby' && (
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left Column: QR Code & Pin */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                Inquadra e unisciti subito
              </span>
              <h2 className="text-2xl font-black text-white">Entra con lo Smartphone</h2>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                Basta scansionare il codice e inserire il tuo nome da banco!
              </p>

              <QRCodeDisplay value={`${appUrl}?pin=${roomState.roomCode}`} size={220} />

              <div className="mt-6 w-full p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Codice Stanza:</span>
                <span className="text-2xl font-black text-amber-300 font-mono tracking-wider">
                  {roomState.roomCode}
                </span>
              </div>

              {/* Bot Simulation for instant testing */}
              <div className="mt-4 pt-4 border-t border-slate-800 w-full flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onAddSimulatedStudents(4)}
                  className="w-full py-2.5 px-4 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow"
                >
                  <PlusCircle className="w-4 h-4" />
                  Simula 4 Studenti in Classe (test rapido)
                </button>
              </div>
            </div>

            {/* Right Column: Question Repository & Start */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">
                    Repository Domande ({roomState.questions.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Domande inviate dagli studenti da posto pronte per la sfida
                  </p>
                </div>

                <button
                  disabled={roomState.questions.length === 0}
                  onClick={onStartGame}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Avvia FlipQuiz Live!
                </button>
              </div>

              {/* Question list in repository */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
                {roomState.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 bg-slate-850 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-white line-clamp-1">{q.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                          <span>
                            Creatore: <strong className="text-indigo-300">{q.creatorName}</strong>
                          </span>
                          <span>•</span>
                          <span className="capitalize">{q.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{q.timeLimit}s</span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">{q.points} pt</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openQuestionConfig(q)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                        title="Modifica tempi e punti"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteQuestion(q.id)}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Elimina dal quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {roomState.questions.length === 0 && (
                  <div className="p-12 text-center text-slate-500 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                    <p className="font-semibold text-sm">Nessuna domanda ancora nel repository.</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Gli studenti possono inviare domande tramite QR code oppure usa il pulsante Simula Studenti.
                    </p>
                  </div>
                )}
              </div>

              {/* Connected Students List */}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 block mb-2">
                  Studenti collegati in classe ({playersList.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {playersList.map((p) => (
                    <div
                      key={p.id}
                      className="px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700/80 text-xs font-bold text-slate-200 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {p.name}
                    </div>
                  ))}
                  {playersList.length === 0 && (
                    <span className="text-xs text-slate-500 italic">
                      In attesa degli studenti...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: QUESTION INTRO SPLASH */}
        {roomState.phase === 'question_intro' && currentQ && (
          <div className="text-center space-y-6 max-w-3xl animate-scale-up">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-black uppercase tracking-widest border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
              Domanda {roomState.currentQuestionIndex + 1} di {roomState.questions.length}
            </div>

            <div className="p-10 bg-slate-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl space-y-4">
              <p className="text-sm uppercase font-bold tracking-widest text-slate-400">
                Questa domanda è stata creata dal vostro compagno:
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-amber-300 tracking-wide">
                {currentQ.creatorName}
              </h2>
              <div className="pt-4 text-slate-300 text-lg font-semibold">
                Preparatevi sui vostri dispositivi!
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: ACTIVE LIVE QUESTION */}
        {roomState.phase === 'question_active' && currentQ && (
          <div className="w-full max-w-4xl flex flex-col items-center gap-6 animate-fade-in">
            {/* Header with Creator and Timing */}
            <div className="w-full flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Autore:</span>
                <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-xs">
                  {currentQ.creatorName}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 capitalize">
                  {currentQ.type.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {answersList.length} risposte registrate
                </div>
                <button
                  onClick={onEndQuestionTimerNow}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold rounded-xl transition-colors"
                >
                  Termina Tempo Ora
                </button>
              </div>
            </div>

            {/* Giant Question Display */}
            <div className="w-full bg-slate-900 border-2 border-slate-700/80 p-8 rounded-3xl shadow-2xl text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                {currentQ.title}
              </h2>

              {currentQ.imageUrl && (
                <div className="max-h-72 rounded-2xl overflow-hidden border border-slate-800 inline-block bg-slate-950">
                  <img
                    src={currentQ.imageUrl}
                    alt="Domanda"
                    className="max-h-72 w-auto object-contain mx-auto"
                  />
                </div>
              )}
            </div>

            {/* Live student response indicators */}
            <div className="w-full bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 block mb-2 text-center uppercase tracking-wider">
                Risposte in tempo reale dalla classe ({answersList.length} su {playersList.length}):
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {playersList.map((p) => {
                  const hasAnswered = !!roomState.answersThisTurn[p.id];
                  return (
                    <div
                      key={p.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        hasAnswered
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm scale-102'
                          : 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span>{p.name}</span>
                      {hasAnswered ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 4: QUESTION RESULTS & FASTEST FINGERS PODIUM */}
        {roomState.phase === 'question_results' && currentQ && (
          <div className="w-full max-w-4xl flex flex-col gap-8 animate-fade-in">
            <div className="text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                Turno Concluso
              </span>
              <h2 className="text-3xl font-black text-white">Risultati della Domanda</h2>
              <p className="text-xs text-slate-400">
                Domanda di <strong className="text-amber-300">{currentQ.creatorName}</strong>
              </p>
            </div>

            {/* Fastest Fingers 3 Bonus Podium */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
                <h3 className="text-xl font-black text-white uppercase tracking-wider">
                  I 3 Diti Più Veloci della Classe
                </h3>
                <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
              </div>

              {fastestFingers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fastestFingers.map((sub, idx) => {
                    const bonus = idx === 0 ? '+20 Bonus' : idx === 1 ? '+15 Bonus' : '+10 Bonus';
                    const medal = idx === 0 ? '🥇 1° Posto' : idx === 1 ? '🥈 2° Posto' : '🥉 3° Posto';
                    const borderCol =
                      idx === 0
                        ? 'border-amber-400 bg-amber-500/10'
                        : idx === 1
                        ? 'border-slate-300 bg-slate-300/10'
                        : 'border-orange-500 bg-orange-500/10';

                    return (
                      <div
                        key={sub.playerId}
                        className={`p-5 rounded-2xl border-2 ${borderCol} flex flex-col items-center text-center shadow-lg transform transition-transform hover:scale-105`}
                      >
                        <span className="text-sm font-black text-amber-300">{medal}</span>
                        <h4 className="text-xl font-black text-white mt-2">{sub.playerName}</h4>
                        <span className="text-xs text-slate-400 mt-1">
                          Tempo: {sub.timeSpent.toFixed(2)}s
                        </span>
                        <span className="mt-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs">
                          {bonus} (+50 base)
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-slate-500 py-6 text-sm">
                  Nessuna risposta corretta registrata in tempo per questo turno.
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={onNextQuestion}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-base shadow-xl flex items-center gap-2 transition-transform active:scale-95"
              >
                Visualizza Classifica Aggiornata
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 5: LEADERBOARD STANDINGS */}
        {roomState.phase === 'leaderboard' && (
          <div className="w-full max-w-3xl flex flex-col gap-6 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Trophy className="w-6 h-6 fill-amber-400" />
                <h2 className="text-3xl font-black text-white">Classifica Live</h2>
              </div>
              <p className="text-xs text-slate-400">
                Punteggi dopo la domanda {roomState.currentQuestionIndex + 1}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-3 max-h-[440px] overflow-y-auto">
              {sortedPlayers.map((player, idx) => {
                const isTop3 = idx < 3;
                return (
                  <div
                    key={player.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      idx === 0
                        ? 'border-amber-400 bg-amber-500/15 shadow-lg'
                        : idx === 1
                        ? 'border-slate-400 bg-slate-400/10'
                        : idx === 2
                        ? 'border-amber-700 bg-amber-700/10'
                        : 'border-slate-800 bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-base text-white">{player.name}</h4>
                        {player.streak > 1 && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-extrabold">
                            <Flame className="w-3.5 h-3.5 fill-amber-400" />
                            {player.streak} di fila!
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-white font-mono">
                        {player.score}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">pt</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                onClick={onNextQuestion}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base shadow-xl flex items-center gap-2 transition-transform active:scale-95"
              >
                {roomState.currentQuestionIndex + 1 < roomState.questions.length
                  ? 'Prossima Domanda'
                  : 'Podio Finale!'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 6: FINAL PODIUM */}
        {roomState.phase === 'podium' && (
          <div className="w-full max-w-4xl flex flex-col items-center gap-8 animate-fade-in text-center">
            <div className="space-y-2">
              <span className="px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 font-black text-xs uppercase tracking-widest border border-amber-400/30">
                FlipQuiz Completato!
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white">Podio della Classe</h2>
              <p className="text-sm text-slate-400">
                Complimenti a tutti gli studenti per le fantastiche domande create e risolte!
              </p>
            </div>

            {/* Podium Visual Stand */}
            <div className="flex items-end justify-center gap-4 w-full max-w-xl my-6">
              {/* 2nd Place */}
              {sortedPlayers[1] && (
                <div className="flex-1 flex flex-col items-center animate-slide-up">
                  <span className="text-3xl mb-2">🥈</span>
                  <h4 className="font-extrabold text-white text-base line-clamp-1">
                    {sortedPlayers[1].name}
                  </h4>
                  <span className="text-xs text-slate-400 font-bold mb-2">
                    {sortedPlayers[1].score} pt
                  </span>
                  <div className="w-full h-36 bg-gradient-to-t from-slate-700 to-slate-600 rounded-t-3xl flex items-center justify-center font-black text-3xl text-white shadow-xl">
                    2
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {sortedPlayers[0] && (
                <div className="flex-1 flex flex-col items-center animate-scale-up">
                  <span className="text-4xl mb-2">👑 🥇</span>
                  <h4 className="font-black text-amber-300 text-lg line-clamp-1">
                    {sortedPlayers[0].name}
                  </h4>
                  <span className="text-sm text-amber-400 font-extrabold mb-2">
                    {sortedPlayers[0].score} pt
                  </span>
                  <div className="w-full h-48 bg-gradient-to-t from-amber-600 to-yellow-500 rounded-t-3xl flex items-center justify-center font-black text-4xl text-slate-950 shadow-2xl ring-4 ring-amber-300">
                    1
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {sortedPlayers[2] && (
                <div className="flex-1 flex flex-col items-center animate-slide-up">
                  <span className="text-3xl mb-2">🥉</span>
                  <h4 className="font-extrabold text-white text-base line-clamp-1">
                    {sortedPlayers[2].name}
                  </h4>
                  <span className="text-xs text-slate-400 font-bold mb-2">
                    {sortedPlayers[2].score} pt
                  </span>
                  <div className="w-full h-28 bg-gradient-to-t from-amber-900 to-amber-800 rounded-t-3xl flex items-center justify-center font-black text-2xl text-amber-200 shadow-xl">
                    3
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onResetGame}
              className="px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Torna alla Lobby per una Nuova Sessione
            </button>
          </div>
        )}
      </div>

      {/* Teacher Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Configurazione Docente</h3>
                  <p className="text-xs text-slate-400">Modifica punteggi e tempi delle singole domande</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Punti base per risposta esatta:
                </label>
                <div className="flex gap-2">
                  {[20, 50, 100].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setEditPoints(pts)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black ${
                        editPoints === pts
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {pts} pt
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tempo risposta per la domanda:
                </label>
                <div className="flex gap-2">
                  {[10, 25, 40, 60].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditTime(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black ${
                        editTime === t
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t} secondi
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>
                  <strong>Regole Punteggio:</strong>
                </p>
                <p>• Risposta corretta: 50 punti (o valore impostato)</p>
                <p>• Bonus 3 diti più veloci: 1° (+20 pt), 2° (+15 pt), 3° (+10 pt)</p>
                <p>• Sfida Disegno: punteggio proporzionale alle stelle ⭐ ricevute dai compagni!</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Chiudi
              </button>
              <button
                type="button"
                onClick={saveQuestionConfig}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
