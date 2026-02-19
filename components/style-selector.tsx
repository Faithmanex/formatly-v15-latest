"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-custom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StyleSelectorProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  size?: "default" | "sm"
}

const styles = [
  {
    id: "APA",
    name: "APA Style",
    description: "American Psychological Association - Common in psychology, education, and social sciences",
    features: ["In-text citations", "Reference list", "Title page", "Running head"],
  },
  {
    id: "MLA",
    name: "MLA Style",
    description: "Modern Language Association - Used in literature, arts, and humanities",
    features: ["Works Cited", "In-text citations", "Header with last name", "Double spacing"],
  },
  {
    id: "Harvard",
    name: "Harvard Style",
    description: "Author-date referencing system - Popular in business and economics",
    features: ["Author-date citations", "Reference list", "Footnotes", "Bibliography"],
  },
  {
    id: "Chicago",
    name: "Chicago Style",
    description: "Chicago Manual of Style - Used in history, literature, and arts",
    features: ["Footnotes", "Bibliography", "Author-date", "Notes system"],
  },
]

export function StyleSelector({ value, onValueChange, disabled = false, size = "default" }: StyleSelectorProps) {
  const selectedStyle = styles.find((style) => style.id === value)

  if (size === "sm") {
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select style" />
        </SelectTrigger>
        <SelectContent>
          {styles.map((style) => (
            <SelectItem key={style.id} value={style.id}>
              {style.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {styles.map((style) => (
          <Card
            key={style.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              value === style.id ? "ring-2 ring-primary" : ""
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !disabled && onValueChange(style.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{style.name}</h3>
                {value === style.id && <Badge>Selected</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{style.description}</p>
              <div className="space-y-1">
                {style.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-xs">
                    <div className="w-1 h-1 bg-primary rounded-full mr-2" />
                    {feature}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedStyle && (
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Selected: {selectedStyle.name}</h4>
          <p className="text-sm text-muted-foreground">{selectedStyle.description}</p>
        </div>
      )}
    </div>
  )
}
