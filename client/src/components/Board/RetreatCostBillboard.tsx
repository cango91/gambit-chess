import React from 'react';

interface RetreatCostBillboardProps {
  screenPosition: { x: number; y: number; visible: boolean };
  cost: number;
  isVisible: boolean;
}

export const RetreatCostBillboard: React.FC<RetreatCostBillboardProps> = ({
  screenPosition,
  cost,
  isVisible
}) => {
  if (!isVisible || !screenPosition.visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: screenPosition.x - 20, // Center the 40px wide element
        top: screenPosition.y - 20,  // Center the 40px tall element
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: cost === 0 ? '#10B981' : '#F59E0B', // Green for free, amber for cost
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'white',
        zIndex: 1000,
        pointerEvents: 'none', // Don't interfere with 3D interactions
        opacity: 0.9,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        fontFamily: 'Arial, sans-serif',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
      }}
    >
      {cost === 0 ? 'FREE' : cost.toString()}
    </div>
  );
}; 