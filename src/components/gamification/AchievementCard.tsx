
import React from 'react';

interface AchievementCardProps {
  title: string;
  description: string;
  icon: string; // This could be a path to an image or a class name for an icon font
  achieved?: boolean; // Optional prop to indicate if the achievement is unlocked
}

const AchievementCard: React.FC<AchievementCardProps> = ({ title, description, icon, achieved = false }) => {
  return (
    <div
      className={`p-4 rounded-lg shadow-lg flex items-center space-x-4 ${achieved ? 'opacity-100' : 'opacity-60 grayscale'}`}
      style={{
        backgroundColor: 'var(--card)', // Glassmorphism background
        border: '1px solid var(--border)', // Glassmorphism border
        backdropFilter: 'blur(10px)', // Glassmorphism blur
      }}
    >
      <div className="flex-shrink-0 text-primary" style={{ fontSize: '2.5rem' }}>
        {/* For now, a simple text icon. In a real app, this would be an actual icon component or img */}
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1 text-shadow-md">{title}</h3>
        <p className="text-sm text-muted-foreground text-shadow-md">{description}</p>
      </div>
    </div>
  );
};

export default AchievementCard;
