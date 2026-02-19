"use client"

import {
  Home,
  FileText,
  Settings,
  Palette,
  User,
  Bot,
  HelpCircle,
  Shield,
  CreditCard,
  Receipt,
  Zap,
  Moon,
  Sun,
  Monitor,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/components/auth-provider"
import { useSubscription, useSubscriptionStatus, usePlanUsage } from "@/contexts/subscription-context"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu-custom"
import Link from "next/link"
import { usePathname } from "next/navigation"

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "My Documents",
    url: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Formatting Preferences",
    url: "/dashboard/preferences",
    icon: Palette,
  },
  {
    title: "Ask Formatly AI",
    url: "/dashboard/ai",
    icon: Bot,
  },
]

const billingMenuItems = [
  {
    title: "Billing & Subscription",
    url: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Upgrade Plan",
    url: "/dashboard/upgrade",
    icon: Zap,
  },
  {
    title: "Billing History",
    url: "/dashboard/billing/history",
    icon: Receipt,
  },
  {
    title: "Payment Methods",
    url: "/dashboard/billing/payment-methods",
    icon: CreditCard,
  },
]

const settingsMenuItems = [
  {
    title: "Account Settings",
    url: "/dashboard/account",
    icon: User,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Help & FAQ",
    url: "/dashboard/help",
    icon: HelpCircle,
  },
]

export function AppSidebar() {
  const { profile } = useAuth()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const { subscription, isLoading: loadingSubscription } = useSubscription()
  const { isPremium, planName } = useSubscriptionStatus()
  const { planUsage, isLoading: planUsageLoading } = usePlanUsage()

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const usagePercentage = planUsage?.usage_percentage || 0
  const hasDocumentLimit = planUsage && planUsage.document_limit > 0
  const documentsUsed = planUsage?.documents_processed || 0
  const documentLimit = planUsage?.document_limit || 0
  const isAtLimit = documentsUsed >= documentLimit && documentLimit > 0

  return (
    <Sidebar
      variant="floating"
      className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <SidebarHeader>
        <div className="px-2 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">F</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold">Formatly</h2>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm">Billing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {billingMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url)}>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">{item.title}</span>
                      {item.title === "Upgrade Plan" && !isPremium && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          New
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm">Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {profile?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/dashboard/admin"}>
                    <Link href="/dashboard/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">Admin Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">{profile?.full_name || "User"}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {getThemeIcon()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Light</span>
                    {theme === "light" && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Dark</span>
                    {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">System</span>
                    {theme === "system" && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {!loadingSubscription && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Plan:</span>
                <Badge variant={isPremium ? "default" : "secondary"} className="text-xs">
                  {planName}
                </Badge>
              </div>
            )}

            {!planUsageLoading && hasDocumentLimit && planUsage && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Documents</span>
                  <span>
                    {documentsUsed}/{documentLimit}
                  </span>
                </div>
                <Progress value={Math.min(usagePercentage, 100)} className="h-1" />
                {isAtLimit && (
                  <div className="text-xs text-red-600 font-medium">
                    {planName.toLowerCase().includes("free") ? "Monthly limit reached" : "Monthly limit reached"}
                  </div>
                )}
                {usagePercentage >= 75 && !isAtLimit && (
                  <div className="text-xs text-yellow-600 font-medium">{Math.round(usagePercentage)}% used</div>
                )}
              </div>
            )}



            {!isPremium && (
              <Button asChild size="sm" className="w-full text-xs">
                <Link href="/dashboard/upgrade" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Upgrade Plan
                </Link>
              </Button>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
