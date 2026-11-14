import { cloudinary } from '../../config/cloudinary';
import { prisma } from '../../config/prisma';

export async function uploadToCloudinaryAndSaveAsset(params: {
  buffer: Buffer;
  mimetype: string;
  folder: string;
  uploadedById: string;
}): Promise<{ assetId: string; url: string }> {
  const dataUri = `data:${params.mimetype};base64,${params.buffer.toString('base64')}`;

  // HEIC/HEIF (the default camera format on many phones) isn't renderable by a plain <Image> on
  // most platforms — force those specifically to JPEG on upload so every stored asset is safe
  // to display anywhere. Formats that already render everywhere are left as-is.
  const needsConversion = params.mimetype === 'image/heic' || params.mimetype === 'image/heif';

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: params.folder,
    resource_type: 'image',
    ...(needsConversion ? { format: 'jpg' } : {}),
  });

  const asset = await prisma.asset.create({
    data: {
      cloudinaryPublicId: result.public_id,
      secureUrl: result.secure_url,
      resourceType: 'image',
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      uploadedById: params.uploadedById,
    },
  });

  return { assetId: asset.id, url: asset.secureUrl };
}

/**
 * Deletes both halves of an asset — the Cloudinary object and its Postgres row. Used when an
 * asset is being replaced (e.g. a new avatar) so the old one doesn't linger as unbilled,
 * untracked storage forever. Best-effort on the Cloudinary side: if that call fails, the DB
 * row is still removed rather than leaving the app in a half-cleaned state.
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return;

  try {
    await cloudinary.uploader.destroy(asset.cloudinaryPublicId, { resource_type: asset.resourceType });
  } catch (err) {
    console.error('[uploads] failed to delete Cloudinary asset (non-fatal):', (err as Error).message);
  }

  await prisma.asset.delete({ where: { id: assetId } }).catch(() => {
    // Already gone, or something still references it — not worth failing the caller over.
  });
}
