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
        'inline-flex relative items-center mr-5 cursor-pointer select-none',
        disabled && 'opacity-50 pointer-events-none',
        className
      ].join(' ')}
      title={title}
    >
      <input type="checkbox" className="sr-only peer" checked={enabled} readOnly />
      <div
        onClick={() => {
          onClick?.()
          if (enabled) onDisable?.()
          else onEnable?.()
        }}
        className="w-8 h-4 bg-gray-200 rounded-full peer  
        peer-focus:ring-green-300 peer-checked:bg-green-600
        peer-checked:after:translate-x-full peer-checked:after:border-white 
        after:content-[''] after:absolute after:top-[10px] after:left-[5px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all"
      ></div>
      <span className="ml-2 text-xs font-medium text-gray-900 uppercase">{text}</span>
    </label>
  )
}
