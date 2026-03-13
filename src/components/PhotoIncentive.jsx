import React, { useState } from 'react';
import { ZoomIn, Download, X } from 'lucide-react';

const PhotoIncentive = ({ photoUrl }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!photoUrl) return null;

  return (
    <div className="photo-incentive" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '0.85rem', color: '#92400E', fontWeight: 'bold', marginBottom: '0.75rem' }}>
        🌟 Today's Reward Photo Revealed!
      </p>
      <div style={{ position: 'relative', display: 'inline-block', minHeight: '150px', background: '#FEF3C7', borderRadius: '12px', padding: '10px', minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src={photoUrl} 
          alt="Reward" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '400px',
            borderRadius: '12px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            cursor: 'zoom-in',
            display: 'block'
          }} 
          onClick={() => setIsZoomed(true)}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.style.minHeight = '60px';
          }}
        />
        <div style={{ 
          position: 'absolute', 
          bottom: '15px', 
          right: '15px', 
          display: 'flex', 
          gap: '8px',
          zIndex: 10
        }}>
          <button 
            onClick={() => setIsZoomed(true)}
            style={{ background: 'white', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex' }}
          >
            <ZoomIn size={18} color="#F59E0B" />
          </button>
          <a 
            href={photoUrl} 
            download 
            style={{ background: 'white', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Download size={18} color="#F59E0B" />
          </a>
        </div>
      </div>

      {isZoomed && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.9)', 
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsZoomed(false)}
        >
          <button 
            onClick={() => setIsZoomed(false)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'white', border: 'none', borderRadius: '50%', p: '8px' }}
          >
            <X size={24} color="#000" />
          </button>
          <img src={photoUrl} alt="Reward Zoomed" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
        </div>
      )}
    </div>
  );
};

export default PhotoIncentive;
