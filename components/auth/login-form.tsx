"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Mail, Lock } from "lucide-react"
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
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95 px-4 py-6 sm:py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Card className="border border-border/50 shadow-lg backdrop-blur-sm relative overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <CardHeader className="space-y-2 pb-4 pt-6 sm:pb-6">
            <div className="flex justify-center mb-4">
              <img src="/logo-dark.svg" alt="Formatly Logo" className="h-10 dark:hidden" />
              <img src="/logo-white.svg" alt="Formatly Logo" className="h-10 hidden dark:block" />
            </div>
            <div className="space-y-1 text-center">
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Sign in to continue your document formatting
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pb-6 sm:pb-8">
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-destructive font-medium">{authError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email
                </Label>
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder="you@company.com"
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
                  className={`h-10 sm:h-11 text-sm sm:text-base ${
                    errors.email
                      ? "border-destructive focus-visible:ring-destructive"
                      : isFocused.email
                        ? "border-primary focus-visible:ring-primary"
                        : ""
                  }`}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                <AnimatePresence>
                  {errors.email && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1 sm:gap-2 text-destructive text-xs sm:text-sm font-medium"
                      id="email-error"
                    >
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      {errors.email}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
                    className={`h-10 sm:h-11 text-sm sm:text-base pr-10 sm:pr-12 ${
                      errors.password
                        ? "border-destructive focus-visible:ring-destructive"
                        : isFocused.password
                          ? "border-primary focus-visible:ring-primary"
                          : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-10 sm:h-11 w-10 p-0 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1 sm:gap-2 text-destructive text-xs sm:text-sm font-medium"
                    >
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      {errors.password}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-border cursor-pointer focus:ring-primary focus:ring-2 accent-primary"
                  />
                  <Label htmlFor="remember" className="text-xs sm:text-sm cursor-pointer select-none font-medium">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
                >
                  Forgot?
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
              >
                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 bg-primary hover:bg-primary/90 text-white font-semibold text-sm sm:text-base transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="text-center text-xs text-muted-foreground leading-relaxed"
              >
                <p>
                  By continuing, you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:underline font-medium">
                    Terms
                  </Link>
                  ,{" "}
                  <Link href="/privacy" className="text-primary hover:underline font-medium">
                    Privacy
                  </Link>
                  , and{" "}
                  <Link href="/cookies" className="text-primary hover:underline font-medium">
                    Cookie Policy
                  </Link>
                </p>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.35 }}
              className="mt-4 sm:mt-6 text-center"
            >
              <p className="text-xs sm:text-sm text-muted-foreground">
                New to Formatly?{" "}
                <Link
                  href="/auth/register"
                  className="text-primary hover:text-primary/80 font-semibold transition-colors hover:underline"
                >
                  Create account
                </Link>
              </p>
            </motion.div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center mt-4 sm:mt-6 px-2"
        >
          <p className="text-xs text-muted-foreground">Protected by industry-standard security</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
