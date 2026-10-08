import type { AppData } from './types';

function cell(value: string | number | null | undefined): string {
  if (value == null) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildCsv(data: AppData): string {
  const types = new Map(data.types.map((type) => [type.id, type.name]));
  const projects = new Map(data.projects.map((project) => [project.id, project.name]));
  const proformas = new Map(data.proformas.map((proforma) => [proforma.id, proforma.supplier]));
  const header = ['fecha', 'descripcion', 'nota', 'monto', 'estado', 'alcance', 'tipo', 'proyecto', 'proforma'];
  const rows = data.expenses
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1))
    .map((expense) =>
      [
        expense.date,
        expense.description,
        expense.note,
        expense.amount.toFixed(2),
        expense.status,
        expense.scope,
        expense.typeId ? (types.get(expense.typeId) ?? '') : '',
        expense.projectId ? (projects.get(expense.projectId) ?? '') : '',
        expense.proformaId ? (proformas.get(expense.proformaId) ?? '') : '',
      ]
        .map(cell)
        .join(','),
    );
  return `\uFEFF${[header.join(','), ...rows].join('\n')}\n`;
}
