'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ChevronDown, ChevronRight, HelpCircle, FileText, Upload, Settings, MessageSquare } from 'lucide-react'

const faqData = [
  {
    category: "Getting Started",
    icon: Upload,
    questions: [
      {
        question: "How do I upload a document?",
        answer: "You can upload documents by clicking the 'Upload Document' button on the dashboard, or by dragging and dropping files directly onto the upload zone. We support .docx files up to 10MB in size."
      },
      {
        question: "What file formats are supported?",
        answer: "Currently, we support Microsoft Word documents (.docx format). Support for additional formats like .doc, .pdf, and .txt is coming soon."
      },
      {
        question: "What is guest mode?",
        answer: "Guest mode allows you to try Formatly without creating an account. You can process 1 document for free to see how our formatting works. Create an account for unlimited access."
      }
    ]
  },
  {
    category: "Formatting Styles",
    icon: FileText,
    questions: [
      {
        question: "What citation styles do you support?",
        answer: "We support APA, MLA, Harvard, and Chicago citation styles. Each style includes proper in-text citations, reference formatting, and document structure according to official guidelines."
      },
      {
        question: "Can I create custom formatting styles?",
        answer: "Yes! Registered users can create custom formatting styles with their own font, spacing, margin, and citation preferences. You can save multiple custom styles and set one as your default."
      },
      {
        question: "How accurate is the formatting?",
        answer: "Our AI-powered formatting engine follows official style guidelines with 95%+ accuracy. We continuously update our algorithms to match the latest formatting standards."
      }
    ]
  },
  {
    category: "Document Processing",
    icon: Settings,
    questions: [
      {
        question: "How long does processing take?",
        answer: "Most documents are processed within 30-60 seconds, depending on length and complexity. You'll see real-time progress updates during processing."
      },
      {
        question: "What happens if processing fails?",
        answer: "If processing fails, you'll receive an error message with details. Common issues include unsupported content or corrupted files. You can retry processing or contact support for help."
      },
      {
        question: "Can I process multiple documents at once?",
        answer: "Yes! Use the multi-upload feature to process several documents simultaneously. You can apply the same style to all documents or set individual styles for each."
      }
    ]
  },
  {
    category: "Account & Billing",
    icon: HelpCircle,
    questions: [
      {
        question: "Is Formatly free to use?",
        answer: "We offer a free tier with limited document processing. Guest users can process 1 document, while registered users get more generous limits. Premium plans offer unlimited processing."
      },
      {
        question: "How do I upgrade my account?",
        answer: "You can upgrade your account from the Account Settings page. Choose from our flexible plans based on your document processing needs."
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
      }
    ]
  }
]

const troubleshootingSteps = [
  {
    issue: "Document won't upload",
    steps: [
      "Check that your file is in .docx format",
      "Ensure file size is under 10MB",
      "Try refreshing the page and uploading again",
      "Clear your browser cache and cookies"
    ]
  },
  {
    issue: "Processing is stuck",
    steps: [
      "Wait up to 2 minutes for processing to complete",
      "Check your internet connection",
      "Try canceling and restarting the process",
      "Contact support if the issue persists"
    ]
  },
  {
    issue: "Formatting looks incorrect",
    steps: [
      "Verify you selected the correct citation style",
      "Check that your original document has proper structure",
      "Try reprocessing with different style settings",
      "Use the 'Edit & Reformat' option to make adjustments"
    ]
  }
]

export function HelpFAQ() {
  const [searchTerm, setSearchTerm] = useState("")
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & FAQ</h1>
        <p className="text-muted-foreground">
          Find answers to common questions and get help with Formatly
        </p>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList>
          <TabsTrigger value="faq">Frequently Asked Questions</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for help..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* FAQ Categories */}
          <div className="space-y-6">
            {filteredFAQ.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="h-5 w-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.questions.map((item, index) => {
                      const itemId = `${category.category}-${index}`
                      const isOpen = openItems.includes(itemId)
                      
                      return (
                        <Collapsible key={index}>
                          <CollapsibleTrigger
                            className="flex items-center justify-between w-full p-4 text-left border rounded-lg hover:bg-muted/50 transition-colors"
                            onClick={() => toggleItem(itemId)}
                          >
                            <span className="font-medium">{item.question}</span>
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-4">
                            <p className="text-muted-foreground">{item.answer}</p>
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
              <CardDescription>
                Step-by-step solutions for common problems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {troubleshootingSteps.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      {item.issue}
                    </h3>
                    <ol className="space-y-2">
                      {item.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-2 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                            {stepIndex + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Contact Support
                </CardTitle>
                <CardDescription>
                  Get personalized help from our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Need help with something specific? Our support team is here to help.
                  </p>
                  <Button className="w-full">
                    Open Support Ticket
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Response Time:</strong> Usually within 24 hours</p>
                  <p><strong>Available:</strong> Monday - Friday, 9 AM - 5 PM EST</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Detailed guides and API documentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    User Guide
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    API Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Style Guide Reference
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
