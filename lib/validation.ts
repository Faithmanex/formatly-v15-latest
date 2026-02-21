import { z } from "zod"

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  file_size: z
    .number()
    .positive()
    .max(10 * 1024 * 1024), // 10MB max
  style: z.enum(["apa", "mla", "chicago", "harvard", "ieee", "vancouver", "custom"]),
  englishVariant: z.enum(["us", "uk", "au", "ca"]),
  reportOnly: z.boolean().optional().default(false),
  includeComments: z.boolean().optional().default(true),
  trackedChanges: z.boolean().optional().default(false),
})

export type FileUploadData = z.infer<typeof fileUploadSchema>

// Document processing validation
export const documentProcessSchema = z.object({
  filename: z.string().min(1).max(255),
  content: z.string().optional(), // Required in FastAPI but could be sent via other means or optional in some flows
  style: z.enum(["apa", "mla", "chicago", "harvard", "ieee", "vancouver", "custom"]),
  englishVariant: z.enum(["us", "uk", "au", "ca"]),
  trackedChanges: z.boolean().optional().default(false),
  options: z.record(z.any()).optional(),
  reportOnly: z.boolean().optional(),
  includeComments: z.boolean().optional(),
  preserveFormatting: z.boolean().optional(),
})

export type DocumentProcessData = z.infer<typeof documentProcessSchema>
export const jobIdSchema = z.string().uuid()

// Auth validation
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
})

// Formatting styles validation
export const formattingStyleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  settings: z.record(z.any()).optional(),
})

// Notification validation
export const notificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(["info", "success", "warning", "error"]),
})

// Helper function to validate and sanitize input
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`).join(", ") }
    }
    return { success: false, error: error instanceof Error ? error.message : "Validation failed" }
  }
}
