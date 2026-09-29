import { db } from "@/lib/db";

export type NotifyInput = {
  userId: string;
  title: string;
  body?: string;
  type?: string; // ORDER | RETAILER | ADMIN | PROMO | INFO
  link?: string;
};

/** Create an in-app notification (DB history). Client polls every ~4s and raises toast + browser push. */
export async function notify(input: NotifyInput) {
  try {
    const n = await db.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body ?? "",
        type: input.type ?? "INFO",
        link: input.link ?? "",
      },
    });
    return n;
  } catch (e) {
    console.error("notify failed", e);
    return null;
  }
}

export async function notifyMany(userIds: string[], input: Omit<NotifyInput, "userId">) {
  await Promise.all(userIds.map((userId) => notify({ ...input, userId })));
}
