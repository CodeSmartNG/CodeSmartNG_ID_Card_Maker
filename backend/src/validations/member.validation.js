import { z } from 'zod';

const memberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  tin: z.string().optional().or(z.literal('')),
  nin: z.string().optional().or(z.literal('')),
});

export const createMemberSchema = z.object({ body: memberSchema });
export const updateMemberSchema = z.object({ body: memberSchema.partial() });
export const bulkCreateMemberSchema = z.object({ 
  body: z.array(memberSchema).min(1).max(500) // Max 500 at a time
});
export const listMembersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
  })
});
