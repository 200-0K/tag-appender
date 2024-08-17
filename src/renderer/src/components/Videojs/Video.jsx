import React from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

export const VideoJS = (props) => {
  const videoRef = React.useRef(null)
  const playerRef = React.useRef(null)
  const { options, onReady } = props

  React.useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current || playerRef.current.isDisposed()) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement('video-js')
      // options.key && videoElement.setAttribute('key', options.key);

      videoElement.classList.add('vjs-big-play-centered')
      videoRef.current.appendChild(videoElement)

      const player = (playerRef.current = videojs(videoElement, options, () => {
        // videojs.log('player is ready')
        onReady && onReady(player)
      }))

      // You could update an existing player in the `else` block here
      // on prop change, for example:
    } else {
      const player = playerRef.current

      player.autoplay(options.autoplay)
      player.src(options.sources)
      player.on('error', (e) => {
        options.onerror?.(e, player.error())
      })
    }
  }, [options, videoRef])

  // Dispose the Video.js player when the functional component unmounts
  React.useEffect(() => {
    const player = playerRef.current

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  videojs.options.autoSetup = false
  return (
    <div data-vjs-player className="h-full">
      <div ref={videoRef} className="h-full" />
    </div>
  )
}

export default VideoJS

export function getPlayer(id) {
  return videojs.getPlayer(id)
}
