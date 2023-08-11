export async function getMedias(dir) {
  if (!dir) return null;
  return await window.api.directoryScanner(dir, { filterName: "medias" });
}