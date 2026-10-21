export function isPreviewableMime(mime: string) {
  const m = mime.toLowerCase();
  return m.startsWith('image/') || m === 'application/pdf';
}

export function previewKind(mime: string): 'image' | 'pdf' | 'none' {
  const m = mime.toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m === 'application/pdf') return 'pdf';
  return 'none';
}
