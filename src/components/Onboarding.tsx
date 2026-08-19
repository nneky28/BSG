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

  if (!meta) {
    return (
      <div className="onboard">
        <p className="eyebrow">New challenge</p>
        <h1>Start the reading ledger</h1>
        <p className="sub">
          1,189 chapters across 180 days (~6-7 chapters/day). Set your name and a
          start date — your friends will join the same ledger.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <button type="submit" className="btn">
            Begin
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="onboard">
      <p className="eyebrow">Joining a ledger already in progress</p>
      <h1>What's your name?</h1>
      <p className="sub">
        Started {formatDate(new Date(meta.startDate + 'T00:00:00'))} ·{' '}
        {meta.members.length} reader{meta.members.length !== 1 ? 's' : ''} so
        far
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <button type="submit" className="btn">
          Join
        </button>
      </form>
    </div>
  );
};
