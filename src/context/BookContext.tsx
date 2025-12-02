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

// Initial mock data with Open Library cover URLs (using cover IDs for reliability)
const INITIAL_ENTRIES: BookEntry[] = [
  {
    id: '1',
    title: 'Atomic Habits',
    author: 'James Clear',
    format: 'physical',
    coverUrl: 'https://covers.openlibrary.org/b/id/8479576-M.jpg',
    isWatchlist: false,
    dateAdded: '2024-09-15',
    totalPages: 320,
    currentPage: 142,
  },
  {
    id: '2',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    format: 'ebook',
    coverUrl: 'https://covers.openlibrary.org/b/id/10540174-M.jpg',
    isWatchlist: true,
    dateAdded: '2024-10-20',
    totalPages: 256,
  },
  {
    id: '3',
    title: 'Deep Work',
    author: 'Cal Newport',
    format: 'audiobook',
    coverUrl: 'https://covers.openlibrary.org/b/id/8114032-M.jpg',
    isWatchlist: false,
    dateAdded: '2024-08-05',
    totalPages: 296,
    currentPage: 296,
  },
  {
    id: '4',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    coverUrl: 'https://covers.openlibrary.org/b/id/6771355-M.jpg',
    isWatchlist: true,
    dateAdded: '2024-11-01',
    totalPages: 499,
  },
  {
    id: '5',
    title: 'The Lean Startup',
    author: 'Eric Ries',
    coverUrl: 'https://covers.openlibrary.org/b/id/8313220-M.jpg',
    isWatchlist: true,
    dateAdded: '2024-11-15',
    totalPages: 336,
  },
  {
    id: '6',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    format: 'audiobook',
    coverUrl: 'https://covers.openlibrary.org/b/id/7894380-M.jpg',
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
    coverUrl: 'https://covers.openlibrary.org/b/id/8553846-M.jpg',
    isWatchlist: true,
    dateAdded: '2024-11-28',
    totalPages: 308,
  },
  {
    id: '8',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    format: 'ebook',
    coverUrl: 'https://covers.openlibrary.org/b/id/8251773-M.jpg',
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
