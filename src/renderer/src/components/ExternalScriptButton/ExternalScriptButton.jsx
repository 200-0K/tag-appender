import Swal from 'sweetalert2'
import Button from '../Button'

export default function ExternalScriptButton({
  children,
  className,
  disabled,
  script,
  setScript,
  args,
  onScriptStart,
  onScriptEnd,
  onScriptResolve,
  onScriptReject,
}) {
  return (
    <Button
      className={['p-1.5 uppercase font-bold', className].join(' ')}
      onClick={async e => {
        if (!script || e.ctrlKey) {
          const { value: newScript } = await Swal.fire({
            title: 'Type The Command',
            input: 'textarea',
            inputAutoTrim: true,
            inputLabel: 'Type the command to run, with space-separated arguments',
            inputValue: script ?? '',
            showCancelButton: true,
          })
          if (newScript == undefined) return
          setScript(newScript)
          return
        }

        onScriptStart?.()
        try {
          const command = String.raw`${[script, ...args].join(' ')}`.replace(/\\/g, '/');
          const output = await window.api.executeScript(command);
          onScriptResolve?.(output)
        } catch(e) {
          await Swal.fire({
            icon: 'error',
            title: 'Oops...',
            html: `<pre>${e}</pre>`,
          })
          onScriptReject?.(e)
        }
        onScriptEnd?.()
      }}
      disabled={disabled}
    >
      {children}
    </Button>
  )
}
