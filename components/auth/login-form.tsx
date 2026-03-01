"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Mail, Lock, CheckCircle2, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [authError, setAuthError] = useState<string>("")
  const [rememberMe, setRememberMe] = useState(true)
  const [isFocused, setIsFocused] = useState({ email: false, password: false })

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const isMountedRef = useRef(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    emailRef.current?.focus()
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const safeSetLoading = (value: boolean) => {
    if (isMountedRef.current) setLoading(value)
  }

  const safeToast = (options: any) => {
    if (isMountedRef.current) toast(options)
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    safeSetLoading(true)
    setErrors({})
    setAuthError("")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (!isMountedRef.current) return

      safeToast({
        title: "Welcome back!",
        description: "You're now signed in to your Formatly account.",
        variant: "default",
      })

      setTimeout(() => {
        if (isMountedRef.current) {
          router.replace("/dashboard")
        }
      }, 100)
    } catch (error: any) {
      if (!isMountedRef.current) return

      let errorMessage = error.message
      let errorTitle = "Sign In Issue"

      if (error.message?.includes("Email not confirmed")) {
        errorTitle = "Email Verification Required"
        errorMessage =
          "Please check your email and click the confirmation link to activate your account. Don't forget to check your spam folder!"
      } else if (error.message?.includes("Invalid login credentials")) {
        errorTitle = "Invalid Credentials"
        errorMessage = "The email or password you entered is incorrect. Please try again."
        setAuthError(errorMessage)
      } else if (error.message?.includes("Email link is invalid or has expired")) {
        errorTitle = "Verification Link Expired"
        errorMessage =
          "Your email verification link has expired. Please sign up again to receive a new confirmation email."
      } else if (error.message?.includes("Too many requests")) {
        errorTitle = "Too Many Attempts"
        errorMessage = "You've tried signing in too many times. Please wait a few minutes before trying again."
      } else if (error.message?.includes("User not found")) {
        errorTitle = "Account Not Found"
        errorMessage = "No account exists with this email address. Please check your email or sign up."
        setAuthError(errorMessage)
      } else {
        errorMessage = "We couldn't sign you in right now. Please check your connection and try again."
        setAuthError(errorMessage)
      }

      safeToast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      })
    } finally {
      safeSetLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    safeSetLoading(true)
    setAuthError("")

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      if (!isMountedRef.current) return

      safeToast({
        title: "Google Sign In Issue",
        description: error.message || "We couldn't sign you in with Google right now.",
        variant: "destructive",
      })
    } finally {
      safeSetLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      if (e.target === emailRef.current) {
        passwordRef.current?.focus()
      } else if (e.target === passwordRef.current) {
        handleLogin(e as any)
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/30 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[100px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl space-y-8">
          {/* Header */}
          <div className="flex flex-col space-y-6">
            <Link
              href="/"
              className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit"
            >
              <div className="p-1 rounded-full group-hover:bg-primary/10 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </div>
              Back to home
            </Link>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">Welcome back</h1>
              <p className="text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="text-primary font-semibold hover:underline underline-offset-4">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <Button
              variant="outline"
              type="button"
              className="h-12 border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 relative group overflow-hidden bg-background/50"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
              <div className="flex items-center justify-center gap-3 relative z-10 w-full font-medium">
                <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive font-medium leading-relaxed">{authError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <div className="space-y-2 group">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isFocused.email ? "text-primary" : "text-muted-foreground"}`} />
                    <Input
                      ref={emailRef}
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors({ ...errors, email: undefined })
                      }}
                      onFocus={() => setIsFocused((prev) => ({ ...prev, email: true }))}
                      onBlur={() => setIsFocused((prev) => ({ ...prev, email: false }))}
                      className={`h-12 pl-12 bg-accent/5 border-border/50 rounded-xl transition-all duration-300 focus:bg-background ${errors.email ? "border-destructive/50 ring-destructive/20" : "focus:border-primary/50 focus:ring-primary/20"}`}
                    />
                  </div>
                  {errors.email && <p className="text-[10px] font-bold text-destructive uppercase ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-2 group">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Password
                    </Label>
                    <Link href="/auth/forgot-password" size="sm" className="text-[10px] font-bold uppercase text-primary hover:text-primary/80 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isFocused.password ? "text-primary" : "text-muted-foreground"}`} />
                    <Input
                      ref={passwordRef}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors({ ...errors, password: undefined })
                      }}
                      onFocus={() => setIsFocused((prev) => ({ ...prev, password: true }))}
                      onBlur={() => setIsFocused((prev) => ({ ...prev, password: false }))}
                      className={`h-12 pl-12 pr-12 bg-accent/5 border-border/50 rounded-xl transition-all duration-300 focus:bg-background ${errors.password ? "border-destructive/50 ring-destructive/20" : "focus:border-primary/50 focus:ring-primary/20"}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-accent rounded-lg"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-[10px] font-bold text-destructive uppercase ml-1">{errors.password}</p>}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 ml-1">
                <Checkbox
                  id="remember_me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="rounded-md"
                />
                <Label htmlFor="remember_me" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
                  Remember me for 30 days
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 mt-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all duration-300 shadow-lg shadow-primary/20 group relative overflow-hidden active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 group-hover:translate-x-1 transition-transform">
                    Sign in to your account
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>

              <div className="pt-6 border-t border-border/40">
                <div className="flex bg-muted/30 p-4 rounded-2xl items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-foreground">Secure Authentication</h4>
                    <p className="text-xs text-muted-foreground">Encrypted end-to-end sessions.</p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <p className="text-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">
            © 2026 Formatly Inc.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
