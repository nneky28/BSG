import React, { useState } from 'react';
import { LedgerMeta } from '../types';
import { formatDate } from '../utils';

interface OnboardingProps {
  meta: LedgerMeta | null;
  onStartSetup: (name: string, startDate: string) => Promise<void>;
  onJoin: (name: string) => Promise<void>;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  meta,
  onStartSetup,
  onJoin,
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (!meta) {
      if (!startDate) return;
      await onStartSetup(trimmedName, startDate);
    } else {
      await onJoin(trimmedName);
    }
  };

  const handleSelectExisting = async (existingName: string) => {
    await onJoin(existingName);
  };

  if (!meta) {
    return (
      <div className="onboard">
        <p className="eyebrow">Bible Study Guide (BSG)</p>
        <h1>Through the Book, Together</h1>
        <p className="sub">
          A progressive journey through all 1,189 chapters of the Bible and scripture meditation.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="onboard-label">Your Name (Initiating Reader):</label>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />

          <label className="onboard-label">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <button type="submit" className="btn">
            Begin Community Reading
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="onboard">
      <p className="eyebrow">27-Week Progressive Bible Reading</p>
      <h1>Through the Book, Together</h1>
      <p className="sub">
        Started {formatDate(new Date(meta.startDate + 'T00:00:00'))} ·{' '}
        {meta.members.length} reader{meta.members.length !== 1 ? 's' : ''} in the fellowship
      </p>

      {meta.members.length > 0 && (
        <div className="onboard-existing">
          <p className="onboard-hint">Returning reader? Tap your name:</p>
          <div className="onboard-members-grid">
            {meta.members.map((memberName) => (
              <button
                key={memberName}
                type="button"
                className="onboard-member-chip"
                onClick={() => handleSelectExisting(memberName)}
              >
                {memberName}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="onboard-name-form">
        <p className="onboard-hint">Or join with a new name:</p>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus={meta.members.length === 0}
          required
        />
        <button type="submit" className="btn">
          Join Fellowship Ledger
        </button>
      </form>
    </div>
  );
};
