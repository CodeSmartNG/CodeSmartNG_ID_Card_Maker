import { z } from 'zod';

// The base schema for a single member
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

// 👇 NO 'body:' wrapper. These are passed directly to validateBody()
export const createMemberSchema = singleMemberSchema;

export const updateMemberSchema = singleMemberSchema.partial();

export const listMembersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
});

// 👇 NO 'body:' wrapper. Just a raw array.
export const bulkCreateMemberSchema = z.array(singleMemberSchema).min(1).max(500);
