"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onNotificationCreated = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.onNotificationCreated = functions.firestore
    .document('notifications/{notifId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data)
        return;
    // Only send push if active
    if (data.active === false)
        return;
    // Enhanced payload for better background delivery
    const payload = {
        notification: {
            title: data.title || 'Nueva Notificación',
            body: data.detail || '',
        },
        data: {
            type: 'general',
        },
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                clickAction: 'FCM_PLUGIN_ACTIVITY',
            },
        },
    };
    let usersQuery = admin.firestore().collection('users');
    // Filter logic if needed (e.g., location targeting)
    // Note: If you want to filter by location, uncomment these, 
    // but users need to have stored their 'province' and 'canton' in Firestore.
    // if (target === 'location') {
    //   if (targetProvince) usersQuery = usersQuery.where('province', '==', targetProvince);
    //   if (targetCanton) usersQuery = usersQuery.where('canton', '==', targetCanton);
    // }
    try {
        const usersSnap = await usersQuery.get();
        const tokens = [];
        usersSnap.forEach(doc => {
            const userData = doc.data();
            if (userData.fcmToken) {
                tokens.push(userData.fcmToken);
            }
        });
        if (tokens.length === 0) {
            console.log('No devices to send to.');
            return;
        }
        // FCM supports up to 500 tokens per multicast message.
        // Easiest is to send in batches of 500.
        const maxTokensPerBatch = 500;
        const batches = [];
        for (let i = 0; i < tokens.length; i += maxTokensPerBatch) {
            const batchTokens = tokens.slice(i, i + maxTokensPerBatch);
            batches.push(admin.messaging().sendEachForMulticast(Object.assign({ tokens: batchTokens }, payload)));
        }
        const responses = await Promise.all(batches);
        let successCount = 0;
        let failureCount = 0;
        responses.forEach(response => {
            successCount += response.successCount;
            failureCount += response.failureCount;
        });
        console.log(`Successfully sent ${successCount} messages; Failed ${failureCount} messages.`);
    }
    catch (error) {
        console.error('Error sending push notification:', error);
    }
});
//# sourceMappingURL=index.js.map