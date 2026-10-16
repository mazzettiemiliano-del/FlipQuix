import { Question } from '../types/quiz';

export const INITIAL_QUESTIONS: Question[] = [
  // 1. Risposta Multipla
  {
    id: 'q-demo-1',
    type: 'multiple_choice',
    title: 'Quale pianeta del Sistema Solare è conosciuto come il "Pianeta Rosso"?',
    creatorName: 'Marco R.',
    timeLimit: 25,
    points: 50,
    imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80',
    content: {
      options: [
        { id: 'opt-1', text: 'Venere', isCorrect: false },
        { id: 'opt-2', text: 'Marte', isCorrect: true },
        { id: 'opt-3', text: 'Giove', isCorrect: false },
        { id: 'opt-4', text: 'Saturno', isCorrect: false }
      ]
    },
    createdAt: Date.now() - 100000,
    approved: true
  },

  // 2. Vero o Falso
  {
    id: 'q-demo-2',
    type: 'true_false',
    title: 'La Grande Muraglia Cinese è visibile ad occhio nudo dalla Luna.',
    creatorName: 'Giulia V.',
    timeLimit: 15,
    points: 50,
    content: {
      isTrueCorrect: false
    },
    createdAt: Date.now() - 90000,
    approved: true
  },

  // 3. Risposta Aperta (Breve)
  {
    id: 'q-demo-3',
    type: 'open_short',
    title: 'Qual è il capoluogo della regione Toscana?',
    creatorName: 'Leonardo B.',
    timeLimit: 25,
    points: 50,
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    content: {
      acceptedAnswers: ['Firenze', 'firenze', 'FIRENZE']
    },
    createdAt: Date.now() - 80000,
    approved: true
  },

  // 4. Risposta a Buchi
  {
    id: 'q-demo-4',
    type: 'fill_blanks',
    title: 'Completa la frase con la parola corretta:',
    creatorName: 'Sofia M.',
    timeLimit: 25,
    points: 50,
    content: {
      originalText: 'MARIO VA AL MARE IN VACANZA',
      blankWord: 'MARE',
      distractors: ['MONTAGNA', 'LAGO', 'COLLINA']
    },
    createdAt: Date.now() - 70000,
    approved: true
  },

  // 5. Identifica Celle
  {
    id: 'q-demo-5',
    type: 'cell_identify',
    title: 'Clicca su tutte le celle collegate alla vita e storia di:',
    creatorName: 'Matteo P.',
    timeLimit: 25,
    points: 50,
    content: {
      stimulus: 'NAPOLEONE',
      cells: [
        { id: 'c1', text: 'Bonaparte', isMatch: true },
        { id: 'c2', text: 'Cavallo Bianco', isMatch: true },
        { id: 'c3', text: 'Waterloo', isMatch: true },
        { id: 'c4', text: 'Banana', isMatch: false },
        { id: 'c5', text: 'Isola d\'Elba', isMatch: true },
        { id: 'c6', text: 'Torre Eiffel', isMatch: false }
      ]
    },
    createdAt: Date.now() - 60000,
    approved: true
  },

  // 6. Ordina le Celle
  {
    id: 'q-demo-6',
    type: 'order_cells',
    title: 'Metti nell\'ordine corretto le 4 stagioni partendo dalla prima:',
    creatorName: 'Federica S.',
    timeLimit: 25,
    points: 50,
    content: {
      correctOrder: [
        { id: 'ord-1', text: 'Primavera' },
        { id: 'ord-2', text: 'Estate' },
        { id: 'ord-3', text: 'Autunno' },
        { id: 'ord-4', text: 'Inverno' }
      ]
    },
    createdAt: Date.now() - 50000,
    approved: true
  },

  // 7. Anagramma
  {
    id: 'q-demo-7',
    type: 'anagram',
    title: 'Ricomponi le lettere per formare la capitale d\'Italia:',
    creatorName: 'Andrea C.',
    timeLimit: 25,
    points: 50,
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80',
    content: {
      phraseOrWord: 'ROMA'
    },
    createdAt: Date.now() - 40000,
    approved: true
  },

  // 8. Matematica
  {
    id: 'q-demo-8',
    type: 'math_challenge',
    title: 'Sfida di Calcolo Rapido a Mente:',
    creatorName: 'Sara T.',
    timeLimit: 25,
    points: 50,
    content: {
      operators: ['+', '-'],
      numberOfOperations: 2,
      digitRange: 100,
      allowCarryOrRemainder: false,
      generatedProblems: [
        { equation: '24 + 15', answer: 39 },
        { equation: '58 - 23', answer: 35 }
      ]
    },
    createdAt: Date.now() - 30000,
    approved: true
  },

  // 9. Disegna & Votazione Stelle
  {
    id: 'q-demo-9',
    type: 'draw_vote',
    title: 'Sfida artistica per tutta la classe!',
    creatorName: 'Chiara L.',
    timeLimit: 40,
    points: 50,
    content: {
      prompt: 'Disegna un gatto con gli occhiali da sole sulla spiaggia!'
    },
    createdAt: Date.now() - 20000,
    approved: true
  }
];
