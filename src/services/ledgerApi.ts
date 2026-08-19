import { supabase, isSupabaseConfigured } from './supabase';
import { LedgerMeta, ProgressMap, ReflectionsMap, ReflectionNote, PlanId } from '../types';
import { safeGet, safeSet } from './storage';
import { DEFAULT_PLAN_ID } from '../data/plans';

const DEFAULT_LEDGER_CODE = 'BSG-MAIN';

export const ledgerApi = {
  /**
   * Load the primary community ledger, reading progress, and reflections.
   */
  async loadLedger(): Promise<{
    meta: LedgerMeta | null;
    progress: ProgressMap;
    reflections: ReflectionsMap;
  }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: ledger, error: ledgerErr } = await supabase
          .from('ledgers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!ledgerErr && ledger) {
          // Fetch members
          const { data: members } = await supabase
            .from('members')
            .select('name')
            .eq('ledger_id', ledger.id)
            .order('created_at', { ascending: true });

          // Fetch progress
          const { data: progressRows } = await supabase
            .from('reading_progress')
            .select('day_number, member_name')
            .eq('ledger_id', ledger.id);

          const progress: ProgressMap = {};
          (progressRows || []).forEach((row) => {
            if (!progress[row.day_number]) {
              progress[row.day_number] = [];
            }
            progress[row.day_number].push(row.member_name);
          });

          // Fetch reflections
          const { data: reflectionRows } = await supabase
            .from('reflections')
            .select('id, day_number, member_name, note, created_at')
            .eq('ledger_id', ledger.id)
            .order('created_at', { ascending: true });

          const reflections: ReflectionsMap = {};
          (reflectionRows || []).forEach((row) => {
            if (!reflections[row.day_number]) {
              reflections[row.day_number] = [];
            }
            reflections[row.day_number].push({
              id: row.id,
              day: row.day_number,
              author: row.member_name,
              text: row.note,
              createdAt: row.created_at,
            });
          });

          const meta: LedgerMeta = {
            code: ledger.code,
            title: ledger.title,
            planId: (ledger.plan_id as PlanId) || DEFAULT_PLAN_ID,
            startDate: ledger.start_date,
            members: (members || []).map((m) => m.name),
          };

          await safeSet('meta', meta, true);
          await safeSet('progress', progress, true);
          await safeSet('reflections', reflections, true);

          return { meta, progress, reflections };
        }
      } catch (err) {
        console.warn('Failed to load from Supabase, fallback to local storage:', err);
      }
    }

    // Fallback to local storage
    const meta = await safeGet<LedgerMeta>('meta', true);
    const progress = (await safeGet<ProgressMap>('progress', true)) || {};
    const reflections = (await safeGet<ReflectionsMap>('reflections', true)) || {};
    return { meta, progress, reflections };
  },

  /**
   * Initialize community reading ledger with selected plan.
   */
  async createLedger(
    creatorName: string,
    startDate: string,
    planId: PlanId = DEFAULT_PLAN_ID,
    title = 'Through the Book, Together'
  ): Promise<LedgerMeta> {
    const code = DEFAULT_LEDGER_CODE;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: ledger, error: ledgerErr } = await supabase
          .from('ledgers')
          .upsert(
            [{ code, title, plan_id: planId, start_date: startDate }],
            { onConflict: 'code' }
          )
          .select()
          .single();

        if (!ledgerErr && ledger) {
          await supabase
            .from('members')
            .upsert(
              [{ ledger_id: ledger.id, name: creatorName }],
              { onConflict: 'ledger_id,name' }
            );

          const meta: LedgerMeta = {
            code: ledger.code,
            title: ledger.title,
            planId,
            startDate: ledger.start_date,
            members: [creatorName],
          };

          await safeSet('my-identity', { name: creatorName }, false);
          await safeSet('meta', meta, true);
          await safeSet('progress', {}, true);
          await safeSet('reflections', {}, true);

          return meta;
        }
      } catch (err) {
        console.warn('Supabase createLedger failed, using local storage:', err);
      }
    }

    const localMeta: LedgerMeta = {
      code,
      title,
      planId,
      startDate,
      members: [creatorName],
    };
    await safeSet('my-identity', { name: creatorName }, false);
    await safeSet('meta', localMeta, true);
    await safeSet('progress', {}, true);
    await safeSet('reflections', {}, true);
    return localMeta;
  },

  /**
   * Update the reading plan for the ledger.
   */
  async updatePlan(planId: PlanId, currentMeta: LedgerMeta): Promise<LedgerMeta> {
    const updated: LedgerMeta = { ...currentMeta, planId };

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('ledgers')
          .update({ plan_id: planId })
          .eq('code', currentMeta.code || DEFAULT_LEDGER_CODE);
      } catch (err) {
        console.warn('Failed to update plan in Supabase:', err);
      }
    }

    await safeSet('meta', updated, true);
    return updated;
  },

  /**
   * Join the community reading ledger.
   */
  async joinLedger(
    name: string
  ): Promise<{ meta: LedgerMeta; progress: ProgressMap; reflections: ReflectionsMap } | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: ledger } = await supabase
          .from('ledgers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (ledger) {
          await supabase
            .from('members')
            .upsert(
              [{ ledger_id: ledger.id, name }],
              { onConflict: 'ledger_id,name' }
            );

          await safeSet('my-identity', { name }, false);
          const loaded = await this.loadLedger();
          if (loaded.meta) {
            return {
              meta: loaded.meta,
              progress: loaded.progress,
              reflections: loaded.reflections,
            };
          }
        }
      } catch (err) {
        console.warn('Supabase joinLedger failed:', err);
      }
    }

    // Local join
    const meta = await safeGet<LedgerMeta>('meta', true);
    if (meta) {
      const updatedMeta: LedgerMeta = {
        ...meta,
        members: meta.members.includes(name) ? meta.members : [...meta.members, name],
      };
      await safeSet('my-identity', { name }, false);
      await safeSet('meta', updatedMeta, true);
      const progress = (await safeGet<ProgressMap>('progress', true)) || {};
      const reflections = (await safeGet<ReflectionsMap>('reflections', true)) || {};
      return { meta: updatedMeta, progress, reflections };
    }

    return null;
  },

  /**
   * Toggle reading day.
   */
  async toggleDay(
    day: number,
    memberName: string,
    currentProgress: ProgressMap
  ): Promise<ProgressMap> {
    const readers = currentProgress[day] ? [...currentProgress[day]] : [];
    const isCompleted = readers.includes(memberName);

    const updatedReaders = isCompleted
      ? readers.filter((n) => n !== memberName)
      : [...readers, memberName];

    const updatedProgress: ProgressMap = {
      ...currentProgress,
      [day]: updatedReaders,
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: ledger } = await supabase
          .from('ledgers')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (ledger) {
          if (isCompleted) {
            await supabase
              .from('reading_progress')
              .delete()
              .match({
                ledger_id: ledger.id,
                day_number: day,
                member_name: memberName,
              });
          } else {
            await supabase
              .from('reading_progress')
              .upsert(
                [
                  {
                    ledger_id: ledger.id,
                    day_number: day,
                    member_name: memberName,
                  },
                ],
                { onConflict: 'ledger_id,day_number,member_name' }
              );
          }
        }
      } catch (err) {
        console.warn('Supabase toggleDay sync error:', err);
      }
    }

    await safeSet('progress', updatedProgress, true);
    return updatedProgress;
  },

  /**
   * Save a spiritual reflection note.
   */
  async saveReflection(
    day: number,
    author: string,
    noteText: string,
    currentReflections: ReflectionsMap
  ): Promise<ReflectionsMap> {
    const newNote: ReflectionNote = {
      day,
      author,
      text: noteText,
      createdAt: new Date().toISOString(),
    };

    const dayNotes = [...(currentReflections[day] || []), newNote];
    const updatedReflections: ReflectionsMap = {
      ...currentReflections,
      [day]: dayNotes,
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: ledger } = await supabase
          .from('ledgers')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (ledger) {
          await supabase.from('reflections').insert([
            {
              ledger_id: ledger.id,
              day_number: day,
              member_name: author,
              note: noteText,
            },
          ]);
        }
      } catch (err) {
        console.warn('Supabase saveReflection error:', err);
      }
    }

    await safeSet('reflections', updatedReflections, true);
    return updatedReflections;
  },

  /**
   * Subscribe to realtime progress, members, and reflections.
   */
  subscribeToChanges(onChange: () => void): () => void {
    if (!isSupabaseConfigured() || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel('bsg-community-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reading_progress' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ledgers' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reflections' },
        () => onChange()
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },
};
