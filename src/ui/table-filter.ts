export function filterRowsBySearch(
  rows: Record<string, unknown>[],
  query: string,
  omitKeys: string[] = [],
): Record<string, unknown>[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const payload =
      omitKeys.length > 0
        ? Object.fromEntries(Object.entries(row).filter(([key]) => !omitKeys.includes(key)))
        : row;
    return JSON.stringify(payload).toLowerCase().includes(q);
  });
}

export function filterMasterItems<
  T extends { title: string; subtitle?: string; status?: string },
>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    [item.title, item.subtitle, item.status].filter(Boolean).join(' ').toLowerCase().includes(q),
  );
}
