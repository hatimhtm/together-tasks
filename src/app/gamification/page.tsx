
import React, { useState, useEffect, useMemo } from 'react';
import XPBar from '@/components/Gamification/XPBar';
import AchievementCard from '@/components/Gamification/AchievementCard';
import Leaderboard from '@/components/Gamification/Leaderboard';

// Define interfaces for API responses
interface UserGamificationStats {
  xp: number;
  level: number;
  current_streak: number;
  highest_streak: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface UserAchievement {
  achievement_id: string;
  achieved_at: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
  level: number;
  xp: number;
}

const GamificationPage: React.FC = () => {
  const [userStats, setUserStats] = useState<UserGamificationStats | null>(null);
  const [loadingUserStats, setLoadingUserStats] = useState<boolean>(true);
  const [errorUserStats, setErrorUserStats] = useState<string | null>(null);

  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState<boolean>(true);
  const [errorAchievements, setErrorAchievements] = useState<string | null>(null);

  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(true);
  const [errorLeaderboard, setErrorLeaderboard] = useState<string | null>(null);

  // Memoize achieved achievement IDs for O(1) lookup
  const achievedSet = useMemo(() => {
    return new Set(userAchievements.map(ua => ua.achievement_id));
  }, [userAchievements]);

  // Function to calculate max XP for a given level
  const calculateMaxXp = (level: number): number => {
    // Simple exponential growth model for now.
    // This could be refined based on game design requirements or backend logic.
    return (level * 100) + 500;
  };

  // Fetch User Gamification Stats
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await fetch('/api/user/gamification-stats');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: UserGamificationStats = await response.json();
        setUserStats(data);
      } catch (error: any) {
        setErrorUserStats(error.message);
      } finally {
        setLoadingUserStats(false);
      }
    };
    fetchUserStats();
  }, []);

  // Fetch Achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const [allResponse, userResponse] = await Promise.all([
          fetch('/api/achievements'),
          fetch('/api/user/achievements'),
        ]);

        if (!allResponse.ok) throw new Error(`HTTP error! All achievements status: ${allResponse.status}`);
        if (!userResponse.ok) throw new Error(`HTTP error! User achievements status: ${userResponse.status}`);

        const allData: Achievement[] = await allResponse.json();
        const userData: UserAchievement[] = await userResponse.json();

        setAllAchievements(allData);
        setUserAchievements(userData);

      } catch (error: any) {
        setErrorAchievements(error.message);
      } finally {
        setLoadingAchievements(false);
      }
    };
    fetchAchievements();
  }, []);

  // Fetch Leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: LeaderboardUser[] = await response.json();
        setLeaderboardUsers(data);
      } catch (error: any) {
        setErrorLeaderboard(error.message);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, []);


  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Gamification & Motivation</h1>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Your Progress</h2>
        {loadingUserStats && <p className="text-muted-foreground">Loading your stats...</p>}
        {errorUserStats && <p className="text-destructive">Error: {errorUserStats}</p>}
        {userStats && (
          <XPBar
            currentXp={userStats.xp}
            maxXp={calculateMaxXp(userStats.level)}
            level={userStats.level}
          />
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Achievements</h2>
        {loadingAchievements && <p className="text-muted-foreground">Loading achievements...</p>}
        {errorAchievements && <p className="text-destructive">Error: {errorAchievements}</p>}
        {!loadingAchievements && !errorAchievements && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                title={achievement.title}
                description={achievement.description}
                icon={achievement.icon}
                achieved={achievedSet.has(achievement.id)}
              />
            ))}
            {allAchievements.length === 0 && <p className="text-muted-foreground">No achievements found.</p>}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Leaderboard</h2>
        {loadingLeaderboard && <p className="text-muted-foreground">Loading leaderboard...</p>}
        {errorLeaderboard && <p className="text-destructive">Error: {errorLeaderboard}</p>}
        {!loadingLeaderboard && !errorLeaderboard && leaderboardUsers.length > 0 && (
          <Leaderboard users={leaderboardUsers} />
        )}
        {!loadingLeaderboard && !errorLeaderboard && leaderboardUsers.length === 0 && (
          <p className="text-muted-foreground">No leaderboard data available.</p>
        )}
      </section>
    </div>
  );
};

export default GamificationPage;
