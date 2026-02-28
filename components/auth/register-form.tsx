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
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Mail, Lock, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({})
  const [isFocused, setIsFocused] = useState({ email: false, password: false, fullName: false })
  const [passwordStrength, setPasswordStrength] = useState(0)

  const fullNameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const isMountedRef = useRef(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fullNameRef.current?.focus()
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!password) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    if (password.length >= 6) strength += 25
    if (password.length >= 10) strength += 25
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 15
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10

    setPasswordStrength(Math.min(strength, 100))
  }, [password])

  const safeSetLoading = (value: boolean) => {
    if (isMountedRef.current) setLoading(value)
  }

  const safeToast = (options: any) => {
    if (isMountedRef.current) toast(options)
  }

  const safeRouterPush = (path: string) => {
    if (isMountedRef.current) router.push(path)
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!fullName.trim()) {
      newErrors.fullName = "Name is required"
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters"
    }

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    safeSetLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })

      if (!isMountedRef.current) return

      if (error) {
        let errorMessage = error.message

        if (error.status === 422) {
          if (error.message.includes("email")) {
            errorMessage = "Please check your email address. It may already be registered."
          } else if (error.message.includes("password")) {
            errorMessage = "Password doesn't meet security requirements."
          } else if (error.message.includes("User already registered")) {
            errorMessage = "Account exists. Try signing in instead."
          }
        } else if (error.message.includes("Database error saving new user")) {
          errorMessage = "We couldn't complete registration. Please try again."
        }

        safeToast({
          title: "Registration Issue",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      setTimeout(() => {
        if (!isMountedRef.current) return

        if (data.user && !data.user.email_confirmed_at) {
          safeRouterPush(`/auth/confirm-email?email=${encodeURIComponent(email)}`)
        } else {
          safeToast({
            title: "Welcome to Formatly!",
            description: "Your account is ready. Sign in to get started.",
          })
          safeRouterPush("/auth/login")
        }
      }, 100)
    } catch (error: any) {
      if (!isMountedRef.current) return

      safeToast({
        title: "Something Went Wrong",
        description: "We encountered an issue. Please try again.",
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
      if (e.target === fullNameRef.current) {
        emailRef.current?.focus()
      } else if (e.target === emailRef.current) {
        passwordRef.current?.focus()
      } else if (e.target === passwordRef.current) {
        handleRegister(e as any)
      }
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-destructive/60"
    if (passwordStrength < 70) return "bg-yellow-500/60"
    return "bg-green-500/60"
  }

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 40) return "Weak"
    if (passwordStrength < 70) return "Medium"
    return "Strong"
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
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Create Account</CardTitle>
              <CardDescription className="text-sm sm:text-base">Start formatting your documents today</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pb-6 sm:pb-8">
            <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="space-y-2"
              >
                <Label htmlFor="fullName" className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Full Name
                </Label>
                <Input
                  ref={fullNameRef}
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (errors.fullName) setErrors({ ...errors, fullName: undefined })
                  }}
                  onFocus={() => setIsFocused((prev) => ({ ...prev, fullName: true }))}
                  onBlur={() => setIsFocused((prev) => ({ ...prev, fullName: false }))}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  autoComplete="name"
                  className={`h-10 sm:h-11 text-sm sm:text-base ${
                    errors.fullName
                      ? "border-destructive focus-visible:ring-destructive"
                      : isFocused.fullName
                        ? "border-primary focus-visible:ring-primary"
                        : ""
                  }`}
                />
                <AnimatePresence>
                  {errors.fullName && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1 sm:gap-2 text-destructive text-xs sm:text-sm font-medium"
                    >
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      {errors.fullName}
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
                />
                <AnimatePresence>
                  {errors.email && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1 sm:gap-2 text-destructive text-xs sm:text-sm font-medium"
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
                transition={{ duration: 0.3, delay: 0.2 }}
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
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors({ ...errors, password: undefined })
                    }}
                    onFocus={() => setIsFocused((prev) => ({ ...prev, password: true }))}
                    onBlur={() => setIsFocused((prev) => ({ ...prev, password: false }))}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    autoComplete="new-password"
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

                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">Strength:</span>
                      <span
                        className={`text-xs font-semibold ${
                          passwordStrength < 40
                            ? "text-destructive"
                            : passwordStrength < 70
                              ? "text-yellow-600 dark:text-yellow-500"
                              : "text-green-600 dark:text-green-500"
                        }`}
                      >
                        {getPasswordStrengthLabel()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength}%` }}
                        transition={{ duration: 0.3 }}
                        className={`h-full ${getPasswordStrengthColor()} transition-colors`}
                      />
                    </div>
                  </motion.div>
                )}

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
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Create Account
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
                  By creating an account, you agree to our{" "}
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
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary hover:text-primary/80 font-semibold transition-colors hover:underline"
                >
                  Sign in
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
