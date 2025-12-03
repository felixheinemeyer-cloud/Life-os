import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface MediaNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface MediaEntry {
  id: string;
  title: string;
  thumbnail?: string;
  format: 'video' | 'short-video' | 'audio' | 'article' | 'thread' | 'website';
  category: string;
  duration?: string;
  sourceUrl?: string;
  isWatchLater?: boolean;
  notes?: string; // Legacy single note
  mediaNotes?: MediaNote[]; // New multiple notes array
  isCompleted?: boolean;
}

interface MediaContextType {
  entries: MediaEntry[];
  addEntry: (entry: MediaEntry) => void;
  updateEntry: (id: string, updates: Partial<MediaEntry>) => void;
  deleteEntry: (id: string) => void;
}

// Initial mock data - Using real YouTube video IDs for thumbnail support
const INITIAL_ENTRIES: MediaEntry[] = [
  { id: '1', title: 'My 5AM Morning Routine', thumbnail: undefined, format: 'video', category: 'health', duration: '12:34', sourceUrl: 'https://youtube.com/watch?v=MEc7JR44b9k', isWatchLater: true },
  { id: '2', title: 'Compound Interest Explained', thumbnail: undefined, format: 'short-video', category: 'finance', duration: '0:58', sourceUrl: 'https://tiktok.com/@finance/video/123', isWatchLater: true },
  { id: '3', title: 'Miyazaki on Creativity', thumbnail: undefined, format: 'audio', category: 'design', duration: '42:15', sourceUrl: 'https://open.spotify.com/episode/xyz', isWatchLater: true },
  { id: '4', title: 'Why You Self-Sabotage', thumbnail: undefined, format: 'thread', category: 'psychology', sourceUrl: 'https://twitter.com/psychologist/status/123' },
  { id: '5', title: 'Pierogi Recipe from Krakow', thumbnail: undefined, format: 'article', category: 'cooking', sourceUrl: 'https://medium.com/@chef/pierogi-recipe', isWatchLater: true },
  { id: '6', title: 'The Art of Saying No', thumbnail: undefined, format: 'short-video', category: 'work', duration: '1:12', sourceUrl: 'https://youtube.com/shorts/ZXsQAXx_ao0' },
  { id: '7', title: 'Chopin Nocturne Op.9 No.2', thumbnail: undefined, format: 'video', category: 'piano', duration: '4:33', sourceUrl: 'https://youtube.com/watch?v=9E6b3swbnWg', isWatchLater: true },
  { id: '8', title: 'Huberman on Sleep', thumbnail: undefined, format: 'audio', category: 'health', duration: '2:15:00', sourceUrl: 'https://podcasts.apple.com/podcast/huberman', isWatchLater: true },
  { id: '9', title: 'How The EU Works', thumbnail: undefined, format: 'video', category: 'politics', duration: '18:44', sourceUrl: 'https://youtube.com/watch?v=9eufLQ3sew0' },
  { id: '10', title: 'Japanese Travel Guide 2024', thumbnail: undefined, format: 'website', category: 'travel', isWatchLater: true },
  { id: '11', title: 'Attachment Styles Explained', thumbnail: undefined, format: 'video', category: 'love', duration: '14:28', sourceUrl: 'https://youtube.com/watch?v=2s9ACDMcpjA' },
  { id: '12', title: 'Polish Cases Simplified', thumbnail: undefined, format: 'article', category: 'polish', sourceUrl: 'https://reddit.com/r/polish/comments/abc', isWatchLater: true },
  { id: '13', title: 'Reframe Your Inner Critic', thumbnail: undefined, format: 'short-video', category: 'mindset', duration: '0:45', sourceUrl: 'https://tiktok.com/@mindset/video/456' },
  { id: '14', title: '30 Min Full Body Workout', thumbnail: undefined, format: 'video', category: 'fitness', duration: '32:14', sourceUrl: 'https://youtube.com/watch?v=gC_L9qAHVJ8', isWatchLater: true },
  { id: '15', title: 'Claude vs GPT-4 Comparison', thumbnail: undefined, format: 'thread', category: 'tech', sourceUrl: 'https://x.com/techguy/status/789', isWatchLater: true },
  { id: '16', title: 'Viral Hook Frameworks', thumbnail: undefined, format: 'short-video', category: 'marketing', duration: '0:32', sourceUrl: 'https://instagram.com/reel/marketing' },
  { id: '17', title: 'Guided Morning Meditation', thumbnail: undefined, format: 'video', category: 'meditation', duration: '10:00', sourceUrl: 'https://youtube.com/watch?v=inpok4MKVLM' },
  { id: '18', title: 'How to Read a Contract', thumbnail: undefined, format: 'article', category: 'common-knowledge', sourceUrl: 'https://linkedin.com/pulse/contracts' },
  { id: '19', title: 'Building a Second Brain', thumbnail: undefined, format: 'video', category: 'productivity', duration: '18:12', sourceUrl: 'https://youtube.com/watch?v=OP3dA2GcAh8' },
  { id: '20', title: 'Dzień dobry! Basic Greetings', thumbnail: undefined, format: 'short-video', category: 'polish', duration: '2:10', sourceUrl: 'https://tiktok.com/@polish/video/greet' },
  { id: '21', title: 'Stock Market For Beginners', thumbnail: undefined, format: 'video', category: 'finance', duration: '22:15', sourceUrl: 'https://youtube.com/watch?v=ZCFkWDdmXG8' },
  { id: '22', title: 'Alex Hormozi on Offers', thumbnail: undefined, format: 'audio', category: 'marketing', duration: '1:32:00', sourceUrl: 'https://open.spotify.com/episode/hormozi' },
  { id: '23', title: 'Secure Attachment Habits', thumbnail: undefined, format: 'thread', category: 'love', sourceUrl: 'https://threads.net/@therapist/post/123' },
  { id: '24', title: 'Cold Plunge Protocol', thumbnail: undefined, format: 'short-video', category: 'health', duration: '1:45', sourceUrl: 'https://instagram.com/reel/coldplunge' },
  { id: '25', title: 'Piano Hand Independence', thumbnail: undefined, format: 'video', category: 'piano', duration: '11:45', sourceUrl: 'https://youtube.com/watch?v=6BYS19_NsG4' },
  { id: '26', title: 'Cognitive Biases Cheat Sheet', thumbnail: undefined, format: 'website', category: 'psychology', sourceUrl: 'https://github.com/biases/cheatsheet' },
  { id: '27', title: 'One Pan Salmon Recipe', thumbnail: undefined, format: 'short-video', category: 'cooking', duration: '0:55', sourceUrl: 'https://tiktok.com/@cooking/video/salmon' },
  { id: '28', title: 'Remote Work Best Practices', thumbnail: undefined, format: 'article', category: 'work', sourceUrl: 'https://medium.com/@remote/best-practices' },
  { id: '29', title: 'Figma Auto Layout Guide', thumbnail: undefined, format: 'video', category: 'design', duration: '16:48', sourceUrl: 'https://youtube.com/watch?v=TyaGpGDFczw' },
  { id: '30', title: 'How Does The EU Work?', thumbnail: undefined, format: 'video', category: 'politics', duration: '8:15', sourceUrl: 'https://youtube.com/watch?v=O37yJBFRrfg' },
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
