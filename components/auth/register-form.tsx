"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { getSupabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Mail, Lock, User, CheckCircle2, ArrowLeft } from "lucide-react"
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
  const [authError, setAuthError] = useState<string>("")

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
    setAuthError("")

    try {
      const { data, error } = await getSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
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

        setAuthError(errorMessage)
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

      setAuthError("We encountered an issue. Please try again.")
    } finally {
      safeSetLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    safeSetLoading(true)
    setAuthError("")

    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      if (!isMountedRef.current) return

      setAuthError(error.message || "We couldn't sign you in with Google right now.")
    } finally {
      safeSetLoading(false)
    }
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
    if (passwordStrength < 40) return "bg-destructive"
    if (passwordStrength < 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 40) return "Weak"
    if (passwordStrength < 70) return "Medium"
    return "Strong"
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
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">Create account</h1>
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary font-semibold hover:underline underline-offset-4">
                  Sign in
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
                Sign up with Google
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-medium">Or use your email</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
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
                  <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isFocused.fullName ? "text-primary" : "text-muted-foreground"}`} />
                    <Input
                      ref={fullNameRef}
                      id="fullName"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value)
                        if (errors.fullName) setErrors({ ...errors, fullName: undefined })
                      }}
                      onFocus={() => setIsFocused((prev) => ({ ...prev, fullName: true }))}
                      onBlur={() => setIsFocused((prev) => ({ ...prev, fullName: false }))}
                      className={`h-12 pl-12 bg-accent/5 border-border/50 rounded-xl transition-all duration-300 focus:bg-background ${errors.fullName ? "border-destructive/50 ring-destructive/20" : "focus:border-primary/50 focus:ring-primary/20"}`}
                    />
                  </div>
                  {errors.fullName && <p className="text-[10px] font-bold text-destructive uppercase ml-1">{errors.fullName}</p>}
                </div>

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
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Password
                  </Label>
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

                  {password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2 pt-1 ml-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Strength</span>
                        <span className={`text-[10px] font-bold uppercase ${passwordStrength < 40 ? "text-destructive" : passwordStrength < 70 ? "text-yellow-500" : "text-green-500"}`}>
                          {getPasswordStrengthLabel()}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength}%` }}
                          className={`h-full ${getPasswordStrengthColor()} transition-colors duration-500`}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 mt-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all duration-300 shadow-lg shadow-primary/20 group relative overflow-hidden active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 group-hover:translate-x-1 transition-transform">
                    Create your free account
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
                    <h4 className="text-sm font-bold text-foreground">Secure & Private</h4>
                    <p className="text-xs text-muted-foreground">We never sell your data.</p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline font-medium">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline font-medium">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </motion.div>
    </div>
  )
}
