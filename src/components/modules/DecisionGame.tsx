import { useState, useCallback } from 'react';
import { initGame, playRound, getHealthLabel } from '../../lib/gameEngine';
import type { GameState } from '../../lib/types';

export function DecisionGame() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [game, setGame] = useState<GameState>(() => initGame('medium'));
  const [lastRound, setLastRound] = useState<typeof game.history[0] | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const startNewGame = useCallback((diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    setGame(initGame(diff));
    setLastRound(null);
    setShowFeedback(false);
  }, []);

  const makeChoice = useCallback((choice: 'signal' | 'silence') => {
    const newState = playRound(game, choice);
    const round = newState.history[newState.history.length - 1];
    setLastRound(round);
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      setGame(newState);
    }, 2500);
  }, [game]);

  const scorePercent = game.optimalScore > 0
    ? ((game.score / game.optimalScore) * 100).toFixed(0)
    : '100';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          The Decision Game
        </h2>
        <p className="text-gray-600">
          You're the AI system designer. At each round, decide whether to send a signal
          (AI recommendation) or stay silent. Learn when silence beats advice.
        </p>
      </div>

      {/* Difficulty selector */}
      <div className="flex gap-2 mb-6">
        {(['easy', 'medium', 'hard'] as const).map(d => (
          <button
            key={d}
            onClick={() => startNewGame(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              difficulty === d
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {game.status === 'playing' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game state */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500">
                Round {game.round + 1} of {game.maxRounds}
              </span>
              <span className="text-sm font-mono text-primary-600">
                Score: {game.score.toFixed(2)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${(game.round / game.maxRounds) * 100}%` }}
              />
            </div>

            {/* State display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">System Health</div>
                <div className="text-2xl font-bold text-gray-900">
                  {getHealthLabel(game.health)}
                </div>
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i <= game.health ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Operator Efficacy</div>
                <div className={`text-2xl font-bold ${
                  game.efficacy === 'H' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {game.efficacy === 'H' ? 'HIGH' : 'LOW'}
                </div>
                <div className={`w-8 h-8 mx-auto mt-2 rounded-full ${
                  game.efficacy === 'H' ? 'bg-green-100' : 'bg-red-100'
                } flex items-center justify-center`}>
                  <span className="text-lg">
                    {game.efficacy === 'H' ? '↑' : '↓'}
                  </span>
                </div>
              </div>
            </div>

            {/* Decision buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => makeChoice('signal')}
                disabled={showFeedback}
                className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-500 transition-all disabled:opacity-50"
              >
                <div className="text-2xl mb-1">{'\u{1F4E2}'}</div>
                <div className="font-semibold text-blue-900">Send Signal</div>
                <div className="text-xs text-blue-600 mt-1">
                  Recommend the optimal action
                </div>
              </button>
              <button
                onClick={() => makeChoice('silence')}
                disabled={showFeedback}
                className="p-4 rounded-xl border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-500 transition-all disabled:opacity-50"
              >
                <div className="text-2xl mb-1">{'\u{1F910}'}</div>
                <div className="font-semibold text-gray-900">Stay Silent</div>
                <div className="text-xs text-gray-600 mt-1">
                  Let operator decide alone
                </div>
              </button>
            </div>
          </div>

          {/* Feedback & History */}
          <div className="space-y-4">
            {/* Last round feedback */}
            {lastRound && showFeedback && (
              <div className={`rounded-xl border-2 p-4 ${
                lastRound.userChoice === lastRound.optimalChoice
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="font-semibold mb-2">
                  {lastRound.userChoice === lastRound.optimalChoice
                    ? 'Correct!' : 'Suboptimal choice'}
                </div>
                <div className="text-sm space-y-1">
                  <div>You chose: <strong>{lastRound.userChoice}</strong></div>
                  <div>Optimal: <strong>{lastRound.optimalChoice}</strong></div>
                  <div>Reward: {lastRound.reward.toFixed(3)}</div>
                  {lastRound.userChoice !== lastRound.optimalChoice && (
                    <div className="mt-2 text-xs">
                      <strong>Why?</strong>{' '}
                      {lastRound.optimalChoice === 'silence'
                        ? 'The efficacy drift cost (E-channel) exceeded the immediate gain. Preserving operator competence was more valuable.'
                        : 'The immediate gain outweighed the drift cost at this state. Signaling was beneficial.'
                      }
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* History */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">
                Round History
              </h3>
              <div className="max-h-64 overflow-y-auto">
                {game.history.length === 0 ? (
                  <p className="text-sm text-gray-400">Make your first decision...</p>
                ) : (
                  <div className="space-y-1">
                    {game.history.map((r, i) => (
                      <div
                        key={i}
                        className={`text-xs flex items-center gap-2 p-1.5 rounded ${
                          r.userChoice === r.optimalChoice ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <span className="text-gray-400 w-5">R{i + 1}</span>
                        <span className={r.userChoice === 'signal' ? 'text-blue-600' : 'text-gray-600'}>
                          {r.userChoice === 'signal' ? '\u{1F4E2}' : '\u{1F910}'}
                        </span>
                        <span className={r.userChoice === r.optimalChoice ? 'text-green-600' : 'text-red-600'}>
                          {r.userChoice === r.optimalChoice ? '✓' : '✗'}
                        </span>
                        <span className="text-gray-500">
                          {getHealthLabel(r.health)} / {r.efficacy}
                        </span>
                        <span className="ml-auto font-mono">
                          +{r.reward.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Game Over Screen */
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-lg mx-auto">
          <div className="text-4xl mb-4">
            {parseInt(scorePercent) >= 90 ? '\u{1F3C6}' : parseInt(scorePercent) >= 70 ? '\u{1F44D}' : '\u{1F4DA}'}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Game Over</h3>

          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Your Score</div>
              <div className="text-2xl font-bold text-gray-900">{game.score.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Optimal Score</div>
              <div className="text-2xl font-bold text-primary-600">{game.optimalScore.toFixed(2)}</div>
            </div>
          </div>

          <div className="text-lg font-semibold mb-2">
            Efficiency: {scorePercent}%
          </div>

          {/* Key insight */}
          <div className="bg-primary-50 rounded-lg p-4 text-sm text-primary-800 mt-4 mb-6 text-left">
            {(() => {
              const overSignaled = game.history.filter(
                r => r.userChoice === 'signal' && r.optimalChoice === 'silence'
              ).length;
              const underSignaled = game.history.filter(
                r => r.userChoice === 'silence' && r.optimalChoice === 'signal'
              ).length;
              if (overSignaled > underSignaled) {
                return `You over-signaled ${overSignaled} times. The key insight: at high-efficacy states, the cost of degrading operator competence often exceeds the immediate benefit of providing advice.`;
              } else if (underSignaled > overSignaled) {
                return `You under-signaled ${underSignaled} times. Some states had enough immediate gain to justify signaling despite the drift cost.`;
              }
              return 'Great balance between signaling and silence!';
            })()}
          </div>

          <button
            onClick={() => startNewGame(difficulty)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
