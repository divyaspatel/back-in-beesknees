import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Lock } from 'lucide-react';
import { getWindowStatus, TIME_WINDOWS } from '../lib/timeUtils';
import FlowerDisplay from './FlowerDisplay';
import PhotoIncentive from './PhotoIncentive';

const ExerciseSet = ({ setKey, exercises, isCompleted, notes: savedNotes, onComplete, photoUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(savedNotes || '');
  const windowStatus = getWindowStatus(setKey);
  const windowInfo = TIME_WINDOWS[setKey];

  const handleComplete = () => {
    if (!notes.trim()) {
      alert("Please add a small note about how you're feeling before completing! ◡̈");
      return;
    }
    onComplete(setKey, notes);
  };

  const getSetColor = () => {
    if (setKey === 'morning') return 'pink';
    if (setKey === 'afternoon') return 'yellow';
    return 'purple';
  };

  // Simplified reps count for flower display in this project
  const flowerCount = exercises.reduce((sum, ex) => sum + (ex.reps * (ex.sets || 1)), 0);

  return (
    <div className={`exercise-set ${isCompleted ? 'completed' : ''}`} style={{ 
      background: 'white', 
      borderRadius: '16px', 
      overflow: 'hidden', 
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      border: isCompleted ? '2px solid #10B981' : '1px solid #FDE68A'
    }}>
      <div 
        className="set-header" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'white' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>{windowInfo.emoji}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#92400E', fontFamily: "'Fredoka', sans-serif" }}>
              {setKey.charAt(0).toUpperCase() + setKey.slice(1)} Set
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
               <Clock size={12} /> {windowInfo.label}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCompleted && <CheckCircle color="#10B981" size={20} />}
          {isOpen ? <ChevronUp size={20} color="#9CA3AF" /> : <ChevronDown size={20} color="#9CA3AF" />}
        </div>
      </div>

      {isOpen && (
        <div className="set-content" style={{ padding: '0 16px 16px', borderTop: '1px solid #F3F4F6' }}>
          {!isCompleted && (
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px' }}>
                How are you feeling? (Required)
              </label>
              <textarea 
                placeholder="e.g., Still sore, but feeling stronger!" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #F3F4F6', fontSize: '0.9rem', minHeight: '80px', fontFamily: 'inherit' }}
              />
            </div>
          )}

          {isCompleted && savedNotes && (
            <div style={{ marginTop: '16px', background: '#FDE68A', padding: '12px', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#92400E', display: 'block', marginBottom: '4px' }}>📋 YOUR NOTE:</span>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400E' }}>"{savedNotes}"</p>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.8rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Exercises</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {exercises.map((ex, i) => (
                <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: '0.9rem', color: isCompleted ? '#9CA3AF' : '#10B981', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                  {ex.name} — {ex.sets} × {ex.reps}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: '16px' }}>
            {!isCompleted ? (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={handleComplete}
                  disabled={windowStatus !== 'active'}
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    background: windowStatus === 'active' ? '#F59E0B' : '#F3F4F6', 
                    color: windowStatus === 'active' ? 'white' : '#9CA3AF',
                    border: 'none', 
                    borderRadius: '12px', 
                    fontWeight: 'bold', 
                    cursor: windowStatus === 'active' ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  title={windowStatus !== 'active' ? "Outside time window" : ""}
                >
                  {windowStatus !== 'active' && <Lock size={16} />}
                  {windowStatus === 'active' ? 'Complete Set' : 'Outside time window'}
                </button>
              </div>
            ) : (
              <div className="reward-section animate-fade-in">
                <FlowerDisplay count={flowerCount} color={getSetColor()} />
                <PhotoIncentive photoUrl={photoUrl} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseSet;
