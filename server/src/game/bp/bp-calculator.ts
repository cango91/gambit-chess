import { GambitMove, GameConfig, SpecialAttackType, TacticsDTO, PinDTO, SkewerDTO, ForkDTO, DiscoveredAttackDTO, CheckDTO } from "@gambit-chess/shared";
import { PieceSymbol, Square } from 'chess.js';
import { detectTactics } from "../tactics";

export function calculateBPRegen(move: GambitMove, config: GameConfig): number {
    let bpRegen = config.regenerationRules.baseTurnRegeneration;
    const tactics: TacticsDTO[] = detectTactics(move);
    const handledCheckSources = new Set<Square>();

    for (const tactic of tactics) {
        if (tactic.type === SpecialAttackType.DISCOVERED_ATTACK && tactic.isCheck) {
            const rule = config.regenerationRules.specialAttackRegeneration[SpecialAttackType.DISCOVERED_ATTACK];
            if (rule && rule.enabled) {
                let formula = rule.formula;
                let regenForTactic = 0;
                const discoveredAttackTactic = tactic as DiscoveredAttackDTO;
                try {
                    if (discoveredAttackTactic.attackedPiece) {
                        const attackedPieceValue = config.pieceValues[discoveredAttackTactic.attackedPiece.type as PieceSymbol];
                        formula = formula.replace('attackedPieceValue', attackedPieceValue.toString());
                        regenForTactic = eval(formula);
                        bpRegen += regenForTactic;
                        handledCheckSources.add(discoveredAttackTactic.attackedBy.square);
                    }
                } catch (error) {
                     console.error(`Error evaluating BP regen formula for ${tactic.type}: ${rule.formula}`, error);
                }
            }
        }
    }

    for(const tactic of tactics){
        if (tactic.type === SpecialAttackType.DISCOVERED_ATTACK && tactic.isCheck) {
            continue;
        }

        const rule = config.regenerationRules.specialAttackRegeneration[tactic.type];
        if (!rule || !rule.enabled) {
            continue;
        }

        let formula = rule.formula;
        let regenForTactic = 0;

        try {
            switch(tactic.type){
                case SpecialAttackType.PIN:
                    const pinTactic = tactic as PinDTO;
                    if (pinTactic.pinnedPiece && pinTactic.pinnedTo) {
                        const pinnedPieceValue = config.pieceValues[pinTactic.pinnedPiece.type];
                        const isPinnedToKing = pinTactic.pinnedTo.type === 'k';
                        formula = formula.replace('pinnedPieceValue', pinnedPieceValue.toString());
                        formula = formula.replace('isPinnedToKing', isPinnedToKing.toString());
                        regenForTactic = eval(formula);
                    }
                    break;
                case SpecialAttackType.SKEWER:
                    const skewerTactic = tactic as SkewerDTO;
                    if (skewerTactic.skeweredPiece && skewerTactic.skeweredTo) {
                        const frontPieceValue = config.pieceValues[skewerTactic.skeweredPiece.type];
                        const backPieceValue = config.pieceValues[skewerTactic.skeweredTo.type];
                        formula = formula.replace('frontPieceValue', frontPieceValue.toString());
                        formula = formula.replace('backPieceValue', backPieceValue.toString());
                        regenForTactic = eval(formula);
                    }
                    break;
                case SpecialAttackType.FORK:
                    const forkTactic = tactic as ForkDTO;
                    if (forkTactic.forkedPieces && forkTactic.forkedPieces.length > 0) {
                        const forkedPiecesValues = forkTactic.forkedPieces.map(p => config.pieceValues[p.type]);
                        const populatedFormula = formula.replace('...forkedPiecesValues', forkedPiecesValues.join(', '));
                        regenForTactic = eval(populatedFormula);
                    }
                    break;
                case SpecialAttackType.DISCOVERED_ATTACK:
                    const discoveredAttackTactic = tactic as DiscoveredAttackDTO;
                     if (discoveredAttackTactic.attackedPiece) {
                        const attackedPieceValue = config.pieceValues[discoveredAttackTactic.attackedPiece.type as PieceSymbol];
                        formula = formula.replace('attackedPieceValue', attackedPieceValue.toString());
                        regenForTactic = eval(formula);
                    }
                    break;
                case SpecialAttackType.CHECK:
                    const checkTactic = tactic as CheckDTO;
                    if (!handledCheckSources.has(checkTactic.checkingPiece.square)) {
                        regenForTactic = eval(formula);
                    }
                    break;
                default:
                    const _exhaustiveCheck: never = tactic;
                    console.warn(`Unhandled tactic type: ${(_exhaustiveCheck as any)?.type}`);
                    break;
            }
        } catch (error) {
            console.error(`Error evaluating BP regen formula for ${tactic.type}: ${rule.formula}`, error);
            regenForTactic = 0;
        }

        bpRegen += regenForTactic;
    }

    if (config.regenerationRules.turnRegenCap !== undefined) {
        bpRegen = Math.min(bpRegen, config.regenerationRules.turnRegenCap);
    }

    return bpRegen;
}