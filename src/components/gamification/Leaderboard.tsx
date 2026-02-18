
import React from 'react';

interface LeaderboardUser {
  id: string;
  name: string;
  level: number;
  xp: number;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ users }) => {
  // Sort users by XP in descending order
  const sortedUsers = [...users].sort((a, b) => b.xp - a.xp);

  return (
    <div className="w-full p-4 rounded-lg shadow-lg" style={{
      backgroundColor: 'var(--card)', // Glassmorphism background
      border: '1px solid var(--border)', // Glassmorphism border
      backdropFilter: 'blur(10px)', // Glassmorphism blur
    }}>
      <h2 className="text-xl font-bold text-foreground mb-4 text-shadow-md">Leaderboard</h2>
      <div className="space-y-3">
        {sortedUsers.map((user, index) => (
          <div key={user.id} className="flex justify-between items-center py-2 px-3 rounded-md"
               style={{
                 backgroundColor: 'var(--popover)', // Slightly different glass background for items
                 border: '1px solid var(--border)',
               }}>
            <div className="flex items-center space-x-3">
              <span className="font-bold text-primary text-shadow-md">#{index + 1}</span>
              <span className="text-foreground text-shadow-md">{user.name}</span>
            </div>
            <div className="text-sm text-muted-foreground text-shadow-md">
              Level {user.level} - {user.xp} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
