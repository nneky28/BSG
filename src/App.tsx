import React, { useState, useEffect, useCallback } from 'react';
import { LedgerMeta, ProgressMap } from './types';
import { SCHEDULE } from './data/schedule';
import { safeGet, safeSet } from './services/storage';
import { getTodayIndex } from './utils';
import { HeroCard } from './components/HeroCard';
import { TodayCard } from './components/TodayCard';
import { LeaderboardCard } from './components/LeaderboardCard';
import { WeekAccordion } from './components/WeekAccordion';
import { Onboarding } from './components/Onboarding';
import { IdentityModal } from './components/IdentityModal';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  const [meta, setMeta] = useState<LedgerMeta | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const idRes = await safeGet<{ name: string }>('my-identity', false);
      setMe(idRes?.name || null);
    } catch {
      setMe(null);
    }

    try {
      const metaRes = await safeGet<LedgerMeta>('meta', true);
      setMeta(metaRes || null);
    } catch {
      setMeta(null);
    }

    try {
      const progRes = await safeGet<ProgressMap>('progress', true);
      setProgress(progRes || {});
    } catch {
      setProgress({});
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartSetup = async (name: string, startDate: string) => {
    const newMeta: LedgerMeta = {
      startDate,
      members: [name],
    };
    await safeSet('my-identity', { name }, false);
    await safeSet('meta', newMeta, true);
    await safeSet('progress', {}, true);

    setMe(name);
    setMeta(newMeta);
    setProgress({});
  };

  const handleJoin = async (name: string) => {
    await safeSet('my-identity', { name }, false);
    setMe(name);

    if (meta && !meta.members.includes(name)) {
      const updatedMeta: LedgerMeta = {
        ...meta,
        members: [...meta.members, name],
      };
      await safeSet('meta', updatedMeta, true);
      setMeta(updatedMeta);
    }
  };

  const handleSelectIdentity = async (name: string) => {
    await safeSet('my-identity', { name }, false);
    setMe(name);

    if (meta && !meta.members.includes(name)) {
      const updatedMeta: LedgerMeta = {
        ...meta,
        members: [...meta.members, name],
      };
      await safeSet('meta', updatedMeta, true);
      setMeta(updatedMeta);
    }
  };

  const handleToggleDay = async (day: number) => {
    if (!me) return;

    const currentDayReaders = progress[day] ? [...progress[day]] : [];
    const index = currentDayReaders.indexOf(me);

    if (index >= 0) {
      currentDayReaders.splice(index, 1);
    } else {
      currentDayReaders.push(me);
    }

    const updatedProgress: ProgressMap = {
      ...progress,
      [day]: currentDayReaders,
    };

    setProgress(updatedProgress);
    await safeSet('progress', updatedProgress, true);
  };

  if (loading) {
    return (
      <div className="loading">
        Opening the ledger…
      </div>
    );
  }

  if (!meta || !me) {
    return (
      <Onboarding
        meta={meta}
        onStartSetup={handleStartSetup}
        onJoin={handleJoin}
      />
    );
  }

  const expectedDay = getTodayIndex(meta.startDate);
  const todayEntry = SCHEDULE[expectedDay - 1] || SCHEDULE[0];

  return (
    <div className="wrap">
      <HeroCard
        me={me}
        meta={meta}
        progress={progress}
        expectedDay={expectedDay}
        onSwitchIdentity={() => setIsIdentityModalOpen(true)}
      />

      <TodayCard
        me={me}
        expectedDay={expectedDay}
        todayEntry={todayEntry}
        progress={progress}
        onToggleDay={handleToggleDay}
      />

      <LeaderboardCard
        me={me}
        members={meta.members}
        progress={progress}
      />

      <WeekAccordion
        schedule={SCHEDULE}
        me={me}
        expectedDay={expectedDay}
        progress={progress}
        onToggleDay={handleToggleDay}
      />

      <IdentityModal
        currentName={me}
        members={meta.members}
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        onSelectIdentity={handleSelectIdentity}
      />
    </div>
  );
};
