import React, { useState } from 'react';
import { LedgerMeta } from '../types';
import { formatDate } from '../utils';

interface OnboardingProps {
  meta: LedgerMeta | null;
  onStartSetup: (name: string, startDate: string) => Promise<void>;
  onJoin: (name: string, code?: string) => Promise<void>;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  meta,
  onStartSetup,
  onJoin,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (!meta) {
      if (tab === 'create') {
        if (!startDate) return;
        await onStartSetup(trimmedName, startDate);
      } else {
        await onJoin(trimmedName, code.trim().toUpperCase());
      }
    } else {
      await onJoin(trimmedName, meta.code);
    }
  };

  if (!meta) {
    return (
      <div className="onboard">
        <p className="eyebrow">Bible Study Guide</p>
        <h1>Bible Reading Ledger</h1>
        <p className="sub">
          1,189 chapters across 180 days (~6-7 chapters/day). Read together and track progress in real-time.
        </p>

        <div className="tab-switch">
          <button
            type="button"
            className={`tab-btn ${tab === 'create' ? 'active' : ''}`}
            onClick={() => setTab('create')}
          >
            Create New Group
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === 'join' ? 'active' : ''}`}
            onClick={() => setTab('join')}
          >
            Join Existing Group
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />

          {tab === 'create' ? (
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          ) : (
            <input
              type="text"
              placeholder="6-character Group Code (e.g. AB12CD)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={10}
              required
            />
          )}

          <button type="submit" className="btn">
            {tab === 'create' ? 'Begin Challenge' : 'Join Group'}
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
        {meta.members.length} reader{meta.members.length !== 1 ? 's' : ''} so far
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
