export async function getImages(dir) {
  if (!dir) return null;
  return await window.api.directoryScanner(dir, { filterName: "images" });
}