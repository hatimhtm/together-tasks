
import React from 'react';

interface XPBarProps {
  currentXp: number;
  maxXp: number;
  level: number;
}

const XPBar: React.FC<XPBarProps> = ({ currentXp, maxXp, level }) => {
  const progress = (currentXp / maxXp) * 100;

  return (
    <div className="w-full p-4 rounded-lg shadow-lg" style={{
      backgroundColor: 'var(--card)', // Glassmorphism background
      border: '1px solid var(--border)', // Glassmorphism border
      backdropFilter: 'blur(10px)', // Glassmorphism blur
    }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground text-shadow-md">Level {level}</span>
        <span className="text-sm font-medium text-foreground text-shadow-md">{currentXp} / {maxXp} XP</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default XPBar;
