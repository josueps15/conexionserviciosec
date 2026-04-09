import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const onNotificationCreated = functions.firestore
    .document('notifications/{notifId}')
    .onWrite(async (change, context) => {
        const data = change.after.data();
        const previousData = change.before.data();

        if (!data) return; // Deleted

        // Check if we should send a push:
        // 1. It's a new document AND it's already active.
        // 2. It was inactive and just became active (scheduled trigger or manual toggle).
        const isNew = !change.before.exists;
        const becameActive = data.active === true && (isNew || previousData?.active === false);

        if (!becameActive) {
            console.log('Notification state change does not require a push (not a transition to active).');
            return;
        }

        // Safety check: Don't send push if it's scheduled for future, 
        // even if active (this shouldn't happen with updated frontend, but for safety)
        if (data.scheduledTime && new Date(data.scheduledTime).getTime() > Date.now()) {
            console.log('Notification is scheduled for future. Skipping immediate push.');
            return;
        }

        // Check if it's already expired (safety check)
        if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
            console.log('Notification is already expired. Not sending push.');
            return;
        }

        // Enhanced payload for better background delivery
        const payload = {
            notification: {
                title: data.title || 'Nueva Notificación',
                body: data.detail || '',
            },
            data: {
                type: 'notifications', // Updated to match App.tsx listener
            },
            android: {
                priority: 'high' as any,
                notification: {
                    sound: 'default',
                    clickAction: 'FCM_PLUGIN_ACTIVITY',
                    channelId: 'push-notifications',
                },
            },
        };

        let usersQuery: admin.firestore.Query = admin.firestore().collection('users');

        try {
            const usersSnap = await usersQuery.get();
            const tokens: string[] = [];

            usersSnap.forEach(doc => {
                const userData = doc.data();
                if (userData.fcmToken) {
                    tokens.push(userData.fcmToken);
                }
            });

            console.log(`Found ${usersSnap.size} users. Valid tokens found: ${tokens.length}`);

            if (tokens.length === 0) {
                console.log('No devices to send to.');
                return;
            }

            const maxTokensPerBatch = 500;
            const batches = [];
            for (let i = 0; i < tokens.length; i += maxTokensPerBatch) {
                const batchTokens = tokens.slice(i, i + maxTokensPerBatch);
                batches.push(admin.messaging().sendEachForMulticast({
                    tokens: batchTokens,
                    ...payload,
                }));
            }

            const responses = await Promise.all(batches);
            let successCount = 0;
            let failureCount = 0;
            responses.forEach((response, index) => {
                successCount += response.successCount;
                failureCount += response.failureCount;
                console.log(`Batch ${index}: Success=${response.successCount}, Failure=${response.failureCount}`);
            });

            console.log(`TOTAL: Successfully sent ${successCount} messages; Failed ${failureCount} messages.`);
        } catch (error) {
            console.error('CRITICAL Error sending push notification:', error);
        }
    });

/**
 * Scheduled function that runs every minute to:
 * 1. Activate notifications whose scheduledTime has arrived.
 * 2. Deactivate notifications whose expiresAt has passed.
 */
// Helper for robust date parsing in Functions environment
const getMillis = (val: any, fallback: number = 0): number => {
    if (val === undefined || val === null || val === '') return fallback;
    if (typeof val === 'string') {
        const d = new Date(val);
        return isNaN(d.getTime()) ? fallback : d.getTime();
    }
    if (val.toMillis) return val.toMillis();
    if (val.toDate) return val.toDate().getTime();
    return new Date(val).getTime() || fallback;
};

export const checkNotificationStatus = functions.pubsub
    .schedule('every 1 minutes')
    .onRun(async (context) => {
        const now = Date.now();
        const db = admin.firestore();
        const batch = db.batch();
        let activations = 0;
        let expirations = 0;

        try {
            const snap = await db.collection('notifications').get();

            snap.forEach(doc => {
                const data = doc.data();
                const schedTime = getMillis(data.scheduledTime, 0);
                // If expiresAt is empty, it should be Infinity so it never "expires" by default
                const expTime = getMillis(data.expiresAt, Infinity);
                const isActive = data.active === true;

                // 1. Logic for Activation:
                // If it's currently OFF, and we have a valid launch time, 
                // and NOW is after that launch time but BEFORE expiry
                if (!isActive && schedTime > 0 && now >= (schedTime - 30000)) { // 30s grace period
                    if (now < expTime) {
                        batch.update(doc.ref, { active: true, activatedAt: admin.firestore.FieldValue.serverTimestamp() });
                        activations++;
                    } else {
                        // Already expired before it could launch
                        batch.update(doc.ref, { active: false });
                    }
                }

                // 2. Logic for Expiration:
                // If it's currently ON and we have reached the expiry time
                if (isActive && expTime !== Infinity && now >= expTime) {
                    batch.update(doc.ref, { active: false, expiredAt: admin.firestore.FieldValue.serverTimestamp() });
                    expirations++;
                }
            });

            if (activations > 0 || expirations > 0) {
                await batch.commit();
                console.log(`Scheduler Run: ${activations} activations, ${expirations} expirations.`);
            }

            return null;
        } catch (error) {
            console.error('Error in checkNotificationStatus scheduler:', error);
            return null;
        }
    });

