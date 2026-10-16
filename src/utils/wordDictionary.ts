/**
 * Italian Word Dictionary & Anagram / Word Builder Helpers
 */

// A curated collection of common Italian words (3 to 10 letters) for the "Più Parole" challenge
export const ITALIAN_WORD_LIST = new Set([
  'mare', 'sole', 'roma', 'cane', 'gatto', 'casa', 'pane', 'vino', 'mela', 'pera',
  'pesce', 'luce', 'notte', 'fiore', 'libro', 'penna', 'foglio', 'cuore', 'vento',
  'porto', 'pista', 'festa', 'terra', 'monte', 'fiume', 'bosco', 'parco', 'tempo',
  'rosso', 'verde', 'giallo', 'blu', 'bianco', 'nero', 'prato', 'cielo', 'stella',
  'sedia', 'tavolo', 'porta', 'vetro', 'muro', 'treno', 'auto', 'nave', 'aereo',
  'bici', 'palla', 'gioco', 'rete', 'salto', 'corsa', 'nuoto', 'passo', 'mano',
  'piede', 'testa', 'occhi', 'naso', 'bocca', 'dente', 'voce', 'suono', 'canto',
  'musica', 'nota', 'ritmo', 'scuola', 'classe', 'banco', 'zaino', 'maestro',
  'amico', 'fratello', 'sorella', 'madre', 'padre', 'nonno', 'nonna', 'figlio',
  'anno', 'mese', 'giorno', 'ora', 'minuto', 'secondo', 'oggi', 'ieri', 'sera',
  'alba', 'tramonto', 'estate', 'inverno', 'autunno', 'primavera', 'caldo', 'freddo',
  'neve', 'pioggia', 'nuvola', 'tuono', 'lampo', 'ombra', 'spazio', 'mondo',
  'italia', 'europa', 'isola', 'costa', 'golfo', 'lago', 'valle', 'collina',
  'oro', 'argento', 'ferro', 'rame', 'legno', 'pietra', 'sabbia', 'acqua', 'fuoco',
  'aria', 'fumo', 'onda', 'scoglio', 'spiaggia', 'porto', 'viaggio', 'strada',
  'ponte', 'piazza', 'chiesa', 'torre', 'palazzo', 'museo', 'teatro', 'cinema',
  'foto', 'quadro', 'statua', 'storia', 'scienza', 'natura', 'vita', 'sogno',
  'pace', 'gioia', 'amore', 'bene', 'forza', 'coraggio', 'mente', 'pensiero',
  'idea', 'parola', 'frase', 'storia', 'favola', 'mito', 'poesia', 'verso',
  // Short common words
  'tre', 'due', 'uno', 'sei', 'dieci', 'otto', 'nove', 'mille', 'cento',
  'ala', 'oro', 'ora', 'era', 'lui', 'lei', 'noi', 'voi', 'mio', 'tuo', 'suo',
  'qui', 'qua', 'giu', 'su', 'mai', 'poi', 'piu', 'gia', 'via', 'zoo', 'bar',
  'sci', 'tè', 're', 'po', 'fa', 'do', 'sol', 'la', 'si', 'mi'
]);

export function canFormWord(word: string, availableLetters: string[]): boolean {
  const normWord = word.trim().toLowerCase();
  if (normWord.length < 2) return false;

  const letterPool = [...availableLetters.map((c) => c.toLowerCase())];

  for (const char of normWord) {
    const idx = letterPool.indexOf(char);
    if (idx === -1) {
      return false;
    }
    letterPool.splice(idx, 1);
  }
  return true;
}

export function isValidItalianWord(word: string): boolean {
  const norm = word.trim().toLowerCase();
  // Valid if in our curated dictionary OR >= 3 letters composed properly
  return ITALIAN_WORD_LIST.has(norm);
}
