import React, { useState, useEffect, useCallback } from 'react';
import { LedgerMeta, ProgressMap, ReflectionsMap, ScheduleDay, PlanId, FilterView } from './types';
import { READING_PLANS, DEFAULT_PLAN_ID } from './data/plans';
import { safeGet, safeSet } from './services/storage';
import { ledgerApi } from './services/ledgerApi';
import { getTodayIndex, getMissedDays } from './utils';
import { HeroCard } from './components/HeroCard';
import { TodayCard } from './components/TodayCard';
import { CatchUpBanner } from './components/CatchUpBanner';
import { LeaderboardCard } from './components/LeaderboardCard';
import { WeekAccordion } from './components/WeekAccordion';
import { Onboarding } from './components/Onboarding';
import { IdentityModal } from './components/IdentityModal';
import { PlanSelectorModal } from './components/PlanSelectorModal';
import { ReflectionModal } from './components/ReflectionModal';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  const [meta, setMeta] = useState<LedgerMeta | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [reflections, setReflections] = useState<ReflectionsMap>({});

  // Modals & UI View State
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedReflectionDay, setSelectedReflectionDay] = useState<ScheduleDay | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterView>('all');

  const loadData = useCallback(async () => {
    try {
      const idRes = await safeGet<{ name: string }>('my-identity', false);
      setMe(idRes?.name || null);

      const {
        meta: loadedMeta,
        progress: loadedProgress,
        reflections: loadedReflections,
      } = await ledgerApi.loadLedger();

      setMeta(loadedMeta);
      setProgress(loadedProgress);
      setReflections(loadedReflections);
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
      const {
        meta: refreshedMeta,
        progress: refreshedProgress,
        reflections: refreshedReflections,
      } = await ledgerApi.loadLedger();

      if (refreshedMeta) setMeta(refreshedMeta);
      setProgress(refreshedProgress);
      setReflections(refreshedReflections);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleStartSetup = async (name: string, startDate: string, planId: PlanId) => {
    setLoading(true);
    try {
      const createdMeta = await ledgerApi.createLedger(name, startDate, planId);
      setMe(name);
      setMeta(createdMeta);
      setProgress({});
      setReflections({});
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
      }
    } catch (err) {
      console.error('Failed to join ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: PlanId) => {
    if (!meta) return;
    const updated = await ledgerApi.updatePlan(planId, meta);
    setMeta(updated);
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

  const handleSaveReflection = async (text: string) => {
    if (!me || !selectedReflectionDay) return;
    const updated = await ledgerApi.saveReflection(
      selectedReflectionDay.day,
      me,
      text,
      reflections
    );
    setReflections(updated);
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

  const activePlan = READING_PLANS[meta.planId || DEFAULT_PLAN_ID] || READING_PLANS[DEFAULT_PLAN_ID];
  const expectedDay = getTodayIndex(meta.startDate, activePlan.totalDays);
  const todayEntry = activePlan.schedule[expectedDay - 1] || activePlan.schedule[0];
  const missedDays = getMissedDays(me, progress, expectedDay);

  return (
    <div className="wrap">
      <HeroCard
        me={me}
        meta={meta}
        plan={activePlan}
        progress={progress}
        expectedDay={expectedDay}
        onSwitchIdentity={() => setIsIdentityModalOpen(true)}
        onOpenPlanSelector={() => setIsPlanModalOpen(true)}
      />

      <CatchUpBanner
        missedDays={missedDays}
        activeFilter={activeFilter}
        onSelectFilter={(f) => setActiveFilter(f)}
      />

      <TodayCard
        me={me}
        expectedDay={expectedDay}
        todayEntry={todayEntry}
        progress={progress}
        reflections={reflections[expectedDay] || []}
        onToggleDay={handleToggleDay}
        onOpenReflection={(entry) => setSelectedReflectionDay(entry)}
      />

      {/* Filter Tabs */}
      <div className="filter-pill-container">
        <button
          className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All Weeks
        </button>
        <button
          className={`filter-pill ${activeFilter === 'catchup' ? 'active' : ''}`}
          onClick={() => setActiveFilter('catchup')}
        >
          Catch Up {missedDays.length > 0 && `(${missedDays.length})`}
        </button>
        <button
          className={`filter-pill ${activeFilter === 'ahead' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ahead')}
        >
          Read Ahead
        </button>
      </div>

      <WeekAccordion
        schedule={activePlan.schedule}
        me={me}
        expectedDay={expectedDay}
        progress={progress}
        reflections={reflections}
        activeFilter={activeFilter}
        onToggleDay={handleToggleDay}
        onOpenReflection={(entry) => setSelectedReflectionDay(entry)}
      />

      <LeaderboardCard
        me={me}
        members={meta.members}
        progress={progress}
      />

      {/* Modals */}
      <IdentityModal
        currentName={me}
        members={meta.members}
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        onSelectIdentity={handleSelectIdentity}
      />

      <PlanSelectorModal
        currentPlanId={activePlan.id}
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSelectPlan={handleSelectPlan}
      />

      {selectedReflectionDay && (
        <ReflectionModal
          dayEntry={selectedReflectionDay}
          notes={reflections[selectedReflectionDay.day] || []}
          currentUser={me}
          isOpen={true}
          onClose={() => setSelectedReflectionDay(null)}
          onSaveNote={handleSaveReflection}
        />
      )}
    </div>
  );
};
