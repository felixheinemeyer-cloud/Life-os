import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string | null;
  streakDates: string[]; // Array of dates (YYYY-MM-DD) when user maintained streak
  totalCheckIns: number;
}

interface StreakContextType {
  streakData: StreakData;
  recordCheckIn: () => Promise<boolean>; // Returns true if streak was incremented
  isLoading: boolean;
}

const defaultStreakData: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckInDate: null,
  streakDates: [],
  totalCheckIns: 0,
};

const StreakContext = createContext<StreakContextType | undefined>(undefined);

const STORAGE_KEY = '@life_os_streak_data';

// Get current date in Berlin timezone (YYYY-MM-DD format)
const getBerlinDate = (): string => {
  const now = new Date();
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const year = berlinTime.getFullYear();
  const month = String(berlinTime.getMonth() + 1).padStart(2, '0');
  const day = String(berlinTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if two dates are consecutive days
const areConsecutiveDays = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays === 1;
};

export const StreakProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [streakData, setStreakData] = useState<StreakData>(defaultStreakData);
  const [isLoading, setIsLoading] = useState(true);

  // Load streak data from storage
  useEffect(() => {
    const loadStreakData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as StreakData;

          // Check if streak should be reset (missed a day)
          const today = getBerlinDate();
          if (parsed.lastCheckInDate) {
            const lastDate = parsed.lastCheckInDate;
            if (lastDate !== today && !areConsecutiveDays(lastDate, today)) {
              // Streak is broken - reset current streak but keep history
              parsed.currentStreak = 0;
            }
          }

          setStreakData(parsed);
        }
      } catch (error) {
        console.error('Error loading streak data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreakData();
  }, []);

  // Save streak data to storage
  const saveStreakData = async (data: StreakData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving streak data:', error);
    }
  };

  // Record a check-in
  const recordCheckIn = useCallback(async (): Promise<boolean> => {
    const today = getBerlinDate();

    // Check if already checked in today
    if (streakData.lastCheckInDate === today) {
      return false; // Already checked in today
    }

    const isConsecutive = streakData.lastCheckInDate
      ? areConsecutiveDays(streakData.lastCheckInDate, today) || streakData.lastCheckInDate === today
      : true;

    const newStreak = isConsecutive ? streakData.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, streakData.longestStreak);

    const newData: StreakData = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCheckInDate: today,
      streakDates: [...streakData.streakDates, today],
      totalCheckIns: streakData.totalCheckIns + 1,
    };

    setStreakData(newData);
    await saveStreakData(newData);

    return true; // Streak was incremented
  }, [streakData]);

  return (
    <StreakContext.Provider value={{ streakData, recordCheckIn, isLoading }}>
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = (): StreakContextType => {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};
