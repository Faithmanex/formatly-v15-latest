"use client"

import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { pricingPlans } from "@/lib/landing-data"

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`transition-base hover-lift ${className}`}>{children}</div>
}

export function Pricing() {
  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16 px-4"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">Choose the plan that fits your needs</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <TiltCard>
                <Card
                  className={`relative h-full hover:shadow-2xl transition-all bg-background ${
                    plan.popular ? "border-primary border-2 sm:scale-105" : ""
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs sm:text-sm rounded-full">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-6 sm:pb-8 p-4 sm:p-6">
                    <CardTitle className="text-xl sm:text-2xl mb-3 sm:mb-4">{plan.name}</CardTitle>
                    <div className="mb-2">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-bold">{plan.price}</span>
                      <span className="text-sm sm:text-base text-muted-foreground">/{plan.period}</span>
                    </div>
                    <CardDescription className="text-sm sm:text-base">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                    <ul className="space-y-2 sm:space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      size="lg"
                      variant={plan.buttonVariant}
                      asChild
                      className={`w-full text-sm sm:text-base rounded-full ${
                        plan.popular ? "bg-primary hover:bg-primary/90" : ""
                      }`}
                    >
                      <Link href={plan.name === "Team" ? "#" : "/auth/register"}>{plan.buttonText}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
