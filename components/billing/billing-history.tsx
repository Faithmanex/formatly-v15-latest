"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Calendar, DollarSign } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getBillingHistory } from "@/lib/billing"

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  currency: string
  status: "paid" | "pending" | "failed"
  created_at: string
  due_date: string
  description: string
  pdf_url?: string
}

export function BillingHistory() {
  const { profile } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBillingHistory = async () => {
      if (!profile?.id) return

      try {
        const history = await getBillingHistory(profile.id)
        setInvoices(history)
      } catch (error) {
        console.error("Error loading billing history:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBillingHistory()
  }, [profile?.id])

  const handleDownloadInvoice = async (invoiceId: string) => {
    // Simulate PDF download
    const link = document.createElement("a")
    link.href = `/api/invoices/${invoiceId}/download`
    link.download = `invoice-${invoiceId}.pdf`
    link.click()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Invoice History
          </CardTitle>
          <CardDescription>View and download your past invoices and payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-gray-500">Your billing history will appear here once you have invoices.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{invoice.invoice_number}</h4>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{invoice.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Created: {formatDate(invoice.created_at)}</span>
                      <span>Due: {formatDate(invoice.due_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(invoice.amount, invoice.currency)}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
