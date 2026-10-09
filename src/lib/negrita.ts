/** Convierte **texto** en <strong>texto</strong>. Escapa el resto del HTML. */
export function negrita(texto: string): string {
  const seguro = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return seguro.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
