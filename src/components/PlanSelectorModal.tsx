import React from 'react';
import { PlanId } from '../types';
import { READING_PLANS } from '../data/plans';

interface PlanSelectorModalProps {
  currentPlanId: PlanId;
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: PlanId) => Promise<void>;
}

export const PlanSelectorModal: React.FC<PlanSelectorModalProps> = ({
  currentPlanId,
  isOpen,
  onClose,
  onSelectPlan,
}) => {
  if (!isOpen) return null;

  const plans = Object.values(READING_PLANS);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content plan-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Reading Pace & Plan</h2>
        <p className="sub">
          Select the pacing that best suits your community's spiritual rhythm and study capacity.
        </p>

        <div className="plan-list">
          {plans.map((plan) => {
            const isSelected = plan.id === currentPlanId;
            return (
              <div
                key={plan.id}
                className={`plan-card ${isSelected ? 'active' : ''}`}
                onClick={async () => {
                  if (!isSelected) {
                    await onSelectPlan(plan.id);
                    onClose();
                  }
                }}
              >
                <div className="plan-card-top">
                  <div className="plan-card-title">
                    <b>{plan.title}</b>
                    {isSelected && <span className="current-badge">Active Plan</span>}
                  </div>
                  <span className="plan-duration">{plan.totalDays} Days · ~{plan.avgChaptersPerDay} ch/day</span>
                </div>
                <p className="plan-tagline">{plan.tagline}</p>
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
