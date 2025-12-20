export default function Toggle({
  enabled = false,
  text = 'on',
  disabled = false,
  title,
  onClick,
  onEnable,
  onDisable,
  className
}) {
  return (
    <label
      className={[
        'inline-flex items-center space-x-3 select-none',
        disabled && 'opacity-50 pointer-events-none',
        className
      ].join(' ')}
      title={title}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={enabled}
        readOnly
        aria-checked={enabled}
      />

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => {
          onClick?.()
          if (enabled) onDisable?.()
          else onEnable?.()
        }}
        className={[
          'relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none',
          enabled ? 'bg-indigo-600 shadow-[0_2px_6px_rgba(79,70,229,0.16)]' : 'bg-slate-700/60',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow',
            enabled ? 'translate-x-5' : 'translate-x-1'
          ].join(' ')}
        />
      </button>

      <div className="flex flex-col">
        <span className="text-xs font-medium text-slate-900 dark:text-slate-200 uppercase">{text}</span>
        {enabled && title ? (
          <span className="mt-0.5 text-[.65rem] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/40 px-2 py-0.5 rounded-full max-w-[12rem] truncate">
            {title}
          </span>
        ) : null}
      </div>
    </label>
  )
}
