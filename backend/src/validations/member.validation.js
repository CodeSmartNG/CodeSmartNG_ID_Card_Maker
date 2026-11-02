import { z } from 'zod';

const singleMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  email: z.string().email('Invalid email').optional().or(z.literal('')).or(z.null()),
  phone: z.string().optional().or(z.literal('')).or(z.null()),
  position: z.string().optional().or(z.literal('')).or(z.null()),
  department: z.string().optional().or(z.literal('')).or(z.null()),
  address: z.string().optional().or(z.literal('')).or(z.null()),
  tin: z.string().optional().or(z.literal('')).or(z.null()),
  nin: z.string().optional().or(z.literal('')).or(z.null()),
});

export const createMemberSchema = singleMemberSchema;
export const updateMemberSchema = singleMemberSchema.partial();

// 👇 NEW: A lenient schema for CSV import. 
// It accepts an array of objects and lets the service filter out bad rows.
export const bulkCreateMemberSchema = z.array(
  z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
    address: z.string().optional(),
    tin: z.string().optional(),
    nin: z.string().optional(),
  }).passthrough()
).min(1).max(500);

export const listMembersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
});
