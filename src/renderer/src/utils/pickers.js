export async function directoryPicker() {
  const dir = await window.api.directoryPicker();
  if (!dir) return null;
  return dir;
}