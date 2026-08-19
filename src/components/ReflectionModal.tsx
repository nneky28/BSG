import React, { useState } from 'react';
import { ScheduleDay, ReflectionNote } from '../types';
import { getInitials } from '../utils';

interface ReflectionModalProps {
  dayEntry: ScheduleDay;
  notes: ReflectionNote[];
  currentUser: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (text: string, isPublic: boolean) => Promise<void>;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  dayEntry,
  notes,
  currentUser,
  isOpen,
  onClose,
  onSaveNote,
}) => {
  const [newNote, setNewNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newNote.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onSaveNote(trimmed, isPublic);
      setNewNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content reflection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reflection-header">
          <p className="eyebrow">Day {dayEntry.day} · Reflection & Journal</p>
          <h2>{dayEntry.reading}</h2>
          {dayEntry.reflectionPrompt && (
            <div className="prompt-card">
              <span className="prompt-icon">🙏</span>
              <p className="prompt-text"><b>Prayer Focus:</b> {dayEntry.reflectionPrompt}</p>
            </div>
          )}
        </div>

        <div className="notes-section">
          <h3>Reflections & Insights ({notes.length})</h3>
          {notes.length === 0 ? (
            <p className="empty-notes">No reflections written yet for Day {dayEntry.day}. Write a takeaway or key verse below.</p>
          ) : (
            <div className="notes-list">
              {notes.map((note, idx) => (
                <div key={note.id || idx} className="note-card">
                  <div className="note-meta">
                    <div className="av" title={note.author}>
                      {getInitials(note.author)}
                    </div>
                    <b className="note-author">{note.author}{note.author === currentUser ? ' (you)' : ''}</b>
                    <span className="privacy-badge">{note.isPublic ? '👥 Fellowship' : '🔒 Private'}</span>
                    {note.createdAt && (
                      <span className="note-date">
                        {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className="note-body">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="new-note-form">
          <textarea
            placeholder="Write your meditation, key verse, or prayer from today's chapters..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            required
          />
          <div className="modal-reflection-controls">
            <label className="privacy-toggle">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span>{isPublic ? '👥 Share with fellowship' : '🔒 Keep private to me'}</span>
            </label>
            <div className="modal-actions-row">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn" disabled={isSubmitting || !newNote.trim()}>
                {isSubmitting ? 'Saving…' : 'Save Reflection'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
