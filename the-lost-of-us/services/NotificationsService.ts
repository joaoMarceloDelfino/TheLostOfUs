import NotificationsRepository, { NotificationRow } from "@/repositories/NotificationsRepository";

type CreateNotificationParams = {
    recipientSub: string;
    actorSub?: string | null;
    postId?: string | null;
    sightingId?: string | null;
    type: string;
    data?: unknown | null;
};

class NotificationsService {
    async createNotification(params: CreateNotificationParams): Promise<NotificationRow> {
        return NotificationsRepository.create(params);
    }

    async listNotifications(recipientSub: string, limit = 50, offset = 0): Promise<NotificationRow[]> {
        return NotificationsRepository.findByRecipient(recipientSub, limit, offset);
    }

    async countUnread(recipientSub: string): Promise<number> {
        return NotificationsRepository.countUnread(recipientSub);
    }

    async markAsRead(ids?: string[], recipientSub?: string): Promise<void> {
        return NotificationsRepository.markAsRead(ids, recipientSub);
    }
}

export default new NotificationsService();
