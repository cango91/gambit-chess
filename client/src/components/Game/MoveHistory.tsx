import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { GambitMove } from '@gambit-chess/shared';
import { extractExtendedNotation } from '../../utils/chess-utils';

const HistoryContainer = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  max-height: 200px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
`;

const StickyHeader = styled.div`
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(5px);
`;

const HistoryTitle = styled.h3`
  color: #f0d9b5;
  font-size: 14px;
  margin: 0;
  font-weight: 600;
`;

const ScrollableContent = styled.div`
  overflow-y: auto;
  padding: 8px 16px 16px;
  flex: 1;
`;

const MoveList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const MoveRow = styled.div`
  display: grid;
  grid-template-columns: 30px 1fr 1fr;
  gap: 6px;
  align-items: start;
  padding: 3px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const MoveNumber = styled.span`
  color: #b58863;
  font-size: 10px;
  font-weight: 500;
  align-self: center;
`;

const MoveNotation = styled.div`
  color: #f0d9b5;
  font-size: 11px;
  font-family: 'Courier New', monospace;
`;

const StandardMove = styled.span`
  color: #f0d9b5;
`;

const ExtendedNotation = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 1px;
`;

const BPAllocation = styled.span`
  color: #fbbf24;
  font-size: 9px;
  background: rgba(251, 191, 36, 0.1);
  padding: 1px 3px;
  border-radius: 2px;
`;

const RetreatCost = styled.span`
  color: #ef4444;
  font-size: 9px;
  background: rgba(239, 68, 68, 0.1);
  padding: 1px 3px;
  border-radius: 2px;
`;

const TacticalAdvantage = styled.span`
  color: #10b981;
  font-size: 9px;
  background: rgba(16, 185, 129, 0.1);
  padding: 1px 3px;
  border-radius: 2px;
`;

const DuelResult = styled.span<{ $won: boolean }>`
  color: ${props => props.$won ? '#10b981' : '#ef4444'};
  font-size: 9px;
  background: ${props => props.$won ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  padding: 1px 3px;
  border-radius: 2px;
`;

const EmptyHistory = styled.div`
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  padding: 20px;
  font-size: 12px;
`;

interface MoveHistoryProps {
  moves: GambitMove[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMoveCountRef = useRef(0);

  // Auto-scroll to latest move
  useEffect(() => {
    if (moves.length > lastMoveCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    lastMoveCountRef.current = moves.length;
  }, [moves.length]);

  if (!moves || moves.length === 0) {
    return (
      <HistoryContainer>
        <StickyHeader>
          <HistoryTitle>Move History</HistoryTitle>
        </StickyHeader>
        <ScrollableContent>
          <EmptyHistory>No moves yet</EmptyHistory>
        </ScrollableContent>
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
      <StickyHeader>
        <HistoryTitle>Move History</HistoryTitle>
      </StickyHeader>
      
      <ScrollableContent ref={scrollRef}>
        <MoveList>
          {movePairs.map((pair, index) => (
            <MoveRow key={index}>
              <MoveNumber>{index + 1}.</MoveNumber>
              {pair.white ? renderMove(pair.white) : <div />}
              {pair.black ? renderMove(pair.black) : <div />}
            </MoveRow>
          ))}
        </MoveList>
      </ScrollableContent>
    </HistoryContainer>
  );
}; 