import { describe, expect, it } from 'vitest';
import { BackupError, exportBackup, parseBackup, serializeBackup } from './backup';
import { buildCsv } from './csv';
import { emptyData, type AppData } from './types';

function sample(): AppData {
  const data = emptyData();
  data.types = [
    {
      id: 't1',
      name: 'Medicina',
      budget: 80,
      recurring: false,
      recurringAmount: null,
      recurringDay: null,
      archived: false,
      createdAt: '2026-10-01',
    },
  ];
  data.projects = [
    { id: 'p1', name: 'Cocina', budget: 1500, status: 'activo', createdAt: '2026-09-01' },
  ];
  data.photos = [
    { id: 'ph1', mime: 'image/jpeg', dataBase64: 'aG9sYQ==', createdAt: '2026-10-02' },
  ];
  data.expenses = [
    {
      id: 'e1',
      amount: 12.5,
      date: '2026-10-02',
      description: 'Farmacia, "centro"',
      note: 'Receta\ninterna',
      receiptPhotoId: 'ph1',
      scope: 'personal',
      typeId: 't1',
      projectId: null,
      status: 'confirmado',
      recurringTypeId: null,
      recurringMonth: null,
      proformaId: null,
      createdAt: '2026-10-02',
    },
  ];
  data.proformas = [
    {
      id: 'pf1',
      projectId: 'p1',
      supplier: 'Maderas Sur',
      description: 'Tableros',
      amount: 200,
      attachmentPhotoId: 'ph1',
      status: 'pendiente',
      createdAt: '2026-10-03',
    },
  ];
  data.payments = [];
  data.settings = { installedMonth: '2026-10', skippedRecurring: '[]' };
  return data;
}

describe('respaldo', () => {
  it('exporta e importa el mismo estado, fotos incluidas', () => {
    const data = sample();
    const file = exportBackup(data, '2026-10-08T00:00:00.000Z');
    const parsed = parseBackup(serializeBackup(file));
    expect(parsed.currency).toBe('USD');
    expect(parsed.version).toBe(1);
    expect(parsed.data).toEqual(data);
    expect(parsed.data.photos[0]?.dataBase64).toBe('aG9sYQ==');
  });

  it('rechaza archivos que no son un respaldo válido', () => {
    expect(() => parseBackup('no-json')).toThrow(BackupError);
    expect(() => parseBackup('{"app":"otro"}')).toThrow(/no es un respaldo/);
    expect(() =>
      parseBackup(
        JSON.stringify({
          app: 'mis-gastos',
          version: 2,
          exportedAt: '2026-10-08',
          currency: 'USD',
          data: sample(),
        }),
      ),
    ).toThrow(/no es compatible/);
    const broken = exportBackup(sample(), '2026-10-08T00:00:00.000Z');
    const dumped = JSON.parse(serializeBackup(broken)) as { data: { expenses: { date?: string }[] } };
    delete dumped.data.expenses[0]?.date;
    expect(() => parseBackup(JSON.stringify(dumped))).toThrow(/incompleto|dañado/);
  });

  it('exporta CSV con comillas escapadas', () => {
    const csv = buildCsv(sample());
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('fecha,descripcion,nota,monto,estado,alcance,tipo,proyecto,proforma');
    expect(csv).toContain('"Farmacia, ""centro"""');
    expect(csv).toContain('12.50');
    expect(csv).toContain('Medicina');
  });
});
