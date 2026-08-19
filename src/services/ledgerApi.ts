import { supabase, isSupabaseConfigured } from './supabase';
import { LedgerMeta, ProgressMap } from '../types';
import { safeGet, safeSet } from './storage';

const DEFAULT_LEDGER_CODE = 'BSG-MAIN';

export const ledgerApi = {
  /**
   * Load the primary community ledger and all progress.
   */
  async loadLedger(): Promise<{ meta: LedgerMeta | null; progress: ProgressMap }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        // Fetch the active community ledger (or the most recent one)
        const { data: ledger, error: ledgerErr } = await supabase
          .from('ledgers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!ledgerErr && ledger) {
          // Fetch all members in this ledger
          const { data: members } = await supabase
            .from('members')
            .select('name')
            .eq('ledger_id', ledger.id)
            .order('created_at', { ascending: true });

          // Fetch all reading progress
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

          const meta: LedgerMeta = {
            code: ledger.code,
            title: ledger.title,
            startDate: ledger.start_date,
            members: (members || []).map((m) => m.name),
          };

          await safeSet('meta', meta, true);
          await safeSet('progress', progress, true);

          return { meta, progress };
        }
      } catch (err) {
        console.warn('Failed to load from Supabase, fallback to local storage:', err);
      }
    }

    // Fallback to local storage
    const meta = await safeGet<LedgerMeta>('meta', true);
    const progress = (await safeGet<ProgressMap>('progress', true)) || {};
    return { meta, progress };
  },

  /**
   * Initialize the community reading ledger (first time setup).
   */
  async createLedger(
    creatorName: string,
    startDate: string,
    title = 'Through the Book, Together'
  ): Promise<LedgerMeta> {
    const code = DEFAULT_LEDGER_CODE;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: ledger, error: ledgerErr } = await supabase
          .from('ledgers')
          .upsert(
            [{ code, title, start_date: startDate }],
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
            startDate: ledger.start_date,
            members: [creatorName],
          };

          await safeSet('my-identity', { name: creatorName }, false);
          await safeSet('meta', meta, true);
          await safeSet('progress', {}, true);

          return meta;
        }
      } catch (err) {
        console.warn('Supabase createLedger failed, using local storage:', err);
      }
    }

    const localMeta: LedgerMeta = {
      code,
      title,
      startDate,
      members: [creatorName],
    };
    await safeSet('my-identity', { name: creatorName }, false);
    await safeSet('meta', localMeta, true);
    await safeSet('progress', {}, true);
    return localMeta;
  },

  /**
   * Join the community reading ledger with reader name.
   */
  async joinLedger(
    name: string
  ): Promise<{ meta: LedgerMeta; progress: ProgressMap } | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: ledger } = await supabase
          .from('ledgers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (ledger) {
          // Add member
          await supabase
            .from('members')
            .upsert(
              [{ ledger_id: ledger.id, name }],
              { onConflict: 'ledger_id,name' }
            );

          await safeSet('my-identity', { name }, false);
          const loaded = await this.loadLedger();
          if (loaded.meta) {
            return { meta: loaded.meta, progress: loaded.progress };
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
      return { meta: updatedMeta, progress };
    }

    return null;
  },

  /**
   * Toggle reading day for a member.
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
   * Subscribe to realtime progress & member changes for the group.
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
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },
};
