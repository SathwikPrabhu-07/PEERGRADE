const admin = require("firebase-admin");
const path = require("path");

// Load service account directly from file
const serviceAccount = require(path.join(__dirname, "../../serviceAccountKey.json"));

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("✅ Firebase Admin SDK initialized successfully with serviceAccountKey.json");
    } catch (error) {
        console.error("❌ Failed to initialize Firebase Admin SDK:", error);
        process.exit(1);
    }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
