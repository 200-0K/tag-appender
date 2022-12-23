export default function InputText({className, onValueEnter, ...props}) {
  return <input 
    className={`bg-gray-100 px-4 rounded py-1${ className ? ` ${className} ` : ""}`}
    type="text"
    onKeyDown={e => {
      const { key, target: { value } } = e;
      if(! (key === "Enter" && value.length > 0)) return;
      onValueEnter?.(e);
    }}
    {...props}
  />
}