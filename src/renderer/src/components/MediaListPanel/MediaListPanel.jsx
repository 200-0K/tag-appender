import React, { useEffect, useMemo, useRef, useState } from 'react'
import { IconArrowLeft, IconCornerUpLeft, IconCheck, IconMapPin, IconClock, IconBookmark, IconBookmarkFilled } from '@tabler/icons-react'
import Button from '../Button'
import { cn } from '../../pages/App/utils/cn'
import { getCachedThumbnail, requestThumbnail } from '../../media/thumbnailCache'
import { getFileName, inLocation } from '../../../../../utils/path-format'

const ROW_HEIGHT = 118
const OVERSCAN = 2

function isImageType(mediaType) {
  return (mediaType || '').toLowerCase().startsWith('image')
}

function Thumbnail({ media }) {
  const [thumbSrc, setThumbSrc] = useState(() => getCachedThumbnail(media.path))
  const type = (media.type || '').toLowerCase()
  const label = type.startsWith('video') ? 'VID' : type.startsWith('audio') ? 'AUD' : 'FILE'

  useEffect(() => {
    let cancelled = false
    let timer = null
    setThumbSrc(getCachedThumbnail(media.path))

    timer = window.setTimeout(() => {
      requestThumbnail(media).then((result) => {
        if (!cancelled && result) setThumbSrc(result)
      })
    }, 140)

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [media.path, media.type])

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-300/70 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
      {thumbSrc ? (
        <img alt="" src={thumbSrc} className="h-full w-full object-cover" loading="lazy" draggable={false} />
      ) : (
        <span className="text-[10px] font-bold tracking-[0.18em] text-slate-500">
          {isImageType(media?.type) ? 'IMG' : label}
        </span>
      )}
    </div>
  )
}

function StatusBadge({ title, tone = 'slate', children }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-full border',
        {
          green: 'border-green-500/35 bg-green-500/10 text-green-400',
          amber: 'border-amber-500/35 bg-amber-500/10 text-amber-400',
          blue: 'border-sky-500/35 bg-sky-500/10 text-sky-400',
          slate: 'border-slate-400/35 bg-slate-400/10 text-slate-300'
        }[tone] ?? 'border-slate-400/35 bg-slate-400/10 text-slate-300'
      )}
    >
      {children}
    </span>
  )
}

function ActionIconButton({ title, onClick, disabled, children }) {
  return (
    <Button
      title={title}
      aria-label={title}
      variant="ghost"
      size="xs"
      onClick={onClick}
      disabled={disabled}
      className="h-7 w-7 rounded-full border border-slate-300/70 px-0 text-slate-600 hover:border-slate-400 hover:bg-slate-200/80 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800"
    >
      {children}
    </Button>
  )
}

function MediaListRow({
  media,
  index,
  isCurrent,
  isVisited,
  isTagged,
  isMoved,
  isBookmarked,
  canUndo,
  onSelectMedia,
  onUndoMedia,
  onBookmarkToggle,
  disabled,
  style
}) {
  const activeBadges = [
    isBookmarked && {
      key: 'bookmarked',
      title: 'Bookmarked',
      tone: 'slate',
      icon: <IconBookmarkFilled size={11} />
    },
    isVisited && { key: 'visited', title: 'Visited', tone: 'blue', icon: <IconClock size={11} /> },
    isTagged === true && { key: 'tagged', title: 'Tagged', tone: 'green', icon: <IconCheck size={11} /> },
    isMoved && { key: 'moved', title: 'Moved', tone: 'amber', icon: <IconMapPin size={11} /> }
  ].filter(Boolean)

  return (
    <div style={style} className="absolute left-0 right-0 px-2">
      <div
        onClick={() => onSelectMedia(index)}
        className={cn(
          'cursor-pointer rounded-lg border p-2 transition-colors',
          isCurrent
            ? 'border-sky-500/60 bg-sky-500/10'
            : isBookmarked
            ? 'border-amber-400/60 bg-amber-50/90 hover:border-amber-500 hover:bg-amber-100/80 dark:border-amber-500/50 dark:bg-amber-500/10 dark:hover:border-amber-400 dark:hover:bg-amber-500/15'
            : 'border-slate-300/70 bg-white/80 hover:border-slate-400 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:bg-slate-800/70'
        )}
      >
        <div className="flex gap-3">
          <Thumbnail media={media} />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                  {getFileName(media.path)}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400" title={media.path}>
                  {media.path}
                </p>
              </div>
              {isCurrent && (
                <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-300">
                  Current
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {activeBadges.map((badge) => (
                  <StatusBadge key={badge.key} title={badge.title} tone={badge.tone}>
                    {badge.icon}
                  </StatusBadge>
                ))}
              </div>

              <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
                <ActionIconButton
                  title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  onClick={() => onBookmarkToggle(media.path)}
                  disabled={disabled}
                >
                  {isBookmarked ? <IconBookmarkFilled size={14} /> : <IconBookmark size={14} />}
                </ActionIconButton>
                {canUndo && (
                  <ActionIconButton title="Undo move" onClick={() => onUndoMedia(media.path)}>
                    <IconCornerUpLeft size={14} />
                  </ActionIconButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MemoMediaListRow = React.memo(MediaListRow)

function MediaListPanel({
  medias,
  currentMediaIndex,
  visitedMediaPaths,
  taggedMediaPaths,
  moveLocation,
  movedHistory,
  bookmarkedMediaPaths,
  onToggleCollapsed,
  onSelectMedia,
  onUndoMedia,
  onBookmarkToggle,
  disabled = false
}) {
  const scrollRef = useRef(null)
  const rafRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const visitedCount = useMemo(
    () => medias.filter((media) => visitedMediaPaths[media.path]).length,
    [medias, visitedMediaPaths]
  )

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return

    const updateHeight = () => setViewportHeight(node.clientHeight)
    updateHeight()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => updateHeight())
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    if (!scrollRef.current || currentMediaIndex == null) return

    const top = currentMediaIndex * ROW_HEIGHT
    const bottom = top + ROW_HEIGHT
    const viewTop = scrollRef.current.scrollTop
    const viewBottom = viewTop + scrollRef.current.clientHeight

    if (top < viewTop) scrollRef.current.scrollTop = top
    else if (bottom > viewBottom) scrollRef.current.scrollTop = bottom - scrollRef.current.clientHeight
  }, [currentMediaIndex])

  const { startIndex, visibleMedias } = useMemo(() => {
    const visibleCount = Math.ceil((viewportHeight || 0) / ROW_HEIGHT)
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    const end = Math.min(medias.length, start + visibleCount + OVERSCAN * 2)
    return {
      startIndex: start,
      visibleMedias: medias.slice(start, end)
    }
  }, [medias, scrollTop, viewportHeight])

  return (
    <aside className="w-[24rem] shrink-0 overflow-hidden rounded-lg border border-slate-300/70 bg-white/70 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-slate-300/70 p-2 dark:border-slate-800">
          <Button
            variant="ghost"
            size="xs"
            onClick={onToggleCollapsed}
            title="Collapse media list"
            className="w-7 px-0"
          >
            <IconArrowLeft size={14} />
          </Button>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Media List</p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {visitedCount}/{medias.length} visited this session
            </p>
          </div>
          <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {medias.length}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-2"
          onScroll={(event) => {
            const nextTop = event.currentTarget.scrollTop
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(() => {
              setScrollTop(nextTop)
              rafRef.current = null
            })
          }}
        >
          <div style={{ height: medias.length * ROW_HEIGHT, position: 'relative' }}>
            {visibleMedias.map((media, offset) => {
              const index = startIndex + offset
              const isCurrent = index === currentMediaIndex
              const isVisited = !!visitedMediaPaths[media.path]
              const isTagged = taggedMediaPaths[media.path]
              const isMoved = !!moveLocation && inLocation(media.path, moveLocation, { level: 0 })
              const isBookmarked = !!bookmarkedMediaPaths[media.path]
              const canUndo = isMoved && !!movedHistory[media.path]

              return (
                <MemoMediaListRow
                  key={media.path}
                  media={media}
                  index={index}
                  isCurrent={isCurrent}
                  isVisited={isVisited}
                  isTagged={isTagged}
                  isMoved={isMoved}
                  isBookmarked={isBookmarked}
                  canUndo={canUndo}
                  onSelectMedia={onSelectMedia}
                  onUndoMedia={onUndoMedia}
                  onBookmarkToggle={onBookmarkToggle}
                  disabled={disabled}
                  style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default React.memo(MediaListPanel)
