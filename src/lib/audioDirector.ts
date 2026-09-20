import {
  DirectorReport,
  DirectorStyle,
  DramaCharacter,
  DramaLine,
  GeminiVoiceName,
  RadioDramaScript,
} from '../types';

/**
 * Comprehensive list of female biblical names and archetypes in Polish
 */
export const FEMALE_BIBLICAL_NAMES = [
  'maria',
  'maryja',
  'marta',
  'elżbieta',
  'magdalena',
  'anna',
  'salome',
  'joanna',
  'zuzanna',
  'rut',
  'noemi',
  'estera',
  'judyta',
  'debora',
  'deborah',
  'ewa',
  'sara',
  'sarah',
  'rebeka',
  'lea',
  'rachela',
  'miriam',
  'abigail',
  'batszeba',
  'dalila',
  'jezebel',
  'safira',
  'tetyana',
  'weronika',
  'samarytanka',
  'kananejka',
  'syrofenicjanka',
  'służebnica',
  'służąca',
  'dziewczyna',
  'dziewczę',
  'dziewica',
  'matka',
  'córka',
  'siostra',
  'wdowa',
  'niewiasta',
  'kobieta',
  'panna',
  'gospodyni',
  'królowa',
  'prorokini',
  'kobieta cierpiąca',
  'cudzołożnica',
  'matka synów zebedeusza',
  'płacząca niewiasta',
  'niewiasty',
];

export const FEMALE_VOICES: GeminiVoiceName[] = ['Kore', 'Aoede'];
export const MALE_VOICES: GeminiVoiceName[] = ['Fenrir', 'Puck', 'Charon', 'Zephyr'];

/**
 * Checks if a character name or line text represents a female biblical character
 */
export function isFemaleCharacter(characterName: string, linesSample: string[] = []): boolean {
  const norm = characterName.toLowerCase().trim();

  // 1. Check direct name or title keywords
  const hasKeyword = FEMALE_BIBLICAL_NAMES.some((keyword) => {
    return norm === keyword || norm.includes(keyword);
  });

  if (hasKeyword) return true;

  // 2. Polish grammatical markers for female roles in name
  if (
    norm.endsWith('ka') || // np. Samarytanka, Kananejka, służąca
    norm.endsWith('ca') || // np. dziewica, służebnica
    norm.endsWith('owa') || // np. wdowa, królowa
    norm.endsWith('ini') // np. gospodyni, prorokini
  ) {
    return true;
  }

  // 3. Inspect spoken lines for feminine inflections (e.g. "powiedziałam", "byłam", "widziałam", "szczęśliwa jestem")
  const sample = linesSample.slice(0, 8).join(' ').toLowerCase();
  const feminineInflections = [
    'powiedziałam',
    'rzekłam',
    'odpowiedziałam',
    'byłam',
    'widziałam',
    'poszłam',
    'znalazłam',
    'słyszałam',
    'szczęśliwa jestem',
    'służebnicą twoją',
    'jestem kobietą',
  ];

  if (feminineInflections.some((fi) => sample.includes(fi))) {
    return true;
  }

  return false;
}

/**
 * Audits all cast characters and strictly enforces that female roles receive female voices (Kore or Aoede).
 */
export function auditAndGuardFemaleCharacters(
  characters: DramaCharacter[],
  lines: DramaLine[] = []
): {
  guardedCharacters: DramaCharacter[];
  guardedCount: number;
  correctedNames: string[];
  notes: string[];
} {
  let guardedCount = 0;
  const correctedNames: string[] = [];
  const notes: string[] = [];

  const guardedCharacters = characters.map((char) => {
    const charLines = lines.filter((l) => l.characterId === char.id).map((l) => l.text);
    const isFemale = char.gender === 'female' || isFemaleCharacter(char.name, charLines);

    if (isFemale) {
      guardedCount++;
      const currentVoice = char.geminiVoice;
      const isVoiceMale = MALE_VOICES.includes(currentVoice);

      // Default female voice assignment
      let targetFemaleVoice: GeminiVoiceName = 'Kore';
      // If young woman, angel, prayer, virgin Mary -> Aoede (soprano/melody)
      const isYoungOrAngelic =
        char.name.toLowerCase().includes('maria') ||
        char.name.toLowerCase().includes('dziewica') ||
        char.name.toLowerCase().includes('córka') ||
        char.name.toLowerCase().includes('dziewczyna') ||
        char.name.toLowerCase().includes('anioł');

      if (isYoungOrAngelic) {
        targetFemaleVoice = 'Aoede';
      }

      if (isVoiceMale || !FEMALE_VOICES.includes(currentVoice)) {
        correctedNames.push(char.name);
        notes.push(
          `Postać „${char.name}” została zabezpieczona: zmieniono głos z męskiego (${currentVoice}) na właściwy głos żeński (${targetFemaleVoice}).`
        );

        return {
          ...char,
          gender: 'female' as const,
          roleType: (char.roleType === 'narrator' ? 'narrator' : 'female') as any,
          geminiVoice: targetFemaleVoice,
          recommendedPitch: 1.05,
          recommendedRate: 0.98,
          voiceProfile: char.voiceProfile.includes('kobiecy')
            ? char.voiceProfile
            : `Głos żeński: ${char.voiceProfile} (zabezpieczony lektorat żeński)`,
        };
      }

      return {
        ...char,
        gender: 'female' as const,
        roleType: (char.roleType === 'narrator' ? 'narrator' : 'female') as any,
      };
    }

    return char;
  });

  return {
    guardedCharacters,
    guardedCount,
    correctedNames,
    notes,
  };
}

/**
 * Intelligent Sound Director: Analyzes line text, character archetype, and narrative context to determine
 * exact tempoMultiplier (0.85x - 1.15x), actor emotion cues, and respiratory pauses.
 */
export function analyzeLineDirection(
  line: DramaLine,
  character?: DramaCharacter,
  directorStyle: DirectorStyle = 'balanced'
): {
  tempoMultiplier: number;
  emotionCue: string;
  pauseBeforeMs: number;
  pauseAfterMs: number;
  volumeMultiplier: number;
  moodCategory: string;
} {
  const text = (line.text || '').toLowerCase().trim();
  const charName = (character?.name || line.characterName || '').toLowerCase();
  const isJesus = charName.includes('jezus') || charName.includes('chrystus') || line.characterId.includes('jesus');
  const isGod = charName.includes('bóg') || charName.includes('ojciec') || charName.includes('pan');
  const isNarrator = charName.includes('narrator') || line.characterId.includes('narrator');
  const isFemale = character?.gender === 'female' || isFemaleCharacter(charName);

  let tempo = 1.0;
  let emotion = '(spokojnie, z radiową dykcją)';
  let pauseBefore = 100;
  let pauseAfter = 750;
  let volume = 1.0;
  let mood = 'Narration';

  // 1. Divine & Christ Authority
  if (isJesus || isGod) {
    if (text.includes('zaprawdę') || text.includes('powiadam wam') || text.includes('ja jestem')) {
      tempo = 0.93;
      emotion = '(z majestatycznym autorytetem, boskim spokojem i ciepłem)';
      pauseAfter = 1100;
      volume = 1.05;
      mood = 'Boski Autorytet';
    } else if (text.includes('nie lękajcie się') || text.includes('pokój wam') || text.includes('pójdź za mną')) {
      tempo = 0.90;
      emotion = '(z głęboką miłością, kojącym pokojem serca i łaskawością)';
      pauseAfter = 1150;
      volume = 1.02;
      mood = 'Pocieszenie';
    } else if (text.includes('biada wam') || text.includes('plemię żmijowe') || text.includes('obłudnicy')) {
      tempo = 1.05;
      emotion = '(z surową powagą, proroczą siłą i sprawiedliwym oburzeniem)';
      pauseAfter = 900;
      volume = 1.08;
      mood = 'Napomnienie';
    } else {
      tempo = 0.94;
      emotion = '(z powściągliwym majestatem, powagą i wewnętrznym światłem)';
      pauseAfter = 1000;
      volume = 1.03;
      mood = 'Słowo Pańskie';
    }
  }
  // 2. High Prayer, Magnificat, Psalms, Praise
  else if (
    text.includes('wielbi dusza moja') ||
    text.includes('ojcze nasz') ||
    text.includes('błogosławiony') ||
    text.includes('święty') ||
    text.includes('chwała') ||
    text.includes('amen') ||
    text.includes('alleluja') ||
    text.includes('panie mój')
  ) {
    tempo = 0.88;
    emotion = '(z nabożnym uniesieniem, głęboką modlitwą i kontemplacją)';
    pauseAfter = 1300;
    volume = 0.98;
    mood = 'Modlitwa i Sacrum';
  }
  // 3. Deep Repentance, Weeping, Humility (e.g. Prodigal Son, Peter, Sinful woman)
  else if (
    text.includes('zgrzeszyłem') ||
    text.includes('ulituj się') ||
    text.includes('nie jestem godzien') ||
    text.includes('zmiłuj się') ||
    text.includes('przebacz') ||
    text.includes('płakał') ||
    text.includes('ratuj') ||
    text.includes('zginiemy')
  ) {
    tempo = 0.90;
    emotion = '(ze skruchą, drżeniem w głosie, łzami i pokornym błaganiem)';
    pauseAfter = 1200;
    volume = 0.94;
    mood = 'Skrucha i Błaganie';
  }
  // 4. Female Characters (Mary, Martha, Elizabeth, mothers, daughters)
  else if (isFemale) {
    if (text.includes('oto ja służebnica') || text.includes('uczyńcie wszystko') || text.includes('synu')) {
      tempo = 0.91;
      emotion = '(z matczyną czułością, cichym zawierzeniem i pokorą serca)';
      pauseAfter = 1000;
      volume = 0.96;
      mood = 'Matczyne Zawierzenie';
    } else if (text.includes('widziałam pana') || text.includes('zmartwychwstał') || text.includes('żyje')) {
      tempo = 1.08;
      emotion = '(z zapartym tchem, drżącą z zachwytu radością i uniesieniem)';
      pauseAfter = 900;
      volume = 1.04;
      mood = 'Radość Paschalna';
    } else if (text.includes('gdybyś tu był') || text.includes('panie, czy ci to obojętne')) {
      tempo = 0.93;
      emotion = '(z bólem serca, żalem, ale i tlącą się wiarą)';
      pauseAfter = 1000;
      volume = 0.96;
      mood = 'Ból i Wiara';
    } else {
      tempo = 0.95;
      emotion = '(melodyjnym, kobiecym głosem pełnym ciepła i wrażliwości)';
      pauseAfter = 850;
      volume = 0.98;
      mood = 'Głos Kobiecy';
    }
  }
  // 5. Questions, Disbelief, Amazement
  else if (text.endsWith('?') || text.includes('jak to się stanie') || text.includes('kimże on jest')) {
    tempo = 1.02;
    emotion = '(z dociekliwością, przejęciem i poszukiwaniem prawdy)';
    pauseAfter = 900;
    volume = 1.0;
    mood = 'Pytanie i Zdumienie';
  }
  // 6. Joy, Proclamation, Good News
  else if (
    text.includes('radujcie się') ||
    text.includes('weselmy się') ||
    text.includes('znalazłem owcę') ||
    text.includes('syn mój ożył') ||
    text.includes('zmartwychwstał')
  ) {
    tempo = 1.06;
    emotion = '(z promienną radością, świętowaniem i serdecznym uniesieniem)';
    pauseAfter = 850;
    volume = 1.05;
    mood = 'Radość i Świętowanie';
  }
  // 7. Agitation, Anger, Crowd Clamour
  else if (
    text.includes('ukrzyżuj') ||
    text.includes('ukamienować') ||
    text.includes('precz') ||
    text.includes('bluźni') ||
    text.includes('zamordować')
  ) {
    tempo = 1.12;
    emotion = '(z gwałtownym uniesieniem, wrogością i wrzawą wzburzonego tłumu)';
    pauseAfter = 600;
    volume = 1.08;
    mood = 'Dramaturgia i Gniew';
  }
  // 8. Narrator (Christian Culture Station voice)
  else if (isNarrator) {
    tempo = 0.96;
    emotion = '(spokojnym, szlachetnym tonem lektorskim stacji Christian Culture)';
    pauseAfter = 750;
    volume = 1.0;
    mood = 'Narracja Biblijna';
  }
  // Default dialogue
  else {
    tempo = 0.98;
    emotion = '(naturalnym, przekonującym tonem z szacunkiem dla tekstu)';
    pauseAfter = 750;
    volume = 1.0;
    mood = 'Dialog';
  }

  // Apply Director Style Modifier
  if (directorStyle === 'reverent') {
    tempo = Math.max(0.85, Number((tempo - 0.05).toFixed(2)));
    pauseAfter = Math.round(pauseAfter * 1.25);
    pauseBefore = Math.round(pauseBefore * 1.2);
  } else if (directorStyle === 'dramatic') {
    if (tempo > 1.0) {
      tempo = Math.min(1.15, Number((tempo + 0.04).toFixed(2)));
    } else {
      tempo = Math.max(0.85, Number((tempo - 0.03).toFixed(2)));
    }
    pauseAfter = Math.round(pauseAfter * 0.9);
  }

  return {
    tempoMultiplier: tempo,
    emotionCue: emotion,
    pauseBeforeMs: pauseBefore,
    pauseAfterMs: pauseAfter,
    volumeMultiplier: volume,
    moodCategory: mood,
  };
}

/**
 * Main AI Sound Director Function:
 * Inspects, audits and directs the entire radio drama script.
 */
export function applyIntelligentAudioDirection(
  script: RadioDramaScript,
  directorStyle: DirectorStyle = 'balanced'
): {
  script: RadioDramaScript;
  report: DirectorReport;
} {
  const characters = script.characters || [];
  const lines = script.lines || [];

  // Step 1: Enforce female voice guard on cast
  const { guardedCharacters, guardedCount, correctedNames, notes } =
    auditAndGuardFemaleCharacters(characters, lines);

  // Map for rapid lookup
  const charMap = new Map<string, DramaCharacter>();
  guardedCharacters.forEach((c) => charMap.set(c.id, c));

  let totalTempo = 0;
  let minTempo = 2.0;
  let maxTempo = 0.0;
  let modCount = 0;
  const moodCounts: Record<string, number> = {};

  // Step 2: Direct each line
  const directedLines: DramaLine[] = lines.map((line) => {
    const char = charMap.get(line.characterId);
    const direction = analyzeLineDirection(line, char, directorStyle);

    totalTempo += direction.tempoMultiplier;
    minTempo = Math.min(minTempo, direction.tempoMultiplier);
    maxTempo = Math.max(maxTempo, direction.tempoMultiplier);
    moodCounts[direction.moodCategory] = (moodCounts[direction.moodCategory] || 0) + 1;
    modCount++;

    return {
      ...line,
      tempoMultiplier: direction.tempoMultiplier,
      emotionCue: direction.emotionCue,
      pauseAfterMs: direction.pauseAfterMs,
      pauseBeforeMs: direction.pauseBeforeMs,
      volumeMultiplier: direction.volumeMultiplier,
    };
  });

  const avgTempo = lines.length > 0 ? Number((totalTempo / lines.length).toFixed(2)) : 1.0;

  // Find dominant mood
  let dominantMood = 'Sakralna narracja';
  let highestMoodCount = 0;
  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (count > highestMoodCount) {
      highestMoodCount = count;
      dominantMood = mood;
    }
  });

  const femaleCharNames = guardedCharacters
    .filter((c) => c.gender === 'female')
    .map((c) => `${c.name} (${c.geminiVoice})`);

  let pacingNote = 'Optymalne, zrównoważone tempo emisyjne dla stacji Christian Culture.';
  if (directorStyle === 'reverent') {
    pacingNote = 'Podniosłe, powolne tempo sakralne z wydłużonymi pauzami kontemplacyjnymi.';
  } else if (directorStyle === 'dramatic') {
    pacingNote = 'Dynamiczne kontrasty tempa dla uwypuklenia dramaturgii i napięcia biblijnego.';
  }

  const report: DirectorReport = {
    lastDirectedAt: Date.now(),
    directorStyle,
    totalLinesDirected: lines.length,
    femaleRolesGuardedCount: guardedCount,
    femaleCharacterNames: femaleCharNames,
    averageTempo: avgTempo,
    tempoRange: {
      min: lines.length > 0 ? Number(minTempo.toFixed(2)) : 1.0,
      max: lines.length > 0 ? Number(maxTempo.toFixed(2)) : 1.0,
    },
    dominantMood,
    pacingNote,
    modificationsCount: modCount,
    guardedFemaleNotes: notes,
  };

  const updatedScript: RadioDramaScript = {
    ...script,
    characters: guardedCharacters,
    lines: directedLines,
    atmosphereMood: `${dominantMood} • Styl: ${directorStyle}`,
  };

  return {
    script: updatedScript,
    report,
  };
}
