import ChildrenProp from 'models/ChildrenProp'

export default function ({ children }: ChildrenProp) {
  return (
    <div className="container mx-auto max-w-prose p-10 prose">{children}</div>
  )
}
