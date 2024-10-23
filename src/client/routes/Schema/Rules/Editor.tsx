
export default function Editor({ params }: { params: Record<string, string> }) {
  const editing = !!params.rule
  return (
    <div>{editing?`Editing Rule: ${params.rule}`:'New Rule'}</div>
  )
}
