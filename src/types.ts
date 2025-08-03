
export enum GameResult {
  WHITE_WINS = '1-0',
  BLACK_WINS = '0-1',
  DRAW = '1/2-1/2',
  PENDING = 'PENDING',
}

export interface Player {
  id: number;
  name: string;
  score: number;
  buchholz: number;
  opponentIds: number[];
  hadBye: boolean;
  colorBalance: number; // +1 for each white, -1 for each black
}

export interface Match {
  id: string; 
  whitePlayerId: number;
  blackPlayerId: number;
  result: GameResult;
}

export interface Bye {
  id: string;
  playerId: number;
}

export function isMatch(matchup: Matchup): matchup is Match {
    return 'whitePlayerId' in matchup;
}

export type Matchup = Match | Bye;

export interface Round {
  roundNumber: number;
  matchups: Matchup[];
}

export enum AppState {
  PLAYER_SETUP = 'PLAYER_SETUP',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}
