
import React from 'react';
import type { Player } from '../types';
import { TrophyIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface FinalReportProps {
  players: Player[];
  resetTournament: () => void;
}

export const FinalReport: React.FC<FinalReportProps> = ({ players, resetTournament }) => {
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.buchholz - a.buchholz;
  });

  const generateHtmlReport = () => {
    const tableHtml = `
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
            <th>Buchholz</th>
          </tr>
        </thead>
        <tbody>
          ${sortedPlayers.map((p, index) => `
            <tr>
              <td style="text-align: center;">${index + 1}</td>
              <td>${p.name}</td>
              <td style="text-align: center;">${p.score.toFixed(1)}</td>
              <td style="text-align: center;">${p.buchholz.toFixed(1)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chess Tournament Final Report</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          thead { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>Final Tournament Standings</h1>
        ${tableHtml}
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tournament_report.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-gray-800 rounded-xl shadow-2xl">
      <div className="text-center mb-8">
        <TrophyIcon className="w-24 h-24 mx-auto text-yellow-400" />
        <h1 className="text-4xl font-bold mt-4">Tournament Finished!</h1>
        <p className="text-gray-400 mt-2">Congratulations to all participants.</p>
      </div>

      <div className="bg-gray-700 rounded-lg shadow-lg overflow-hidden mb-8">
        <h2 className="text-2xl font-bold p-4 bg-gray-700/50 text-yellow-400">Final Standings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-600 text-gray-300 uppercase text-sm">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Name</th>
                <th className="p-3 text-center">Score</th>
                <th className="p-3 text-center">Buchholz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {sortedPlayers.map((p, index) => (
                <tr key={p.id} className="hover:bg-gray-600/50 transition duration-150">
                  <td className={`p-3 font-semibold text-center ${index < 3 ? 'text-yellow-400' : ''}`}>{index + 1}</td>
                  <td className="p-3">{p.name}</td>
                  <td className="p-3 text-center font-mono">{p.score.toFixed(1)}</td>
                  <td className="p-3 text-center font-mono">{p.buchholz.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <button
          onClick={generateHtmlReport}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center text-lg"
        >
          <ArrowDownTrayIcon className="w-6 h-6 mr-2" />
          Download HTML Report
        </button>
        <button
          onClick={resetTournament}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center text-lg"
        >
          <ArrowPathIcon className="w-6 h-6 mr-2" />
          Start New Tournament
        </button>
      </div>
    </div>
  );
};
