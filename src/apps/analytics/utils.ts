export function formatDate(date: string, short = true) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: short ? "short" : "long",
    day: "numeric",
  });
}

export function formatTimeMs(value: number) {
  const hours = Math.floor(value / 3600000);
  const minutes = Math.floor((value % 3600000) / 60000);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
