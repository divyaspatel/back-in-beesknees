import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Lock, RotateCcw } from 'lucide-react';
import { getWindowStatus, TIME_WINDOWS } from '../lib/timeUtils';
import PhotoIncentive from './PhotoIncentive';

const ExerciseSet = ({ setKey, exercises, isCompleted, notes: savedNotes, onComplete, onUndo, photoUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(savedNotes || '');
  const windowStatus = getWindowStatus(setKey);
  const windowInfo = TIME_WINDOWS[setKey];

  // Sync internal notes with prop if it changes (e.g., from undo)
  useEffect(() => {
    if (savedNotes !== undefined) setNotes(savedNotes);
  }, [savedNotes]);

  const handleComplete = () => {
    if (!notes.trim()) {
      alert("Please add a small note about how you're feeling before completing! ◡̈");
      return;
    }
    onComplete(setKey, notes);
  };

  const handleUndo = () => {
    if (confirm("Move this set back to 'not done'? The flowers will be removed from your garden, but your note will stay.")) {
      onUndo(setKey);
    }
  };

  return (
    <div className={`exercise-set ${isCompleted ? 'completed' : ''}`} style={{ 
      background: 'white', 
      borderRadius: '16px', 
      border: `2px solid ${isCompleted ? '#FDE68A' : '#F3F4F6'}`,
      padding: '16px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
      transition: 'all 0.3s ease',
      marginBottom: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            background: isCompleted ? '#FEF3C7' : '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem'
          }}>
            {windowInfo.emoji}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#92400E', fontFamily: "'Fredoka', sans-serif" }}>
              {setKey.charAt(0).toUpperCase() + setKey.slice(1)} Set
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#9CA3AF' }}>
              <Clock size={12} /> {windowInfo.label}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCompleted && <CheckCircle size={20} color="#10B981" />}
          <button onClick={() => setIsOpen(!isOpen)} style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
          {/* Exercise List Restoration */}
          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Exercises in this set
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
              {exercises.map((ex, i) => (
                <div key={i} style={{ display: 'contents' }}>
                  <div style={{ fontSize: '0.9rem', color: '#92400E', fontWeight: 500 }}>{ex.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: 700 }}>{ex.sets} × {ex.reps}</div>
                </div>
              ))}
            </div>
          </div>

          {!isCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#92400E' }}>Your Note</span>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling before starting? ✍️"
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid #E5E7EB',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    minHeight: '60px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button 
                onClick={handleComplete}
                disabled={windowStatus !== 'active'}
                style={{ 
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: windowStatus === 'active' ? '#F59E0B' : '#E5E7EB',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: windowStatus === 'active' ? 1 : 0.6,
                  cursor: windowStatus === 'active' ? 'pointer' : 'not-allowed',
                  border: 'none',
                  fontFamily: 'inherit'
                }}
              >
                {windowStatus === 'active' ? (
                  <>Complete All {exercises.length} Exercises ✨</>
                ) : windowStatus === 'upcoming' ? (
                  <><Clock size={16} /> Starts at {windowInfo.label}</>
                ) : (
                  <><Lock size={16} /> Window Closed</>
                )}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#FFFBEB', padding: '12px', borderRadius: '10px', border: '1px solid #FEF3C7' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#D97706', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Your Note
                </span>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400E', fontStyle: 'italic' }}>
                  "{notes}"
                </p>
              </div>
              
              <div style={{ width: '100%', borderTop: '1px solid rgba(245, 158, 11, 0.1)', paddingTop: '16px' }}>
                <PhotoIncentive photoUrl={photoUrl} />
              </div>
              <button 
                onClick={handleUndo}
                style={{ 
                  marginTop: '8px',
                  padding: '8px 12px', 
                  fontSize: '0.75rem', 
                  color: '#9CA3AF', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  fontFamily: 'inherit',
                  background: 'transparent',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={12} /> Mark as Not Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseSet;
