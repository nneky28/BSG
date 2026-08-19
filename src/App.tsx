import React, { useState, useEffect, useCallback } from 'react';
import { LedgerMeta, ProgressMap } from './types';
import { SCHEDULE } from './data/schedule';
import { safeGet, safeSet } from './services/storage';
import { ledgerApi } from './services/ledgerApi';
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
    try {
      const idRes = await safeGet<{ name: string }>('my-identity', false);
      setMe(idRes?.name || null);

      const { meta: loadedMeta, progress: loadedProgress } = await ledgerApi.loadLedger();
      setMeta(loadedMeta);
      setProgress(loadedProgress);
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription for single group
  useEffect(() => {
    const unsubscribe = ledgerApi.subscribeToChanges(async () => {
      const { meta: refreshedMeta, progress: refreshedProgress } = await ledgerApi.loadLedger();
      if (refreshedMeta) setMeta(refreshedMeta);
      setProgress(refreshedProgress);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleStartSetup = async (name: string, startDate: string) => {
    setLoading(true);
    try {
      const createdMeta = await ledgerApi.createLedger(name, startDate);
      setMe(name);
      setMeta(createdMeta);
      setProgress({});
    } catch (err) {
      console.error('Failed to create ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (name: string) => {
    setLoading(true);
    try {
      const result = await ledgerApi.joinLedger(name);
      if (result) {
        setMe(name);
        setMeta(result.meta);
        setProgress(result.progress);
      }
    } catch (err) {
      console.error('Failed to join ledger:', err);
    } finally {
      setLoading(false);
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

    const newProgress = await ledgerApi.toggleDay(day, me, progress);
    setProgress(newProgress);
  };

  if (loading) {
    return <div className="loading">Opening the ledger…</div>;
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
