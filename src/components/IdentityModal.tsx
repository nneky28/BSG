import React, { useState } from 'react';

interface IdentityModalProps {
  currentName: string;
  members: string[];
  isOpen: boolean;
  onClose: () => void;
  onSelectIdentity: (name: string) => void;
}

export const IdentityModal: React.FC<IdentityModalProps> = ({
  currentName,
  members,
  isOpen,
  onClose,
  onSelectIdentity,
}) => {
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const handleSelect = (name: string) => {
    onSelectIdentity(name);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (trimmed) {
      handleSelect(trimmed);
      setCustomName('');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Switch Reader Profile</h2>
        <p className="sub">Select an existing reader or add a new reader name on this device.</p>

        {members.length > 0 && (
          <div className="member-list">
            {members.map((name) => (
              <button
                key={name}
                className={`member-btn ${name === currentName ? 'active' : ''}`}
                onClick={() => handleSelect(name)}
              >
                <span>{name}</span>
                {name === currentName && <span className="current-badge">Active</span>}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleCustomSubmit} className="new-reader-form">
          <input
            type="text"
            placeholder="Or enter new reader name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <button type="submit" className="btn">
            Switch / Add
          </button>
        </form>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
