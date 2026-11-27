import * as React from 'react'
import { cn } from '@/lib/utils'

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  regionLabel?: string
  maxHeightClassName?: string
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    {
      className,
      regionLabel = 'Data table',
      maxHeightClassName = 'max-h-[min(62dvh,34rem)]',
      ...props
    },
    ref
  ) => (
    <div
      tabIndex={0}
      role="region"
      aria-label={regionLabel}
      className={cn(
        'relative w-full overflow-auto overscroll-contain spindle-scroll rounded-xl border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        maxHeightClassName
      )}
    >
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm text-left', className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_var(--color-border)] [&_tr]:border-b-0 [&_tr:hover]:bg-transparent',
      className
    )}
    {...props}
  />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
))
TableBody.displayName = 'TableBody'


const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary-tint',
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, scope = 'col', ...props }, ref) => (
  <th
    ref={ref}
    scope={scope}
    className={cn(
      'h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('p-4 align-middle text-sm text-foreground', className)} {...props} />
))
TableCell.displayName = 'TableCell'

export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
}
