"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined)

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error("Dropdown components must be used within DropdownMenu")
  }
  return context
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscapeKey)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleEscapeKey)
      }
    }
  }, [isOpen])

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={menuRef} className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

export function DropdownMenuTrigger({ asChild, children, ...props }: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen } = useDropdownMenu()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        setIsOpen(!isOpen)
        children.props.onClick?.(e)
      },
    })
  }

  return (
    <button
      {...props}
      onClick={(e) => {
        setIsOpen(!isOpen)
        props.onClick?.(e)
      }}
    >
      {children}
    </button>
  )
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end"
  alignOffset?: number
  sideOffset?: number
  forceMount?: boolean
  className?: string
}

export function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  sideOffset = 8,
  forceMount = false,
  className,
  children,
  ...props
}: DropdownMenuContentProps) {
  const { isOpen } = useDropdownMenu()

  if (!isOpen && !forceMount) return null

  return (
    <div
      className={cn(
        "absolute z-50 min-w-[8rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
        align === "end" ? `right-${alignOffset}` : `left-${alignOffset}`,
        `top-full`,
        isOpen ? "animate-in fade-in-0 zoom-in-95 duration-200" : "hidden",
        className,
      )}
      style={{
        ...(align === "end" && { right: alignOffset }),
        ...(align === "start" && { left: alignOffset }),
        top: `calc(100% + ${sideOffset}px)`,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive"
  children: React.ReactNode
}

export function DropdownMenuItem({
  asChild,
  variant = "default",
  className,
  children,
  ...props
}: DropdownMenuItemProps) {
  const { setIsOpen } = useDropdownMenu()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsOpen(false)
    props.onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      className: cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
        variant === "destructive" && "text-destructive focus:bg-destructive/10 focus:text-destructive",
        className,
      ),
    })
  }

  return (
    <button
      className={cn(
        "w-full text-left flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors",
        variant === "destructive" && "text-destructive hover:bg-destructive/10 focus:bg-destructive/10",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("bg-border -mx-1 my-1 h-px", className)} />
}

export function DropdownMenuLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-2 py-1.5 text-sm font-medium", className)}>{children}</div>
}

export function DropdownMenuGroup({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}
