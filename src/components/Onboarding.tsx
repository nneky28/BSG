import React, { useState } from 'react';
import { LedgerMeta, PlanId } from '../types';
import { formatDate } from '../utils';
import { READING_PLANS, DEFAULT_PLAN_ID } from '../data/plans';

interface OnboardingProps {
  meta: LedgerMeta | null;
  onStartSetup: (name: string, startDate: string, planId: PlanId) => Promise<void>;
  onJoin: (name: string) => Promise<void>;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  meta,
  onStartSetup,
  onJoin,
}) => {
  const [name, setName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(DEFAULT_PLAN_ID);
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (!meta) {
      if (!startDate) return;
      await onStartSetup(trimmedName, startDate, selectedPlanId);
    } else {
      await onJoin(trimmedName);
    }
  };

  const handleSelectExisting = async (existingName: string) => {
    await onJoin(existingName);
  };

  if (!meta) {
    const plans = Object.values(READING_PLANS);

    return (
      <div className="onboard">
        <p className="eyebrow">Bible Study Guide</p>
        <h1>Set Up the Reading Ledger</h1>
        <p className="sub">
          Through the Book, Together. Choose the pacing that best suits your community.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name (Community leader / reader)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />

          <div className="onboard-plan-picker">
            <label className="onboard-label">Choose Reading Pacing:</label>
            <div className="onboard-plan-options">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`plan-option-chip ${selectedPlanId === p.id ? 'active' : ''}`}
                  onClick={() => setSelectedPlanId(p.id)}
                >
                  <div className="chip-header">
                    <b>{p.title}</b>
                    <span>~{p.avgChaptersPerDay} ch/day</span>
                  </div>
                  <p className="chip-desc">{p.tagline}</p>
                </div>
              ))}
            </div>
          </div>

          <label className="onboard-label">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <button type="submit" className="btn">
            Begin Community Challenge
          </button>
        </form>
      </div>
    );
  }

  const activePlan = READING_PLANS[meta.planId || DEFAULT_PLAN_ID] || READING_PLANS[DEFAULT_PLAN_ID];

  return (
    <div className="onboard">
      <p className="eyebrow">{activePlan.title} · {activePlan.totalDays} Days</p>
      <h1>Through the Book, Together</h1>
      <p className="sub">
        Started {formatDate(new Date(meta.startDate + 'T00:00:00'))} ·{' '}
        {meta.members.length} reader{meta.members.length !== 1 ? 's' : ''} reading together (~{activePlan.avgChaptersPerDay} ch/day)
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
        <p className="onboard-hint">Or enter your name to join:</p>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus={meta.members.length === 0}
          required
        />
        <button type="submit" className="btn">
          Join Ledger
        </button>
      </form>
    </div>
  );
};
