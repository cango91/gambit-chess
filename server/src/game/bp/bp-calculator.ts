import { GambitMove, GameConfig, SpecialAttackType, TacticsDTO, PinDTO, SkewerDTO, ForkDTO, DiscoveredAttackDTO, CheckDTO, BPRegenerationResult, TacticRegenerationDetail } from "@gambit-chess/shared";
import { PieceSymbol, Square } from 'chess.js';
import { detectTactics } from "../tactics";

/**
 * Calculate BP regeneration with detailed breakdown for transparency and debugging
 * Returns comprehensive information about each step of the calculation
 */
export function calculateBPRegenDetailed(move: GambitMove, config: GameConfig): BPRegenerationResult {
    const calculations: string[] = [];
    const tacticDetails: TacticRegenerationDetail[] = [];
    const formulaParts: string[] = [];
    
    // Base regeneration
    const baseRegen = config.regenerationRules.baseTurnRegeneration;
    calculations.push(`🎯 Base Turn Regeneration: ${baseRegen} BP`);
    formulaParts.push(baseRegen.toString());
    
    // Detect tactics created by this move
    const tactics: TacticsDTO[] = detectTactics(move);
    const handledCheckSources = new Set<Square>();
    
    let tacticRegeneration = 0;
    
    // Process discovered attack + check combination first (special case)
    for (const tactic of tactics) {
        if (tactic.type === SpecialAttackType.DISCOVERED_ATTACK && tactic.isCheck) {
            const rule = config.regenerationRules.specialAttackRegeneration[SpecialAttackType.DISCOVERED_ATTACK];
            if (rule && rule.enabled) {
                const tacticDetail = processTacticRegeneration(tactic, rule, config, calculations);
                if (tacticDetail) {
                    tacticDetails.push(tacticDetail);
                    tacticRegeneration += tacticDetail.result;
                    formulaParts.push(`${tactic.type}(${tacticDetail.result})`);
                    
                    // Mark check source as handled to avoid double-counting
                    const discoveredAttackTactic = tactic as DiscoveredAttackDTO;
                    if (discoveredAttackTactic.attackedBy) {
                        handledCheckSources.add(discoveredAttackTactic.attackedBy.square);
                    }
                }
            }
        }
    }
    
    // Process remaining tactics (excluding already handled discovered attack checks)
    for (const tactic of tactics) {
        if (tactic.type === SpecialAttackType.DISCOVERED_ATTACK && tactic.isCheck) {
            continue; // Already handled above
        }
        
        const rule = config.regenerationRules.specialAttackRegeneration[tactic.type];
        if (!rule || !rule.enabled) {
            calculations.push(`❌ ${tactic.type.toUpperCase()}: Disabled in config`);
            continue;
        }
        
        // Special handling for check to avoid double-counting with discovered attacks
        if (tactic.type === SpecialAttackType.CHECK) {
            const checkTactic = tactic as CheckDTO;
            if (handledCheckSources.has(checkTactic.checkingPiece.square)) {
                calculations.push(`⏭️ ${tactic.type.toUpperCase()}: Skipped (already counted via discovered attack)`);
                continue;
            }
        }
        
        const tacticDetail = processTacticRegeneration(tactic, rule, config, calculations);
        if (tacticDetail) {
            tacticDetails.push(tacticDetail);
            tacticRegeneration += tacticDetail.result;
            formulaParts.push(`${tactic.type}(${tacticDetail.result})`);
        }
    }
    
    // Calculate total before cap
    let totalBP = baseRegen + tacticRegeneration;
    
    // Apply cap if configured
    let appliedCap: number | undefined;
    if (config.regenerationRules.turnRegenCap !== undefined) {
        if (totalBP > config.regenerationRules.turnRegenCap) {
            appliedCap = config.regenerationRules.turnRegenCap;
            calculations.push(`🔒 Turn Regeneration Cap Applied: ${totalBP} → ${appliedCap} BP`);
            totalBP = appliedCap;
        }
    }
    
    // Build final formula
    const formula = formulaParts.join(' + ') + ` = ${totalBP} BP` + (appliedCap ? ` (capped from ${baseRegen + tacticRegeneration})` : '');
    
    return {
        totalBP,
        baseRegeneration: baseRegen,
        tacticRegeneration,
        appliedCap,
        formula,
        tacticDetails,
        calculations
    };
}

/**
 * Process individual tactic regeneration with detailed breakdown
 */
function processTacticRegeneration(
    tactic: TacticsDTO, 
    rule: { enabled: boolean; formula: string; description: string }, 
    config: GameConfig,
    calculations: string[]
): TacticRegenerationDetail | null {
    const breakdown: string[] = [];
    let configFormula = rule.formula;
    let substitutedFormula = rule.formula;
    let evaluatedFormula = '';
    let result = 0;
    
    try {
        switch (tactic.type) {
            case SpecialAttackType.PIN:
                const pinTactic = tactic as PinDTO;
                if (pinTactic.pinnedPiece && pinTactic.pinnedTo) {
                    const pinnedPieceValue = config.pieceValues[pinTactic.pinnedPiece.type];
                    const isPinnedToKing = pinTactic.pinnedTo.type === 'k';
                    
                    // Substitute values in formula
                    substitutedFormula = configFormula
                        .replace('pinnedPieceValue', pinnedPieceValue.toString())
                        .replace('isPinnedToKing', isPinnedToKing.toString());
                    
                    result = eval(substitutedFormula);
                    evaluatedFormula = `${pinnedPieceValue} + ${isPinnedToKing ? 1 : 0} = ${result}`;
                    
                    breakdown.push(`📌 PIN Details:`);
                    breakdown.push(`   └─ Pinned Piece: ${pinTactic.pinnedPiece.square} (${pinTactic.pinnedPiece.type.toUpperCase()}, value: ${pinnedPieceValue})`);
                    breakdown.push(`   └─ Pinned To: ${pinTactic.pinnedTo.square} (${pinTactic.pinnedTo.type.toUpperCase()})`);
                    breakdown.push(`   └─ Pinned By: ${pinTactic.pinnedBy.square} (${pinTactic.pinnedBy.type.toUpperCase()})`);
                    breakdown.push(`   └─ King Pin Bonus: ${isPinnedToKing ? '+1' : '0'}`);
                }
                break;
                
            case SpecialAttackType.SKEWER:
                const skewerTactic = tactic as SkewerDTO;
                if (skewerTactic.skeweredPiece && skewerTactic.skeweredTo) {
                    const frontPieceValue = config.pieceValues[skewerTactic.skeweredPiece.type];
                    const backPieceValue = config.pieceValues[skewerTactic.skeweredTo.type];
                    
                    substitutedFormula = configFormula
                        .replace('frontPieceValue', frontPieceValue.toString())
                        .replace('backPieceValue', backPieceValue.toString());
                    
                    result = eval(substitutedFormula);
                    evaluatedFormula = `max(1, |${frontPieceValue} - ${backPieceValue}|) = ${result}`;
                    
                    breakdown.push(`🏹 SKEWER Details:`);
                    breakdown.push(`   └─ Front Piece: ${skewerTactic.skeweredPiece.square} (${skewerTactic.skeweredPiece.type.toUpperCase()}, value: ${frontPieceValue})`);
                    breakdown.push(`   └─ Back Piece: ${skewerTactic.skeweredTo.square} (${skewerTactic.skeweredTo.type.toUpperCase()}, value: ${backPieceValue})`);
                    breakdown.push(`   └─ Skewered By: ${skewerTactic.skeweredBy.square} (${skewerTactic.skeweredBy.type.toUpperCase()})`);
                    breakdown.push(`   └─ Value Difference: |${frontPieceValue} - ${backPieceValue}| = ${Math.abs(frontPieceValue - backPieceValue)}`);
                }
                break;
                
            case SpecialAttackType.FORK:
                const forkTactic = tactic as ForkDTO;
                if (forkTactic.forkedPieces && forkTactic.forkedPieces.length > 0) {
                    const forkedPiecesValues = forkTactic.forkedPieces.map(p => config.pieceValues[p.type]);
                    
                    substitutedFormula = configFormula.replace('...forkedPiecesValues', forkedPiecesValues.join(', '));
                    result = eval(substitutedFormula);
                    evaluatedFormula = `min(${forkedPiecesValues.join(', ')}) = ${result}`;
                    
                    breakdown.push(`🍴 FORK Details:`);
                    breakdown.push(`   └─ Forked By: ${forkTactic.forkedBy.square} (${forkTactic.forkedBy.type.toUpperCase()})`);
                    forkTactic.forkedPieces.forEach((piece, index) => {
                        breakdown.push(`   └─ Forked Piece ${index + 1}: ${piece.square} (${piece.type.toUpperCase()}, value: ${forkedPiecesValues[index]})`);
                    });
                    breakdown.push(`   └─ Minimum Value: ${Math.min(...forkedPiecesValues)}`);
                }
                break;
                
            case SpecialAttackType.DISCOVERED_ATTACK:
                const discoveredAttackTactic = tactic as DiscoveredAttackDTO;
                if (discoveredAttackTactic.attackedPiece) {
                    const attackedPieceValue = config.pieceValues[discoveredAttackTactic.attackedPiece.type as PieceSymbol];
                    
                    substitutedFormula = configFormula.replace('attackedPieceValue', attackedPieceValue.toString());
                    result = eval(substitutedFormula);
                    evaluatedFormula = `⌈${attackedPieceValue}/2⌉ = ${result}`;
                    
                    breakdown.push(`💨 DISCOVERED ATTACK Details:`);
                    breakdown.push(`   └─ Attacked Piece: ${discoveredAttackTactic.attackedPiece.square} (${discoveredAttackTactic.attackedPiece.type.toUpperCase()}, value: ${attackedPieceValue})`);
                    breakdown.push(`   └─ Attacked By: ${discoveredAttackTactic.attackedBy.square} (${discoveredAttackTactic.attackedBy.type.toUpperCase()})`);
                    breakdown.push(`   └─ Is Check: ${discoveredAttackTactic.isCheck ? 'Yes' : 'No'}`);
                }
                break;
                
            case SpecialAttackType.CHECK:
                const checkTactic = tactic as CheckDTO;
                result = eval(configFormula);
                evaluatedFormula = `${result}`;
                substitutedFormula = configFormula;
                
                breakdown.push(`👑 CHECK Details:`);
                breakdown.push(`   └─ Checking Piece: ${checkTactic.checkingPiece.square} (${checkTactic.checkingPiece.type.toUpperCase()})`);
                breakdown.push(`   └─ Double Check: ${checkTactic.isDoubleCheck ? 'Yes' : 'No'}`);
                break;
                
            default:
                calculations.push(`❓ ${(tactic as any).type?.toUpperCase() || 'UNKNOWN'}: Unknown tactic type`);
                return null;
        }
        
        calculations.push(`✨ ${tactic.type.toUpperCase()}: +${result} BP`);
        calculations.push(`   └─ Formula: ${configFormula}`);
        calculations.push(`   └─ Substituted: ${substitutedFormula}`);
        calculations.push(`   └─ Result: ${evaluatedFormula}`);
        
        return {
            type: tactic.type,
            detectedTactic: tactic,
            configFormula,
            substitutedFormula,
            evaluatedFormula,
            result,
            breakdown
        };
        
    } catch (error) {
        calculations.push(`💥 ${tactic.type.toUpperCase()}: Error evaluating formula "${configFormula}" - ${error}`);
        console.error(`Error evaluating BP regen formula for ${tactic.type}: ${configFormula}`, error);
        return null;
    }
}

/**
 * Legacy function that returns just the number for backward compatibility
 * This ensures existing code continues to work while we transition
 */
export function calculateBPRegen(move: GambitMove, config: GameConfig): number {
    return calculateBPRegenDetailed(move, config).totalBP;
}