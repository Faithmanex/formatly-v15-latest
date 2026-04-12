import {
  Zap,
  FileText,
  Shield,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Target,
  GraduationCap,
  FileCheck,
  BookMarked,
  Building2,
  Briefcase,
  PenTool,
} from "lucide-react"

export const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Format in about 30 seconds.",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
  },
  {
    icon: FileText,
    title: "All Citation Styles",
    description: "APA, MLA, Chicago, Harvard, and Turabian — all properly formatted to official standards",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description: "Your documents are secure with end-to-end encryption",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  {
    icon: BookOpen,
    title: "Smart AI Assistant",
    description: "Get intelligent suggestions and guidance on all formatting styles",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  {
    icon: Users,
    title: "Collaborative Workspace",
    description: "Work with co-authors and editors in real time",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
  },
  {
    icon: Award,
    title: "Publisher-Ready Output",
    description: "Meets strict journal and institutions requirements.",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/50",
  },
]

export const stats = [
  { icon: Target, value: "99%", label: "Accuracy" },
  { icon: Zap, value: "480x", label: "Faster formatting" },
  { icon: FileCheck, value: "100%", label: "Style compliance" },
]

export const testimonials = [
  {
    name: "Lakeisha",
    role: "PhD Student",
    content: "APA 7th edition has so many rules, different heading levels, references, grammar. I had my content done but couldn't get the formatting right. Formatly handled all of it in one go. The headings, the references, everything.",
    rating: 5,
    avatar: "L",
  },
  {
    name: "David",
    role: "Master's Student, University of Michigan",
    content: "I was using a free citation generator and my references were all wrong. My professor flagged it immediately. Formatly caught errors I didn't even know existed — hanging indents, italicized journal names, the works.",
    rating: 5,
    avatar: "D",
  },
  {
    name: "Rachel",
    role: "Undergraduate, Ohio State",
    content: "I spent three hours trying to fix my running head and page numbers. Three hours. Formatly did it in seconds. I wish I'd found this before my junior year.",
    rating: 5,
    avatar: "R",
  },
]

export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    price_monthly: 0,
    price_yearly: 0,
    period: "month",
    description: "Get started with Formatly",
    features: [
      "3 documents per month",
      "APA Style formatting only",
      "Standard Email Support",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
    popular: false,
    document_limit: 3,
    priority_support: false,
    custom_styles: false,
    team_collaboration: false,
  },
  {
    id: "pro",
    name: "Pro",
    price_monthly: 12,
    price_yearly: 120,
    period: "month",
    description: "Great for students and professionals",
    features: [
      "Everything in Free, plus:",
      "50 documents per month",
      "All formatting styles: MLA, Chicago, Harvard, Turabian",
      "Tracked Changes: Full transparency on every structural adjustment",
      "Custom styles: Tailor formatting to specific journal or institutional requirements",
      "AI Assistant: Real-time intelligence to refine your document’s flow",
      "Priority email support",
    ],
    buttonText: "Get Started",
    buttonVariant: "default" as const,
    popular: true,
    document_limit: 50,
    priority_support: true,
    custom_styles: true,
    team_collaboration: false,
  },
  {
    id: "business",
    name: "Business",
    price_monthly: 39,
    price_yearly: 390,
    period: "month",
    description: "For research teams and organisations",
    features: [
      "Everything in Pro, plus:",
      "Unlimited Documents for your entire team.",
      "Centralized Billing and seat management.",
      "Advanced Collaboration: Share styles and templates across the organization.",
      "SSO & Enterprise Security: Keeping your proprietary research protected.",
    ],
    buttonText: "Coming soon...",
    buttonVariant: "outline" as const,
    popular: false,
    comingSoon: true,
    document_limit: -1,
    priority_support: true,
    custom_styles: true,
    team_collaboration: true,
  },
]

export const useCases = [
  {
    icon: GraduationCap,
    title: "Students",
    description:
      "High school, homeschool, college, or PhD level. APA, MLA, Chicago and more — done right every time. Stop losing marks on formatting.",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    icon: BookOpen,
    title: "Academic Professionals",
    description:
      "Researchers, lecturers, and academic writers. Focus on your analysis instead of margin alignment.",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  {
    icon: Building2,
    title: "Institutions",
    description:
      "Universities and research institutions. Streamline document formatting across departments with centralized style management.",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  {
    icon: PenTool,
    title: "Freelancers & Agencies",
    description:
      "Freelance editors and formatting agencies. Process client documents faster with accurate results every time.",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
  },
  {
    icon: BookMarked,
    title: "Self-Published Authors",
    description:
      "Indie authors and content creators. Get KDP-ready manuscripts with print-ready formatting — no designer needed.",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
  },
  {
    icon: FileCheck,
    title: "Journal Submissions",
    description:
      "Meet strict journal guidelines instantly. Ensure your manuscript meets every formatting requirement before submission.",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/50",
  },
]

export const faqs = [
  {
    question: "What does Formatly actually do?",
    answer:
      "Formatly formats your document — margins, spacing, fonts, headings, page layout, and structure — all matched to your chosen style (APA, MLA, Chicago, etc.). We don't edit your writing, check grammar, or validate citations. You write it; we make it look right.",
  },
  {
    question: "Do I need to know anything about formatting?",
    answer:
      "Not at all. If you can paste text and click buttons, you can use Formatly. Our wizard walks you through every step — you don't need to know margin sizes, heading styles, or spacing rules.",
  },
  {
    question: "What gets formatted automatically?",
    answer:
      "Margins, fonts, spacing, headings, page numbers, title pages, and structural layout — all applied exactly to published style guide rules. You focus on your writing; we handle the tedious formatting.",
  },
  {
    question: "What doesn't Formatly do?",
    answer:
      "We format documents, not write them. We don't generate citations, write reference entries, create content for title pages or abstracts, or check grammar and spelling. Your writing is your responsibility — the formatting is ours.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Documents up to 3 per month are free with our basic plan. Upgrade to Pro for 50 documents per month with all styles. No per-page or per-word charges. Only you can see your documents.",
  },
  {
    question: "Is my work secure?",
    answer:
      "Yes. Your documents are processed in real-time and only you can access them. We never see, store, or share your content — your work stays yours.",
  },
  {
    question: "What is tracked changes?",
    answer:
      "Tracked Changes shows every formatting adjustment we make to your document — so you can see exactly what changed and approve or reject each change before finalizing your file.",
  },
  {
    question: "Which citation styles are supported?",
    answer:
      "Formatly supports APA 7th edition, MLA 9th edition, Chicago Manual of Style, Harvard, and Turabian. We continuously evaluate new styles based on user requests.",
  },
  {
    question: "Can I switch my document to a different citation style?",
    answer:
      "Yes. You can convert your document between any supported style in one click. All headings, citations, and references update automatically — no need to re-upload your document.",
  },
  {
    question: "How long does formatting take?",
    answer:
      "Most documents are formatted in about 30 seconds. The time depends on document size and length, but our engine is optimised for speed without sacrificing accuracy.",
  },
  {
    question: "What file formats do you support?",
    answer:
      "We support Word (.docx) files only. Upload your .docx document and download the formatted version in the same format.",
  },
]
