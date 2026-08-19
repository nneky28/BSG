import React from 'react';

interface CatchUpBannerProps {
  missedDays: number[];
  activeFilter: string;
  onSelectFilter: (filter: 'all' | 'today' | 'catchup' | 'ahead') => void;
}

export const CatchUpBanner: React.FC<CatchUpBannerProps> = ({
  missedDays,
  activeFilter,
  onSelectFilter,
}) => {
  if (missedDays.length === 0) {
    return (
      <div className="grace-banner on-track">
        <span className="grace-icon">✨</span>
        <div className="grace-text">
          <b>You are completely up to date!</b>
          <span>Keep dwelling deeply in God's word today.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grace-banner needs-catchup">
      <span className="grace-icon">🌱</span>
      <div className="grace-text">
        <b>Grace & Flexibility: {missedDays.length} day{missedDays.length > 1 ? 's' : ''} to catch up</b>
        <span>No rush — cover missed chapters whenever you have time without breaking your flow.</span>
      </div>
      <button
        className={`btn-grace ${activeFilter === 'catchup' ? 'active' : ''}`}
        onClick={() => onSelectFilter(activeFilter === 'catchup' ? 'all' : 'catchup')}
      >
        {activeFilter === 'catchup' ? 'Show All Days' : 'View Missed Days'}
      </button>
    </div>
  );
};
