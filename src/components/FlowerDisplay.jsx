import React from 'react';

const FlowerDisplay = ({ count, color = '#ffb703' }) => {
  const flowerEmoji = color === 'pink' ? '🌸' : color === 'yellow' ? '🌼' : '🪻';
  
  // Limiting the number of displayed flowers for performance and clean look
  const displayCount = Math.min(count, 40);
  const remainingCount = Math.max(0, count - displayCount);

  return (
    <div className="flower-display" style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '4px', 
      marginTop: '10px',
      fontSize: '1.2rem'
    }}>
      {Array.from({ length: displayCount }).map((_, i) => (
        <span key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
          {flowerEmoji}
        </span>
      ))}
      {remainingCount > 0 && (
        <span style={{ fontSize: '0.8rem', color: '#718096', alignSelf: 'center' }}>
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};

export default FlowerDisplay;
