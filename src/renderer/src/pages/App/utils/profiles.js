export async function getProfiles() {
  const profiles = await window.api.profileScanner();
  return profiles;
}