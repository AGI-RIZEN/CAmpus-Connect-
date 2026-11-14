import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { ApiError } from '../../middleware/errorHandler';
import { prisma } from '../../config/prisma';
import { verifyAvatarUploadToken } from '../auth/auth.tokens';
import { uploadToCloudinaryAndSaveAsset, deleteAsset } from './uploads.service';

// Raster image types only — explicitly NOT image/svg+xml, which Cloudinary would happily store
// and serve back with its original content-type, making it a stored-XSS vector (an SVG can
// carry a <script> tag) if ever rendered somewhere less strict than a plain <img>.
const ALLOWED_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  // Deliberately NOT using multer's `fileFilter` here: rejecting inside that callback aborts
  // the upload stream mid-request, which resets the connection before any HTTP response can be
  // sent — the client gets a hard connection failure, not a clean 415. Instead we let multer
  // fully receive the (size-capped) file into memory and validate the mimetype afterward, in
  // the route handler, where throwing ApiError produces a proper JSON error response.
});

function assertImageMimetype(file: Express.Multer.File) {
  if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
    throw new ApiError(415, `Unsupported file type: ${file.mimetype}. Use JPEG, PNG, WEBP, or GIF.`);
  }
}

export const uploadsRouter = Router();

/** General authenticated upload — for post images etc. once those modules exist. */
uploadsRouter.post(
  '/',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'No file uploaded');
    assertImageMimetype(req.file);

    const result = await uploadToCloudinaryAndSaveAsset({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      folder: 'campus-connect/general',
      uploadedById: req.user!.id,
    });
    res.status(201).json(result);
  })
);

/**
 * Scoped-but-not-fully-authenticated: lets a brand-new signup attach a profile photo before
 * they have a real session (OTP hasn't been verified yet, so no access token exists). Proven
 * via a short-lived, single-purpose token minted by POST /auth/signup and bound to that one
 * account — NOT by trusting a client-supplied userId, which anyone who observed/guessed the id
 * could otherwise replay to overwrite someone else's avatar before they finish verifying.
 * Still double-checked server-side that the account hasn't been verified yet, as defense in depth.
 */
uploadsRouter.post(
  '/avatar',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'No file uploaded');
    assertImageMimetype(req.file);

    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;
    const userId = token ? verifyAvatarUploadToken(token) : null;
    if (!userId) throw new ApiError(401, 'Missing or invalid upload authorization');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'Account not found');
    if (user.isEmailVerified) {
      throw new ApiError(403, 'Avatar can only be set during initial signup');
    }

    const result = await uploadToCloudinaryAndSaveAsset({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      folder: 'campus-connect/avatars',
      uploadedById: userId,
    });

    const previousAssetId = user.avatarAssetId;
    await prisma.user.update({ where: { id: userId }, data: { avatarAssetId: result.assetId } });
    if (previousAssetId) {
      await deleteAsset(previousAssetId);
    }

    res.status(201).json(result);
  })
);
