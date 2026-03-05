import { describe, expect, it, vi } from "vitest";
import {
  QUIZ_QUESTIONS,
  scoreQuiz,
  determineType,
  determineCluster,
  getBucketListRecommendations,
  type QuizAnswerMap,
} from "@/lib/quiz/personalityQuiz";

describe("personality quiz", () => {
  it("scores all answered dimensions correctly", () => {
    const answers: QuizAnswerMap = {
      q1: "A", // E
      q2: "A", // N
      q3: "B", // F
      q4: "A", // J
      q5: "B", // N
      q6: "A", // T
    };

    const scores = scoreQuiz(answers);

    expect(scores.E).toBe(1);
    expect(scores.I).toBe(0);
    expect(scores.N).toBe(2);
    expect(scores.S).toBe(0);
    expect(scores.T).toBe(1);
    expect(scores.F).toBe(1);
    expect(scores.J).toBe(1);
    expect(scores.P).toBe(0);
  });

  it("determines personality type in EI-SN-TF-JP order", () => {
    const type = determineType({ E: 2, I: 1, S: 0, N: 2, T: 2, F: 0, J: 0, P: 1 });
    expect(type).toBe("ENTP");
  });

  it("maps known types to clusters", () => {
    expect(determineCluster("ENFP")).toBe("Dreamer");
    expect(determineCluster("INTJ")).toBe("Strategist");
    expect(determineCluster("ISFJ")).toBe("Builder");
    expect(determineCluster("ESTP")).toBe("Explorer");
  });

  it("returns six unique recommendations", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.42);
    const list = getBucketListRecommendations("Dreamer", { count: 6 });
    expect(list).toHaveLength(6);
    expect(new Set(list).size).toBe(6);
    vi.restoreAllMocks();
  });

  it("keeps question set at six entries", () => {
    expect(QUIZ_QUESTIONS).toHaveLength(6);
  });
});
