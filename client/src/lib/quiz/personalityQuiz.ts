export type Dimension = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";
export type DimensionPair = "EI" | "SN" | "TF" | "JP";
export type Cluster = "Explorer" | "Dreamer" | "Strategist" | "Builder";

export type PersonalityType =
  | "ESTP" | "ESFP" | "ISTP" | "ISFP"
  | "ENFP" | "INFP" | "INFJ" | "ENFJ"
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ";

export type QuizAnswerOption = {
  key: "A" | "B";
  label: string;
  scoreFor: Dimension;
};

export type QuizQuestion = {
  id: string;
  text: string;
  dimensionPair: DimensionPair;
  answers: [QuizAnswerOption, QuizAnswerOption];
};

export type QuizAnswerMap = Record<string, "A" | "B">;
export type QuizScore = Record<Dimension, number>;
export type QuizGoalSuggestion = {
  title: string;
  category: string;
};

export type QuizResult = {
  personality_type: PersonalityType;
  cluster: Cluster;
  description: string;
  bucket_list: QuizGoalSuggestion[];
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "How do you prefer to spend a free weekend?",
    dimensionPair: "EI",
    answers: [
      { key: "A", label: "Meeting people and exploring a city", scoreFor: "E" },
      { key: "B", label: "Quiet time or a small group adventure", scoreFor: "I" },
    ],
  },
  {
    id: "q2",
    text: "What excites you more?",
    dimensionPair: "SN",
    answers: [
      { key: "A", label: "Deep ideas, philosophy, creativity", scoreFor: "N" },
      { key: "B", label: "Physical experiences and real-world activities", scoreFor: "S" },
    ],
  },
  {
    id: "q3",
    text: "Which goal sounds better?",
    dimensionPair: "TF",
    answers: [
      { key: "A", label: "Achieving something impressive", scoreFor: "T" },
      { key: "B", label: "Creating meaningful memories", scoreFor: "F" },
    ],
  },
  {
    id: "q4",
    text: "How do you travel?",
    dimensionPair: "JP",
    answers: [
      { key: "A", label: "Structured itinerary", scoreFor: "J" },
      { key: "B", label: "Go with the flow", scoreFor: "P" },
    ],
  },
  {
    id: "q5",
    text: "Which sounds more appealing?",
    dimensionPair: "SN",
    answers: [
      { key: "A", label: "Extreme adventure", scoreFor: "S" },
      { key: "B", label: "Cultural exploration", scoreFor: "N" },
    ],
  },
  {
    id: "q6",
    text: "What motivates you most?",
    dimensionPair: "TF",
    answers: [
      { key: "A", label: "Personal achievement", scoreFor: "T" },
      { key: "B", label: "Helping or connecting with others", scoreFor: "F" },
    ],
  },
];

const CLUSTER_TYPES: Record<Cluster, PersonalityType[]> = {
  Explorer: ["ESTP", "ESFP", "ISTP", "ISFP"],
  Dreamer: ["ENFP", "INFP", "INFJ", "ENFJ"],
  Strategist: ["INTJ", "INTP", "ENTJ", "ENTP"],
  Builder: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
};

const CLUSTER_DESCRIPTIONS: Record<Cluster, string> = {
  Explorer: "You thrive on action, discovery, and hands-on challenges that push your limits.",
  Dreamer: "You seek meaning, creativity, and experiences that shape your story.",
  Strategist: "You are driven by mastery, ambition, and big goals with measurable impact.",
  Builder: "You value structure, legacy, and creating dependable experiences for people around you.",
};

const CLUSTER_BUCKET_LISTS: Record<Cluster, QuizGoalSuggestion[]> = {
  Explorer: [
    { title: "Skydive", category: "Adventure" },
    { title: "Scuba dive with sharks", category: "Adventure" },
    { title: "Backpack South America", category: "Travel" },
    { title: "Learn to surf", category: "Skills" },
    { title: "Climb a volcano", category: "Adventure" },
    { title: "Explore a cave", category: "Adventure" },
    { title: "Drive a dune buggy in the desert", category: "Adventure" },
    { title: "Try white-water rafting", category: "Adventure" },
    { title: "Go paragliding", category: "Adventure" },
    { title: "Hike an active glacier", category: "Adventure" },
  ],
  Dreamer: [
    { title: "See the Northern Lights", category: "Travel" },
    { title: "Volunteer abroad", category: "Service" },
    { title: "Write a book", category: "Creative" },
    { title: "Learn a language", category: "Learning" },
    { title: "Attend a cultural festival", category: "Travel" },
    { title: "Live abroad for a month", category: "Travel" },
    { title: "Keep a year-long travel journal", category: "Creative" },
    { title: "Take a photography storytelling trip", category: "Creative" },
    { title: "Spend a month studying art history", category: "Learning" },
    { title: "Visit a UNESCO heritage site", category: "Travel" },
  ],
  Strategist: [
    { title: "Launch a startup", category: "Career" },
    { title: "Publish a book", category: "Creative" },
    { title: "Visit all 7 continents", category: "Travel" },
    { title: "Give a conference talk", category: "Career" },
    { title: "Build a major side project", category: "Skills" },
    { title: "Climb a major mountain", category: "Adventure" },
    { title: "Complete an executive leadership course", category: "Learning" },
    { title: "Run a marathon under a target time", category: "Fitness" },
    { title: "Build a profitable online business", category: "Career" },
    { title: "Mentor 10 aspiring professionals", category: "Service" },
  ],
  Builder: [
    { title: "Cross-country road trip", category: "Travel" },
    { title: "Build a dream home", category: "Personal" },
    { title: "Visit world landmarks", category: "Travel" },
    { title: "Host a large family celebration", category: "Personal" },
    { title: "Create a family tradition", category: "Personal" },
    { title: "Start a community project", category: "Service" },
    { title: "Plant and grow a backyard garden", category: "Personal" },
    { title: "Document your family history", category: "Personal" },
    { title: "Organize an annual neighborhood event", category: "Service" },
    { title: "Renovate a meaningful space", category: "Personal" },
  ],
};

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function scoreQuiz(answers: QuizAnswerMap): QuizScore {
  const scores: QuizScore = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  for (const question of QUIZ_QUESTIONS) {
    const answerKey = answers[question.id];
    if (!answerKey) continue;
    const selected = question.answers.find((answer) => answer.key === answerKey);
    if (!selected) continue;
    scores[selected.scoreFor] += 1;
  }

  return scores;
}

export function determineType(scores: QuizScore): PersonalityType {
  const type = [
    scores.E >= scores.I ? "E" : "I",
    scores.S >= scores.N ? "S" : "N",
    scores.T >= scores.F ? "T" : "F",
    scores.J >= scores.P ? "J" : "P",
  ].join("") as PersonalityType;

  return type;
}

export function determineCluster(type: PersonalityType): Cluster {
  const clusterEntry = Object.entries(CLUSTER_TYPES).find(([, types]) => types.includes(type));
  return (clusterEntry?.[0] as Cluster | undefined) ?? "Builder";
}

export function getBucketListRecommendations(
  cluster: Cluster,
  options?: { count?: number; diversify?: boolean }
): QuizGoalSuggestion[] {
  const count = options?.count ?? 6;
  const basePool = CLUSTER_BUCKET_LISTS[cluster] ?? [];
  const chosen = new Map(
    shuffle(basePool)
      .slice(0, Math.min(count, basePool.length))
      .map((goal) => [goal.title, goal])
  );

  if (options?.diversify && chosen.size > 0) {
    const otherClusters = (Object.keys(CLUSTER_BUCKET_LISTS) as Cluster[]).filter((name) => name !== cluster);
    const donorCluster = otherClusters[Math.floor(Math.random() * otherClusters.length)] ?? null;
    if (donorCluster) {
      const donorPool = shuffle(CLUSTER_BUCKET_LISTS[donorCluster]);
      const donorItem = donorPool.find((item) => !chosen.has(item.title));
      if (donorItem) {
        const current = Array.from(chosen.values());
        current.pop();
        const next = new Map<string, QuizGoalSuggestion>();
        for (const entry of current) next.set(entry.title, entry);
        next.set(donorItem.title, donorItem);
        return Array.from(next.values()).slice(0, count);
      }
    }
  }

  return Array.from(chosen.values()).slice(0, count);
}

export function buildQuizResult(answers: QuizAnswerMap, options?: { diversify?: boolean }): QuizResult {
  const scores = scoreQuiz(answers);
  const personality_type = determineType(scores);
  const cluster = determineCluster(personality_type);
  return {
    personality_type,
    cluster,
    description: CLUSTER_DESCRIPTIONS[cluster],
    bucket_list: getBucketListRecommendations(cluster, { count: 6, diversify: options?.diversify }),
  };
}
