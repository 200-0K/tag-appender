export async function getProfiles() {
  const profiles = (await window.api.profileScanner())?.map(profiles => profiles.path);
  return profiles;
}