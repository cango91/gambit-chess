import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useGameStore } from '../../stores/gameStore';
import { BPTransaction, TacticRegenerationDetail, BPCalculationReport } from '@gambit-chess/shared';
import { wsService } from '../../services/websocket.service';

const HistoryContainer = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  max-height: 200px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 12px;
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
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TitleIcon = styled.span`
  font-size: 16px;
`;

const ScrollableContent = styled.div`
  overflow-y: auto;
  padding: 8px 16px 16px;
  flex: 1;
`;

const CalculationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CompactEntry = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 8px;
  border-left: 3px solid rgba(251, 191, 36, 0.5);
  position: relative;
`;

const EntryHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 4px;
`;

const MoveInfo = styled.div`
  color: #f0d9b5;
  font-size: 12px;
  font-weight: 500;
  flex: 1;
`;

const TurnNumber = styled.span<{ $playerColor?: 'white' | 'black' }>`
  color: ${props => {
    if (props.$playerColor === 'white') return '#ffffff';
    if (props.$playerColor === 'black') return '#ffffff';
    return '#f0d9b5';
  }};
  font-size: 10px;
  background: ${props => {
    if (props.$playerColor === 'white') return 'rgba(240, 217, 181, 0.2)';
    if (props.$playerColor === 'black') return 'rgba(139, 69, 19, 0.2)';
    return 'rgba(181, 136, 99, 0.2)';
  }};
  padding: 1px 4px;
  border-radius: 2px;
  margin-left: 8px;
  font-weight: 600;
`;

const PlayerRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 11px;
`;

const PlayerInfo = styled.div<{ $player: 'white' | 'black' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${props => props.$player === 'white' ? '#f0d9b5' : '#d2b48c'};
  background: ${props => props.$player === 'white' 
    ? 'rgba(240, 217, 181, 0.08)' 
    : 'rgba(139, 69, 19, 0.08)'
  };
  padding: 3px 6px;
  border-radius: 3px;
`;

const PlayerName = styled.span`
  font-size: 10px;
  opacity: 0.8;
  text-transform: uppercase;
  font-weight: 600;
`;

const BPInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const BPValue = styled.span`
  color: #fbbf24;
  font-weight: 600;
`;

const BPChange = styled.span<{ $positive: boolean }>`
  color: ${props => props.$positive ? '#10b981' : '#ef4444'};
  font-size: 10px;
  font-weight: 500;
`;

const DetailsButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  transition: all 0.2s;
  margin-left: 4px;
  
  &:hover {
    background: rgba(156, 163, 175, 0.2);
    color: #f0d9b5;
  }
`;

const TransactionSummary = styled.div`
  display: flex;
  gap: 2px;
  margin-top: 2px;
`;

const TransactionPill = styled.span<{ $type: string }>`
  font-size: 8px;
  padding: 1px 3px;
  border-radius: 2px;
  background: ${props => {
    switch (props.$type) {
      case 'regeneration': return 'rgba(16, 185, 129, 0.2)';
      case 'duel_cost': return 'rgba(239, 68, 68, 0.2)';
      case 'retreat_cost': return 'rgba(245, 158, 11, 0.2)';
      default: return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'regeneration': return '#10b981';
      case 'duel_cost': return '#ef4444';
      case 'retreat_cost': return '#f59e0b';
      default: return '#9ca3af';
    }
  }};
`;

const ExpandedDetails = styled.div`
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 10px;
`;

const DetailSection = styled.div`
  margin-bottom: 6px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailTitle = styled.div`
  color: #fbbf24;
  font-weight: 600;
  margin-bottom: 3px;
  font-size: 10px;
`;

const DetailItem = styled.div`
  color: #d1d5db;
  margin-bottom: 2px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FormulaText = styled.span`
  font-family: 'Courier New', monospace;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 9px;
  color: #10b981;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 20px;
  font-size: 12px;
`;

const Tooltip = styled.div<{ $x: number; $y: number; $visible: boolean }>`
  position: fixed;
  left: ${props => Math.min(props.$x, window.innerWidth - 250)}px;
  top: ${props => Math.max(10, Math.min(props.$y, window.innerHeight - 150))}px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 12px;
  max-width: 240px;
  z-index: 1000;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.15s ease-in-out;
  color: #f0d9b5;
  font-size: 11px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  
  @media (max-width: 768px) {
    max-width: calc(100vw - 40px);
    left: 20px !important;
    right: 20px;
    width: auto;
  }
`;

interface TooltipData {
  content: string;
  title?: string;
}

interface CalculationHistoryEntry {
  turn: number; // Actual chess turn (1, 2, 3...)
  halfTurn: number; // Half-turn for server mapping (0, 1, 2...)
  move?: string;
  color?: 'white' | 'black'; // Who moved this turn
  whiteTransactions: BPTransaction[];
  blackTransactions: BPTransaction[];
  whiteBP: number;
  blackBP: number;
  regenerationDetails?: any;
}

export const BPCalculationHistory: React.FC = () => {
  const { currentGame } = useGameStore();
  const [tooltip, setTooltip] = useState<{ data: TooltipData; x: number; y: number } | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | null>(null);
  const [serverBPHistory, setServerBPHistory] = useState<BPCalculationReport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastEntryCountRef = useRef(0);

  // Build calculation history from game data
  const buildCalculationHistory = (): CalculationHistoryEntry[] => {
    if (!currentGame) return [];

    const history: CalculationHistoryEntry[] = [];
    
    // Add initial state
    history.push({
      turn: 0,
      halfTurn: 0,
      move: 'Game Start',
      whiteTransactions: [{
        type: 'initial',
        player: 'white',
        amount: currentGame.config.initialBattlePoints,
        details: 'Starting BP'
      }],
      blackTransactions: [{
        type: 'initial',
        player: 'black',
        amount: currentGame.config.initialBattlePoints,
        details: 'Starting BP'
      }],
      whiteBP: currentGame.config.initialBattlePoints,
      blackBP: currentGame.config.initialBattlePoints
    });

    // Build history from move history and current BP states
    let currentWhiteBP = currentGame.config.initialBattlePoints;
    let currentBlackBP = currentGame.config.initialBattlePoints;

    currentGame.moveHistory.forEach((move, index) => {
      const halfTurn = index + 1;
      const chessRealTurn = Math.ceil(halfTurn / 2); // Chess turn number (1, 2, 3...)
      const movingPlayer = move.color === 'w' ? 'white' : 'black';
      const isLatestMove = index === currentGame.moveHistory.length - 1;
      
      // For the latest move, use the detailed calculation report if available
      if (isLatestMove && currentGame.bpCalculationReport) {
        const report = currentGame.bpCalculationReport;
        history.push({
          turn: chessRealTurn,
          halfTurn,
          move: move.san || 'Move',
          color: movingPlayer,
          whiteTransactions: report.transactions.filter(t => t.player === 'white'),
          blackTransactions: report.transactions.filter(t => t.player === 'black'),
          whiteBP: report.playerBP.white,
          blackBP: report.playerBP.black,
          regenerationDetails: report.regenerationDetails
        });
      } else {
        // For other moves, create basic entries from move data
        const whiteTransactions: BPTransaction[] = [];
        const blackTransactions: BPTransaction[] = [];
        
        // If this move had a duel, add duel cost transactions
        if (move.duelResult) {
          const attackerColor = move.color;
          const defenderColor = attackerColor === 'w' ? 'b' : 'w';
          const attackerPlayer = attackerColor === 'w' ? 'white' : 'black';
          const defenderPlayer = defenderColor === 'w' ? 'white' : 'black';
          
          if (attackerColor === 'w') {
            whiteTransactions.push({
              type: 'duel_cost',
              player: 'white',
              amount: -move.duelResult.attackerAllocation,
              details: `Duel allocation: ${move.duelResult.attackerAllocation} BP`
            });
            blackTransactions.push({
              type: 'duel_cost',
              player: 'black', 
              amount: -move.duelResult.defenderAllocation,
              details: `Duel defense: ${move.duelResult.defenderAllocation} BP`
            });
            currentWhiteBP -= move.duelResult.attackerAllocation;
            currentBlackBP -= move.duelResult.defenderAllocation;
          } else {
            blackTransactions.push({
              type: 'duel_cost',
              player: 'black',
              amount: -move.duelResult.attackerAllocation,
              details: `Duel allocation: ${move.duelResult.attackerAllocation} BP`
            });
            whiteTransactions.push({
              type: 'duel_cost',
              player: 'white',
              amount: -move.duelResult.defenderAllocation,
              details: `Duel defense: ${move.duelResult.defenderAllocation} BP`
            });
            currentBlackBP -= move.duelResult.attackerAllocation;
            currentWhiteBP -= move.duelResult.defenderAllocation;
          }
        }
        
        // Add retreat cost if applicable
        if (move.tacticalRetreat?.battlePointsCost && move.tacticalRetreat.battlePointsCost > 0) {
          const retreatingPlayer = move.color === 'w' ? 'white' : 'black';
          const transaction: BPTransaction = {
            type: 'retreat_cost',
            player: retreatingPlayer,
            amount: -move.tacticalRetreat.battlePointsCost,
            details: `Retreat to ${move.tacticalRetreat.retreatSquare}: ${move.tacticalRetreat.battlePointsCost} BP`
          };
          
          if (retreatingPlayer === 'white') {
            whiteTransactions.push(transaction);
            currentWhiteBP -= move.tacticalRetreat.battlePointsCost;
          } else {
            blackTransactions.push(transaction);
            currentBlackBP -= move.tacticalRetreat.battlePointsCost;
          }
        }
        
        // Add basic regeneration (simplified - we don't have detailed tactical analysis for past moves)
        const baseRegen = currentGame.config.regenerationRules.baseTurnRegeneration;
        const movingPlayer = move.color === 'w' ? 'white' : 'black';
        
        if (baseRegen > 0) {
          const transaction: BPTransaction = {
            type: 'regeneration',
            player: movingPlayer,
            amount: baseRegen,
            details: `Base regeneration: ${baseRegen} BP`
          };
          
          if (movingPlayer === 'white') {
            whiteTransactions.push(transaction);
            currentWhiteBP += baseRegen;
          } else {
            blackTransactions.push(transaction);
            currentBlackBP += baseRegen;
          }
        }
        
        history.push({
          turn: chessRealTurn,
          halfTurn,
          move: move.san || 'Move',
          color: movingPlayer,
          whiteTransactions,
          blackTransactions,
          whiteBP: currentWhiteBP,
          blackBP: currentBlackBP
        });
      }
    });

    return history;
  };

  // Build calculation history from server-provided BP reports
  const buildCalculationHistoryFromServer = (): CalculationHistoryEntry[] => {
    if (!currentGame || serverBPHistory.length === 0) {
      // Fallback to local history if server history not available
      return buildCalculationHistory();
    }

    const history: CalculationHistoryEntry[] = [];
    
    // Add initial state
    history.push({
      turn: 0,
      halfTurn: 0,
      move: 'Game Start',
      whiteTransactions: [{
        type: 'initial',
        player: 'white',
        amount: currentGame.config.initialBattlePoints,
        details: 'Starting BP'
      }],
      blackTransactions: [{
        type: 'initial',
        player: 'black',
        amount: currentGame.config.initialBattlePoints,
        details: 'Starting BP'
      }],
      whiteBP: currentGame.config.initialBattlePoints,
      blackBP: currentGame.config.initialBattlePoints
    });

    // Convert server BP reports to history entries using server-provided move information
    serverBPHistory.forEach((report, index) => {
      // Use server-provided move information instead of trying to map by index
      const moveInfo = report.moveInfo;
      const halfTurn = moveInfo?.moveNumber ?? (index + 1);
      const chessRealTurn = Math.ceil(halfTurn / 2); // Chess turn number (1, 2, 3...)
      const movingPlayer = moveInfo?.color === 'w' ? 'white' : 'black';
      
      history.push({
        turn: chessRealTurn,
        halfTurn,
        move: moveInfo?.notation || 'Move',
        color: movingPlayer,
        whiteTransactions: report.transactions.filter(t => t.player === 'white'),
        blackTransactions: report.transactions.filter(t => t.player === 'black'),
        whiteBP: report.playerBP.white,
        blackBP: report.playerBP.black,
        regenerationDetails: report.regenerationDetails
      });
    });

    return history;
  };

  // Request BP history from server only when game changes (not on every move)
  useEffect(() => {
    if (!currentGame?.id) return;
    
    setIsLoadingHistory(true);
    wsService.requestBPHistory(currentGame.id);
  }, [currentGame?.id]);

  // Handle BP history response from server
  useEffect(() => {
    const handleBPHistoryResponse = (data: { gameId: string; history: BPCalculationReport[]; timestamp: number }) => {
      if (data.gameId === currentGame?.id) {
        setServerBPHistory(data.history);
        setIsLoadingHistory(false);
        console.log('📊 Received BP history from server:', data.history.length, 'entries');
      }
    };

    wsService.on('game:bp_history_response', handleBPHistoryResponse);
    
    return () => {
      wsService.off('game:bp_history_response', handleBPHistoryResponse);
    };
  }, [currentGame?.id]);

  // Update server BP history when new moves are made (append latest calculation)
  useEffect(() => {
    if (!currentGame?.bpCalculationReport || !currentGame?.moveHistory?.length) return;
    if (serverBPHistory.length >= currentGame.moveHistory.length) return; // Already up to date
    
    // Append the latest BP calculation to server history
    setServerBPHistory(prev => [...prev, currentGame.bpCalculationReport!]);
  }, [currentGame?.moveHistory?.length, currentGame?.bpCalculationReport]);

  // Auto-scroll to latest entry
  useEffect(() => {
    const history = buildCalculationHistoryFromServer();
    if (history.length > lastEntryCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    lastEntryCountRef.current = history.length;
  }, [serverBPHistory.length]);

  // Debounced tooltip handlers
  const handleMouseEnter = (event: React.MouseEvent, data: TooltipData) => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }
    
    const timeout = setTimeout(() => {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltip({
        data,
        x: rect.right + 10,
        y: rect.top
      });
    }, 300); // 300ms delay to prevent flickering
    
    setTooltipTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      setTooltipTimeout(null);
    }
    
    const timeout = setTimeout(() => {
      setTooltip(null);
    }, 100); // Small delay to prevent flickering when moving between elements
    
    setTooltipTimeout(timeout);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'regeneration': return '✨';
      case 'duel_cost': return '⚔️';
      case 'retreat_cost': return '🏃';
      case 'initial': return '🎯';
      default: return '📊';
    }
  };

  const formatTransactionSummary = (transactions: BPTransaction[]) => {
    const summary = transactions.reduce((acc, t) => {
      if (!acc[t.type]) acc[t.type] = 0;
      acc[t.type] += t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(summary)
      .filter(([_, amount]) => amount !== 0)
      .map(([type, amount]) => (
        <TransactionPill key={type} $type={type}>
          {getTransactionIcon(type)}{amount > 0 ? '+' : ''}{amount}
        </TransactionPill>
      ));
  };

  const renderExpandedDetails = (entry: CalculationHistoryEntry) => {
    const allTransactions = [...entry.whiteTransactions, ...entry.blackTransactions];
    
    return (
      <ExpandedDetails>
        {allTransactions.length > 0 && (
          <DetailSection>
            <DetailTitle>Transactions</DetailTitle>
            {allTransactions.map((transaction, index) => (
              <DetailItem key={index}>
                <span>
                  {getTransactionIcon(transaction.type)} {transaction.player.toUpperCase()}: {transaction.details}
                </span>
                <span style={{ color: transaction.amount > 0 ? '#10b981' : '#ef4444' }}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                </span>
              </DetailItem>
            ))}
          </DetailSection>
        )}
        
        {entry.regenerationDetails?.tacticDetails?.length > 0 && (
          <DetailSection>
            <DetailTitle>Regeneration Details</DetailTitle>
            {entry.regenerationDetails.tacticDetails.map((detail: TacticRegenerationDetail, index: number) => (
              <DetailItem key={index}>
                <div>
                  <div>{detail.type.toUpperCase()}: +{detail.result} BP</div>
                  <FormulaText>{detail.configFormula}</FormulaText>
                </div>
              </DetailItem>
            ))}
          </DetailSection>
        )}
      </ExpandedDetails>
    );
  };

  const calculationHistory = buildCalculationHistoryFromServer();

  if (isLoadingHistory) {
    return (
      <HistoryContainer>
        <StickyHeader>
          <HistoryTitle>
            <TitleIcon>🧮</TitleIcon>
            BP History
          </HistoryTitle>
        </StickyHeader>
        <ScrollableContent>
          <EmptyState>Loading BP history...</EmptyState>
        </ScrollableContent>
      </HistoryContainer>
    );
  }

  if (calculationHistory.length === 0) {
    return (
      <HistoryContainer>
        <StickyHeader>
          <HistoryTitle>
            <TitleIcon>🧮</TitleIcon>
            BP History
          </HistoryTitle>
        </StickyHeader>
        <ScrollableContent>
          <EmptyState>No calculations yet</EmptyState>
        </ScrollableContent>
      </HistoryContainer>
    );
  }

  return (
    <HistoryContainer>
      <StickyHeader>
        <HistoryTitle>
          <TitleIcon>🧮</TitleIcon>
          BP History
        </HistoryTitle>
      </StickyHeader>
      
      <ScrollableContent ref={scrollRef}>
        <CalculationList>
          {calculationHistory.map((entry, index) => {
            const previousEntry = index > 0 ? calculationHistory[index - 1] : undefined;
            const whiteBPChange = previousEntry ? entry.whiteBP - previousEntry.whiteBP : 0;
            const blackBPChange = previousEntry ? entry.blackBP - previousEntry.blackBP : 0;
            const isExpanded = expandedEntry === index;
            const hasDetails = entry.whiteTransactions.length > 1 || entry.blackTransactions.length > 1 || 
                             entry.regenerationDetails?.tacticDetails?.length > 0;
            
            return (
              <CompactEntry key={index}>
                <EntryHeader>
                  <MoveInfo>{entry.move}</MoveInfo>
                  <TurnNumber $playerColor={entry.color}>T{entry.turn}</TurnNumber>
                </EntryHeader>

                <PlayerRow>
                  <PlayerInfo $player="white">
                    <PlayerName>White</PlayerName>
                    <BPInfo>
                      <BPValue>{entry.whiteBP}</BPValue>
                      {whiteBPChange !== 0 && (
                        <BPChange $positive={whiteBPChange > 0}>
                          ({whiteBPChange > 0 ? '+' : ''}{whiteBPChange})
                        </BPChange>
                      )}
                    </BPInfo>
                  </PlayerInfo>
                  
                  <PlayerInfo $player="black">
                    <PlayerName>Black</PlayerName>
                    <BPInfo>
                      <BPValue>{entry.blackBP}</BPValue>
                      {blackBPChange !== 0 && (
                        <BPChange $positive={blackBPChange > 0}>
                          ({blackBPChange > 0 ? '+' : ''}{blackBPChange})
                        </BPChange>
                      )}
                    </BPInfo>
                  </PlayerInfo>
                </PlayerRow>

                {(entry.whiteTransactions.length > 0 || entry.blackTransactions.length > 0) && (
                  <TransactionSummary>
                    {formatTransactionSummary([...entry.whiteTransactions, ...entry.blackTransactions])}
                    {hasDetails && (
                      <DetailsButton
                        onClick={() => setExpandedEntry(isExpanded ? null : index)}
                        onMouseEnter={(e) => handleMouseEnter(e, {
                          content: isExpanded ? 'Hide details' : 'Show details',
                          title: 'Details'
                        })}
                        onMouseLeave={handleMouseLeave}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </DetailsButton>
                    )}
                  </TransactionSummary>
                )}

                {isExpanded && renderExpandedDetails(entry)}
              </CompactEntry>
            );
          })}
        </CalculationList>
      </ScrollableContent>

      {tooltip && (
        <Tooltip $x={tooltip.x} $y={tooltip.y} $visible={true}>
          {tooltip.data.title && (
            <div style={{ fontWeight: 600, marginBottom: '4px', color: '#fbbf24' }}>
              {tooltip.data.title}
            </div>
          )}
          <div>{tooltip.data.content}</div>
        </Tooltip>
      )}
    </HistoryContainer>
  );
}; 