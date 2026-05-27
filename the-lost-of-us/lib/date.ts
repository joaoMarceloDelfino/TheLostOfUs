export function formatRelativeTime(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) {
    return "agora h\u00e1 pouco";
  }

  if (minutes === 1) {
    return "h\u00e1 1 minuto";
  }

  if (minutes < 60) {
    return `h\u00e1 ${minutes} minutos`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours === 1) {
    return "h\u00e1 1 hora";
  }

  if (hours < 24) {
    return `h\u00e1 ${hours} horas`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "h\u00e1 1 dia";
  }

  if (days < 30) {
    return `h\u00e1 ${days} dias`;
  }

  const months = Math.floor(days / 30);
  if (months === 1) {
    return "h\u00e1 1 m\u00eas";
  }

  if (months < 12) {
    return `h\u00e1 ${months} meses`;
  }

  const years = Math.floor(months / 12);
  if (years === 1) {
    return "h\u00e1 1 ano";
  }

  return `h\u00e1 ${years} anos`;
}
