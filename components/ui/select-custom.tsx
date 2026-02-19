"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  children?: React.ReactNode
}

interface SelectTriggerProps {
  className?: string
  children?: React.ReactNode
}

interface SelectContentProps {
  className?: string
  children?: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
}

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

export function Select({ value, onValueChange, disabled, children }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ className, children }: SelectTriggerProps) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectTrigger must be used within Select")

  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        context.setIsOpen(false)
      }
    }

    if (context.isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [context.isOpen, context.setIsOpen])

  return (
    <button
      ref={triggerRef}
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={cn(
        'border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*="text-"])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9',
        className,
      )}
    >
      <div className="flex items-center gap-2 flex-1 line-clamp-1">{children}</div>
      <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectValue must be used within Select")

  return <span className="text-muted-foreground">{placeholder}</span>
}

export function SelectContent({ className, children }: SelectContentProps) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectContent must be used within Select")

  if (!context.isOpen) return null

  return (
    <div
      className={cn(
        "absolute top-full left-0 right-0 mt-1 z-50 bg-popover text-popover-foreground border rounded-md shadow-md overflow-hidden",
        className,
      )}
    >
      <div className="max-h-[300px] overflow-y-auto p-1">{children}</div>
    </div>
  )
}

export function SelectItem({ value, children, disabled }: SelectItemProps) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectItem must be used within Select")

  const isSelected = context.value === value

  return (
    <button
      onClick={() => {
        if (!disabled) {
          context.onValueChange(value)
          context.setIsOpen(false)
        }
      }}
      disabled={disabled}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex w-full items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none cursor-default disabled:pointer-events-none disabled:opacity-50 hover:bg-accent",
        isSelected && "bg-accent text-accent-foreground",
      )}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="size-4" />}
      </span>
      <span>{children}</span>
    </button>
  )
}
