import { addMonths, currentMonth, formatMonth, WEEK_MS } from './dates';
import type { AppData } from './types';

export type ReminderKind = 'month_close' | 'weekly';

export interface Reminder {
  kind: ReminderKind;
  key: string;
  title: string;
  message: string;
}

export function evaluateReminder(settings: AppData['settings'], now: Date): Reminder | null {
  const current = currentMonth(now);
  const lastClosed = settings.lastClosedMonth || settings.installedMonth || current;
  if (current > lastClosed) {
    const key = `month_close:${current}`;
    if (settings.dismissedReminder !== key) {
      const previous = formatMonth(addMonths(current, -1));
      return {
        kind: 'month_close',
        key,
        title: 'Cierre de mes',
        message: `Empezó un mes nuevo. Hay un respaldo de ${previous} listo para guardar en Drive.`,
      };
    }
  }

  const lastBackup = settings.lastBackupAt ? Date.parse(settings.lastBackupAt) : Number.NaN;
  const installedAt = settings.installedAt ? Date.parse(settings.installedAt) : now.getTime();
  const baseline = Number.isFinite(lastBackup) ? lastBackup : installedAt;
  if (now.getTime() - baseline >= WEEK_MS) {
    const key = `weekly:${Math.floor(now.getTime() / WEEK_MS)}`;
    if (settings.dismissedReminder !== key) {
      return {
        kind: 'weekly',
        key,
        title: 'Respaldo semanal',
        message: 'Pasó una semana desde el último respaldo. Compártelo y elige Guardar en Drive.',
      };
    }
  }
  return null;
}
