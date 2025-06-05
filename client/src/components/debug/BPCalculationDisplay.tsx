import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';

interface BPCalculationDisplayProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const BPCalculationDisplay: React.FC<BPCalculationDisplayProps> = ({
  isVisible,
  onToggle
}) => {
  const { currentGame } = useGameStore();
  
  if (!currentGame?.bpCalculationReport) {
    return null;
  }

  const report = currentGame.bpCalculationReport;

  return (
    <div className="bp-calculation-display">
      <button 
        onClick={onToggle}
        className="bg-blue-600 text-white px-3 py-1 rounded text-sm mb-2 hover:bg-blue-700"
      >
        {isVisible ? 'Hide' : 'Show'} BP Calculations
      </button>
      
      {isVisible && (
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs max-h-96 overflow-y-auto">
          <h3 className="text-yellow-400 mb-2 font-bold">🧮 BP Calculation Report</h3>
          
          {/* Current BP Pool */}
          <div className="mb-3">
            <div className="text-blue-400">💰 Current BP Pools:</div>
            <div className="ml-2">
              <div>White: {report.playerBP.white} BP</div>
              <div>Black: {report.playerBP.black} BP</div>
            </div>
          </div>

          {/* Transactions */}
          {report.transactions.length > 0 && (
            <div className="mb-3">
              <div className="text-blue-400">📊 Last Turn Transactions:</div>
              {report.transactions.map((transaction, index) => (
                <div key={index} className="ml-2 my-1">
                  <div className={`${
                    transaction.amount > 0 
                      ? 'text-green-400' 
                      : transaction.amount < 0 
                        ? 'text-red-400' 
                        : 'text-gray-400'
                  }`}>
                    {transaction.type === 'duel_cost' && '⚔️'}
                    {transaction.type === 'retreat_cost' && '🏃'}
                    {transaction.type === 'regeneration' && '✨'}
                    {transaction.type === 'initial' && '🎯'}
                    {' '}
                    {transaction.player.toUpperCase()}: {transaction.amount > 0 ? '+' : ''}{transaction.amount} BP
                  </div>
                  <div className="text-gray-500 ml-4 text-xs">{transaction.details}</div>
                  {transaction.formula && (
                    <div className="text-yellow-400 ml-4 text-xs">Formula: {transaction.formula}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Calculations */}
          {report.calculations.length > 0 && (
            <div className="mb-3">
              <div className="text-blue-400">🔧 Detailed Calculations:</div>
              {report.calculations.map((calc, index) => (
                <div key={index} className="ml-2 text-xs text-gray-300">
                  {calc}
                </div>
              ))}
            </div>
          )}

          {/* Tactics */}
          {report.tactics && report.tactics.length > 0 && (
            <div className="mb-3">
              <div className="text-blue-400">🎯 Detected Tactics:</div>
              {report.tactics.map((tactic, index) => (
                <div key={index} className="ml-2 text-yellow-400 text-xs">
                  • {tactic.type}: {tactic.description || 'No description'}
                </div>
              ))}
            </div>
          )}

          {/* Duel Details */}
          {report.duelDetails && (
            <div className="mb-3">
              <div className="text-blue-400">⚔️ Duel Details:</div>
              <div className="ml-2 text-xs">
                <div>Attacker: {report.duelDetails.attackerAllocation} BP</div>
                <div>Defender: {report.duelDetails.defenderAllocation} BP</div>
                <div className={report.duelDetails.winner === 'attacker' ? 'text-green-400' : 'text-red-400'}>
                  Winner: {report.duelDetails.winner}
                </div>
              </div>
            </div>
          )}

          {/* Hidden Info Notice */}
          {report.hiddenInfo && (
            <div className="text-yellow-500 text-xs mt-2">
              ⚠️ Information hiding is enabled - some details may be concealed in production
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 