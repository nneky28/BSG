import React from 'react';
import { ProgressMap } from '../types';
import { getCompletedCount } from '../utils';

interface LeaderboardCardProps {
  me: string;
  members: string[];
  progress: ProgressMap;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ me, members, progress }) => {
  const board = members
    .map((name) => ({
      name,
      count: getCompletedCount(name, progress),
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(1, ...board.map((b) => b.count));

  return (
    <div className="card">
      <h2>Leaderboard</h2>
      {board.map((b) => (
        <div key={b.name} className="lb-row">
          <div className="lb-name">
            {b.name}
            {b.name === me ? ' (you)' : ''}
          </div>
          <div className="lb-bar-wrap">
            <div
              className="lb-bar"
              style={{ width: `${(b.count / maxCount) * 100}%` }}
            />
          </div>
          <div className="lb-count">{b.count}/180</div>
        </div>
      ))}
    </div>
  );
};
