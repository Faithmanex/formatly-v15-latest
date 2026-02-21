"use client"

import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { faqs } from "@/lib/landing-data"

export function FAQ() {
  return (
    <section
      id="faq"
      className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8 bg-muted/20 backdrop-blur-sm relative scroll-mt-20"
    >
      <div className="absolute inset-0 bg-dot-pattern dark:opacity-[0.04] opacity-30" />
      <div className="max-w-4xl mx-auto relative z-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center">Frequently Asked Questions</h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg px-4 sm:px-6 py-2 sm:py-3 bg-card hover:bg-muted/50 transition-colors"
              >
                <AccordionTrigger className="text-left text-base sm:text-lg font-semibold hover:no-underline py-3 sm:py-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 transition-transform duration-200" />
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed pb-3 sm:pb-4 pl-7 sm:pl-9">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
