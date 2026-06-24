// Self-contained German A1 learning data for Deutsch Start.
// The A1 course mirrors the Learn German Original A1 sequence (65 lessons).

export type GermanLevel = "A1" | "A2" | "B1";

export type Lesson = {
  level: GermanLevel;
  number: number;
  title: string;
  grammar: string;
  vocabulary: string;
};

type RawLesson = Omit<Lesson, "level">;

export type Unit = {
  id: string;
  title: string;
  blurb: string;
  range: [number, number];
};

export type SkillId =
  | "grammar"
  | "vocabulary"
  | "listening"
  | "speaking"
  | "writing"
  | "exam";

export type Resource = {
  id: string;
  name: string;
  description: string;
  url: string;
  skill: SkillId;
  free: boolean;
};

export type Skill = {
  id: SkillId;
  name: string;
  tagline: string;
};

const courseBase = "https://learngermanoriginal.com/courses";
const vocabularyBase = "https://learngermanoriginal.com/vocabulary/basic";
const courseSlug: Record<GermanLevel, string> = { A1: "a1-course", A2: "a2-course", B1: "b1-course" };

export const lessonUrl = (lesson: { level: GermanLevel; number: number }) =>
  `${courseBase}/${courseSlug[lesson.level]}/lesson-${lesson.number}/`;

// Topic vocabulary pages that genuinely match a lesson; otherwise the lesson
// page itself is the safest vocabulary source.
const vocabularyTopicByLesson: Partial<Record<number, string>> = {
  6: "countries-and-languages", 7: "countries-and-languages", 14: "hobbies",
  15: "means-of-transport", 18: "professions", 19: "in-the-classroom",
  20: "in-the-classroom", 21: "devices", 22: "time-of-the-day",
  23: "time-of-the-day", 24: "my-house", 26: "groceries", 27: "clothing",
  28: "breakfast", 29: "in-the-city", 30: "breakfast", 33: "months",
  34: "weekdays", 38: "time-of-the-day", 39: "in-the-classroom",
  40: "in-the-city", 43: "bodyparts", 45: "means-of-transport",
  47: "means-of-transport", 48: "groceries", 49: "weather", 50: "weekdays",
  52: "hobbies", 54: "colors", 55: "clothing", 56: "means-of-transport",
  57: "time-of-the-day", 59: "bodyparts", 62: "in-the-city", 63: "in-the-city",
  64: "my-house", 65: "means-of-transport",
};

export const vocabularyUrl = (lesson: Lesson) => {
  if (lesson.level === "A1") {
    const topic = vocabularyTopicByLesson[lesson.number];
    if (topic) return `${vocabularyBase}/${topic}/`;
  }
  return lessonUrl(lesson);
};

const a1Raw: RawLesson[] = [
  { number: 1, title: "Greetings", grammar: "Greeting formulas and word order in fixed expressions", vocabulary: "Hallo, Guten Morgen, Guten Tag, Guten Abend, Tschüss" },
  { number: 2, title: "Common Phrases", grammar: "Polite fixed expressions", vocabulary: "bitte, danke, Entschuldigung, ja, nein, gern" },
  { number: 3, title: "Numbers (Part 1)", grammar: "Number formation from 1–20", vocabulary: "Numbers 1–20, age and small prices" },
  { number: 4, title: "Numbers (Part 2)", grammar: "Number formation from 20–100", vocabulary: "Tens, phone numbers and prices" },
  { number: 5, title: "Alphabets", grammar: "German letter names and spelling questions", vocabulary: "Alphabet, buchstabieren, Wie schreibt man …?" },
  { number: 6, title: "Introducing yourself", grammar: "First-person statements with heißen, kommen and wohnen", vocabulary: "Name, country, city, study and language" },
  { number: 7, title: "Getting to know someone", grammar: "W-questions and informal du versus formal Sie", vocabulary: "wer, wie, wo, woher, wohnen, kommen" },
  { number: 8, title: "Wie geht's?", grammar: "Question and response patterns", vocabulary: "gut, sehr gut, okay, müde, schlecht, auch" },
  { number: 9, title: "Sentence structure (Part 1)", grammar: "Verb in position 2 in statements", vocabulary: "Personal-information sentence building" },
  { number: 10, title: "Sentence structure (Part 2)", grammar: "Yes/no questions and question word order", vocabulary: "Question starters and short answers" },
  { number: 11, title: "Pronomen", grammar: "Personal pronouns in the nominative", vocabulary: "ich, du, er, sie, es, wir, ihr, Sie" },
  { number: 12, title: "Verb Conjugation (Part 1)", grammar: "Present tense of sein and haben", vocabulary: "sein, haben and personal descriptions" },
  { number: 13, title: "What is a Verb?", grammar: "Infinitives, stems, regular and irregular verbs", vocabulary: "Core everyday action verbs" },
  { number: 14, title: "Verb Conjugation (Part 2)", grammar: "Present tense of regular verbs", vocabulary: "lernen, machen, wohnen, arbeiten, spielen" },
  { number: 15, title: "Verb Conjugation (Part 3)", grammar: "Present tense of common irregular verbs", vocabulary: "fahren, lesen, sprechen, sehen, essen" },
  { number: 16, title: "Numbers (Part 3)", grammar: "Numbers above 100", vocabulary: "Hundreds, thousands, years and large prices" },
  { number: 17, title: "Adjectives and Opposites", grammar: "Predicative adjectives with sein", vocabulary: "groß/klein, alt/neu, teuer/billig, schnell/langsam" },
  { number: 18, title: "How to introduce someone", grammar: "Third-person pronouns and verb forms", vocabulary: "Family, colleague, friend, origin and occupation" },
  { number: 19, title: "Articles (bestimmte Artikel)", grammar: "Definite articles der, die and das", vocabulary: "Every noun with article and plural" },
  { number: 20, title: "Articles (unbestimmte Artikel)", grammar: "Indefinite articles ein and eine", vocabulary: "Objects, people and classroom nouns" },
  { number: 21, title: "Articles (negative Artikel)", grammar: "Negation with kein and keine", vocabulary: "Possessions and everyday objects" },
  { number: 22, title: "Time (official)", grammar: "Formal clock-time patterns", vocabulary: "Uhr, hours, minutes and appointments" },
  { number: 23, title: "Time (inofficial)", grammar: "Colloquial time with vor, nach, halb and Viertel", vocabulary: "Daily times and scheduling phrases" },
  { number: 24, title: "Possessive Pronouns (Nominative)", grammar: "mein, dein, sein, ihr and Ihr in the nominative", vocabulary: "Possessions and relationships" },
  { number: 25, title: "My Family", grammar: "Possessives and third-person descriptions", vocabulary: "Family members, age, work and relationships" },
  { number: 26, title: "Accusative Articles", grammar: "Accusative case and masculine article change", vocabulary: "Food, purchases and direct objects" },
  { number: 27, title: "Possessive Pronouns (Accusative)", grammar: "Possessives as direct objects", vocabulary: "Finding, buying and describing belongings" },
  { number: 28, title: "Modal Verb möchten", grammar: "möchten plus infinitive", vocabulary: "Requests, food, drinks and polite wishes" },
  { number: 29, title: "Was? Wo? Wie? (W-Fragen)", grammar: "W-question words and verb position", vocabulary: "was, wo, wohin, woher, wann, warum, wie" },
  { number: 30, title: "In Restaurant", grammar: "Polite requests with möchten and ich hätte gern", vocabulary: "Menu, ordering, paying and restaurant phrases" },
  { number: 31, title: "Personal Pronouns (Accusative)", grammar: "mich, dich, ihn, sie, es, uns, euch and Sie", vocabulary: "People and direct-object actions" },
  { number: 32, title: "Dative Articles", grammar: "Dative definite and indefinite articles", vocabulary: "Giving, helping and common dative verbs" },
  { number: 33, title: "Ordinal Numbers", grammar: "Ordinal endings and dates", vocabulary: "Calendar dates, floors and sequence" },
  { number: 34, title: "Questions of time", grammar: "Temporal questions with wann, wie lange and wie oft", vocabulary: "Frequency, duration and appointments" },
  { number: 35, title: "Possessive Pronouns (Dative)", grammar: "Possessives in the dative", vocabulary: "Giving and talking about other people's belongings" },
  { number: 36, title: "Personal Pronouns (Dative)", grammar: "mir, dir, ihm, ihr, uns, euch and ihnen", vocabulary: "Helping, thanking and giving" },
  { number: 37, title: "Separable Verbs", grammar: "Separated prefixes in main clauses", vocabulary: "aufstehen, einkaufen, anrufen, mitkommen, anfangen" },
  { number: 38, title: "Daily Routine", grammar: "Present tense, separable verbs and time order", vocabulary: "Morning, work, study, meals and evening routine" },
  { number: 39, title: "Imperative Sentences", grammar: "Imperative forms for du, ihr and Sie", vocabulary: "Requests, instructions and classroom language" },
  { number: 40, title: "Giving Directions", grammar: "Imperatives and directional prepositions", vocabulary: "links, rechts, geradeaus, gegenüber, an der Ecke" },
  { number: 41, title: "war or hatte?", grammar: "Simple past of sein and haben", vocabulary: "Past states, possession and yesterday" },
  { number: 42, title: "Non-separable Verbs", grammar: "Inseparable prefixes be-, er-, ver-, ent- and zer-", vocabulary: "bezahlen, erklären, verstehen, besuchen, erzählen" },
  { number: 43, title: "Talking about your health", grammar: "Dative body expressions and haben constructions", vocabulary: "Body parts, symptoms, pain and wellbeing" },
  { number: 44, title: "Perfekt 1: sentence structure", grammar: "Conversational past: auxiliary plus past participle", vocabulary: "Yesterday and completed activities" },
  { number: 45, title: "Perfekt 2: haben or sein?", grammar: "Choosing haben or sein as the Perfekt auxiliary", vocabulary: "Movement, change of state and daily actions" },
  { number: 46, title: "Perfekt 3: participle forms", grammar: "Regular and irregular past participles", vocabulary: "Common participles for everyday events" },
  { number: 47, title: "What did you do on vacation?", grammar: "Narrating past events in Perfekt", vocabulary: "Travel, holiday activities and sequencing" },
  { number: 48, title: "In the Supermarket", grammar: "Quantity expressions and accusative objects", vocabulary: "Groceries, packaging, weights and prices" },
  { number: 49, title: "How is the weather?", grammar: "Impersonal es and weather expressions", vocabulary: "sunny, cloudy, rain, snow, temperature and seasons" },
  { number: 50, title: "How to fix appointments", grammar: "Modal language for accepting, declining and rescheduling", vocabulary: "Dates, availability and appointment phrases" },
  { number: 51, title: "Letter Writing: Invitation", grammar: "Informal message structure and word order", vocabulary: "Invitation, reason, date, place, acceptance and refusal" },
  { number: 52, title: "Expressing Likes and Dislikes", grammar: "gern, lieber, gefallen and mögen", vocabulary: "Hobbies, preferences and opinions" },
  { number: 53, title: "Interrogative pronoun welch-", grammar: "welch- endings across basic cases", vocabulary: "Choosing between people and things" },
  { number: 54, title: "Demonstrative article dies-", grammar: "dies- endings across basic cases", vocabulary: "Pointing out and comparing items" },
  { number: 55, title: "Buying clothes", grammar: "Adjective vocabulary with demonstratives and questions", vocabulary: "Clothes, colors, sizes, fit and payment" },
  { number: 56, title: "Hiring a taxi", grammar: "Polite destination and request patterns", vocabulary: "Address, route, luggage, fare and receipt" },
  { number: 57, title: "Adverbs of time", grammar: "Position of temporal adverbs in sentences", vocabulary: "heute, morgen, gestern, zuerst, später, manchmal" },
  { number: 58, title: "Telephone conversation", grammar: "Telephone question and clarification patterns", vocabulary: "Calling, connecting, repeating and leaving a message" },
  { number: 59, title: "At the Doctor's", grammar: "Health questions, modal verbs and dative expressions", vocabulary: "Appointment, symptoms, medicine and instructions" },
  { number: 60, title: "Letter Writing: Hotel reservation", grammar: "Formal email structure and polite requests", vocabulary: "Room, dates, price, breakfast and confirmation" },
  { number: 61, title: "Filling in a form", grammar: "Personal-data questions and formal labels", vocabulary: "Name, address, birth date, nationality and signature" },
  { number: 62, title: "The post office", grammar: "Polite service-counter questions", vocabulary: "Letter, parcel, stamp, address, send and collect" },
  { number: 63, title: "The Bank", grammar: "Service questions and möchten constructions", vocabulary: "Account, card, cash, transfer and identification" },
  { number: 64, title: "Looking for an apartment", grammar: "Es gibt, modal verbs and housing descriptions", vocabulary: "Rent, deposit, rooms, furnished and viewing" },
  { number: 65, title: "Buying a train ticket", grammar: "Travel questions, destinations and modal requests", vocabulary: "Ticket, platform, change, departure, arrival and return" },
];

const tag = (arr: RawLesson[], level: GermanLevel): Lesson[] => arr.map((l) => ({ ...l, level }));

// A2 course (Learn German Original) — 50 lessons, grammar-sequenced.
const a2Raw: RawLesson[] = [
  { number: 1, title: "Introducing yourself", grammar: "Extended self-introduction and word-order review at A2 depth", vocabulary: "Origin, work, studies, hobbies and routine" },
  { number: 2, title: "Character Traits", grammar: "Predicative adjectives describing personality", vocabulary: "freundlich, ehrlich, faul, fleißig, geduldig, nervös" },
  { number: 3, title: "Subordinate clauses with \"dass\"", grammar: "dass-clauses with the verb at the end", vocabulary: "Reporting thoughts and opinions (ich denke, dass …)" },
  { number: 4, title: "Subordinate clauses with \"weil\" & \"da\"", grammar: "Causal clauses with weil and da; verb-final", vocabulary: "Giving reasons and explanations" },
  { number: 5, title: "Adjective endings (Nominative case)", grammar: "Adjective declension in the nominative", vocabulary: "Describing people and things" },
  { number: 6, title: "Adjective endings (Accusative case)", grammar: "Adjective declension in the accusative", vocabulary: "Describing direct objects" },
  { number: 7, title: "Adjective endings (Dative case)", grammar: "Adjective declension in the dative", vocabulary: "Describing with dative objects" },
  { number: 8, title: "Subordinate clauses with \"wenn\"", grammar: "Conditional and temporal wenn-clauses", vocabulary: "Conditions, habits and routines" },
  { number: 9, title: "The Genitive case", grammar: "The genitive case and possession", vocabulary: "Possession and of-relationships" },
  { number: 10, title: "Adjective endings (Genitive case)", grammar: "Adjective declension in the genitive", vocabulary: "Formal descriptions" },
  { number: 11, title: "Degrees of Comparison (Part 1)", grammar: "Comparative forms (–er … als)", vocabulary: "Comparing people and things" },
  { number: 12, title: "Degrees of Comparison (Part 2)", grammar: "Superlative forms (am –sten)", vocabulary: "Extremes and preferences" },
  { number: 13, title: "Subordinate clauses with \"obwohl\"", grammar: "Concessive clauses with obwohl", vocabulary: "Contrasts and concessions" },
  { number: 14, title: "\"deshalb\" and \"trotzdem\"", grammar: "Consequence (deshalb) and concession (trotzdem) with inversion", vocabulary: "Cause-and-effect connectors" },
  { number: 15, title: "The Verb \"werden\"", grammar: "werden for the future and change of state", vocabulary: "Plans, predictions and becoming" },
  { number: 16, title: "Indirect Questions", grammar: "Indirect questions with ob and W-words", vocabulary: "Polite, embedded questions" },
  { number: 17, title: "Subordinate clauses with \"während\" and \"bevor\"", grammar: "Temporal clauses with während and bevor", vocabulary: "Sequencing simultaneous and prior events" },
  { number: 18, title: "Relative clauses (Nominative case)", grammar: "Relative pronouns in the nominative", vocabulary: "Defining people and things" },
  { number: 19, title: "Relative clauses (Accusative case)", grammar: "Relative pronouns in the accusative", vocabulary: "Defining objects" },
  { number: 20, title: "Relative clauses (Dative case)", grammar: "Relative pronouns in the dative", vocabulary: "Defining with dative" },
  { number: 21, title: "Relative clauses (Genitive case)", grammar: "Relative pronouns in the genitive (dessen, deren)", vocabulary: "Possessive relations" },
  { number: 22, title: "Relative pronouns \"wer\" and \"was\"", grammar: "Indefinite relative pronouns wer and was", vocabulary: "Generalizing statements" },
  { number: 23, title: "Indefinite Pronouns", grammar: "man, jemand, niemand, etwas, nichts, alle", vocabulary: "Talking in general terms" },
  { number: 24, title: "Preterite (Modal Verbs)", grammar: "Präteritum of the modal verbs", vocabulary: "Past obligations, abilities and wishes" },
  { number: 25, title: "Preterite (Regular Verbs)", grammar: "Präteritum of regular and common verbs", vocabulary: "Written past narration" },
  { number: 26, title: "Preterite (Irregular Verbs)", grammar: "Präteritum of irregular verbs", vocabulary: "Storytelling in the past" },
  { number: 27, title: "Subordinate Clauses with \"als\"", grammar: "Temporal als for single past events", vocabulary: "Narrating past time clauses" },
  { number: 28, title: "How were you as a child?", grammar: "Präteritum in context; narrating the past", vocabulary: "Childhood, school and memories" },
  { number: 29, title: "Where would you prefer to live?", grammar: "Expressing preferences with würde and lieber", vocabulary: "City vs. countryside, housing" },
  { number: 30, title: "Infinitive with \"zu\"", grammar: "Infinitive clauses with zu", vocabulary: "Intentions and plans (versuchen / anfangen zu)" },
  { number: 31, title: "Infinitive without \"zu\"", grammar: "Verbs taking a bare infinitive (modals, gehen, sehen …)", vocabulary: "Everyday activities" },
  { number: 32, title: "Past Perfect Tense", grammar: "Plusquamperfekt for the earlier past", vocabulary: "Events before other past events" },
  { number: 33, title: "Conjunctions – nachdem and seitdem", grammar: "Temporal nachdem and seitdem with tense sequence", vocabulary: "Sequencing past events" },
  { number: 34, title: "Two way prepositions", grammar: "Wechselprä­positionen (accusative vs. dative)", vocabulary: "Location vs. direction" },
  { number: 35, title: "Expressing assumptions", grammar: "Adverbs of probability and assumption (wahrscheinlich, vielleicht)", vocabulary: "Guessing and probability" },
  { number: 36, title: "Polite requests", grammar: "Konjunktiv II (könnten, würden) for politeness", vocabulary: "Requests and service situations" },
  { number: 37, title: "Describing a picture", grammar: "Position and description language", vocabulary: "im Vordergrund, im Hintergrund, links, rechts" },
  { number: 38, title: "Adjectives as nouns", grammar: "Nominalized adjectives (der/die Deutsche, das Beste)", vocabulary: "People groups and qualities" },
  { number: 39, title: "The Passive Voice – Part 1", grammar: "Passive present (werden + Partizip II)", vocabulary: "Describing processes" },
  { number: 40, title: "The Passive Voice – Part 2", grammar: "Passive with modals and in the past", vocabulary: "Processes and instructions" },
  { number: 41, title: "Writing a recipe", grammar: "Imperative, sequencing and passive in instructions", vocabulary: "Cooking, quantities and steps" },
  { number: 42, title: "Giving a suggestion", grammar: "Making suggestions (Sollen wir …?, Wie wäre es mit …?)", vocabulary: "Proposals and leisure" },
  { number: 43, title: "Writing an SMS – exam preparation", grammar: "Informal message structure", vocabulary: "Short messages, apologies and plans" },
  { number: 44, title: "How to express emotions", grammar: "Emotion verbs and prepositions (sich freuen über …)", vocabulary: "Feelings and reactions" },
  { number: 45, title: "Dream Job and career", grammar: "Future and wishes with werden / Konjunktiv II", vocabulary: "Jobs, career and qualifications" },
  { number: 46, title: "Weather Forecast", grammar: "Future with werden and impersonal es", vocabulary: "Weather and forecasts" },
  { number: 47, title: "Semi-formal Letter", grammar: "Semi-formal register and letter structure", vocabulary: "Requests, complaints and enquiries" },
  { number: 48, title: "Talk about your vacation", grammar: "Narrating with Perfekt and Präteritum", vocabulary: "Travel and holidays" },
  { number: 49, title: "Planning something together", grammar: "Making arrangements; subordinate-clause review", vocabulary: "Plans and appointments" },
  { number: 50, title: "10 authentic dialogues", grammar: "Integrated A2 review through real dialogues", vocabulary: "Everyday A2 situations" },
];

// B1 course (Learn German Original) — 27 grammar-focused lessons.
const b1Raw: RawLesson[] = [
  { number: 1, title: "Reflexive Verbs (Part 1)", grammar: "Reflexive verbs with accusative reflexive pronouns", vocabulary: "Daily routine and self-care" },
  { number: 2, title: "Reflexive Verbs (Part 2)", grammar: "Reflexive verbs with dative reflexive pronouns", vocabulary: "Body, grooming and preferences" },
  { number: 3, title: "Reciprocal verbs", grammar: "Reciprocal use of reflexives (each other)", vocabulary: "Relationships and interactions" },
  { number: 4, title: "Noun-Verb Combinations", grammar: "Funktionsverbgefüge (eine Entscheidung treffen …)", vocabulary: "Formal and written expressions" },
  { number: 5, title: "The Verb \"lassen\"", grammar: "lassen: to allow and to have something done", vocabulary: "Services and permissions" },
  { number: 6, title: "Passive sentences with \"sich lassen\"", grammar: "sich lassen as a passive alternative", vocabulary: "Possibility and feasibility" },
  { number: 7, title: "\"lassen\" with Prefixes", grammar: "Separable and inseparable lassen (verlassen, zulassen …)", vocabulary: "Everyday actions" },
  { number: 8, title: "N-Declension (Weak Nouns)", grammar: "n-declension masculine nouns (der Junge → den Jungen)", vocabulary: "People and profession nouns" },
  { number: 9, title: "Genitive Prepositions – während, wegen, trotz", grammar: "Genitive prepositions während, wegen, trotz", vocabulary: "Time, reason and concession" },
  { number: 10, title: "Da-Compounds (Part 1)", grammar: "da(r)- + preposition referring to things", vocabulary: "Referring back to things" },
  { number: 11, title: "Da-Compounds (Part 2)", grammar: "Verb + preposition with da-compounds", vocabulary: "Opinions and reactions" },
  { number: 12, title: "Wo-Compounds", grammar: "wo(r)- + preposition in questions", vocabulary: "Asking about things" },
  { number: 13, title: "indem | dadurch, dass", grammar: "Clauses of means and method (indem, dadurch dass)", vocabulary: "Explaining how something is done" },
  { number: 14, title: "Final Clauses (damit, um…zu)", grammar: "Purpose clauses with damit and um … zu", vocabulary: "Goals and intentions" },
  { number: 15, title: "Final Clauses (ohne zu, ohne…dass)", grammar: "ohne … zu and ohne dass", vocabulary: "Negative manner and circumstances" },
  { number: 16, title: "Final Clauses (anstatt…zu, anstatt…dass)", grammar: "anstatt … zu and anstatt dass", vocabulary: "Alternatives and replacements" },
  { number: 17, title: "nicht/kein/nur (brauchen + zu)", grammar: "brauchen … zu constructions", vocabulary: "Necessity and limits" },
  { number: 18, title: "Genitive Prepositions – aufgrund, anstelle, (an)statt", grammar: "Further genitive prepositions", vocabulary: "Formal writing" },
  { number: 19, title: "Present Participle (Partizip I)", grammar: "Partizip I as an adjective", vocabulary: "Vivid descriptions" },
  { number: 20, title: "Past Participle (Partizip II)", grammar: "Partizip II as an adjective", vocabulary: "States and results" },
  { number: 21, title: "Static passive (Zustandspassiv)", grammar: "sein + Partizip II (Zustandspassiv)", vocabulary: "Resulting states" },
  { number: 22, title: "Subjunctive II", grammar: "Konjunktiv II: forms and uses", vocabulary: "Hypotheticals and politeness" },
  { number: 23, title: "Verb conjugation in Subjunctive II", grammar: "Konjunktiv II conjugation (wäre, hätte, könnte, würde)", vocabulary: "Wishes and advice" },
  { number: 24, title: "Past tense of Subjunctive II", grammar: "Konjunktiv II der Vergangenheit (hätte/wäre + Partizip II)", vocabulary: "Regrets and the hypothetical past" },
  { number: 25, title: "Expressing wishes and dreams", grammar: "Wishes with Konjunktiv II (Ich wünschte …, wenn … nur)", vocabulary: "Dreams and hopes" },
  { number: 26, title: "Writing a semi-formal letter – exam preparation", grammar: "B1 letter structure and register", vocabulary: "Formal correspondence" },
  { number: 27, title: "Express opinion (Goethe Certificate B1)", grammar: "Structuring an opinion with connectors (B1 speaking/writing)", vocabulary: "Arguments and opinions" },
];

export const lessons: Lesson[] = [...tag(a1Raw, "A1"), ...tag(a2Raw, "A2"), ...tag(b1Raw, "B1")];

export type Level = { id: GermanLevel; tag: string; blurb: string; count: number; focus: string };

export const levels: Level[] = [
  { id: "A1", tag: "Beginner", blurb: "Your first words, the present tense, articles and everyday situations.", count: a1Raw.length, focus: "Greetings · numbers · der/die/das · cases · daily life" },
  { id: "A2", tag: "Elementary", blurb: "Subordinate clauses, adjective endings, comparison, the past and the passive.", count: a2Raw.length, focus: "dass / weil / wenn · adjective endings · Präteritum · Passiv" },
  { id: "B1", tag: "Intermediate", blurb: "Reflexive verbs, participles, advanced connectors and the subjunctive.", count: b1Raw.length, focus: "reflexives · da-/wo-compounds · Konjunktiv II · opinions" },
];

export const lessonsForLevel = (level: GermanLevel) => lessons.filter((l) => l.level === level);
export const totalLessons = lessons.length;

export const skills: Skill[] = [
  { id: "grammar", name: "Grammar", tagline: "Build correct sentences from day one." },
  { id: "vocabulary", name: "Vocabulary", tagline: "Learn words with article, plural and context." },
  { id: "listening", name: "Listening", tagline: "Train your ear with real, natural German." },
  { id: "speaking", name: "Speaking", tagline: "Pronounce, shadow and record yourself." },
  { id: "writing", name: "Writing", tagline: "Write short texts and check them instantly." },
  { id: "exam", name: "Exam & practice", tagline: "Reinforce daily and prepare for the A1 exam." },
];

export const resources: Resource[] = [
  // Grammar
  { id: "lgo-a1", name: "Learn German Original A1", description: "65 structured A1 lessons with grammar explanations, vocabulary and worksheets. The backbone of this roadmap.", url: courseBase + "/", skill: "grammar", free: true },
  { id: "dw-hub", name: "DW – Deutsch lernen", description: "Deutsche Welle's free course hub: graded courses, grammar and placement, all levels A1–C.", url: "https://learngerman.dw.com/en/overview", skill: "grammar", free: true },
  { id: "nicos", name: "Nicos Weg A1 (DW)", description: "The official DW beginner course following Nico's story — grammar in real situations.", url: "https://learngerman.dw.com/en/nicos-weg/c-36519789", skill: "grammar", free: true },
  // Vocabulary
  { id: "lgo-vocab", name: "Learn German Original – Vocabulary", description: "Beginner vocabulary by topic, each with its own lesson and worksheet.", url: vocabularyBase + "/", skill: "vocabulary", free: true },
  { id: "dict-cc", name: "dict.cc Dictionary", description: "Fast German–English dictionary that shows gender, plural and example usage.", url: "https://www.dict.cc/", skill: "vocabulary", free: true },
  // Listening
  { id: "easy-german", name: "Easy German", description: "Friendly street interviews with German + English subtitles. Great for the real spoken language.", url: "https://www.youtube.com/@EasyGerman", skill: "listening", free: true },
  { id: "nicos-movie", name: "Nicos Weg A1 – full movie", description: "Watch the whole A1 story in one sitting for immersion.", url: "https://www.youtube.com/watch?v=4-eDoThe6qo", skill: "listening", free: true },
  { id: "nicos-playlist", name: "Nicos Weg A1 – playlist", description: "All beginner episodes in order for short daily listening.", url: "https://www.youtube.com/playlist?list=PLs7zUO7VPyJ5DV1iBRgSw2uDl832n0bLg", skill: "listening", free: true },
  // Speaking
  { id: "youglish", name: "YouGlish German", description: "Hear any German word or phrase pronounced across thousands of real video clips.", url: "https://youglish.com/german", skill: "speaking", free: true },
  { id: "vocaroo", name: "Vocaroo", description: "Record and replay a short speaking attempt instantly — no account needed.", url: "https://vocaroo.com/", skill: "speaking", free: true },
  // Writing
  { id: "languagetool", name: "LanguageTool (German)", description: "Check your German writing for spelling, capitalization and grammar.", url: "https://languagetool.org/spellchecking-german", skill: "writing", free: true },
  // Exam & practice
  { id: "duolingo", name: "Duolingo German", description: "Short daily reinforcement to protect the habit — a supplement, not your main course.", url: "https://www.duolingo.com/course/de/en/Learn-German", skill: "exam", free: true },
  { id: "goethe", name: "Goethe-Institut A1 practice", description: "Official Goethe A1 (Start Deutsch 1) practice materials and a model exam.", url: "https://www.goethe.de/en/spr/kup/prf/prf/gzsd1/ueb.html", skill: "exam", free: true },
];

export const resourcesForSkill = (skill: SkillId) =>
  resources.filter((resource) => resource.skill === skill);
