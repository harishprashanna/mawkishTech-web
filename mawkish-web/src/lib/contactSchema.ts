import { z } from 'zod'

export const ContactSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters'),
  email:   z.string().email('Invalid email address'),
  company: z.string().optional(),
  phone:   z.string({ required_error: 'Phone number is required' }).trim().min(6, 'Phone number is required').max(30, 'Phone number is too long').regex(/^[+()\d\s.-]+$/, 'Invalid phone number'),
  service: z.string().optional(),
  intent:  z.string().min(1, 'Please select an option').optional(),
  message: z.string().min(1, 'Message is required'),
})

export type ContactFormData = z.infer<typeof ContactSchema>