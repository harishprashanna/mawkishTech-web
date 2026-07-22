import { z } from 'zod'

export const ContactSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters'),
  email:   z.string().email('Invalid email address'),
  company: z.string().optional(),
  intent:  z.string().min(1, 'Please select an option').optional(),
  message: z.string().min(1, 'Message is required'),
})

export type ContactFormData = z.infer<typeof ContactSchema>