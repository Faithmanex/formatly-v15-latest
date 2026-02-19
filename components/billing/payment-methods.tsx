"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreditCard, Plus, Trash2, Star } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getPaymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } from "@/lib/billing"
import { useToast } from "@/hooks/use-toast"

interface PaymentMethod {
  id: string
  type: "card"
  card_brand: string
  card_last4: string
  card_exp_month: number
  card_exp_year: number
  is_default: boolean
  created_at: string
}

export function PaymentMethods() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [addingCard, setAddingCard] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Form state for adding new card
  const [cardForm, setCardForm] = useState({
    number: "",
    expMonth: "",
    expYear: "",
    cvc: "",
    name: "",
  })

  useEffect(() => {
    loadPaymentMethods()
  }, [profile?.id])

  const loadPaymentMethods = async () => {
    if (!profile?.id) return

    try {
      const methods = await getPaymentMethods(profile.id)
      setPaymentMethods(methods)
    } catch (error) {
      console.error("Error loading payment methods:", error)
      toast({
        title: "Error",
        description: "Failed to load payment methods.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCard = async () => {
    if (!profile?.id) return

    setAddingCard(true)
    try {
      await addPaymentMethod(profile.id, {
        number: cardForm.number,
        exp_month: Number.parseInt(cardForm.expMonth),
        exp_year: Number.parseInt(cardForm.expYear),
        cvc: cardForm.cvc,
        name: cardForm.name,
      })

      toast({
        title: "Success",
        description: "Payment method added successfully.",
      })

      setShowAddDialog(false)
      setCardForm({ number: "", expMonth: "", expYear: "", cvc: "", name: "" })
      loadPaymentMethods()
    } catch (error) {
      console.error("Error adding payment method:", error)
      toast({
        title: "Error",
        description: "Failed to add payment method.",
        variant: "destructive",
      })
    } finally {
      setAddingCard(false)
    }
  }

  const handleRemoveCard = async (paymentMethodId: string) => {
    if (!profile?.id) return

    try {
      await removePaymentMethod(profile.id, paymentMethodId)
      toast({
        title: "Success",
        description: "Payment method removed successfully.",
      })
      loadPaymentMethods()
    } catch (error) {
      console.error("Error removing payment method:", error)
      toast({
        title: "Error",
        description: "Failed to remove payment method.",
        variant: "destructive",
      })
    }
  }

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!profile?.id) return

    try {
      await setDefaultPaymentMethod(profile.id, paymentMethodId)
      toast({
        title: "Success",
        description: "Default payment method updated.",
      })
      loadPaymentMethods()
    } catch (error) {
      console.error("Error setting default payment method:", error)
      toast({
        title: "Error",
        description: "Failed to update default payment method.",
        variant: "destructive",
      })
    }
  }

  const getCardBrandIcon = (brand: string) => {
    // In a real app, you'd use actual card brand icons
    return <CreditCard className="h-5 w-5" />
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>Manage your payment methods and billing information.</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>Add a new credit or debit card to your account.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardForm.number}
                      onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expMonth">Exp. Month</Label>
                      <Input
                        id="expMonth"
                        placeholder="MM"
                        value={cardForm.expMonth}
                        onChange={(e) => setCardForm({ ...cardForm, expMonth: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expYear">Exp. Year</Label>
                      <Input
                        id="expYear"
                        placeholder="YYYY"
                        value={cardForm.expYear}
                        onChange={(e) => setCardForm({ ...cardForm, expYear: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                      value={cardForm.cvc}
                      onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardForm.name}
                      onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCard} disabled={addingCard}>
                    {addingCard ? "Adding..." : "Add Card"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
              <p className="text-gray-500 mb-4">Add a payment method to manage your subscription.</p>
              <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Card
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getCardBrandIcon(method.card_brand)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {method.card_brand.toUpperCase()} •••• {method.card_last4}
                        </span>
                        {method.is_default && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Expires {method.card_exp_month.toString().padStart(2, "0")}/{method.card_exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button variant="outline" size="sm" onClick={() => handleSetDefault(method.id)}>
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveCard(method.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
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
