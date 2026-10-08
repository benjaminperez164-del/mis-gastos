export const errorText: Record<string, string> = {
  monto_invalido: 'Ingresa un monto mayor a cero.',
  fecha_invalida: 'Elige una fecha válida.',
  descripcion_requerida: 'Escribe una descripción.',
  tipo_requerido: 'Elige un tipo de gasto.',
  tipo_invalido: 'Ese tipo de gasto no está disponible.',
  proyecto_requerido: 'Elige un proyecto.',
  proyecto_invalido: 'Ese proyecto no está disponible.',
  nombre_requerido: 'Escribe un nombre.',
  nombre_duplicado: 'Ya existe un tipo con ese nombre.',
  presupuesto_invalido: 'El presupuesto debe ser mayor a cero, o déjalo vacío.',
  dia_invalido: 'El día del mes debe estar entre 1 y 31.',
  proveedor_requerido: 'Escribe el proveedor.',
  no_encontrado: 'No se encontró el registro.',
  no_editable: 'Solo puedes editar una proforma pendiente.',
  en_uso: 'Está en uso. Puedes ocultarlo o cerrarlo.',
  ya_aprobada: 'Esta proforma ya está aprobada.',
  rechazada: 'Esta proforma está rechazada.',
  no_aprobada: 'Aprueba la proforma antes de registrar un pago.',
  no_pendiente: 'Solo puedes rechazar una proforma pendiente.',
  excede_saldo: 'El pago supera el saldo pendiente.',
  elige_dos: 'Elige al menos dos proformas.',
  distinto_proyecto: 'Solo puedes comparar proformas del mismo proyecto.',
  cancelado: 'No se compartió el archivo.',
  proforma_bloqueada: 'El monto de un pago de proforma se cambia desde la proforma.',
};

export function messageFor(error: string): string {
  return errorText[error] ?? error;
}
