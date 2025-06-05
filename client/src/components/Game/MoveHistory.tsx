import React from 'react';
import styled from 'styled-components';
import { GambitMove } from '@gambit-chess/shared';
import { extractExtendedNotation } from '../../utils/chess-utils';

const HistoryContainer = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const HistoryTitle = styled.h3`
  color: #f0d9b5;
  font-size: 16px;
  margin: 0 0 12px 0;
  font-weight: 600;
`;

const MoveList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MoveRow = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 1fr;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const MoveNumber = styled.span`
  color: #b58863;
  font-size: 12px;
  font-weight: 500;
`;

const MoveNotation = styled.div`
  color: #f0d9b5;
  font-size: 13px;
  font-family: 'Courier New', monospace;
`;

const StandardMove = styled.span`
  color: #f0d9b5;
`;

const ExtendedNotation = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
`;

const BPAllocation = styled.span`
  color: #fbbf24;
  font-size: 11px;
  background: rgba(251, 191, 36, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
`;

const RetreatCost = styled.span`
  color: #ef4444;
  font-size: 11px;
  background: rgba(239, 68, 68, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
`;

const TacticalAdvantage = styled.span`
  color: #10b981;
  font-size: 11px;
  background: rgba(16, 185, 129, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
`;

const DuelResult = styled.span<{ $won: boolean }>`
  color: ${props => props.$won ? '#10b981' : '#ef4444'};
  font-size: 11px;
  background: ${props => props.$won ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  padding: 1px 4px;
  border-radius: 3px;
`;

const EmptyHistory = styled.div`
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  padding: 20px 0;
`;

interface MoveHistoryProps {
  moves: GambitMove[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  if (!moves || moves.length === 0) {
    return (
      <HistoryContainer>
        <HistoryTitle>Move History</HistoryTitle>
        <EmptyHistory>No moves yet</EmptyHistory>
      </HistoryContainer>
    );
  }

  // Group moves by pairs (white, black)
  const movePairs: Array<{ white?: GambitMove; black?: GambitMove }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      white: moves[i],
      black: moves[i + 1]
    });
  }

  const renderMove = (move: GambitMove) => {
    const notation = move.san || `${move.from}${move.to}`;
    const extended = extractExtendedNotation(notation);
    
    return (
      <MoveNotation>
        <StandardMove>{extended.standardPart}</StandardMove>
        
        {/* Extended notation elements */}
        <ExtendedNotation>
          {extended.bpAllocation && (
            <BPAllocation>BP: {extended.bpAllocation}</BPAllocation>
          )}
          
          {extended.retreatCost && (
            <RetreatCost>Retreat: {extended.retreatCost}</RetreatCost>
          )}
          
          {extended.tacticalAdvantage && (
            <TacticalAdvantage>Tactical: {extended.tacticalAdvantage}</TacticalAdvantage>
          )}
          
          {/* Duel result */}
          {move.duelResult && (
            <DuelResult $won={move.duelResult.attackerWon}>
              Duel: {move.duelResult.attackerAllocation} vs {move.duelResult.defenderAllocation}
              {move.duelResult.attackerWon ? ' ✓' : ' ✗'}
            </DuelResult>
          )}
          
          {/* Tactical retreat */}
          {move.tacticalRetreat && (
            <RetreatCost>
              →{move.tacticalRetreat.retreatSquare}
            </RetreatCost>
          )}
        </ExtendedNotation>
      </MoveNotation>
    );
  };

  return (
    <HistoryContainer>
      <HistoryTitle>Move History</HistoryTitle>
      <MoveList>
        {movePairs.map((pair, index) => (
          <MoveRow key={index}>
            <MoveNumber>{index + 1}.</MoveNumber>
            <div>{pair.white && renderMove(pair.white)}</div>
            <div>{pair.black && renderMove(pair.black)}</div>
          </MoveRow>
        ))}
      </MoveList>
    </HistoryContainer>
  );
}; 