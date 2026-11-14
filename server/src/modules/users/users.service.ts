import { prisma } from '../../config/prisma';

/** Empty string means "clear" — used when a user disables notifications in Settings. */
export async function setPushToken(userId: string, token: string) {
  await prisma.user.update({ where: { id: userId }, data: { expoPushToken: token || null } });
}
