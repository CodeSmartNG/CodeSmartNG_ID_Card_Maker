import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../config/database.js';

export const updateOrganization = asyncHandler(async (req, res) => {
  const { name, email, phone, address, website } = req.body;
  const organizationId = req.user.organizationId;

  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: { name, email, phone, address, website },
  });

  res.json({ organization });
});

export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No logo uploaded' });
  
  // Assuming you have an upload file helper in storageService
  const { uploadMemberPhoto } = await import('../services/storageService.js');
  const logoUrl = await uploadMemberPhoto(req.file.buffer, req.file.originalname, req.user.organizationId);

  const organization = await prisma.organization.update({
    where: { id: req.user.organizationId },
    data: { logoUrl },
  });

  res.json({ organization });
});
