const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const fs = require('fs');

// ✅ Load Firebase config from file
const serviceAccount = JSON.parse(fs.readFileSync("firebase-config.json"));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://sentiment-analysis-58b59-default-rtdb.asia-southeast1.firebasedatabase.app/" // 🔹 Replace with your Firebase project URL
});

const db = admin.firestore();
const app = express();
const PORT = 3000;

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Save Sentiment to Firestore
app.post('/save-sentiment', async (req, res) => {
    try {
        const { text, emotions } = req.body;
        if (!text || !emotions) {
            return res.status(400).json({ error: "Missing text or emotions" });
        }

        const docRef = await db.collection('sentiments').add({
            text,
            emotions,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true, id: docRef.id, message: "Sentiment saved successfully!" });
    } catch (error) {
        console.error("❌ Error saving sentiment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Get All Saved Sentiments from Firestore
app.get('/get-sentiments', async (req, res) => {
    try {
        const snapshot = await db.collection('sentiments').orderBy("timestamp", "desc").get();
        const sentiments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json(sentiments);
    } catch (error) {
        console.error("❌ Error fetching sentiments:", error);
        res.status(500).json({ error: "Failed to fetch sentiments" });
    }
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
