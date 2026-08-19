import React, { useState } from 'react';
import { ScheduleDay, ReflectionNote } from '../types';
import { getInitials } from '../utils';

interface ReflectionModalProps {
  dayEntry: ScheduleDay;
  notes: ReflectionNote[];
  currentUser: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (text: string) => Promise<void>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newNote.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onSaveNote(trimmed);
      setNewNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content reflection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reflection-header">
          <p className="eyebrow">Day {dayEntry.day} · Spiritual Takeaway</p>
          <h2>{dayEntry.reading}</h2>
          {dayEntry.reflectionPrompt && (
            <div className="prompt-card">
              <span className="prompt-icon">💡</span>
              <p className="prompt-text">{dayEntry.reflectionPrompt}</p>
            </div>
          )}
        </div>

        <div className="notes-section">
          <h3>Community Insights & Reflections</h3>
          {notes.length === 0 ? (
            <p className="empty-notes">No reflections added yet for Day {dayEntry.day}. Be the first to share what God spoke to you!</p>
          ) : (
            <div className="notes-list">
              {notes.map((note, idx) => (
                <div key={note.id || idx} className="note-card">
                  <div className="note-meta">
                    <div className="av" title={note.author}>
                      {getInitials(note.author)}
                    </div>
                    <b className="note-author">{note.author}{note.author === currentUser ? ' (you)' : ''}</b>
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
            placeholder="Share your meditation, favorite verse, or key insight from today's chapters..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            required
          />
          <div className="modal-actions-row">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn" disabled={isSubmitting || !newNote.trim()}>
              {isSubmitting ? 'Saving…' : 'Share Reflection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
