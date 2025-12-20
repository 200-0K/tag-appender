/**
 * Default structure and metadata for tag profiles (.ta files).
 * Stored as JSON to allow for future extensibility (e.g., categories, colors, weights).
 */

export const PROFILE_VERSION = 1

/**
 * Creates a new profile object with the current schema version.
 * @param {Array} tags - Array of tag objects or strings (will be converted to objects)
 * @returns {Object} The structured profile object
 */
export const createProfileData = (tags = []) => {
  return {
    // Ensure tags are stored as objects with at least a 'name' property
    tags: tags.map((tag) => (typeof tag === 'string' ? { name: tag } : tag)),
    // Versioning helps handle future schema changes or migrations
    version: PROFILE_VERSION,
    // Placeholder for future metadata
    description: '',
    lastModified: new Date().toISOString()
  }
}

export const DEFAULT_PROFILE = createProfileData([])
