// Present-tense conjugation trainer data.
//
// Each paradigm lists the six present-tense forms in the fixed person order
// [ich, du, er/sie/es, wir, ihr, sie/Sie]. The trainer turns every (verb,
// person) pair into a typed prompt ("haben — du → ?" → "hast"), so it drills
// the tricky du/er stem changes (du liest, er spricht) that example-sentence
// blanks can never reach — a sentence only ever shows one person.
//
// Verbs are gated by the deck schedule: a paradigm only appears once its
// infinitive is unlocked as a normal flashcard, so the trainer stays in step
// with whatever the learner has reached. Verbs not present in a given app's
// curriculum simply never show.

import { FlashcardWithMeta, headword } from "./flashcards";

export type Person = "ich" | "du" | "er/sie/es" | "wir" | "ihr" | "sie/Sie";

export const PERSONS: Person[] = ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"];

export type VerbParadigm = {
  infinitive: string;
  en: string;
  hint?: string; // shown as a small note, e.g. "a → ä" or "irregular"
  // Six present-tense forms, in PERSONS order.
  forms: [string, string, string, string, string, string];
};

export const VERB_PARADIGMS: VerbParadigm[] = [
  // — Irregular core (Lektion 12) —
  { infinitive: "sein", en: "to be", hint: "irregular", forms: ["bin", "bist", "ist", "sind", "seid", "sind"] },
  { infinitive: "haben", en: "to have", hint: "irregular: du hast, er hat", forms: ["habe", "hast", "hat", "haben", "habt", "haben"] },
  { infinitive: "werden", en: "to become", hint: "irregular: du wirst, er wird", forms: ["werde", "wirst", "wird", "werden", "werdet", "werden"] },
  { infinitive: "wissen", en: "to know (a fact)", hint: "irregular: ich weiß", forms: ["weiß", "weißt", "weiß", "wissen", "wisst", "wissen"] },

  // — Regular (Lektion 13–14) —
  { infinitive: "machen", en: "to do / to make", forms: ["mache", "machst", "macht", "machen", "macht", "machen"] },
  { infinitive: "gehen", en: "to go", forms: ["gehe", "gehst", "geht", "gehen", "geht", "gehen"] },
  { infinitive: "kommen", en: "to come", forms: ["komme", "kommst", "kommt", "kommen", "kommt", "kommen"] },
  { infinitive: "lernen", en: "to learn", forms: ["lerne", "lernst", "lernt", "lernen", "lernt", "lernen"] },
  { infinitive: "wohnen", en: "to live / reside", forms: ["wohne", "wohnst", "wohnt", "wohnen", "wohnt", "wohnen"] },
  { infinitive: "spielen", en: "to play", forms: ["spiele", "spielst", "spielt", "spielen", "spielt", "spielen"] },
  { infinitive: "kaufen", en: "to buy", forms: ["kaufe", "kaufst", "kauft", "kaufen", "kauft", "kaufen"] },
  { infinitive: "fragen", en: "to ask", forms: ["frage", "fragst", "fragt", "fragen", "fragt", "fragen"] },
  { infinitive: "sagen", en: "to say", forms: ["sage", "sagst", "sagt", "sagen", "sagt", "sagen"] },
  { infinitive: "hören", en: "to hear / to listen", forms: ["höre", "hörst", "hört", "hören", "hört", "hören"] },
  { infinitive: "lieben", en: "to love", forms: ["liebe", "liebst", "liebt", "lieben", "liebt", "lieben"] },
  { infinitive: "brauchen", en: "to need", forms: ["brauche", "brauchst", "braucht", "brauchen", "braucht", "brauchen"] },
  { infinitive: "suchen", en: "to search / look for", forms: ["suche", "suchst", "sucht", "suchen", "sucht", "suchen"] },
  { infinitive: "kochen", en: "to cook", forms: ["koche", "kochst", "kocht", "kochen", "kocht", "kochen"] },
  { infinitive: "studieren", en: "to study (at university)", forms: ["studiere", "studierst", "studiert", "studieren", "studiert", "studieren"] },
  { infinitive: "telefonieren", en: "to phone / to call", forms: ["telefoniere", "telefonierst", "telefoniert", "telefonieren", "telefoniert", "telefonieren"] },

  // — Stem ends in -t / -d: insert -e- before -st/-t —
  { infinitive: "arbeiten", en: "to work", hint: "stem ends in -t → du arbeitest, er arbeitet", forms: ["arbeite", "arbeitest", "arbeitet", "arbeiten", "arbeitet", "arbeiten"] },
  { infinitive: "antworten", en: "to answer", hint: "stem ends in -t → du antwortest", forms: ["antworte", "antwortest", "antwortet", "antworten", "antwortet", "antworten"] },
  { infinitive: "reden", en: "to talk", hint: "stem ends in -d → du redest", forms: ["rede", "redest", "redet", "reden", "redet", "reden"] },
  { infinitive: "finden", en: "to find", hint: "stem ends in -d → du findest", forms: ["finde", "findest", "findet", "finden", "findet", "finden"] },

  // — Stem ends in a sibilant (-s/-ß/-z): du form takes only -t —
  { infinitive: "heißen", en: "to be called", hint: "stem ends in -ß → du heißt", forms: ["heiße", "heißt", "heißt", "heißen", "heißt", "heißen"] },
  { infinitive: "tanzen", en: "to dance", hint: "stem ends in -z → du tanzt", forms: ["tanze", "tanzt", "tanzt", "tanzen", "tanzt", "tanzen"] },

  // — Stem-changing (Lektion 15): a→ä, au→äu, e→i, e→ie —
  { infinitive: "fahren", en: "to drive / to go (by vehicle)", hint: "a → ä: du fährst, er fährt", forms: ["fahre", "fährst", "fährt", "fahren", "fahrt", "fahren"] },
  { infinitive: "schlafen", en: "to sleep", hint: "a → ä: du schläfst, er schläft", forms: ["schlafe", "schläfst", "schläft", "schlafen", "schlaft", "schlafen"] },
  { infinitive: "tragen", en: "to carry / to wear", hint: "a → ä: du trägst, er trägt", forms: ["trage", "trägst", "trägt", "tragen", "tragt", "tragen"] },
  { infinitive: "laufen", en: "to run / to walk", hint: "au → äu: du läufst, er läuft", forms: ["laufe", "läufst", "läuft", "laufen", "lauft", "laufen"] },
  { infinitive: "lesen", en: "to read", hint: "e → ie: du liest, er liest", forms: ["lese", "liest", "liest", "lesen", "lest", "lesen"] },
  { infinitive: "sehen", en: "to see", hint: "e → ie: du siehst, er sieht", forms: ["sehe", "siehst", "sieht", "sehen", "seht", "sehen"] },
  { infinitive: "sprechen", en: "to speak", hint: "e → i: du sprichst, er spricht", forms: ["spreche", "sprichst", "spricht", "sprechen", "sprecht", "sprechen"] },
  { infinitive: "essen", en: "to eat", hint: "e → i: du isst, er isst", forms: ["esse", "isst", "isst", "essen", "esst", "essen"] },
  { infinitive: "geben", en: "to give", hint: "e → i: du gibst, er gibt", forms: ["gebe", "gibst", "gibt", "geben", "gebt", "geben"] },
  { infinitive: "treffen", en: "to meet", hint: "e → i: du triffst, er trifft", forms: ["treffe", "triffst", "trifft", "treffen", "trefft", "treffen"] },
  { infinitive: "helfen", en: "to help", hint: "e → i: du hilfst, er hilft", forms: ["helfe", "hilfst", "hilft", "helfen", "helft", "helfen"] },
  { infinitive: "nehmen", en: "to take", hint: "irregular: du nimmst, er nimmt", forms: ["nehme", "nimmst", "nimmt", "nehmen", "nehmt", "nehmen"] },
  { infinitive: "gefallen", en: "to please / to be liked", hint: "a → ä: er gefällt", forms: ["gefalle", "gefällst", "gefällt", "gefallen", "gefallt", "gefallen"] },

  // — Modal verbs: ich and er/sie/es share the same form —
  { infinitive: "können", en: "can / to be able to", hint: "modal: ich = er (kann)", forms: ["kann", "kannst", "kann", "können", "könnt", "können"] },
  { infinitive: "müssen", en: "must / to have to", hint: "modal: ich = er (muss)", forms: ["muss", "musst", "muss", "müssen", "müsst", "müssen"] },
  { infinitive: "wollen", en: "to want to", hint: "modal: ich = er (will)", forms: ["will", "willst", "will", "wollen", "wollt", "wollen"] },
  { infinitive: "dürfen", en: "may / to be allowed to", hint: "modal: ich = er (darf)", forms: ["darf", "darfst", "darf", "dürfen", "dürft", "dürfen"] },
  { infinitive: "sollen", en: "should / to be supposed to", hint: "modal: ich = er (soll)", forms: ["soll", "sollst", "soll", "sollen", "sollt", "sollen"] },
  { infinitive: "mögen", en: "to like", hint: "modal: ich = er (mag)", forms: ["mag", "magst", "mag", "mögen", "mögt", "mögen"] },
  { infinitive: "möchten", en: "would like (to)", hint: "modal: ich = er (möchte)", forms: ["möchte", "möchtest", "möchte", "möchten", "möchtet", "möchten"] },
];

/**
 * Build synthetic practice cards for the verbs whose infinitive is already
 * unlocked. Each (verb, person) becomes one typed prompt. Level/lesson are
 * copied from the real deck card so scope filters and spaced repetition work.
 */
export function buildConjugationCards(unlocked: FlashcardWithMeta[]): FlashcardWithMeta[] {
  const refByInfinitive = new Map<string, FlashcardWithMeta>();
  for (const card of unlocked) {
    if (card.type !== "verb") continue;
    const key = headword(card).toLowerCase();
    if (!refByInfinitive.has(key)) refByInfinitive.set(key, card);
  }

  const out: FlashcardWithMeta[] = [];
  for (const verb of VERB_PARADIGMS) {
    const ref = refByInfinitive.get(verb.infinitive.toLowerCase());
    if (!ref) continue; // not unlocked yet, or not in this curriculum
    PERSONS.forEach((person, i) => {
      out.push({
        id: `conj:${verb.infinitive}:${person}`,
        de: verb.forms[i],
        en: verb.en,
        type: "verb",
        conj: { infinitive: verb.infinitive, person, en: verb.en, hint: verb.hint },
        level: ref.level,
        lesson: ref.lesson,
        lessonTitle: ref.lessonTitle,
        deckIndex: ref.deckIndex,
      });
    });
  }
  return out;
}
