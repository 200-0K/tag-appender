
export default function SelectableList({
  items,
  selectedItems,
  onSelect,
  className,
} = {}) {
  return (
    <div className={["flex flex-col border border-black/50 border-dashed select-none overflow-auto", className].join(" ")}>
      {items?.map((item, idx) =>
          <div key={`item-${idx}`}>
            <input
              className="hidden peer"
              id={`item-${idx}`}
              type="checkbox"
              value={item}
              checked={selectedItems?.includes(item)}
              onClick={e => {
                const {ctrlKey, target: {value, checked}} = e
                onSelect?.(value, {checked, ctrlKey})
              }}
            />
            <label
              className="cursor-pointer block bg-slate-300 peer-checked:bg-slate-500 border border:black/40 p-1"
              htmlFor={`item-${idx}`}
            >{item}</label>
          </div>
        )
      }
    </div>
  );
}