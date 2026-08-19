import React, { useState } from 'react';
import { PrayerRequest } from '../types';
import { getInitials } from '../utils';

interface PrayerRequestsCardProps {
  currentWeek: number;
  currentUser: string;
  prayerRequests: PrayerRequest[];
  onAddPrayerRequest: (text: string) => Promise<void>;
}

export const PrayerRequestsCard: React.FC<PrayerRequestsCardProps> = ({
  currentWeek,
  currentUser,
  prayerRequests,
  onAddPrayerRequest,
}) => {
  const [newPrayer, setNewPrayer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPrayer.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onAddPrayerRequest(trimmed);
      setNewPrayer('');
      setIsExpanded(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card prayer-card">
      <div className="prayer-header">
        <h2>
          Fellowship Prayer Requests <span className="n">Week {currentWeek}</span>
        </h2>
        <span className="prayer-count-pill">{prayerRequests.length} request{prayerRequests.length !== 1 ? 's' : ''}</span>
      </div>

      <p className="prayer-intro">
        "Carry each other’s burdens, and in this way you will fulfill the law of Christ." (Galatians 6:2)
      </p>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="prayer-input-form">
        <input
          type="text"
          placeholder="Share a prayer request with your fellowship..."
          value={newPrayer}
          onChange={(e) => setNewPrayer(e.target.value)}
          required
        />
        <button type="submit" className="btn-prayer-submit" disabled={isSubmitting || !newPrayer.trim()}>
          {isSubmitting ? 'Posting…' : 'Share Prayer'}
        </button>
      </form>

      {/* Prayer List */}
      {prayerRequests.length > 0 && (
        <div className="prayers-list-wrap">
          <div className="prayers-list">
            {(isExpanded ? prayerRequests : prayerRequests.slice(0, 3)).map((req) => (
              <div key={req.id} className="prayer-item">
                <div className="prayer-item-header">
                  <div className="av" title={req.author}>
                    {getInitials(req.author)}
                  </div>
                  <b className="prayer-author">{req.author}{req.author === currentUser ? ' (you)' : ''}</b>
                  <span className="prayer-week-tag">Week {req.week}</span>
                </div>
                <p className="prayer-body">{req.text}</p>
              </div>
            ))}
          </div>

          {prayerRequests.length > 3 && (
            <button
              type="button"
              className="btn-toggle-prayers"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '▲ Show Less' : `▼ View All ${prayerRequests.length} Prayer Requests`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
