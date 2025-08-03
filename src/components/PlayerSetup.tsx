import React, { useState } from 'react';
import type { Player } from '../types';
import { TrashIcon, UsersIcon, PlayIcon, HashtagIcon } from '@heroicons/react/24/solid';

interface PlayerSetupProps {
  players: Player[];
  addPlayersFromList: (list: string) => void;
  deletePlayer: (id: number) => void;
  startTournament: (numRounds: number) => void;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ players, addPlayersFromList, deletePlayer, startTournament }) => {
  const [playerList, setPlayerList] = useState('');
  const [numRounds, setNumRounds] = useState(4);
  const canStart = players.length >= 2 && numRounds > 0;

  const handleAddList = () => {
    if (playerList.trim()) {
      addPlayersFromList(playerList);
      setPlayerList('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-gray-800 rounded-xl shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400">Swiss Tournament Setup</h1>
        <p className="text-gray-400 mt-2">Add players and set the number of rounds to begin.</p>
      </div>

      <div className="mb-8">
        {/* Add Multiple Players */}
        <div className="bg-gray-700 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><UsersIcon className="w-6 h-6 mr-2 text-yellow-400" />Bulk Add Players</h2>
          <textarea
            value={playerList}
            onChange={(e) => setPlayerList(e.target.value)}
            placeholder="Enter names, one per line or comma-separated"
            className="w-full h-24 bg-gray-800 border border-gray-600 rounded-md px-4 py-2 mb-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
          />
          <button onClick={handleAddList} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-200">
            Add From List
          </button>
        </div>
      </div>

      {/* Player List */}
      <div className="bg-gray-700 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Current Players ({players.length})</h2>
        {players.length > 0 ? (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {players.map((p) => (
              <li key={p.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-md shadow">
                <span className="truncate text-gray-200">{p.name}</span>
                <button onClick={() => deletePlayer(p.id)} className="text-gray-500 hover:text-red-500 transition duration-200">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-center py-4">No players added yet.</p>
        )}
      </div>
      
      {/* Rounds Setup */}
      <div className="bg-gray-700 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center"><HashtagIcon className="w-6 h-6 mr-2 text-yellow-400" />Number of Rounds</h2>
        <input
            type="number"
            value={numRounds}
            onChange={(e) => setNumRounds(parseInt(e.target.value, 10) || 0)}
            min="1"
            className="w-full bg-gray-800 border border-gray-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            aria-label="Number of rounds"
        />
      </div>

      {/* Start Button */}
      <div className="text-center">
          <button 
            onClick={() => startTournament(numRounds)} 
            disabled={!canStart}
            className={`w-full md:w-1/2 py-4 px-8 text-xl font-bold rounded-lg transition duration-300 flex items-center justify-center
              ${canStart 
                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-lg hover:shadow-xl' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
          >
            <PlayIcon className="w-7 h-7 mr-3" />
            Start Tournament
          </button>
          {!canStart && (
            <p className="text-red-400 mt-3">
              You need at least 2 players and a positive number of rounds to start.
            </p>
          )}
      </div>
    </div>
  );
};
