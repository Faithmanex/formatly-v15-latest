import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy - Formatly",
  description: "Comprehensive Privacy Policy for Formatly's AI-powered formatting services.",
}

export default function PrivacyPolicyPage() {
  const lastUpdated = "March 1, 2026"

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {lastUpdated}
            <br />
            Effective Date: March 1, 2026
          </p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2 mb-4">
              1. Introduction & Scope
            </h2>
            <p className="text-muted-foreground leading-relaxed">
               Formatly Inc. ("we," "our," or "us") is deeply committed to safeguarding your privacy and ensuring the security of the data you entrust to us. This Comprehensive Privacy Policy details exactly how we collect, use, process, share, and protect your personal data and proprietary documents when you access our website, application programming interfaces (APIs), and AI-driven formatting platform (collectively, the "Services").
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              By registering an account or utilizing our Services in any capacity, you acknowledge that you have read, understood, and unreservedly agree to the terms prescribed in this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2 mb-4">
              2. Exhaustive List of Information We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed">
               To provide, maintain, and secure our Services, we collect specific categories of data, classified below:
            </p>
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-2">2.1 Information You Provide Directly to Us</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account Credentials:</strong> Full name, email address, strictly encrypted passwords, and profile avatars.</li>
              <li><strong>OAuth Data:</strong> If you authenticate via Google or another third-party Single Sign-On (SSO) provider, we collect your basic profile information (name, email) as permitted by those providers and your privacy settings with them.</li>
              <li><strong>Financial Data:</strong> For paid subscriptions, we collect billing addresses and payment histories. <strong>Note:</strong> We do NOT store full credit card numbers or CVV codes within our internal databases. All financial transactions are tokenized and processed securely by our PCI-DSS compliant payment gateways (e.g., PayPal, Stripe, Paddle).</li>
              <li><strong>Direct Communications:</strong> Any inquiries to our support desk, feedback forms, feature requests, or legal correspondence.</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-2">2.2 Automatically Collected Telemetry & Usage Data</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
               <li><strong>Device & Network Metrics:</strong> IP addresses, browser agents, operating system versions, and unique device identifiers (e.g., UUIDs).</li>
               <li><strong>Application Telemetry:</strong> Features accessed, exact timestamps of API calls, document parse durations, error logs, and stack traces resulting from application crashes.</li>
               <li><strong>Cookies & Local Storage:</strong> Cryptographic session tokens, JWTs, and tracking beacons necessary for user authentication and preserving application state across sessions.</li>
            </ul>
          </section>

          <section>
             <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">2.3 User-Provided Content (The "Document Payload")</h2>
             <p className="text-muted-foreground leading-relaxed">
               When utilizing our formatting engines, you upload raw text files, PDFs, or word processing documents. This payload includes your raw intellectual property, bibliographic metadata, and any embedded data within the file structure.
            </p>
          </section>

          <section>
             <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2 mb-4">
              3. Our Strict Policy on AI Training & Document Processing
            </h2>
            <p className="text-muted-foreground leading-relaxed font-semibold italic">
               We recognize that academic and professional documents are highly sensitive. This section explicitly defines our handling of your Document Payload.
            </p>
             <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Ephemerality & Processing:</strong> Document Payloads are transferred over TLS 1.3 encryption directly into our secure, isolated processing pipelines. They reside in volataile memory briefly during active parsing and formatting before being outputted back to you. They are then securely stored within segregated cloud buckets utilizing strict Row-Level Security (RLS) policies.</li>
              <li><strong>Zero Foundation Model Training:</strong> Under absolutely no circumstances do we harvest, mine, scrape, or otherwise utilize your Document Payload to train, fine-tune, or calibrate our foundational Large Language Models (LLMs) or heuristics algorithms.</li>
              <li><strong>Isolation Guarantee:</strong> Your Document Payload is exclusively tied to your authenticated user identity. Our architectural design prohibits cross-tenant data spillage. No other user on the Formatly platform can query, access, or derive insight from your stored documents.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2 mb-4">
              4. How We Utilize Non-Document Information
            </h2>
             <p className="text-muted-foreground leading-relaxed">
              Excluding the Document Payload, we utilize Account, Financial, and Telemetry data strictly for:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
               <li>Fulfilling the core contractual obligations of our Services.</li>
               <li>Processing invoices, handling disputes, and preventing systemic payment fraud.</li>
               <li>Detecting and mitigating catastrophic security threats, DDoS attacks, blocklisting malicious IP ranges, and auditing system integrity.</li>
               <li>Aggregating anonymized cohort analytics to dictate future feature roadmaps (e.g., determining the percentage of users requiring Chicago Style versus APA).</li>
               <li>Compliance with explicit legal subpoenas issued by courts of competent jurisdiction.</li>
            </ul>
          </section>

           <section>
            <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2 mb-4">
              5. Third-Party Subprocessors
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We lack vertical integration on all hardware stacks. Therefore, we utilize trusted third-party enterprise vendors ("Subprocessors"). We only share the minimal amount of data required for them to perform their specific function. Current subprocessors include:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
               <li><strong>Authentication & Database Hosting:</strong> Supabase Inc. (Stores encrypted credentials and document mappings).</li>
               <li><strong>Edge Infrastructure & CDN:</strong> Vercel Inc. (Hosts the application runtime and routes traffic securely).</li>
               <li><strong>Payment Infrastructure:</strong> PayPal Holdings, Inc. / Stripe, Inc. (Handles PCI-compliant processing of transaction tokens).</li>
               <li><strong>Transactional Email:</strong> Resend / SendGrid (For password resets, invoice deliveries, and email verification pings).</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We execute binding Data Processing Agreements (DPAs) with all subprocessors ensuring their data security standards align with or exceed our own.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2 mb-4">
              6. Data Security Architectures
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement defense-in-depth strategies:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
               <li><strong>Encryption in Transit:</strong> 100% of data traveling to and from our domains is protected by mandatory HTTPS (TLS 1.2+ minimum, TLS 1.3 default).</li>
               <li><strong>Encryption at Rest:</strong> Database volumes and cloud storage buckets are encrypted utilizing AES-256 standard encryption before physical write to disk.</li>
               <li><strong>Access Control:</strong> Administrative access to production databases requires multi-factor authentication (MFA) and is strictly limited on a principle-of-least-privilege basis to essential DevOps personnel only.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2 mb-4">
              7. International Data Transfers
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Formatly operates primarily out of servers located in the United States and the European Union. By using the Services, you consent to the transfer of your data to these regions. For users originating in the European Economic Area (EEA), we rely on Standard Contractual Clauses (SCCs) to ensure adequacy mechanisms are met during transatlantic data flows.
            </p>
          </section>

           <section>
            <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2 mb-4">
              8. Your Absolute Data Rights (GDPR & CCPA Aligned)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Subject to verified identity and local law, you hold actionable rights concerning your data:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
               <li><strong>The Right to Access & Portability:</strong> You may request a machine-readable export of all metadata associated with your account.</li>
               <li><strong>The Right to Rectification:</strong> You may correct erroneous profiling data via your dashboard.</li>
               <li><strong>The Right to Erasure ("Right to be Forgotten"):</strong> Upon clicking "Delete Account," we trigger a cascading hard-delete of your profile, billing history, and entirely purge your stored Document Payloads from active storage buckets. (Note: Encrypted backups may retain this data for an additional 30 days before natural rotation overwrites them).</li>
               <li><strong>The Right to Restrict Processing:</strong> You may halt active processing scenarios under certain dispute conditions.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To trigger any of these formal actions beyond the capabilities of the automated user dashboard, email your request directly to privacy@formatly.com with the subject line "Formal Data Request." We process authenticated requests within 30 calendar days.
            </p>
          </section>

           <section>
            <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2 mb-4">
              9. Mandatory Disclosure Thresholds
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to pierce data confidentiality and disclose information to law enforcement agencies or third-party litigants ONLY if compelled by a court order, subpoena, search warrant, or binding statutory mandate. We will, unless explicitly gagged by the issuing court, attempt to notify you prior to compliance so you may seek protective legal remedies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2 mb-4">
              10. Contact Details & Privacy Officer
            </h2>
             <p className="text-muted-foreground leading-relaxed">
               For escalations, formal GDRP Article 27 inquiries, or concerns regarding systemic privacy vulnerabilities, you must contact our dedicated compliance desk:
            </p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border inline-block min-w-[300px]">
               <p className="font-medium text-foreground text-lg mb-1">Formatly Data Protection Officer</p>
               <p className="text-sm text-muted-foreground">C/O Legal & Compliance</p>
               <p className="text-sm font-medium text-primary mt-2">privacy@formatly.com</p>
            </div>
             <p className="text-muted-foreground leading-relaxed mt-4 text-xs uppercase font-bold tracking-wider">
               If you suspect a zero-day vulnerability or security breach, do not use regular support channels. Email security@formatly.com directly.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
