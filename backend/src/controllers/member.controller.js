import { asyncHandler } from '../utils/asyncHandler.js';
import * as memberService from '../services/member.service.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadMemberPhoto } from '../services/storageService.js';

/* =========================================================
   LIST
   ========================================================= */
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

/* =========================================================
   GET ONE
   ========================================================= */
export const getMember = asyncHandler(async (req, res) => {
  const member = await memberService.getMember({
    id: req.params.id,
    organizationId: req.user.organizationId,
  });

  res.json({ member });
});

/* =========================================================
   CREATE
   ========================================================= */
export const createMember = asyncHandler(async (req, res) => {
  const member = await memberService.createMember({
    data: req.body,
    organizationId: req.user.organizationId,
  });

  res.status(201).json({ member });
});

/* =========================================================
   UPDATE
   ========================================================= */
export const updateMember = asyncHandler(async (req, res) => {
  const member = await memberService.updateMember({
    id: req.params.id,
    data: req.body,
    organizationId: req.user.organizationId,
  });

  res.json({ member });
});

/* =========================================================
   DELETE
   ========================================================= */
export const deleteMember = asyncHandler(async (req, res) => {
  await memberService.deleteMember({
    id: req.params.id,
    organizationId: req.user.organizationId,
  });

  res.status(204).send();
});

/* =========================================================
   UPLOAD PHOTO
   ========================================================= */
export const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file provided');
  }

  // Extra safety — multer fileFilter catches most cases, but double-check
  if (!req.file.mimetype?.startsWith('image/')) {
    throw new ApiError(415, 'Only image files are allowed');
  }

  if (req.file.size > 5 * 1024 * 1024) {
    throw new ApiError(413, 'Image must be under 5MB');
  }

  // Upload to storage (S3 / Cloudinary / local — dispatcher handles it)
  const photoUrl = await uploadMemberPhoto(
    req.file.buffer,
    req.file.originalname,
    req.params.id
  );

  // Persist URL on the member record
  const member = await memberService.updateMemberPhoto({
    id: req.params.id,
    organizationId: req.user.organizationId,
    photoUrl,
  });

  res.json({ photoUrl: member.photoUrl, member });
});
