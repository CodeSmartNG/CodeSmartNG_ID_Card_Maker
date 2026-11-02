import { z } from 'zod';

const singleMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  tin: z.string().optional().or(z.literal('')),
  nin: z.string().optional().or(z.literal('')),
});

export const createMemberSchema = z.object({
  body: singleMemberSchema,
});

export const updateMemberSchema = z.object({
  body: singleMemberSchema.partial(),
});

export const listMembersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
  }),
});

// 👇 NEW: Schema for CSV bulk import
export const bulkCreateMemberSchema = z.object({
  body: z.array(singleMemberSchema).min(1).max(500), // Limit to 500 at a time
});
