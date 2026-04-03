import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const HEARTBEAT_INTERVAL = 30_000; // 30s keepalive
const CHECK_INTERVAL = 3_000; // 3s check for new notifications

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  let lastChecked = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      // Send initial unread count
      const initialCount = await db.notification.count({
        where: { userId, read: false },
      });
      send("count", { count: initialCount });

      // Periodic check for new notifications
      const checkTimer = setInterval(async () => {
        try {
          const newNotifications = await db.notification.findMany({
            where: {
              userId,
              createdAt: { gt: lastChecked },
            },
            orderBy: { createdAt: "desc" },
          });

          if (newNotifications.length > 0) {
            lastChecked = new Date();

            // Send each new notification
            for (const n of newNotifications) {
              send("notification", {
                id: n.id,
                type: n.type,
                title: n.title,
                body: n.body,
                link: n.link,
                read: n.read,
                createdAt: n.createdAt.toISOString(),
              });
            }

            // Send updated count
            const count = await db.notification.count({
              where: { userId, read: false },
            });
            send("count", { count });
          }
        } catch {
          // Connection may be closed, timer will be cleared
        }
      }, CHECK_INTERVAL);

      // Heartbeat to keep connection alive
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Connection closed
        }
      }, HEARTBEAT_INTERVAL);

      // Cleanup when client disconnects
      const abortHandler = () => {
        clearInterval(checkTimer);
        clearInterval(heartbeatTimer);
        try { controller.close(); } catch { /* already closed */ }
      };

      // Store cleanup for when stream is cancelled
      (controller as unknown as { _cleanup: () => void })._cleanup = abortHandler;
    },
    cancel() {
      // Stream cancelled by client
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
