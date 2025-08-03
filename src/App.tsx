import React, { useState, useEffect, useCallback } from 'react';
import type { Player, Round, Matchup, Match } from './types';
import { AppState, GameResult, isMatch } from './types';
import { PlayerSetup } from './components/PlayerSetup';
import { TournamentDashboard } from './components/TournamentDashboard';
import { FinalReport } from './components/FinalReport';
import { ArrowPathIcon } from '@heroicons/react/24/solid';


const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(() => {
        return (localStorage.getItem('chess-appState') as AppState) || AppState.PLAYER_SETUP;
    });
    const [players, setPlayers] = useState<Player[]>(() => {
        return JSON.parse(localStorage.getItem('chess-players') || '[]');
    });
    const [rounds, setRounds] = useState<Round[]>(() => {
        return JSON.parse(localStorage.getItem('chess-rounds') || '[]');
    });
    const [currentRound, setCurrentRound] = useState<number>(() => {
         return JSON.parse(localStorage.getItem('chess-currentRound') || '1');
    });
    const [totalRounds, setTotalRounds] = useState<number>(() => {
        return JSON.parse(localStorage.getItem('chess-totalRounds') || '0');
    });
    const [version, setVersion] = useState<string>('');

    useEffect(() => {
        fetch('/metadata.json')
            .then(res => res.json())
            .then(data => setVersion(data.version))
            .catch(console.error);
    }, []);

    useEffect(() => {
        localStorage.setItem('chess-appState', appState);
        localStorage.setItem('chess-players', JSON.stringify(players));
        localStorage.setItem('chess-rounds', JSON.stringify(rounds));
        localStorage.setItem('chess-currentRound', JSON.stringify(currentRound));
        localStorage.setItem('chess-totalRounds', JSON.stringify(totalRounds));
    }, [appState, players, rounds, currentRound, totalRounds]);

    const resetTournament = useCallback(() => {
        if(window.confirm("Are you sure you want to reset? All current tournament data will be lost.")) {
            localStorage.removeItem('chess-appState');
            localStorage.removeItem('chess-players');
            localStorage.removeItem('chess-rounds');
            localStorage.removeItem('chess-currentRound');
            localStorage.removeItem('chess-totalRounds');
            setAppState(AppState.PLAYER_SETUP);
            setPlayers([]);
            setRounds([]);
            setCurrentRound(1);
            setTotalRounds(0);
        }
    }, []);
    
    const addPlayersFromList = (list: string) => {
        const names = list.split(/[\n,]/).map(name => name.trim()).filter(Boolean);
        const existingNames = new Set(players.map(p => p.name.toLowerCase()));
        const newPlayers: Player[] = [];
        names.forEach(name => {
            if (!existingNames.has(name.toLowerCase())) {
                newPlayers.push({
                    id: Date.now() + Math.random(),
                    name,
                    score: 0,
                    buchholz: 0,
                    opponentIds: [],
                    hadBye: false,
                    colorBalance: 0,
                });
                existingNames.add(name.toLowerCase());
            }
        });
        setPlayers(prev => [...prev, ...newPlayers]);
    };

    const deletePlayer = (id: number) => {
        setPlayers(prev => prev.filter(p => p.id !== id));
    };

    const calculateAllBuchholz = (currentPlayers: Player[], allRounds: Round[]) => {
        const playersMap = new Map(currentPlayers.map(p => [p.id, p]));
        return currentPlayers.map(player => {
            const buchholz = player.opponentIds.reduce((sum, oppId) => {
                const opponent = playersMap.get(oppId);
                return sum + (opponent?.score || 0);
            }, 0);
            return { ...player, buchholz };
        });
    };
    
    const pairNewRound = useCallback((playersToPair: Player[], roundNumber: number): Matchup[] => {
        let availablePlayers = [...playersToPair].sort((a, b) => b.score - a.score);
        const matchups: Matchup[] = [];

        // Handle bye
        if (availablePlayers.length % 2 !== 0) {
            let byePlayer = availablePlayers.reverse().find(p => !p.hadBye);
            if (!byePlayer) byePlayer = availablePlayers[0]; // everyone has had a bye, give to lowest ranked
            
            matchups.push({ id: `${roundNumber}-bye-${byePlayer.id}`, playerId: byePlayer.id });
            availablePlayers = availablePlayers.filter(p => p.id !== byePlayer!.id);
            availablePlayers.reverse(); // back to score-sorted
        }
        
        const pairedPlayerIds = new Set<number>();

        for (const playerA of availablePlayers) {
            if (pairedPlayerIds.has(playerA.id)) continue;

            for (const playerB of availablePlayers) {
                if (playerA.id === playerB.id || pairedPlayerIds.has(playerB.id)) continue;
                if (!playerA.opponentIds.includes(playerB.id)) {
                    
                    const whiteGoesFirst = playerA.colorBalance <= playerB.colorBalance;
                    const whitePlayer = whiteGoesFirst ? playerA : playerB;
                    const blackPlayer = whiteGoesFirst ? playerB : playerA;

                    matchups.push({
                        id: `${roundNumber}-${whitePlayer.id}-${blackPlayer.id}`,
                        whitePlayerId: whitePlayer.id,
                        blackPlayerId: blackPlayer.id,
                        result: GameResult.PENDING,
                    });
                    pairedPlayerIds.add(playerA.id);
                    pairedPlayerIds.add(playerB.id);
                    break;
                }
            }
        }
        return matchups;
    }, []);

    const startTournament = (numRounds: number) => {
        if (players.length < 2 || numRounds <= 0) return;
        setTotalRounds(numRounds);
        
        const firstRoundMatchups = pairNewRound(players, 1);
        const firstRound: Round = { roundNumber: 1, matchups: firstRoundMatchups };

        setRounds([firstRound]);
        setCurrentRound(1);
        setAppState(AppState.IN_PROGRESS);
    };

    const updateResult = (matchId: string, result: GameResult) => {
        const newRounds = [...rounds];
        const currentRoundData = newRounds.find(r => r.roundNumber === currentRound);
        if (!currentRoundData) return;

        const matchupIndex = currentRoundData.matchups.findIndex(m => m.id === matchId);
        if (matchupIndex === -1) return;

        const matchup = currentRoundData.matchups[matchupIndex];
        if (isMatch(matchup)) {
           (currentRoundData.matchups[matchupIndex] as Match).result = result;
        }
        setRounds(newRounds);
    };
    
    const advanceRound = () => {
        // 1. Update scores from the completed round
        let updatedPlayers = [...players];
        const playersMap = new Map(updatedPlayers.map(p => [p.id, p]));
        const lastRound = rounds.find(r => r.roundNumber === currentRound);

        if (!lastRound) return;

        for (const matchup of lastRound.matchups) {
            if (isMatch(matchup)) {
                const white = playersMap.get(matchup.whitePlayerId)!;
                const black = playersMap.get(matchup.blackPlayerId)!;
                
                white.opponentIds.push(black.id);
                black.opponentIds.push(white.id);
                white.colorBalance += 1;
                black.colorBalance -=1;
                
                if (matchup.result === GameResult.WHITE_WINS) white.score += 1;
                else if (matchup.result === GameResult.BLACK_WINS) black.score += 1;
                else if (matchup.result === GameResult.DRAW) {
                    white.score += 0.5;
                    black.score += 0.5;
                }
            } else { // It's a Bye
                const player = playersMap.get(matchup.playerId)!;
                player.score += 1;
                player.hadBye = true;
            }
        }
        updatedPlayers = Array.from(playersMap.values());
        
        // 2. Calculate Buchholz scores
        updatedPlayers = calculateAllBuchholz(updatedPlayers, rounds);
        setPlayers(updatedPlayers);
        
        // 3. Check if tournament is finished
        if (currentRound >= totalRounds) {
            setAppState(AppState.FINISHED);
            return;
        }

        // 4. Pair next round
        const nextRoundNumber = currentRound + 1;
        const nextRoundMatchups = pairNewRound(updatedPlayers, nextRoundNumber);
        const nextRound: Round = { roundNumber: nextRoundNumber, matchups: nextRoundMatchups };
        setRounds([...rounds, nextRound]);
        setCurrentRound(nextRoundNumber);
    };


    const renderContent = () => {
        switch (appState) {
            case AppState.PLAYER_SETUP:
                return <PlayerSetup players={players} addPlayersFromList={addPlayersFromList} deletePlayer={deletePlayer} startTournament={startTournament} />;
            case AppState.IN_PROGRESS:
                const currentRoundData = rounds.find(r => r.roundNumber === currentRound);
                if (!currentRoundData) return <div>Error: Current round not found.</div>;
                return <TournamentDashboard players={players} currentRoundData={currentRoundData} totalRounds={totalRounds} updateResult={updateResult} advanceRound={advanceRound} />;
            case AppState.FINISHED:
                return <FinalReport players={players} resetTournament={resetTournament} />;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 relative">
          {appState !== AppState.PLAYER_SETUP && (
            <button onClick={resetTournament} className="absolute top-4 right-4 bg-red-800 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center z-10">
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Reset
            </button>
          )}
          {renderContent()}
          {version && (
            <div className="fixed bottom-4 right-4 text-xs text-gray-500 font-mono z-10" aria-label={`Version ${version}`}>
                v{version}
            </div>
           )}
        </div>
    );
};

export default App;