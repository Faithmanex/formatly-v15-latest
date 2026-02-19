"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { User, Key, Trash2, Upload, Save, Copy, Crown, Calendar, CreditCard } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useSubscription, useSubscriptionStatus, useUsageLimits } from "@/contexts/subscription-context"
import { useToast } from "@/hooks/use-toast"
import { useProfileCache } from "@/hooks/use-profile-cache"
import { profileService } from "@/lib/database"
import { ProfileCacheService } from "@/lib/profile-cache"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export function AccountSettings() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const { forceRefresh } = useProfileCache()
  const { subscription, usage, refreshAll } = useSubscription()
  const { isSubscribed, isPremium, planName, subscriptionStatus } = useSubscriptionStatus()
  const { limits } = useUsageLimits()

  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [apiKey, setApiKey] = useState("sk-formatly-...")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const formatCurrency = (amount: number, currency = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleUpdateProfile = async () => {
    if (!user?.id) return

    try {
      setIsUpdatingProfile(true)

      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        })

        if (emailError) {
          throw new Error(`Email update failed: ${emailError.message}`)
        }
      }

      const updatedProfile = await profileService.updateProfile(user.id, {
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })

      if (updatedProfile) {
        ProfileCacheService.clearProfileCache()
        await refreshProfile(true)

        toast({
          title: "Profile Updated",
          description:
            email !== user.email
              ? "Profile updated. Please check your email to confirm the new address."
              : "Your profile information has been updated successfully.",
        })
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Could not update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsChangingPassword(true)

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      ProfileCacheService.clearProfileCache()
      await refreshProfile(true)

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Password Change Failed",
        description: "Could not update your password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleGenerateApiKey = () => {
    const newKey = `sk-formatly-${Math.random().toString(36).substr(2, 32)}`
    setApiKey(newKey)
    toast({
      title: "API Key Generated",
      description: "A new API key has been generated.",
    })
  }

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    toast({
      title: "Copied",
      description: "API key copied to clipboard.",
    })
  }

  const handleRefreshProfile = async () => {
    try {
      await forceRefresh()
      await refreshAll()
      toast({
        title: "Profile Refreshed",
        description: "Your profile data has been refreshed from the server.",
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh profile data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const usagePercentage =
    usage && subscription?.plan
      ? subscription.plan.document_limit === -1
        ? 0
        : Math.min((usage.documents_processed / subscription.plan.document_limit) * 100, 100)
      : profile
        ? Math.min((profile.documents_used / profile.document_limit) * 100, 100)
        : 0

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Account Settings</h1>
            {isPremium && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                <Crown className="h-3 w-3 mr-1" />
                {planName}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Manage your account information and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">
            Profile
          </TabsTrigger>
          <TabsTrigger value="subscription" className="text-xs sm:text-sm">
            Subscription
          </TabsTrigger>
          <TabsTrigger value="usage" className="text-xs sm:text-sm">
            Usage
          </TabsTrigger>
          <TabsTrigger value="api" className="text-xs sm:text-sm">
            API Keys
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <User className="h-4 w-4 md:h-5 md:w-5" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm md:text-base">
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              <div className="flex items-center gap-4 md:gap-6">
                <Avatar className="h-16 w-16 md:h-20 md:w-20">
                  <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.full_name} />
                  <AvatarFallback className="text-base md:text-lg">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="fullName" className="text-xs sm:text-sm md:text-base">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs sm:text-sm md:text-base">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-2 flex-wrap">
                <Button variant="outline" onClick={handleRefreshProfile} size="sm">
                  Refresh Profile
                </Button>
                <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdatingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                    Current Subscription
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm md:text-base">
                    View and manage your subscription details
                  </CardDescription>
                </div>
                {subscription?.current_period_end && (
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {subscription.cancel_at_period_end ? "Ends" : "Renews"}{" "}
                        {formatDate(subscription.current_period_end)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-medium">Plan</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{planName}</p>
                  </div>
                  <Badge variant={isSubscribed ? "default" : "secondary"}>
                    {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
                  </Badge>
                </div>

                {subscription?.plan && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Monthly Cost:</span>
                      <span className="ml-2">
                        {formatCurrency(
                          subscription.billing_cycle === "yearly"
                            ? Math.round(subscription.plan.price_yearly / 12)
                            : subscription.plan.price_monthly,
                          subscription.plan.currency,
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Billing Cycle:</span>
                      <span className="ml-2 capitalize">{subscription.billing_cycle || "monthly"}</span>
                    </div>
                    {subscription.plan.price_yearly > 0 && subscription.billing_cycle === "yearly" && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-green-600">Yearly Savings:</span>
                        <span className="ml-2 text-green-600">
                          {formatCurrency(subscription.plan.price_monthly * 12 - subscription.plan.price_yearly)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button asChild>
                    <Link href="/dashboard/upgrade">{isPremium ? "Change Plan" : "Upgrade Plan"}</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/billing">View Billing Details</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Usage Statistics</CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-base">
                Track your document processing usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-medium">Account Type</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {planName} {profile?.role === "guest" ? "Guest Account" : ""}
                  </p>
                </div>
                <Badge variant={profile?.role === "guest" ? "secondary" : "default"}>{planName}</Badge>
              </div>

              {usage && subscription?.plan ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-2">
                      <span>Documents Processed</span>
                      <span>
                        {usage.documents_processed.toLocaleString()} /{" "}
                        {subscription.plan.document_limit === -1
                          ? "∞"
                          : subscription.plan.document_limit.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {subscription.plan.document_limit === -1
                        ? "Unlimited documents remaining"
                        : `${Math.max(0, subscription.plan.document_limit - usage.documents_processed)} documents remaining`}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-2">
                      <span>API Calls This Month</span>
                      <span>
                        {usage.api_calls_made.toLocaleString()} /{" "}
                        {subscription.plan.api_calls_limit === -1
                          ? "∞"
                          : subscription.plan.api_calls_limit.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={
                        subscription.plan.api_calls_limit === -1
                          ? 0
                          : Math.min((usage.api_calls_made / subscription.plan.api_calls_limit) * 100, 100)
                      }
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-2">
                      <span>Storage Used</span>
                      <span>
                        {usage.storage_used_gb.toFixed(1)} GB /{" "}
                        {subscription.plan.storage_limit_gb === -1 ? "∞" : subscription.plan.storage_limit_gb} GB
                      </span>
                    </div>
                    <Progress
                      value={
                        subscription.plan.storage_limit_gb === -1
                          ? 0
                          : Math.min((usage.storage_used_gb / subscription.plan.storage_limit_gb) * 100, 100)
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span>Documents Processed</span>
                    <span>
                      {profile?.documents_used || 0} / {profile?.document_limit || 1}
                    </span>
                  </div>
                  <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.max(0, (profile?.document_limit || 1) - (profile?.documents_used || 0))} documents remaining
                  </p>
                </div>
              )}

              {!isPremium && (
                <div className="p-3 md:p-4 bg-secondary/50 rounded-lg">
                  <h4 className="text-sm sm:text-base font-medium mb-2">Upgrade to unlock more features</h4>
                  <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 mb-3 md:mb-4">
                    <li>• Unlimited document processing</li>
                    <li>• Custom style creation</li>
                    <li>• Batch processing</li>
                    <li>• Priority support</li>
                    <li>• Advanced formatting options</li>
                  </ul>
                  <Button asChild>
                    <Link href="/dashboard/upgrade">Upgrade Account</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-base">
                Generate and manage API keys for developer access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              <div className="p-3 md:p-4 bg-secondary/50 rounded-lg">
                <h4 className="text-sm sm:text-base font-medium mb-2">Current API Key</h4>
                <div className="flex items-center gap-2">
                  <Input value={apiKey} readOnly className="font-mono text-xs sm:text-sm md:text-base" />
                  <Button variant="outline" size="sm" onClick={handleCopyApiKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Keep your API key secure and do not share it publicly.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleGenerateApiKey}>Generate New Key</Button>
                <Button variant="destructive">Revoke Key</Button>
              </div>

              <div className="text-xs sm:text-sm md:text-base text-muted-foreground">
                <h4 className="font-medium mb-2">API Usage</h4>
                <p>Use your API key to integrate Formatly with your applications.</p>
                <p className="mt-2">
                  <strong>Endpoint:</strong> https://api.formatly.com/v1/
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Change Password</CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-base">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-sm sm:text-sm md:text-base">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-sm sm:text-sm md:text-base">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-sm sm:text-sm md:text-base">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-destructive">Danger Zone</CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-base">
                Irreversible actions that will affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base sm:text-lg">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm sm:text-base md:text-base">
                      This action cannot be undone. This will permanently delete your account and remove all your data
                      from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
