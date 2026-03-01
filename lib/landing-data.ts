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
} from "lucide-react"

export const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Format in under 60 seconds.",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
  },
  {
    icon: FileText,
    title: "All Citation Styles",
    description: "APA, MLA, Chicago, Harvard, IEEE, and 50+ more academic formats",
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
  { icon: TrendingUp, value: "25x", label: "Faster formatting" },
  { icon: Users, value: "42x", label: "More accuracy" },
  { icon: Target, value: "300%", label: "Productivity boost" },
]

export const testimonials = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Stanford Research Professor",
    content: "Formatly saved me over 15 hours on my last paper. The APA 7th edition formatting is absolutely perfect!",
    rating: 5,
    avatar: "SM",
  },
  {
    name: "James Rodriguez",
    role: "PhD Candidate, MIT",
    content: "This tool is a game-changer for graduate students. I can focus on research instead of formatting headaches.",
    rating: 5,
    avatar: "JR",
  },
  {
    name: "Dr. Emily Chen",
    role: "Medical Journal Editor",
    content: "We recommend Formatly to all our authors. The consistency and quality are unmatched in the industry.",
    rating: 5,
    avatar: "EC",
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
      "All formatting styles: MLA, Chicago, Harvard, AMA, IEEE",
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
    title: "Thesis & Dissertations",
    description:
      "Perfect for lengthy academic works. Formatly handles complex formatting requirements for theses across all major citation styles.",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    icon: FileCheck,
    title: "Journal Submissions",
    description:
      "Meet strict journal guidelines instantly. Ensure your manuscript meets every formatting requirement before submission.",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  {
    icon: BookMarked,
    title: "Research Papers",
    description:
      "Format research papers with precision. Support for all academic styles ensures your work looks professional and polished.",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
]

export const faqs = [
  {
    question: "Which citation styles are supported?",
    answer:
      "Formatly supports 50+ citation styles including APA 7th edition, MLA 9th edition, Chicago Manual of Style (16th edition), Harvard, IEEE, and many more. We continuously add new styles based on user requests.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes, absolutely. We use enterprise-grade end-to-end encryption for all documents. Your files are never stored on our servers longer than necessary, and we comply with GDPR, CCPA, and other data protection regulations.",
  },
  {
    question: "Can I use Formatly offline?",
    answer:
      "Currently, Formatly requires an internet connection. However, we're working on an offline mode for our Professional and Team plans. You can download your formatted documents and work with them offline.",
  },
  {
    question: "How long does formatting take?",
    answer:
      "Most documents are formatted in under 60 seconds. The time depends on document size and length, but our AI-powered engine is optimized for speed without sacrificing accuracy.",
  },
  {
    question: "Can I collaborate with my team?",
    answer:
      "Yes! Our Team plan includes real-time collaboration features. You can invite team members, share documents, and track changes together. Perfect for research groups and co-authored papers.",
  },
  {
    question: "What file formats do you support?",
    answer:
      "We supports only Word (.docx) files. You can upload your document in this format and download the formatted version in Word (.docx) format.",
  },
]
