import { z } from 'zod';

export const createMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(7).max(20).optional().or(z.literal('')),
  position: z.string().max(100).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
  // 👇 These 3 fields MUST be here, or Zod will strip them out!
  address: z.string().max(200).optional().or(z.literal('')),
  tin: z.string().max(50).optional().or(z.literal('')),
  nin: z.string().max(50).optional().or(z.literal('')),
});

export const updateMemberSchema = createMemberSchema.partial();

export const listMembersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
});
