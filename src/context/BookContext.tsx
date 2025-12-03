import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface ChapterNote {
  id: string;
  title: string;
  notes: string;
  createdAt: string;
}

export interface BookEntry {
  id: string;
  title: string;
  author: string;
  format?: 'physical' | 'ebook' | 'audiobook';  // Optional
  coverUrl?: string;  // Cover image URL from Open Library
  isWatchlist: boolean;  // True = "To Read", False = "Own"
  dateAdded: string;
  notes?: string;
  chapterNotes?: ChapterNote[];  // Chapter-by-chapter notes
  currentPage?: number;  // Bookmark - current reading position
  totalPages?: number;   // Total pages in the book
}

interface BookContextType {
  entries: BookEntry[];
  addEntry: (entry: BookEntry) => void;
  updateEntry: (id: string, updates: Partial<BookEntry>) => void;
  deleteEntry: (id: string) => void;
}

// Initial mock data with Open Library cover URLs (using ISBN for accurate covers)
const INITIAL_ENTRIES: BookEntry[] = [
  {
    id: '1',
    title: 'Atomic Habits',
    author: 'James Clear',
    format: 'physical',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg',
    isWatchlist: false,
    dateAdded: '2024-09-15',
    totalPages: 320,
    currentPage: 142,
    chapterNotes: [
      {
        id: '101',
        title: 'The 1% Rule',
        notes: 'Getting 1% better every day compounds to massive results over time. If you improve by 1% each day for a year, you end up 37 times better. This is why small habits matter so much - they compound into remarkable results.',
        createdAt: '2024-11-28T10:30:00.000Z',
      },
      {
        id: '102',
        title: 'Identity-Based Habits',
        notes: 'The most effective way to change your habits is to focus not on what you want to achieve, but on who you wish to become. Your identity emerges out of your habits. Every action is a vote for the type of person you wish to become. The goal is not to read a book, the goal is to become a reader. The goal is not to run a marathon, the goal is to become a runner.',
        createdAt: '2024-11-25T14:15:00.000Z',
      },
      {
        id: '103',
        title: 'The Four Laws of Behavior Change',
        notes: 'Make it obvious, make it attractive, make it easy, make it satisfying. These four laws are a simple set of rules for creating good habits and breaking bad ones. To break a bad habit, invert the laws: make it invisible, make it unattractive, make it difficult, make it unsatisfying.',
        createdAt: '2024-11-20T09:45:00.000Z',
      },
      {
        id: '104',
        title: 'Environment Design',
        notes: 'Environment is the invisible hand that shapes human behavior. Small changes in context can lead to large changes in behavior over time. Make the cues of good habits obvious in your environment.',
        createdAt: '2024-11-15T16:00:00.000Z',
      },
    ],
  },
  {
    id: '2',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    format: 'ebook',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780857197689-M.jpg',
    isWatchlist: true,
    dateAdded: '2024-10-20',
    totalPages: 256,
  },
  {
    id: '3',
    title: 'Deep Work',
    author: 'Cal Newport',
    format: 'audiobook',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781455586691-M.jpg',
    isWatchlist: false,
    dateAdded: '2024-08-05',
    totalPages: 296,
    currentPage: 296,
  },
  {
    id: '4',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780374533557-M.jpg',
    isWatchlist: true,
    dateAdded: '2024-11-01',
    totalPages: 499,
  },
  {
    id: '5',
    title: 'The Lean Startup',
    author: 'Eric Ries',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780307887894-M.jpg',
    isWatchlist: true,
    dateAdded: '2024-11-15',
    totalPages: 336,
  },
  {
    id: '6',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    format: 'audiobook',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg',
    isWatchlist: false,
    dateAdded: '2024-07-22',
    totalPages: 443,
    currentPage: 215,
  },
  {
    id: '7',
    title: 'The 4-Hour Workweek',
    author: 'Tim Ferriss',
    format: 'physical',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780307465351-M.jpg',
    isWatchlist: true,
    dateAdded: '2024-11-28',
    totalPages: 308,
  },
  {
    id: '8',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    format: 'ebook',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780140449334-M.jpg',
    isWatchlist: false,
    dateAdded: '2024-06-10',
    totalPages: 256,
    currentPage: 256,
  },
];

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<BookEntry[]>(INITIAL_ENTRIES);

  const addEntry = (entry: BookEntry) => {
    setEntries((prev) => [entry, ...prev]); // Add to beginning (newest first)
  };

  const updateEntry = (id: string, updates: Partial<BookEntry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <BookContext.Provider value={{ entries, addEntry, updateEntry, deleteEntry }}>
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = (): BookContextType => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
};
