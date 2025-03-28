import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export interface ServerToClientEvents {
  'gameState.update': (state: any) => void;
  'duel.initiated': (data: { attackingPiece: any; defendingPiece: any; position: any }) => void;
  'duel.awaitingAllocation': (data: { remainingBP: number }) => void;
  'duel.outcome': (data: { winner: string; result: string; attackerAllocation: number; defenderAllocation: number }) => void;
  'retreat.options': (data: { piece: any; validPositions: any[]; costs: number[] }) => void;
  'game.check': (data: { kingPosition: any }) => void;
  'game.checkmate': (data: { winner: string }) => void;
  'game.draw': (data: { reason: string }) => void;
  'bp.update': (data: { currentBP: number }) => void;
  'error.validation': (data: { message: string; code: string }) => void;
  'error.illegal': (data: { message: string; code: string }) => void;
  'chat.message': (data: { playerId: string; playerName: string; message: string; timestamp: number }) => void;
  'spectator.joined': (data: { spectatorName: string; spectatorCount: number }) => void;
  'spectator.left': (data: { spectatorName: string; spectatorCount: number }) => void;
}

export interface ClientToServerEvents {
  'move.execute': (data: { from: any; to: any; piece: any }) => void;
  'duel.allocate': (data: { amount: number }) => void;
  'retreat.select': (data: { position: any }) => void;
  'game.resign': () => void;
  'game.offerDraw': () => void;
  'game.respondDraw': (data: { accept: boolean }) => void;
  'connection.ping': (data: { timestamp: number }) => void;
  'chat.send': (data: { message: string }) => void;
  'spectator.join': (data: { name: string }) => void;
  'player.setName': (data: { name: string }) => void;
}

export interface InterServerEvents {
  'game.stateChange': (gameId: string) => void;
  'player.disconnect': (playerId: string) => void;
  'player.reconnect': (playerId: string, socketId: string) => void;
}

export interface SocketData {
  playerId?: string;
  gameId?: string;
  isSpectator?: boolean;
  playerName?: string;
  color?: 'white' | 'black';
}

export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;
export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>; 