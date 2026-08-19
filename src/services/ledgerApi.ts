import { supabase, isSupabaseConfigured } from './supabase';
import { LedgerMeta, ProgressMap } from '../types';
import { safeGet, safeSet } from './storage';

export const ledgerApi = {
  /**
   * Load ledger metadata and reading progress.
   */
  async loadLedger(code?: string): Promise<{ meta: LedgerMeta | null; progress: ProgressMap }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const ledgerCode = code || (await safeGet<string>('current-ledger-code', false));
        if (ledgerCode) {
          const { data: ledger, error: ledgerErr } = await supabase
            .from('ledgers')
            .select('*')
            .eq('code', ledgerCode)
            .single();

          if (!ledgerErr && ledger) {
            // Fetch members
            const { data: members } = await supabase
              .from('members')
              .select('name')
              .eq('ledger_id', ledger.id);

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

            const meta: LedgerMeta = {
              code: ledger.code,
              title: ledger.title,
              startDate: ledger.start_date,
              members: (members || []).map((m) => m.name),
            };

            await safeSet('meta', meta, true);
            await safeSet('progress', progress, true);
            await safeSet('current-ledger-code', ledger.code, false);

            return { meta, progress };
          }
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
   * Create a new group ledger in Supabase (or local storage).
   */
  async createLedger(
    creatorName: string,
    startDate: string,
    title = 'Six-Month Bible Reading Ledger'
  ): Promise<LedgerMeta> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: ledger, error: ledgerErr } = await supabase
          .from('ledgers')
          .insert([{ code, title, start_date: startDate }])
          .select()
          .single();

        if (!ledgerErr && ledger) {
          await supabase.from('members').insert([{ ledger_id: ledger.id, name: creatorName }]);

          const meta: LedgerMeta = {
            code: ledger.code,
            title: ledger.title,
            startDate: ledger.start_date,
            members: [creatorName],
          };

          await safeSet('current-ledger-code', ledger.code, false);
          await safeSet('my-identity', { name: creatorName }, false);
          await safeSet('meta', meta, true);
          await safeSet('progress', {}, true);

          return meta;
        }
      } catch (err) {
        console.warn('Supabase createLedger failed, fallback to local storage:', err);
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
   * Join an existing ledger with code.
   */
  async joinLedger(
    name: string,
    code?: string
  ): Promise<{ meta: LedgerMeta; progress: ProgressMap } | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const ledgerCode = code || (await safeGet<string>('current-ledger-code', false));
        if (ledgerCode) {
          const { data: ledger } = await supabase
            .from('ledgers')
            .select('*')
            .eq('code', ledgerCode)
            .single();

          if (ledger) {
            // Add member if not present
            await supabase
              .from('members')
              .insert([{ ledger_id: ledger.id, name }])
              .select()
              .maybeSingle();

            await safeSet('my-identity', { name }, false);
            const loaded = await this.loadLedger(ledger.code);
            if (loaded.meta) {
              return { meta: loaded.meta, progress: loaded.progress };
            }
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
   * Toggle a reading day for a member.
   */
  async toggleDay(
    day: number,
    memberName: string,
    currentProgress: ProgressMap,
    ledgerCode?: string
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
        const code = ledgerCode || (await safeGet<string>('current-ledger-code', false));
        if (code) {
          const { data: ledger } = await supabase
            .from('ledgers')
            .select('id')
            .eq('code', code)
            .single();

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
                .insert([
                  {
                    ledger_id: ledger.id,
                    day_number: day,
                    member_name: memberName,
                  },
                ]);
            }
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
   * Subscribe to realtime progress & member changes.
   */
  subscribeToChanges(
    ledgerCode: string | undefined,
    onChange: () => void
  ): () => void {
    if (!isSupabaseConfigured() || !supabase || !ledgerCode) {
      return () => {};
    }

    const channel = supabase
      .channel(`ledger-${ledgerCode}`)
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
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },
};
