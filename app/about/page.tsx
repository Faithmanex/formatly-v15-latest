import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Features } from "@/components/features"
import { Testimonials } from "@/components/testimonials"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "About Us | Formatly",
  description: "Learn about Formatly's mission to revolutionize academic formatting and research efficiency.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 border-b">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Mission</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Formatly was founded with a simple goal: to help researchers focus on their ideas, not their indents. 
              We believe that the time spent on manual formatting is time stolen from innovation.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Formatly?</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Academic writing is hard enough. Between citations, reference lists, and institutional style guides, 
                researchers often spend days just polishing the presentation of their work.
              </p>
              <p className="text-lg text-muted-foreground">
                Our AI-powered platform automates the tedious parts of document preparation, ensuring 100% compliance 
                with APA, MLA, Chicago, and Harvard standards in seconds.
              </p>
            </div>
            <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">30s</div>
                  <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Average Formatting Time</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">5+</div>
                  <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Major Citation Styles</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">10k+</div>
                  <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Users Worldwide</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">100%</div>
                  <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Style Compliance</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Powerful Capabilities</h2>
              <p className="text-xl text-muted-foreground">Everything you need for publication-ready documents</p>
            </div>
            <Features />
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 bg-muted/30">
          <Testimonials />
        </section>
      </main>

      <Footer />
    </div>
  )
}
