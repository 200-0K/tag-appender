export default function DropdownMenu({ items, handleItemChange, selectedItem, className, ...props }) {
  return (
    <select
      value={selectedItem || false}
      className={["bg-drop-down rounded px-2 py-1", className].join(" ")}
      onChange={e => e.target.value && handleItemChange(e.target.value)}
      {...props}
    >
      {items?.map((item, idx) => (
        <option key={`opt-${idx}`} value={item.value ?? item}>
          {item.displayValue ?? item}
        </option>
      ))}
    </select>
  )
}
