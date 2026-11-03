import { asyncHandler } from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';

export const listStaff = asyncHandler(async (req, res) => {
  const staff = await userService.getStaff(req.user.organizationId);
  res.json({ staff });
});

export const inviteStaff = asyncHandler(async (req, res) => {
  const staff = await userService.createStaff({
    ...req.body,
    organizationId: req.user.organizationId,
  });
  res.status(201).json({ staff });
});

export const removeStaff = asyncHandler(async (req, res) => {
  await userService.deleteStaff({
    id: req.params.id,
    organizationId: req.user.organizationId,
    currentUserId: req.user.id,
  });
  res.status(204).send();
});
