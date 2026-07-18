import { z } from 'zod'

export const volunteerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  mobile_number: z.string().min(10, "Mobile number must be at least 10 digits"),
  model_id: z.uuid("Invalid model selection").optional().nullable(),
  photo_url: z.url().optional().nullable(),
  status: z.enum(['Pending', 'Approved', 'Rejected']).optional().default('Pending'),
  accommodation: z.boolean().optional().default(false),
  emergency_contact: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  snk_id: z.string().optional().nullable(),
  role: z.string().optional().nullable()
})

export const sessionSchema = z.object({
  name: z.string().min(3, "Session name must be at least 3 characters"),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lecturer_id: z.uuid().optional().nullable(),
  venue: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format"),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format"),
  capacity: z.number().int().positive().optional().nullable(),
  status: z.enum(['Scheduled', 'Ongoing', 'Completed', 'Cancelled']).optional().default('Scheduled')
})

export const lecturerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  mobile: z.string().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().nullable(),
  status: z.enum(['Active', 'Inactive']).optional().default('Active')
})

export const bulkImportVolunteerSchema = z.array(volunteerSchema)

export const modelHeadSchema = z.object({
  fullName: z.string().min(2, "Full Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().nullable()
})

export const childSchema = z.object({
  qr_id: z.string().uuid("Invalid QR ID"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  contact_number: z.string().optional().nullable(),
  session_id: z.string().uuid("Invalid Session ID").optional().nullable()
})
