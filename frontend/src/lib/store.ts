import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ResumeData {
  basics: {
    name: string;
    email: string;
    phone: string;
    location: string;
    title: string;
    summary: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }>;
  skills: string[];
  projects: Array<{
    id: string;
    name: string;
    description: string;
    url?: string;
  }>;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  plan: 'free' | 'pro' | 'enterprise';
  scans: number;
  scans_used_today: number;
  scan_limit: number;
  resume_updated_at: string;
  created_at: string;
}

export interface InterviewState {
  sessionId: string | null;
  messages: Array<{
    role: 'user' | 'ai';
    content: string;
    timestamp: number;
  }>;
  currentQuestion: string | null;
  questionCount: number;
  answers: string[];
  isStreaming: boolean;
  confidenceScore: number | null;
  starRating: string | null;
  suggestedImprovement: string | null;
}

export interface GigOpportunity {
  id: string;
  title: string;
  platform: 'outlier' | 'upwork';
  rate: string;
  url: string;
  skills: string[];
  postedAt: string;
  relevanceScore?: number;
}

interface AppState {
  // User & Auth
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;

  // Resume Data (synced across tabs)
  resume: ResumeData | null;
  setResume: (resume: ResumeData | null) => void;
  updateResume: (updates: Partial<ResumeData>) => void;

  // Interview Session
  interview: InterviewState;
  startInterview: (sessionId: string) => void;
  addInterviewMessage: (role: 'user' | 'ai', content: string) => void;
  setCurrentQuestion: (question: string | null) => void;
  incrementQuestionCount: () => void;
  addAnswer: (answer: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  completeInterview: (score: number, rating: string, improvement: string) => void;
  resetInterview: () => void;

  // Gig Opportunities (Income Radar)
  gigs: GigOpportunity[];
  setGigs: (gigs: GigOpportunity[]) => void;
  addGigs: (gigs: GigOpportunity[]) => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Cross-tab sync trigger
  lastSyncAt: number;
  triggerSync: () => void;
}

const initialInterviewState: InterviewState = {
  sessionId: null,
  messages: [],
  currentQuestion: null,
  questionCount: 0,
  answers: [],
  isStreaming: false,
  confidenceScore: null,
  starRating: null,
  suggestedImprovement: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User & Auth
      user: null,
      setUser: (user) => set({ user }),

      // Resume Data
      resume: null,
      setResume: (resume) => set({ resume, lastSyncAt: Date.now() }),
      updateResume: (updates) => {
        const current = get().resume;
        if (current) {
          set({ resume: { ...current, ...updates }, lastSyncAt: Date.now() });
        }
      },

      // Interview Session
      interview: initialInterviewState,
      startInterview: (sessionId) => set({
        interview: { ...initialInterviewState, sessionId }
      }),
      addInterviewMessage: (role, content) => set((state) => ({
        interview: {
          ...state.interview,
          messages: [...state.interview.messages, { role, content, timestamp: Date.now() }]
        }
      })),
      setCurrentQuestion: (question) => set((state) => ({
        interview: { ...state.interview, currentQuestion: question }
      })),
      incrementQuestionCount: () => set((state) => ({
        interview: { ...state.interview, questionCount: state.interview.questionCount + 1 }
      })),
      addAnswer: (answer) => set((state) => ({
        interview: {
          ...state.interview,
          answers: [...state.interview.answers, answer]
        }
      })),
      setStreaming: (isStreaming) => set((state) => ({
        interview: { ...state.interview, isStreaming }
      })),
      completeInterview: (score, rating, improvement) => set((state) => ({
        interview: {
          ...state.interview,
          confidenceScore: score,
          starRating: rating,
          suggestedImprovement: improvement
        }
      })),
      resetInterview: () => set({ interview: initialInterviewState }),

      // Gig Opportunities
      gigs: [],
      setGigs: (gigs) => set({ gigs }),
      addGigs: (gigs) => set((state) => ({ gigs: [...state.gigs, ...gigs] })),

      // UI State
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Cross-tab sync
      lastSyncAt: 0,
      triggerSync: () => set({ lastSyncAt: Date.now() }),
    }),
    {
      name: 'craftlycv-storage',
      partialize: (state) => ({
        resume: state.resume,
        interview: state.interview,
        user: state.user,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Cross-tab sync via localStorage events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'craftlycv-storage') {
      useAppStore.getState().triggerSync();
    }
  });
}