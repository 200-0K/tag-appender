export function toImgxUrl(mediaPath) {
  if (!mediaPath) return undefined

  // normalize
  let p = String(mediaPath).replace(/\\/g, '/')

  const isWindows = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent)

  // If path looks like "l/..." on Windows, interpret as drive letter "L:/..."
  // (This matches what your URLs currently imply via hostname "l")
  if (isWindows && /^[A-Za-z]\//.test(p) && !/^[A-Za-z]:\//.test(p)) {
    p = `${p[0].toUpperCase()}:/${p.slice(2)}`
  }

  // Ensure hostless URL form: imgx:///...
  if (p.startsWith('/')) p = p.slice(1)

  return encodeURI('imgx:///' + p).replace(/#/g, '%23')
}
