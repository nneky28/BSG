import React, { useState, useEffect, useCallback } from 'react';
import { LedgerMeta, ProgressMap, ReflectionsMap, PrayerRequest } from './types';
import { CUSTOM_SCHEDULE, TOTAL_CUSTOM_DAYS, CustomDayEntry } from './data/customSchedule';
import { safeGet, safeSet } from './services/storage';
import { ledgerApi } from './services/ledgerApi';
import { getTodayIndex } from './utils';
import { calculateGraceBuffer } from './services/bufferEngine';
import { HeroCard } from './components/HeroCard';
import { WeeklyMemoryVerse } from './components/WeeklyMemoryVerse';
import { DailyCard } from './components/DailyCard';
import { PrayerRequestsCard } from './components/PrayerRequestsCard';
import { LeaderboardCard } from './components/LeaderboardCard';
import { WeekAccordion } from './components/WeekAccordion';
import { Onboarding } from './components/Onboarding';
import { IdentityModal } from './components/IdentityModal';
import { ReflectionModal } from './components/ReflectionModal';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  const [meta, setMeta] = useState<LedgerMeta | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [reflections, setReflections] = useState<ReflectionsMap>({});
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);

  // Modals & UI View State
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [selectedReflectionDay, setSelectedReflectionDay] = useState<CustomDayEntry | null>(null);

  const loadData = useCallback(async () => {
    try {
      const idRes = await safeGet<{ name: string }>('my-identity', false);
      const currentName = idRes?.name || null;
      setMe(currentName);

      const {
        meta: loadedMeta,
        progress: loadedProgress,
        reflections: loadedReflections,
        prayerRequests: loadedPrayers,
      } = await ledgerApi.loadLedger(currentName);

      setMeta(loadedMeta);
      setProgress(loadedProgress);
      setReflections(loadedReflections);
      setPrayerRequests(loadedPrayers);
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = ledgerApi.subscribeToChanges(async () => {
      const {
        meta: refreshedMeta,
        progress: refreshedProgress,
        reflections: refreshedReflections,
        prayerRequests: refreshedPrayers,
      } = await ledgerApi.loadLedger(me);

      if (refreshedMeta) setMeta(refreshedMeta);
      setProgress(refreshedProgress);
      setReflections(refreshedReflections);
      setPrayerRequests(refreshedPrayers);
    });

    return () => {
      unsubscribe();
    };
  }, [me]);

  const handleStartSetup = async (name: string, startDate: string) => {
    setLoading(true);
    try {
      const createdMeta = await ledgerApi.createLedger(name, startDate);
      setMe(name);
      setMeta(createdMeta);
      setProgress({});
      setReflections({});
      setPrayerRequests([]);
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
        setReflections(result.reflections);
        setPrayerRequests(result.prayerRequests);
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

  const handleSaveReflection = async (day: number, text: string, isPublic: boolean) => {
    if (!me) return;
    const updated = await ledgerApi.saveReflection(day, me, text, isPublic, reflections);
    setReflections(updated);
  };

  const handleAddPrayerRequest = async (text: string) => {
    if (!me || !meta) return;
    const expectedDay = getTodayIndex(meta.startDate, TOTAL_CUSTOM_DAYS);
    const currentWeek = Math.ceil(expectedDay / 7);
    const updated = await ledgerApi.addPrayerRequest(me, currentWeek, text, prayerRequests);
    setPrayerRequests(updated);
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

  const expectedDay = getTodayIndex(meta.startDate, TOTAL_CUSTOM_DAYS);
  const currentWeek = Math.ceil(expectedDay / 7);
  const todayEntry = CUSTOM_SCHEDULE[expectedDay - 1] || CUSTOM_SCHEDULE[0];
  const bufferStatus = calculateGraceBuffer(me, progress, expectedDay);

  return (
    <div className="wrap">
      {/* 1. Hero Header with Carry-Forward Grace Buffer & Progressive Pace */}
      <HeroCard
        me={me}
        meta={meta}
        expectedDay={expectedDay}
        currentWeek={currentWeek}
        bufferStatus={bufferStatus}
        memberCount={meta.members.length}
        onSwitchIdentity={() => setIsIdentityModalOpen(true)}
      />

      {/* 2. Active Week's Memory Verse */}
      <WeeklyMemoryVerse currentWeek={currentWeek} />

      {/* 3. Today's Reading Card with 1-Tap Read Link & Prayer Focus */}
      <DailyCard
        me={me}
        expectedDay={expectedDay}
        todayEntry={todayEntry}
        progress={progress}
        reflections={reflections[expectedDay] || []}
        onToggleDay={handleToggleDay}
        onSaveReflection={(text, isPublic) => handleSaveReflection(expectedDay, text, isPublic)}
      />

      {/* 4. Full 27-Week Progressive Schedule */}
      <WeekAccordion
        schedule={CUSTOM_SCHEDULE}
        me={me}
        expectedDay={expectedDay}
        progress={progress}
        reflections={reflections}
        bufferStatus={bufferStatus}
        onToggleDay={handleToggleDay}
        onOpenReflection={(entry) => setSelectedReflectionDay(entry)}
      />

      {/* 5. Fellowship Weekly Prayer Space */}
      <PrayerRequestsCard
        currentWeek={currentWeek}
        currentUser={me}
        prayerRequests={prayerRequests}
        onAddPrayerRequest={handleAddPrayerRequest}
      />

      {/* 6. Fellowship Leaderboard */}
      <LeaderboardCard
        me={me}
        members={meta.members}
        progress={progress}
      />

      {/* Identity Switch Modal */}
      <IdentityModal
        currentName={me}
        members={meta.members}
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        onSelectIdentity={handleSelectIdentity}
      />

      {/* Day Reflection Modal */}
      {selectedReflectionDay && (
        <ReflectionModal
          dayEntry={{
            day: selectedReflectionDay.day,
            reading: selectedReflectionDay.reading,
            chapters: selectedReflectionDay.chapters,
            reflectionPrompt: selectedReflectionDay.prayerPoint,
          }}
          notes={reflections[selectedReflectionDay.day] || []}
          currentUser={me}
          isOpen={true}
          onClose={() => setSelectedReflectionDay(null)}
          onSaveNote={(text, isPublic) =>
            handleSaveReflection(selectedReflectionDay.day, text, isPublic)
          }
        />
      )}
    </div>
  );
};
