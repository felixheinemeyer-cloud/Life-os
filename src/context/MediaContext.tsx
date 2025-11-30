import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface MediaEntry {
  id: string;
  title: string;
  thumbnail?: string;
  format: 'video' | 'short-video' | 'audio' | 'article' | 'thread' | 'website';
  category: string;
  duration?: string;
  sourceUrl?: string;
  isWatchLater?: boolean;
}

interface MediaContextType {
  entries: MediaEntry[];
  addEntry: (entry: MediaEntry) => void;
  updateEntry: (id: string, updates: Partial<MediaEntry>) => void;
  deleteEntry: (id: string) => void;
}

// Initial mock data
const INITIAL_ENTRIES: MediaEntry[] = [
  { id: '1', title: '5 Morning Habits for Energy', thumbnail: undefined, format: 'video', category: 'health', duration: '8:21', sourceUrl: 'https://youtube.com/watch?v=abc123', isWatchLater: true },
  { id: '2', title: 'Compound Interest Explained', thumbnail: undefined, format: 'short-video', category: 'finance', duration: '0:58', sourceUrl: 'https://tiktok.com/@finance/video/123', isWatchLater: true },
  { id: '3', title: 'Miyazaki on Creativity', thumbnail: undefined, format: 'audio', category: 'design', duration: '42:15', sourceUrl: 'https://open.spotify.com/episode/xyz', isWatchLater: true },
  { id: '4', title: 'Why You Self-Sabotage', thumbnail: undefined, format: 'thread', category: 'psychology', sourceUrl: 'https://twitter.com/psychologist/status/123' },
  { id: '5', title: 'Pierogi Recipe from Krakow', thumbnail: undefined, format: 'article', category: 'cooking', sourceUrl: 'https://medium.com/@chef/pierogi-recipe', isWatchLater: true },
  { id: '6', title: 'The Art of Saying No', thumbnail: undefined, format: 'short-video', category: 'work', duration: '1:12', sourceUrl: 'https://instagram.com/reel/abc' },
  { id: '7', title: 'Chopin Nocturne Tutorial', thumbnail: undefined, format: 'video', category: 'piano', duration: '24:30', sourceUrl: 'https://youtu.be/xyz789', isWatchLater: true },
  { id: '8', title: 'Huberman on Sleep', thumbnail: undefined, format: 'audio', category: 'health', duration: '2:15:00', sourceUrl: 'https://podcasts.apple.com/podcast/huberman', isWatchLater: true },
  { id: '9', title: 'How NATO Actually Works', thumbnail: undefined, format: 'video', category: 'politics', duration: '18:44', sourceUrl: 'https://youtube.com/watch?v=nato' },
  { id: '10', title: 'Japanese Travel Guide 2024', thumbnail: undefined, format: 'website', category: 'travel', isWatchLater: true },
  { id: '11', title: 'Anxious Attachment Deep Dive', thumbnail: undefined, format: 'video', category: 'love', duration: '32:10', sourceUrl: 'https://youtube.com/watch?v=attach' },
  { id: '12', title: 'Polish Cases Simplified', thumbnail: undefined, format: 'article', category: 'polish', sourceUrl: 'https://reddit.com/r/polish/comments/abc', isWatchLater: true },
  { id: '13', title: 'Reframe Your Inner Critic', thumbnail: undefined, format: 'short-video', category: 'mindset', duration: '0:45', sourceUrl: 'https://tiktok.com/@mindset/video/456' },
  { id: '14', title: 'Home Workout No Equipment', thumbnail: undefined, format: 'video', category: 'fitness', duration: '28:00', sourceUrl: 'https://youtube.com/watch?v=workout', isWatchLater: true },
  { id: '15', title: 'Claude vs GPT-4 Comparison', thumbnail: undefined, format: 'thread', category: 'tech', sourceUrl: 'https://x.com/techguy/status/789', isWatchLater: true },
  { id: '16', title: 'Viral Hook Frameworks', thumbnail: undefined, format: 'short-video', category: 'marketing', duration: '0:32', sourceUrl: 'https://instagram.com/reel/marketing' },
  { id: '17', title: 'Breath of Fire Technique', thumbnail: undefined, format: 'video', category: 'meditation', duration: '8:15', sourceUrl: 'https://youtube.com/watch?v=breath' },
  { id: '18', title: 'How to Read a Contract', thumbnail: undefined, format: 'article', category: 'common-knowledge', sourceUrl: 'https://linkedin.com/pulse/contracts' },
  { id: '19', title: 'Second Brain with Notion', thumbnail: undefined, format: 'video', category: 'productivity', duration: '45:22', sourceUrl: 'https://youtube.com/watch?v=notion' },
  { id: '20', title: 'Dzień dobry! Basic Greetings', thumbnail: undefined, format: 'short-video', category: 'polish', duration: '2:10', sourceUrl: 'https://tiktok.com/@polish/video/greet' },
  { id: '21', title: 'Stock Market for Beginners', thumbnail: undefined, format: 'video', category: 'finance', duration: '22:15', sourceUrl: 'https://youtube.com/watch?v=stocks' },
  { id: '22', title: 'Alex Hormozi on Offers', thumbnail: undefined, format: 'audio', category: 'marketing', duration: '1:32:00', sourceUrl: 'https://open.spotify.com/episode/hormozi' },
  { id: '23', title: 'Secure Attachment Habits', thumbnail: undefined, format: 'thread', category: 'love', sourceUrl: 'https://threads.net/@therapist/post/123' },
  { id: '24', title: 'Cold Plunge Protocol', thumbnail: undefined, format: 'short-video', category: 'health', duration: '1:45', sourceUrl: 'https://instagram.com/reel/coldplunge' },
  { id: '25', title: 'Left Hand Independence Piano', thumbnail: undefined, format: 'video', category: 'piano', duration: '15:30', sourceUrl: 'https://youtube.com/watch?v=piano' },
  { id: '26', title: 'Cognitive Biases Cheat Sheet', thumbnail: undefined, format: 'website', category: 'psychology', sourceUrl: 'https://github.com/biases/cheatsheet' },
  { id: '27', title: 'One Pan Salmon Recipe', thumbnail: undefined, format: 'short-video', category: 'cooking', duration: '0:55', sourceUrl: 'https://tiktok.com/@cooking/video/salmon' },
  { id: '28', title: 'Remote Work Best Practices', thumbnail: undefined, format: 'article', category: 'work', sourceUrl: 'https://medium.com/@remote/best-practices' },
  { id: '29', title: 'Figma Auto Layout Mastery', thumbnail: undefined, format: 'video', category: 'design', duration: '34:18', sourceUrl: 'https://youtube.com/watch?v=figma' },
  { id: '30', title: 'EU Elections Explained', thumbnail: undefined, format: 'video', category: 'politics', duration: '12:33', sourceUrl: 'https://youtube.com/watch?v=eu' },
];

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<MediaEntry[]>(INITIAL_ENTRIES);

  const addEntry = (entry: MediaEntry) => {
    setEntries((prev) => [entry, ...prev]); // Add to beginning (newest first)
  };

  const updateEntry = (id: string, updates: Partial<MediaEntry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <MediaContext.Provider value={{ entries, addEntry, updateEntry, deleteEntry }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = (): MediaContextType => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
};
