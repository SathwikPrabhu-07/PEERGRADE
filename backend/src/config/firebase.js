const admin = require("firebase-admin");

// Initialize Firebase Admin SDK using environment variables
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                type: "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
            }),
        });
        console.log("✅ Firebase Admin SDK initialized using environment variables");
    } catch (error) {
        console.error("❌ Failed to initialize Firebase Admin SDK:", error);
        process.exit(1);
    }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
