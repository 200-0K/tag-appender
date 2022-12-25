
export default function Button({
  children,
  className,
  ...props
}) {
  return (
    <button className={["text-white bg-button rounded px-2 disabled:opacity-70 select-none active:scale-95 transition", className].join(" ")} {...props}>
      {children}
    </button>
  )
}