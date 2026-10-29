import { asyncHandler } from '../utils/asyncHandler.js';
import * as memberService from '../services/member.service.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadToStorage } from '../services/storageService.js'; // Adjust based on your storage logic

/* ────────────── LIST ────────────── */
export const listMembers = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await memberService.listMembers({
    organizationId: req.user.organizationId,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    search,
  });
  res.json(result);
});

/* ────────────── GET ONE ────────────── */
export const getMember = asyncHandler(async (req, res) => {
  const member = await memberService.getMember({
    id: req.params.id,
    organizationId: req.user.organizationId,
  });
  res.json({ member });
});

/* ────────────── CREATE ────────────── */
export const createMember = asyncHandler(async (req, res) => {
  const member = await memberService.createMember({
    data: req.body,
    organizationId: req.user.organizationId,
  });
  res.status(201).json({ member });
});

/* ────────────── UPDATE ────────────── */
export const updateMember = asyncHandler(async (req, res) => {
  const member = await memberService.updateMember({
    id: req.params.id,
    data: req.body,
    organizationId: req.user.organizationId,
  });
  res.json({ member });
});

/* ────────────── DELETE ────────────── */
export const deleteMember = asyncHandler(async (req, res) => {
  await memberService.deleteMember({
    id: req.params.id,
    organizationId: req.user.organizationId,
  });
  res.status(204).send();
});

/* ────────────── UPLOAD PHOTO ────────────── */
export const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file provided');

  // NOTE: replace this with your actual storage logic (S3, Cloudinary, Local)
  // If saving locally, the path might look like: /uploads/members/filename.jpg
  const photoUrl = await uploadToStorage(req.file.buffer, req.file.originalname);

  const member = await memberService.updateMemberPhoto({
    id: req.params.id,
    organizationId: req.user.organizationId,
    photoUrl,
  });

  res.json({ photoUrl: member.photoUrl, member });
});
