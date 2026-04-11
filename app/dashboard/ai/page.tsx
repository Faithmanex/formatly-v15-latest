"use client"

import { AskFormatlyAI } from "@/components/ask-formatly-ai"
import { useSubscription } from "@/contexts/subscription-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AIPage() {
  const { isPremium, planName, isLoading } = useSubscription()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">AI Assistant - Pro Feature</CardTitle>
            <CardDescription className="text-center">
              The AI Assistant is available for Pro plan users. Upgrade to unlock intelligent formatting assistance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Current plan: <span className="font-medium text-foreground">{planName}</span></p>
            </div>
            <Link href="/dashboard/upgrade" className="block">
              <Button className="w-full" size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <AskFormatlyAI />
    </div>
  )
}