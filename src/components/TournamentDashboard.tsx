
import React from 'react';
import type { Player, Round, Matchup } from '../types';
import { GameResult, isMatch } from '../types';
import { TrophyIcon, UserGroupIcon, ForwardIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface StandingsTableProps {
    players: Player[];
}

const StandingsTable: React.FC<StandingsTableProps> = ({ players }) => {
    const sortedPlayers = [...players].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.buchholz - a.buchholz;
    });

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <h2 className="text-2xl font-bold p-4 bg-gray-700/50 flex items-center text-yellow-400"><TrophyIcon className="w-6 h-6 mr-3"/>Standings</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
                        <tr>
                            <th className="p-3">Rank</th>
                            <th className="p-3">Name</th>
                            <th className="p-3 text-center">Score</th>
                            <th className="p-3 text-center">Buchholz</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {sortedPlayers.map((p, index) => (
                            <tr key={p.id} className="hover:bg-gray-700/50 transition duration-150">
                                <td className="p-3 font-semibold text-center">{index + 1}</td>
                                <td className="p-3">{p.name}</td>
                                <td className="p-3 text-center font-mono">{p.score.toFixed(1)}</td>
                                <td className="p-3 text-center font-mono">{p.buchholz.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


interface MatchCardProps {
    matchup: Matchup;
    playersMap: Map<number, Player>;
    onResultChange: (matchId: string, result: GameResult) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ matchup, playersMap, onResultChange }) => {
    if (!isMatch(matchup)) {
        const player = playersMap.get(matchup.playerId);
        return (
             <div className="bg-gray-700 rounded-lg p-4 text-center text-gray-400">
                {player?.name} has a bye.
            </div>
        )
    }

    const whitePlayer = playersMap.get(matchup.whitePlayerId);
    const blackPlayer = playersMap.get(matchup.blackPlayerId);

    if (!whitePlayer || !blackPlayer) return null;

    const getButtonClass = (result: GameResult) => {
        const base = "flex-1 py-2 px-1 text-sm rounded-md transition duration-200";
        if (matchup.result === result) {
            return `${base} bg-yellow-500 text-gray-900 font-bold`;
        }
        return `${base} bg-gray-600 hover:bg-gray-500 text-gray-200`;
    };
    
    return (
        <div className="bg-gray-700 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-white">{whitePlayer.name}</span>
                <span className="text-sm text-gray-400">vs</span>
                <span className="font-semibold text-white">{blackPlayer.name}</span>
            </div>
             <div className="flex justify-between items-center text-xs text-gray-400 mb-3 px-1">
                <span>(White)</span>
                <span>(Black)</span>
            </div>
            <div className="flex space-x-2">
                <button onClick={() => onResultChange(matchup.id, GameResult.WHITE_WINS)} className={getButtonClass(GameResult.WHITE_WINS)}>1-0</button>
                <button onClick={() => onResultChange(matchup.id, GameResult.DRAW)} className={getButtonClass(GameResult.DRAW)}>½-½</button>
                <button onClick={() => onResultChange(matchup.id, GameResult.BLACK_WINS)} className={getButtonClass(GameResult.BLACK_WINS)}>0-1</button>
            </div>
        </div>
    );
}

interface TournamentDashboardProps {
    players: Player[];
    currentRoundData: Round;
    totalRounds: number;
    updateResult: (matchId: string, result: GameResult) => void;
    advanceRound: () => void;
}

export const TournamentDashboard: React.FC<TournamentDashboardProps> = ({ players, currentRoundData, totalRounds, updateResult, advanceRound }) => {
    const playersMap = new Map(players.map(p => [p.id, p]));
    const isRoundComplete = currentRoundData.matchups.every(m => !isMatch(m) || m.result !== GameResult.PENDING);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            <header className="text-center">
                <h1 className="text-4xl font-bold text-yellow-400">Round {currentRoundData.roundNumber} <span className="text-gray-400 font-normal">of</span> {totalRounds}</h1>
            </header>

            <div className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-2 space-y-4">
                     <h2 className="text-2xl font-bold flex items-center text-yellow-400"><UserGroupIcon className="w-6 h-6 mr-3"/>Pairings</h2>
                     <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {currentRoundData.matchups.map(m => (
                            <MatchCard key={m.id} matchup={m} playersMap={playersMap} onResultChange={updateResult} />
                        ))}
                    </div>
                </div>

                <div className="md:col-span-3">
                    <StandingsTable players={players} />
                </div>
            </div>

            <footer className="text-center mt-8">
                <button 
                    onClick={advanceRound}
                    disabled={!isRoundComplete}
                    className={`w-full md:w-2/3 py-4 px-8 text-xl font-bold rounded-lg transition duration-300 flex items-center justify-center
                        ${isRoundComplete
                            ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-lg hover:shadow-xl'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                >
                    {isRoundComplete ? <CheckCircleIcon className="w-7 h-7 mr-3"/> : <ForwardIcon className="w-7 h-7 mr-3"/>}
                    {isRoundComplete ? `Finalize Round & Proceed` : `Enter all results to continue`}
                </button>
            </footer>
        </div>
    );
};
