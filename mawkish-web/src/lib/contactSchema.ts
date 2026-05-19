import { z } from 'zod'

export const ContactSchema = z.object({
  fullName:        z.string().min(2, 'Name must be at least 2 characters'),
  companyName:     z.string().min(1, 'Company name is required'),
  email:           z.string().email('Invalid email address'),
  phone:           z.string().optional(),
  serviceInterest: z.string().min(1, 'Please select a service'),
  message:         z.string().min(20, 'Message must be at least 20 characters'),
})

export type ContactFormData = z.infer<typeof ContactSchema>