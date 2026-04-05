"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { testimonials } from "@/lib/landing-data"

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`transition-base hover-lift ${className}`}>{children}</div>
}

export function Testimonials() {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16 px-4"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Trusted by Researchers Worldwide
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">See what our users have to say</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <TiltCard>
                <Card className="h-full bg-card/60 backdrop-blur-md border border-border/50 hover:border-primary/30 transition-all shadow-md hover:shadow-xl overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 sm:p-8 relative z-10 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex mb-4 sm:mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-base sm:text-lg text-foreground mb-6 leading-relaxed font-medium italic">
                        "{testimonial.content}"
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 mt-auto pt-4 border-t border-border/50">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm sm:text-base group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-sm sm:text-base">{testimonial.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
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
