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

export type QuizResult = {
  personality_type: PersonalityType;
  cluster: Cluster;
  description: string;
  bucket_list: string[];
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

const CLUSTER_BUCKET_LISTS: Record<Cluster, string[]> = {
  Explorer: [
    "Skydive",
    "Scuba dive with sharks",
    "Backpack South America",
    "Learn to surf",
    "Climb a volcano",
    "Explore a cave",
    "Drive a dune buggy in the desert",
    "Try white-water rafting",
    "Go paragliding",
    "Hike an active glacier",
  ],
  Dreamer: [
    "See the Northern Lights",
    "Volunteer abroad",
    "Write a book",
    "Learn a language",
    "Attend a cultural festival",
    "Live abroad for a month",
    "Keep a year-long travel journal",
    "Take a photography storytelling trip",
    "Spend a month studying art history",
    "Visit a UNESCO heritage site",
  ],
  Strategist: [
    "Launch a startup",
    "Publish a book",
    "Visit all 7 continents",
    "Give a conference talk",
    "Build a major side project",
    "Climb a major mountain",
    "Complete an executive leadership course",
    "Run a marathon under a target time",
    "Build a profitable online business",
    "Mentor 10 aspiring professionals",
  ],
  Builder: [
    "Cross-country road trip",
    "Build a dream home",
    "Visit world landmarks",
    "Host a large family celebration",
    "Create a family tradition",
    "Start a community project",
    "Plant and grow a backyard garden",
    "Document your family history",
    "Organize an annual neighborhood event",
    "Renovate a meaningful space",
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
): string[] {
  const count = options?.count ?? 6;
  const basePool = CLUSTER_BUCKET_LISTS[cluster] ?? [];
  const chosen = new Set(shuffle(basePool).slice(0, Math.min(count, basePool.length)));

  if (options?.diversify && chosen.size > 0) {
    const otherClusters = (Object.keys(CLUSTER_BUCKET_LISTS) as Cluster[]).filter((name) => name !== cluster);
    const donorCluster = otherClusters[Math.floor(Math.random() * otherClusters.length)] ?? null;
    if (donorCluster) {
      const donorPool = shuffle(CLUSTER_BUCKET_LISTS[donorCluster]);
      const donorItem = donorPool.find((item) => !chosen.has(item));
      if (donorItem) {
        const current = Array.from(chosen);
        current.pop();
        chosen.clear();
        for (const entry of current) chosen.add(entry);
        chosen.add(donorItem);
      }
    }
  }

  return Array.from(chosen).slice(0, count);
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
