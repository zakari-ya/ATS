import type { AiCvMatchResponse } from "@/types/ai";

export const validAiCvMatchResponseFixture: AiCvMatchResponse = {
  input_quality: {
    cv_text_quality: "good",
    job_description_quality: "good",
    analysis_reliability: "high",
    warnings: [],
  },
  job_profile: {
    role_title: "Full Stack Developer",
    seniority: "junior",
    required_skills: [
      {
        name: "React",
        category: "frontend",
        priority: "required",
        evidence: "Build user interfaces with React.",
      },
    ],
    preferred_skills: [
      {
        name: "Docker",
        category: "devops",
        priority: "preferred",
        evidence: "Docker experience is a plus.",
      },
    ],
    responsibilities: ["Build frontend interfaces and backend APIs."],
    experience_requirements: {
      minimum_years: 1,
      level: "junior",
      evidence: "1+ year of full-stack experience.",
    },
  },
  cv_profile: {
    detected_role: "Full Stack Developer",
    skills: [
      {
        name: "React",
        category: "frontend",
        evidence: "Built a React dashboard.",
      },
    ],
    projects: [
      {
        name: "Candidate tracking dashboard",
        relevant_skills: ["React", "Node.js"],
        evidence: "Created a dashboard using React and API routes.",
      },
    ],
    experience_summary: {
      estimated_level: "junior",
      evidence: "Project-based full-stack work is visible.",
    },
  },
  match_matrix: [
    {
      requirement: "React",
      priority: "required",
      category: "frontend",
      match_status: "exact_match",
      match_strength: 1,
      confidence: 0.95,
      job_evidence: "Build user interfaces with React.",
      cv_evidence: "Built a React dashboard.",
      reason: "The CV directly mentions React project work.",
    },
    {
      requirement: "Docker",
      priority: "preferred",
      category: "devops",
      match_status: "missing",
      match_strength: 0,
      confidence: 0.8,
      job_evidence: "Docker experience is a plus.",
      cv_evidence: null,
      reason: "Docker is requested but not visible in the CV text.",
    },
  ],
  feedback_inputs: {
    strong_points: ["The CV shows React project evidence."],
    missing_required_items: [],
    missing_preferred_items: ["Docker is not visible in the CV."],
    weak_points: ["DevOps tooling is not clearly shown."],
    recommended_cv_improvements: [
      "Add a truthful Docker project detail if you have used it.",
    ],
  },
};

export const invalidAiCvMatchResponseFixtures = {
  missingTopLevelKey: {
    ...validAiCvMatchResponseFixture,
    input_quality: undefined,
  },
  invalidMatchStatus: {
    ...validAiCvMatchResponseFixture,
    match_matrix: [
      {
        ...validAiCvMatchResponseFixture.match_matrix[0],
        match_status: "strong_match",
      },
    ],
  },
  confidenceTooHigh: {
    ...validAiCvMatchResponseFixture,
    match_matrix: [
      {
        ...validAiCvMatchResponseFixture.match_matrix[0],
        confidence: 1.2,
      },
    ],
  },
  exactMatchWithoutCvEvidence: {
    ...validAiCvMatchResponseFixture,
    match_matrix: [
      {
        ...validAiCvMatchResponseFixture.match_matrix[0],
        cv_evidence: "",
      },
    ],
  },
  missingWithCvEvidence: {
    ...validAiCvMatchResponseFixture,
    match_matrix: [
      {
        ...validAiCvMatchResponseFixture.match_matrix[1],
        cv_evidence: "Docker is listed in a project.",
      },
    ],
  },
  mismatchedMatchStrength: {
    ...validAiCvMatchResponseFixture,
    match_matrix: [
      {
        ...validAiCvMatchResponseFixture.match_matrix[0],
        match_strength: 0.85,
      },
    ],
  },
  restrictedFeedbackLanguage: {
    ...validAiCvMatchResponseFixture,
    feedback_inputs: {
      ...validAiCvMatchResponseFixture.feedback_inputs,
      strong_points: ["This CV would be accepted."],
    },
  },
} as const;
