import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { exportBackup, serializeBackup } from '@/src/domain/backup';
import { buildCsv } from '@/src/domain/csv';
import { currentMonth } from '@/src/domain/dates';
import { evaluateReminder, type Reminder } from '@/src/domain/reminders';
import { emptyData, type AppData, type ProjectStatus } from '@/src/domain/types';
import type { PaymentInput } from '@/src/domain/proformas';
import type { ExpenseDraft, ProformaDraft, ProjectDraft, TypeDraft } from '@/src/domain/validation';
import { openDatabase } from '@/src/db/open';
import { createRepository, type Repository } from '@/src/db/repository';
import { messageFor } from '@/src/copy';
import { deliverTextFile, writeTextFile } from '@/src/platform/files';
import { theme } from '@/src/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

interface AppContextValue {
  ready: boolean;
  data: AppData;
  reminder: Reminder | null;
  ensureMonth: (month: string) => Promise<void>;
  saveExpense: (draft: ExpenseDraft) => Promise<string | null>;
  deleteExpense: (id: string) => Promise<string | null>;
  saveType: (draft: TypeDraft) => Promise<string | null>;
  archiveType: (id: string, archived: boolean) => Promise<string | null>;
  deleteType: (id: string) => Promise<string | null>;
  saveProject: (draft: ProjectDraft) => Promise<string | null>;
  setProjectStatus: (id: string, status: ProjectStatus) => Promise<string | null>;
  deleteProject: (id: string) => Promise<string | null>;
  saveProforma: (draft: ProformaDraft) => Promise<string | null>;
  approveProforma: (id: string, payment: PaymentInput | null) => Promise<string | null>;
  addPayment: (id: string, payment: PaymentInput) => Promise<string | null>;
  rejectProforma: (id: string) => Promise<string | null>;
  addPhoto: (photo: { mime: string; dataBase64: string }) => Promise<{ id: string } | { error: string }>;
  shareBackup: () => Promise<string | null>;
  dismissReminder: () => Promise<void>;
  restoreBackup: (raw: string) => Promise<string | null>;
  exportCsv: () => Promise<string | null>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function materialize(repo: Repository, data: AppData, reminder: Reminder | null) {
  if (!reminder) return;
  const existing = await repo.getPendingSnapshot();
  if (existing?.key === reminder.key) return;
  const file = exportBackup(data, new Date().toISOString());
  await repo.setPendingSnapshot(reminder.key, file);
  if (Platform.OS !== 'web') {
    await writeTextFile(`mis-gastos-${file.exportedAt.slice(0, 10)}.json`, serializeBackup(file)).catch(() => undefined);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const repoRef = useRef<Repository | null>(null);
  const dataRef = useRef<AppData>(emptyData());
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [data, setData] = useState<AppData>(emptyData());
  const [reminder, setReminder] = useState<Reminder | null>(null);

  function commit(next: AppData, nextReminder?: Reminder | null) {
    dataRef.current = next;
    setData(next);
    if (nextReminder !== undefined) setReminder(nextReminder);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const repo = createRepository(openDatabase());
        const now = new Date();
        const initial = await repo.initialize(now);
        if (cancelled) return;
        repoRef.current = repo;
        commit(initial.data, initial.reminder);
        await materialize(repo, initial.data, initial.reminder);
      } catch {
        if (!cancelled) setBootError('No se pudo abrir el almacenamiento de este dispositivo.');
      } finally {
        if (!cancelled) setReady(true);
        SplashScreen.hideAsync().catch(() => undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      const repo = repoRef.current;
      if (!repo) return;
      void (async () => {
        const now = new Date();
        const next = await repo.ensureMonth(now, currentMonth(now));
        const nextReminder = evaluateReminder(next.settings, now);
        commit(next, nextReminder);
        await materialize(repo, next, nextReminder);
      })();
    });
    return () => subscription.remove();
  }, []);

  async function apply(result: { ok: true; value: AppData } | { ok: false; error: string }): Promise<string | null> {
    if (!result.ok) return messageFor(result.error);
    commit(result.value);
    return null;
  }

  const value: AppContextValue = {
    ready,
    data,
    reminder,
    async ensureMonth(month) {
      const repo = repoRef.current;
      if (!repo) return;
      const next = await repo.ensureMonth(new Date(), month);
      commit(next);
    },
    saveExpense: (draft) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.saveExpense(draft).then(apply);
    },
    deleteExpense: (id) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.deleteExpense(id).then(apply);
    },
    saveType: (draft) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.saveType(draft).then(apply);
    },
    archiveType: (id, archived) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.archiveType(id, archived).then(apply);
    },
    deleteType: (id) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.deleteType(id).then(apply);
    },
    saveProject: (draft) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.saveProject(draft).then(apply);
    },
    setProjectStatus: (id, status) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.setProjectStatus(id, status).then(apply);
    },
    deleteProject: (id) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.deleteProject(id).then(apply);
    },
    saveProforma: (draft) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.saveProforma(draft).then(apply);
    },
    approveProforma: (id, payment) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.approveProformaAction(id, payment).then(apply);
    },
    addPayment: (id, payment) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.addPayment(id, payment).then(apply);
    },
    rejectProforma: (id) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve('La app todavía está abriendo.');
      return repo.rejectProformaAction(id).then(apply);
    },
    async addPhoto(photo) {
      const repo = repoRef.current;
      if (!repo) return { error: 'La app todavía está abriendo.' };
      const result = await repo.addPhoto(photo);
      if (!result.ok) return { error: messageFor(result.error) };
      commit(result.value.data);
      return { id: result.value.id };
    },
    async shareBackup() {
      const repo = repoRef.current;
      if (!repo) return 'La app todavía está abriendo.';
      const now = new Date();
      const snapshot = await repo.getPendingSnapshot();
      const file = snapshot?.file ?? exportBackup(dataRef.current, now.toISOString());
      try {
        const outcome = await deliverTextFile(
          `mis-gastos-${file.exportedAt.slice(0, 10)}.json`,
          serializeBackup(file),
          'application/json',
        );
        if (outcome === 'cancelled') return messageFor('cancelado');
        const next = await repo.markBackedUp(now);
        commit(next.data, next.reminder);
        return null;
      } catch {
        return 'No se pudo compartir el respaldo.';
      }
    },
    async dismissReminder() {
      const repo = repoRef.current;
      if (!repo || !reminder) return;
      const next = await repo.dismissReminder(reminder.key, new Date());
      commit(next.data, next.reminder);
    },
    async restoreBackup(raw) {
      const repo = repoRef.current;
      if (!repo) return 'La app todavía está abriendo.';
      const result = await repo.restore(raw);
      if (!result.ok) return messageFor(result.error);
      commit(result.value.data, result.value.reminder);
      return null;
    },
    async exportCsv() {
      try {
        await deliverTextFile(`mis-gastos-${currentMonth()}.csv`, buildCsv(dataRef.current), 'text/csv');
        return null;
      } catch {
        return 'No se pudo exportar el CSV.';
      }
    },
  };

  if (!ready) {
    return (
      <View style={styles.boot}>
        <Text style={styles.bootTitle}>Mis Gastos</Text>
        <Text style={styles.bootText}>Abriendo tus datos…</Text>
      </View>
    );
  }

  if (bootError) {
    return (
      <View style={styles.boot}>
        <Text style={styles.bootTitle}>Mis Gastos</Text>
        <Text style={styles.bootText}>{bootError}</Text>
      </View>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de la app');
  return context;
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  bootTitle: { color: theme.white, fontSize: 32, fontWeight: '800' },
  bootText: { color: '#D1FAE5', fontSize: 16, textAlign: 'center' },
});
