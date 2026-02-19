"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { customStyleService } from "@/lib/database"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface CustomStyleEditorProps {
  style?: any
  onClose: () => void
  onSave: (style: any) => void
}

interface StyleFormData {
  name: string
  font: string
  fontSize: string
  lineSpacing: string
  margins: string
  includeTOC: boolean
  pageNumbers: string
  citationStyle: string
  isDefault: boolean
  description: string
}

export function CustomStyleEditor({ style, onClose, onSave }: CustomStyleEditorProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<StyleFormData>({
    name: "",
    font: "times",
    fontSize: "12",
    lineSpacing: "double",
    margins: "1",
    includeTOC: true,
    pageNumbers: "header-right",
    citationStyle: "apa",
    isDefault: false,
    description: "",
  })

  useEffect(() => {
    if (style) {
      setFormData({
        name: style.name || "",
        font: style.settings?.font || "times",
        fontSize: style.settings?.fontSize?.toString() || "12",
        lineSpacing: style.settings?.spacing || "double",
        margins: style.settings?.margins || "1",
        includeTOC: style.settings?.includeTOC ?? true,
        pageNumbers: style.settings?.pageNumbers || "header-right",
        citationStyle: style.settings?.citationStyle || "apa",
        isDefault: style.is_default || false,
        description: style.description || "",
      })
    }
  }, [style])

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save styles.",
        variant: "destructive",
      })
      return
    }

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Style name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      const styleData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        user_id: user.id,
        is_default: formData.isDefault,
        is_global: false,
        settings: {
          font: formData.font,
          fontSize: Number.parseInt(formData.fontSize),
          spacing: formData.lineSpacing,
          margins: formData.margins,
          includeTOC: formData.includeTOC,
          pageNumbers: formData.pageNumbers,
          citationStyle: formData.citationStyle,
        },
      }

      let savedStyle
      if (style?.id) {
        // Update existing style
        savedStyle = await customStyleService.updateStyle(style.id, styleData)
      } else {
        // Create new style
        savedStyle = await customStyleService.createStyle(styleData)
      }

      if (savedStyle) {
        // If this is set as default, update the default style
        if (formData.isDefault) {
          await customStyleService.setDefaultStyle(user.id, savedStyle.id)
        }

        onSave(savedStyle)
      } else {
        throw new Error("Failed to save style")
      }
    } catch (error) {
      console.error("Error saving style:", error)
      toast({
        title: "Error",
        description: "Failed to save custom style. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getFontDisplayName = (font: string) => {
    switch (font) {
      case "times":
        return "Times New Roman"
      case "arial":
        return "Arial"
      case "calibri":
        return "Calibri"
      case "georgia":
        return "Georgia"
      default:
        return font
    }
  }

  const getSpacingDisplayName = (spacing: string) => {
    switch (spacing) {
      case "single":
        return "Single"
      case "1.5":
        return "1.5"
      case "double":
        return "Double"
      default:
        return spacing
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{style ? "Edit Custom Style" : "Create Custom Style"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Style Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter style name"
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="default"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isDefault: checked }))}
              />
              <Label htmlFor="default">Set as default style</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe when to use this style..."
              className="mt-1"
            />
          </div>

          <Tabs defaultValue="typography" className="space-y-4">
            <TabsList>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="citations">Citations</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="typography" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Font Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Font Family</Label>
                    <RadioGroup
                      value={formData.font}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, font: value }))}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="times" id="times-custom" />
                        <Label htmlFor="times-custom">Times New Roman</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="arial" id="arial-custom" />
                        <Label htmlFor="arial-custom">Arial</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="calibri" id="calibri-custom" />
                        <Label htmlFor="calibri-custom">Calibri</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="georgia" id="georgia-custom" />
                        <Label htmlFor="georgia-custom">Georgia</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Font Size</Label>
                    <RadioGroup
                      value={formData.fontSize}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, fontSize: value }))}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="10" id="size10-custom" />
                        <Label htmlFor="size10-custom">10pt</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="11" id="size11-custom" />
                        <Label htmlFor="size11-custom">11pt</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="12" id="size12-custom" />
                        <Label htmlFor="size12-custom">12pt</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="14" id="size14-custom" />
                        <Label htmlFor="size14-custom">14pt</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spacing & Margins</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Line Spacing</Label>
                      <RadioGroup
                        value={formData.lineSpacing}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, lineSpacing: value }))}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="single-custom" />
                          <Label htmlFor="single-custom">Single</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1.5" id="onehalf-custom" />
                          <Label htmlFor="onehalf-custom">1.5</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="double" id="double-custom" />
                          <Label htmlFor="double-custom">Double</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="margins">Margins (inches)</Label>
                      <Input
                        id="margins"
                        value={formData.margins}
                        onChange={(e) => setFormData((prev) => ({ ...prev, margins: e.target.value }))}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Page Elements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="toc-custom" className="text-sm font-medium">
                        Include Table of Contents
                      </Label>
                      <Switch
                        id="toc-custom"
                        checked={formData.includeTOC}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, includeTOC: checked }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Page Numbers</Label>
                      <RadioGroup
                        value={formData.pageNumbers}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, pageNumbers: value }))}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="header-right" id="header-right-custom" />
                          <Label htmlFor="header-right-custom">Header Right</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="footer-center" id="footer-center-custom" />
                          <Label htmlFor="footer-center-custom">Footer Center</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="none" id="none-custom" />
                          <Label htmlFor="none-custom">None</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="citations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Citation Format</CardTitle>
                  <CardDescription>Choose the citation style for this custom format</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.citationStyle}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, citationStyle: value }))}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="apa" id="apa-citation" />
                      <div>
                        <Label htmlFor="apa-citation" className="font-medium">
                          APA Style
                        </Label>
                        <p className="text-sm text-muted-foreground">(Author, Year) format with References list</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="mla" id="mla-citation" />
                      <div>
                        <Label htmlFor="mla-citation" className="font-medium">
                          MLA Style
                        </Label>
                        <p className="text-sm text-muted-foreground">(Author Page) format with Works Cited</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="harvard" id="harvard-citation" />
                      <div>
                        <Label htmlFor="harvard-citation" className="font-medium">
                          Harvard Style
                        </Label>
                        <p className="text-sm text-muted-foreground">Author-date system with Reference list</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded">
                      <RadioGroupItem value="chicago" id="chicago-citation" />
                      <div>
                        <Label htmlFor="chicago-citation" className="font-medium">
                          Chicago Style
                        </Label>
                        <p className="text-sm text-muted-foreground">Footnotes with Bibliography</p>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Style Preview</CardTitle>
                  <CardDescription>Preview how your custom style will appear</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="border rounded-lg p-6 bg-white text-black"
                    style={{
                      fontFamily: getFontDisplayName(formData.font),
                      fontSize: `${formData.fontSize}pt`,
                      lineHeight:
                        formData.lineSpacing === "single" ? "1" : formData.lineSpacing === "1.5" ? "1.5" : "2",
                    }}
                  >
                    <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Sample Document Title</h1>
                    <p style={{ marginBottom: "15px" }}>
                      This is a sample paragraph showing how your custom style will appear. The font family is{" "}
                      {getFontDisplayName(formData.font)}, size {formData.fontSize}pt, with{" "}
                      {getSpacingDisplayName(formData.lineSpacing)} line spacing.
                    </p>
                    <p style={{ marginBottom: "15px" }}>
                      Citations will appear in {formData.citationStyle.toUpperCase()} format.
                      {formData.includeTOC && " A table of contents will be included at the beginning of the document."}
                    </p>
                    {formData.pageNumbers !== "none" && (
                      <div
                        style={{
                          textAlign: formData.pageNumbers === "header-right" ? "right" : "center",
                          fontSize: "10pt",
                          marginTop: "20px",
                          borderTop: "1px solid #ccc",
                          paddingTop: "10px",
                        }}
                      >
                        Page 1
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim() || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {style ? "Updating..." : "Creating..."}
                </>
              ) : style ? (
                "Update Style"
              ) : (
                "Create Style"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
