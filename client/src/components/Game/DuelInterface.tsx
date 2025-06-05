import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { PendingDuel } from '@gambit-chess/shared';
import { useGameStore } from '../../stores/gameStore';
import { wsService } from '../../services/websocket.service';
import * as shared from '@gambit-chess/shared';
const { DEFAULT_GAME_CONFIG } = shared;

const DuelOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const DuelContainer = styled.div<{ $isPractice: boolean }>`
  background: linear-gradient(135deg, #2c1810, #3d2817);
  border: 2px solid #b58863;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: ${props => props.$isPractice ? '800px' : '500px'};
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

const DuelTitle = styled.h2`
  color: #f0d9b5;
  text-align: center;
  margin: 0 0 8px 0;
  font-size: 28px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
`;

const DuelSubtitle = styled.p`
  color: #b58863;
  text-align: center;
  margin: 0 0 24px 0;
  font-size: 16px;
`;

const PracticeDuelGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
`;

const DuelSide = styled.div<{ $side: 'attacker' | 'defender' }>`
  background: linear-gradient(135deg, 
    ${props => props.$side === 'attacker' ? '#4a2617' : '#1a3a4a'}, 
    ${props => props.$side === 'attacker' ? '#3d2817' : '#2a3040'});
  border: 2px solid ${props => props.$side === 'attacker' ? '#d4825a' : '#5a9bd4'};
  border-radius: 12px;
  padding: 20px;
`;

const SideTitle = styled.h3<{ $side: 'attacker' | 'defender' }>`
  color: ${props => props.$side === 'attacker' ? '#d4825a' : '#5a9bd4'};
  text-align: center;
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
`;

const RoleIndicator = styled.div<{ $role: 'attacker' | 'defender' }>`
  background: linear-gradient(135deg, 
    ${props => props.$role === 'attacker' ? '#d4825a' : '#5a9bd4'}, 
    ${props => props.$role === 'attacker' ? '#b8693f' : '#4a88c7'});
  color: white;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 20px;
`;

const AllocationSection = styled.div`
  margin-bottom: 24px;
`;

const PieceInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
`;

const PieceInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #f0d9b5;
  font-size: 14px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PieceInfoLabel = styled.span`
  font-weight: 500;
`;

const PieceInfoValue = styled.span<{ $highlight?: boolean }>`
  color: ${props => props.$highlight ? '#d4825a' : '#b58863'};
  font-weight: 600;
`;

const AllocationSlider = styled.div`
  margin: 16px 0;
`;

const SliderTrack = styled.div`
  position: relative;
  height: 8px;
  background: #3d2817;
  border-radius: 4px;
  margin: 12px 0;
`;

const SliderZone = styled.div<{ 
  $left: number; 
  $width: number; 
  $color: string;
  $canAfford: boolean;
}>`
  position: absolute;
  top: 0;
  left: ${props => props.$left}%;
  width: ${props => props.$width}%;
  height: 100%;
  background: linear-gradient(90deg, 
    ${props => props.$canAfford ? props.$color : '#666'}, 
    ${props => props.$canAfford ? props.$color + '88' : '#44444488'});
  border-radius: 4px;
  transition: all 0.2s;
`;

const SliderHandle = styled.div<{ $position: number }>`
  position: absolute;
  top: -6px;
  left: ${props => props.$position}%;
  width: 20px;
  height: 20px;
  background: #f0d9b5;
  border: 3px solid #b58863;
  border-radius: 50%;
  cursor: pointer;
  transform: translateX(-50%);
  transition: all 0.2s;
  
  &:hover {
    background: #fff;
    transform: translateX(-50%) scale(1.1);
  }
`;

const SliderInput = styled.input`
  width: 100%;
  margin: 8px 0;
  accent-color: #b58863;
`;

const AllocationDisplay = styled.div`
  text-align: center;
  margin: 16px 0;
`;

const AllocationValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #f0d9b5;
  margin-bottom: 4px;
`;

const AllocationBreakdown = styled.div`
  font-size: 14px;
  color: #b58863;
  line-height: 1.4;
`;

const EffectiveDisplay = styled.div<{ $effective: number; $max: number }>`
  background: ${props => props.$effective === props.$max ? 
    'linear-gradient(135deg, #4a7c59, #2d5233)' : 
    'linear-gradient(135deg, #7c4a4a, #522d2d)'};
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;
  text-align: center;
`;

const EffectiveValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
`;

const EffectiveLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
`;

const SubmitButton = styled.button<{ $canAfford: boolean }>`
  width: 100%;
  background: ${props => props.$canAfford ? 
    'linear-gradient(135deg, #b58863, #8b6f32)' : 
    'linear-gradient(135deg, #666, #444)'};
  color: white;
  border: none;
  padding: 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: ${props => props.$canAfford ? 'pointer' : 'not-allowed'};
  transition: all 0.2s;

  &:hover {
    transform: ${props => props.$canAfford ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.$canAfford ? '0 8px 25px rgba(181, 136, 99, 0.3)' : 'none'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const WaitingMessage = styled.div`
  text-align: center;
  color: #b58863;
  font-size: 16px;
  padding: 20px;
`;

interface DuelInterfaceProps {
  role: 'attacker' | 'defender';
  pendingDuel: PendingDuel;
}

// Calculate effective BP based on piece capacity and penalty system
const calculateEffectiveBP = (pieceType: string, totalSpent: number) => {
  if (totalSpent === 0) return 0;
  
  const config = DEFAULT_GAME_CONFIG;
  const capacity = config.pieceValues[pieceType.toLowerCase() as keyof typeof config.pieceValues] || 1;
  const maxEffective = config.maxPieceBattlePoints;
  
  if (totalSpent <= capacity) {
    // Within capacity: 1:1 effectiveness
    return totalSpent;
  } else {
    // Over capacity: base + (overage / 2), capped at max
    const base = capacity;
    const overage = Math.min(totalSpent - capacity, (maxEffective - capacity) * 2);
    return Math.min(base + (overage / 2), maxEffective);
  }
};

// Calculate total BP needed to reach a specific effective BP
const calculateTotalBPNeeded = (pieceType: string, targetEffective: number) => {
  const config = DEFAULT_GAME_CONFIG;
  const capacity = config.pieceValues[pieceType.toLowerCase() as keyof typeof config.pieceValues] || 1;
  
  if (targetEffective <= capacity) {
    return targetEffective;
  } else {
    const overage = targetEffective - capacity;
    return capacity + (overage * 2);
  }
};

export const DuelInterface: React.FC<DuelInterfaceProps> = ({ role, pendingDuel }) => {
  const { submitDuelAllocation, duelAllocationSubmitted, session, currentGame } = useGameStore();
  const [allocation, setAllocation] = useState<number>(0);
  const [attackerAllocation, setAttackerAllocation] = useState<number>(0);
  const [defenderAllocation, setDefenderAllocation] = useState<number>(0);

  if (!session || !currentGame) return null;

  const isPracticeMode = currentGame.gameType === 'practice';

  // Get players' current BP
  const attackerPlayer = pendingDuel.attackerColor === 'w' ? currentGame.whitePlayer : currentGame.blackPlayer;
  const defenderPlayer = pendingDuel.defenderColor === 'w' ? currentGame.whitePlayer : currentGame.blackPlayer;
  
  const config = DEFAULT_GAME_CONFIG;
  
  // Calculate piece info
  const attackingPieceType = pendingDuel.attackingPiece.type.toLowerCase();
  const defendingPieceType = pendingDuel.defendingPiece.type.toLowerCase();
  
  const attackerCapacity = config.pieceValues[attackingPieceType as keyof typeof config.pieceValues] || 1;
  const defenderCapacity = config.pieceValues[defendingPieceType as keyof typeof config.pieceValues] || 1;
  const maxEffective = config.maxPieceBattlePoints;
  
  // Calculate allocation info for each player
  const getPlayerAllocationInfo = (playerType: 'attacker' | 'defender', currentAllocation: number) => {
    const player = playerType === 'attacker' ? attackerPlayer : defenderPlayer;
    const pieceType = playerType === 'attacker' ? attackingPieceType : defendingPieceType;
    const capacity = playerType === 'attacker' ? attackerCapacity : defenderCapacity;
    
    const effective = calculateEffectiveBP(pieceType, currentAllocation);
    const canAfford = currentAllocation <= player.battlePoints;
    const maxAffordable = player.battlePoints;
    const maxTotal = calculateTotalBPNeeded(pieceType, maxEffective);
    
    return {
      player,
      pieceType,
      capacity,
      effective,
      canAfford,
      maxAffordable,
      maxTotal,
      maxEffective
    };
  };

  const attackerInfo = getPlayerAllocationInfo('attacker', attackerAllocation);
  const defenderInfo = getPlayerAllocationInfo('defender', defenderAllocation);
  const playerInfo = role === 'attacker' ? attackerInfo : defenderInfo;

  const handleSubmit = () => {
    if (isPracticeMode) {
      // In practice mode, submit both allocations - attacker first, then defender
      const attackerCanAfford = attackerInfo.canAfford;
      const defenderCanAfford = defenderInfo.canAfford;
      
      if (attackerCanAfford && defenderCanAfford) {
        // Submit attacker allocation first
        console.log('🥊 Practice mode: Submitting attacker allocation:', attackerAllocation);
        wsService.submitDuelAllocation(currentGame.id, attackerAllocation);
        
        // Submit defender allocation after a small delay to ensure proper ordering
        setTimeout(() => {
          console.log('🥊 Practice mode: Submitting defender allocation:', defenderAllocation);
          wsService.submitDuelAllocation(currentGame.id, defenderAllocation);
        }, 100);
        
        // Set the submitted state directly without sending another allocation
        useGameStore.setState({ duelAllocationSubmitted: true });
      }
    } else {
      if (playerInfo.canAfford) {
        submitDuelAllocation(allocation);
      }
    }
  };

  const renderPlayerAllocation = (playerType: 'attacker' | 'defender') => {
    const info = playerType === 'attacker' ? attackerInfo : defenderInfo;
    const currentAllocation = playerType === 'attacker' ? attackerAllocation : defenderAllocation;
    const setCurrentAllocation = playerType === 'attacker' ? setAttackerAllocation : setDefenderAllocation;
    
    const sliderMax = Math.min(info.maxTotal, info.maxAffordable);
    const capacityPercent = sliderMax > 0 ? (info.capacity / sliderMax) * 100 : 0;
    const allocationPercent = sliderMax > 0 ? (currentAllocation / sliderMax) * 100 : 0;
    
    return (
      <DuelSide $side={playerType}>
        <SideTitle $side={playerType}>
          {playerType.toUpperCase()} ({pendingDuel[`${playerType}Color` as keyof PendingDuel] === 'w' ? 'White' : 'Black'})
        </SideTitle>
        
        <PieceInfo>
          <PieceInfoRow>
            <PieceInfoLabel>Piece:</PieceInfoLabel>
            <PieceInfoValue $highlight>{info.pieceType.toUpperCase()}</PieceInfoValue>
          </PieceInfoRow>
          <PieceInfoRow>
            <PieceInfoLabel>BP Capacity:</PieceInfoLabel>
            <PieceInfoValue>{info.capacity}</PieceInfoValue>
          </PieceInfoRow>
          <PieceInfoRow>
            <PieceInfoLabel>Available BP:</PieceInfoLabel>
            <PieceInfoValue $highlight>{info.player.battlePoints}</PieceInfoValue>
          </PieceInfoRow>
          <PieceInfoRow>
            <PieceInfoLabel>Max Effective:</PieceInfoLabel>
            <PieceInfoValue>{info.maxEffective}</PieceInfoValue>
          </PieceInfoRow>
        </PieceInfo>

        <AllocationSlider>
          <SliderTrack>
            {/* No-penalty zone */}
            <SliderZone
              $left={0}
              $width={capacityPercent}
              $color="#4a7c59"
              $canAfford={currentAllocation <= info.capacity && info.canAfford}
            />
            {/* Penalty zone */}
            <SliderZone
              $left={capacityPercent}
              $width={100 - capacityPercent}
              $color="#7c4a4a"
              $canAfford={currentAllocation > info.capacity && info.canAfford}
            />
            <SliderHandle $position={allocationPercent} />
          </SliderTrack>
          
          <SliderInput
            type="range"
            min="0"
            max={sliderMax}
            value={currentAllocation}
            onChange={(e) => setCurrentAllocation(parseInt(e.target.value))}
          />
        </AllocationSlider>

        <AllocationDisplay>
          <AllocationValue>{currentAllocation} BP</AllocationValue>
          <AllocationBreakdown>
            {currentAllocation === 0 ? (
              `No allocation (0 effective BP)`
            ) : currentAllocation <= info.capacity ? (
              `Within capacity (1:1 cost)`
            ) : (
              <>
                {info.capacity} base + {currentAllocation - info.capacity} penalty (2:1 cost)
                <br />
                Total cost: {currentAllocation} BP
              </>
            )}
          </AllocationBreakdown>
        </AllocationDisplay>

        <EffectiveDisplay $effective={info.effective} $max={info.maxEffective}>
          <EffectiveValue>{info.effective.toFixed(1)}</EffectiveValue>
          <EffectiveLabel>
            Effective Battle Power
            {info.effective === info.maxEffective && info.effective > 0 && ' (MAX)'}
          </EffectiveLabel>
        </EffectiveDisplay>
      </DuelSide>
    );
  };

  if (duelAllocationSubmitted) {
    return (
      <DuelOverlay>
        <DuelContainer $isPractice={isPracticeMode}>
          <DuelTitle>⚔️ Battle in Progress</DuelTitle>
          <WaitingMessage>
            {isPracticeMode 
              ? "Processing duel resolution..." 
              : "Waiting for opponent to allocate Battle Points..."
            }
          </WaitingMessage>
        </DuelContainer>
      </DuelOverlay>
    );
  }

  if (isPracticeMode) {
    return (
      <DuelOverlay>
        <DuelContainer $isPractice={isPracticeMode}>
          <DuelTitle>⚔️ Battle Duel - Practice Mode</DuelTitle>
          <DuelSubtitle>
            {pendingDuel.attackingPiece.type.toUpperCase()} attempts to capture {pendingDuel.defendingPiece.type.toUpperCase()}
          </DuelSubtitle>
          
          <PracticeDuelGrid>
            {renderPlayerAllocation('attacker')}
            {renderPlayerAllocation('defender')}
          </PracticeDuelGrid>

          <SubmitButton 
            onClick={handleSubmit}
            $canAfford={attackerInfo.canAfford && defenderInfo.canAfford}
            disabled={!attackerInfo.canAfford || !defenderInfo.canAfford}
          >
            Resolve Duel (A: {attackerInfo.effective.toFixed(1)} vs D: {defenderInfo.effective.toFixed(1)})
          </SubmitButton>
        </DuelContainer>
      </DuelOverlay>
    );
  }

  // Single player mode
  const maxSlider = Math.min(playerInfo.maxTotal, playerInfo.maxAffordable);
  const capacityPercent = maxSlider > 0 ? (playerInfo.capacity / maxSlider) * 100 : 0;
  const allocationPercent = maxSlider > 0 ? (allocation / maxSlider) * 100 : 0;
  const effective = calculateEffectiveBP(playerInfo.pieceType, allocation);

  return (
    <DuelOverlay>
      <DuelContainer $isPractice={isPracticeMode}>
        <DuelTitle>⚔️ Battle Duel</DuelTitle>
        <DuelSubtitle>
          {pendingDuel.attackingPiece.type.toUpperCase()} attempts to capture {pendingDuel.defendingPiece.type.toUpperCase()}
        </DuelSubtitle>
        
        <RoleIndicator $role={role}>
          You are the {role.toUpperCase()}
        </RoleIndicator>

        <PieceInfo>
          <PieceInfoRow>
            <PieceInfoLabel>Your Piece:</PieceInfoLabel>
            <PieceInfoValue $highlight>{playerInfo.pieceType.toUpperCase()}</PieceInfoValue>
          </PieceInfoRow>
          <PieceInfoRow>
            <PieceInfoLabel>BP Capacity:</PieceInfoLabel>
            <PieceInfoValue>{playerInfo.capacity}</PieceInfoValue>
          </PieceInfoRow>
          <PieceInfoRow>
            <PieceInfoLabel>Available BP:</PieceInfoLabel>
            <PieceInfoValue $highlight>{playerInfo.player.battlePoints}</PieceInfoValue>
          </PieceInfoRow>
          <PieceInfoRow>
            <PieceInfoLabel>Max Effective:</PieceInfoLabel>
            <PieceInfoValue>{playerInfo.maxEffective}</PieceInfoValue>
          </PieceInfoRow>
        </PieceInfo>

        <AllocationSection>
          <AllocationSlider>
            <SliderTrack>
              {/* No-penalty zone */}
              <SliderZone
                $left={0}
                $width={capacityPercent}
                $color="#4a7c59"
                $canAfford={allocation <= playerInfo.capacity && playerInfo.canAfford}
              />
              {/* Penalty zone */}
              <SliderZone
                $left={capacityPercent}
                $width={100 - capacityPercent}
                $color="#7c4a4a"
                $canAfford={allocation > playerInfo.capacity && playerInfo.canAfford}
              />
              <SliderHandle $position={allocationPercent} />
            </SliderTrack>
            
            <SliderInput
              type="range"
              min="0"
              max={maxSlider}
              value={allocation}
              onChange={(e) => setAllocation(parseInt(e.target.value))}
            />
          </AllocationSlider>

          <AllocationDisplay>
            <AllocationValue>{allocation} BP</AllocationValue>
            <AllocationBreakdown>
              {allocation === 0 ? (
                `No allocation (0 effective BP)`
              ) : allocation <= playerInfo.capacity ? (
                `Within capacity (1:1 cost)`
              ) : (
                <>
                  {playerInfo.capacity} base + {allocation - playerInfo.capacity} penalty (2:1 cost)
                  <br />
                  Total cost: {allocation} BP
                </>
              )}
            </AllocationBreakdown>
          </AllocationDisplay>

          <EffectiveDisplay $effective={effective} $max={playerInfo.maxEffective}>
            <EffectiveValue>{effective.toFixed(1)}</EffectiveValue>
            <EffectiveLabel>
              Effective Battle Power
              {effective === playerInfo.maxEffective && effective > 0 && ' (MAX)'}
            </EffectiveLabel>
          </EffectiveDisplay>
        </AllocationSection>

        <SubmitButton 
          onClick={handleSubmit}
          $canAfford={playerInfo.canAfford}
          disabled={!playerInfo.canAfford}
        >
          {role === 'attacker' ? 'Attack!' : 'Defend!'} ({effective.toFixed(1)} effective BP)
        </SubmitButton>
      </DuelContainer>
    </DuelOverlay>
  );
}; 