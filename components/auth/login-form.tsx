"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Left side: Animated Backdrop & Branding (Desk) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-zinc-950">
        {/* Animated Orbs Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -40, 0],
              y: [0, 60, 0],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[120px]"
          />
        </div>

        {/* Floating Illustration Content */}
        <div className="relative z-10 flex flex-col h-full justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="relative group cursor-default">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <img
                src="/auth_illustration_1772400714827.png"
                alt="Formatly Auth Illustration"
                className="relative rounded-2xl w-full shadow-2xl transform transition-all duration-700 hover:scale-[1.02]"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6 max-w-lg"
          >
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Reinvent your <span className="text-primary italic">workflow.</span>
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed font-light">
              Join thousands of professionals who trust Formatly for automated, precision formatting of their most
              critical documents.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              {[
                { label: "10k+", desc: "Active Users" },
                { label: "99.9%", desc: "Uptime SLA" },
                { label: "ISO 27001", desc: "Security" },
                { label: "24/7", desc: "Expert Support" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-xl font-semibold text-white">{item.label}</span>
                  <span className="text-sm text-zinc-500">{item.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Footer info (Desk) */}
        <div className="relative z-10 flex items-center justify-between text-zinc-500 text-xs">
          <p>© 2026 Formatly Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 py-12 relative">
        {/* Subtle grid pattern background for mobile & desk */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none brightness-50 contrast-150"></div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md space-y-8"
        >
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
            {/* Google Social Login */}
            <Button
              variant="outline"
              type="button"
              className="h-12 border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 relative group overflow-hidden"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
              <div className="flex items-center justify-center gap-3 relative z-10 w-full font-medium">
                <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            {/* Login Form Content */}
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
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Email Address
                    </Label>
                    <AnimatePresence>
                      {errors.email && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-[10px] font-semibold text-destructive uppercase"
                        >
                          {errors.email}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <div
                      className={`absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors ${isFocused.email ? "text-primary" : ""}`}
                    >
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      ref={emailRef}
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors({ ...errors, email: undefined })
                        if (authError) setAuthError("")
                      }}
                      onFocus={() => setIsFocused((prev) => ({ ...prev, email: true }))}
                      onBlur={() => setIsFocused((prev) => ({ ...prev, email: false }))}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      autoComplete="email"
                      className={`h-12 pl-12 bg-accent/5 border-border/50 transition-all duration-300 rounded-xl hover:bg-accent/10 focus:bg-background ${
                        errors.email ? "border-destructive/50 ring-destructive/20" : "focus:border-primary/50 focus:ring-primary/20"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <div className="flex justify-between items-center px-1">
                    <Label
                      htmlFor="password"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Password
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div
                      className={`absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors ${isFocused.password ? "text-primary" : ""}`}
                    >
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      ref={passwordRef}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors({ ...errors, password: undefined })
                        if (authError) setAuthError("")
                      }}
                      onFocus={() => setIsFocused((prev) => ({ ...prev, password: true }))}
                      onBlur={() => setIsFocused((prev) => ({ ...prev, password: false }))}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      autoComplete="current-password"
                      className={`h-12 pl-12 pr-12 bg-accent/5 border-border/50 transition-all duration-300 rounded-xl hover:bg-accent/10 focus:bg-background ${
                        errors.password ? "border-destructive/50 ring-destructive/20" : "focus:border-primary/50 focus:ring-primary/20"
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-accent rounded-lg transition-colors"
                      onClick={togglePasswordVisibility}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-[10px] font-semibold text-destructive uppercase px-1"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
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
                className="w-full h-12 mt-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold tracking-wide transition-all duration-300 shadow-lg shadow-primary/20 group relative overflow-hidden active:scale-[0.98]"
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
                <div className="flex bg-muted/30 p-4 rounded-xl items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Secure Authentication</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your credentials are encrypted end-to-end using industry-standard protocols.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline font-medium">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline font-medium">
              Privacy Policy
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  )
}
