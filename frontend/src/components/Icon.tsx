// The Material Symbols stylesheet in index.html is subset to exactly these
// names. Adding an icon means adding it here AND to the icon_names list there
// (alphabetical), otherwise the ligature renders as plain text.
export type IconName =
  | 'arrow_back'
  | 'arrow_forward'
  | 'check'
  | 'close'
  | 'description'
  | 'directions_walk'
  | 'edit'
  | 'expand_more'
  | 'help'
  | 'info'
  | 'my_location'
  | 'north_east'
  | 'restart_alt'
  | 'square_foot'
  | 'upload_file'
  | 'verified'
  | 'warning'

export default function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
      {name}
    </span>
  )
}
