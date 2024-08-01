const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');

// Path to service account key
const serviceAccount = require(path.resolve(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://skripsi-tiket-ece21-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const app = express();
app.use(cors()); // Enable CORS if you need to access the API from other origins
app.use(express.json());

app.post('/handleMidtransNotification', async (req, res) => {
  try {
    const notification = req.body;

    // Verifikasi data notifikasi dari Midtrans dengan signature key
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    const serverKey = 'SB-Mid-server-aVSYun8nN8bkx0Dg3aacu-Sn'; 
    const stringToSign = orderId + statusCode + grossAmount + serverKey;
    const signatureKey = crypto.createHash('sha512').update(stringToSign).digest('hex');

    if (signatureKey !== notification.signature_key) {
      return res.status(400).send('Invalid signature');
    }

    // Simpan data notifikasi ke Firebase Realtime Database
    await admin.database().ref('/transactions').push(notification);

    return res.status(200).send('Notification received and processed.');
  } catch (error) {
    console.error('Error processing notification:', error);
    return res.status(500).send('Error processing notification.');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
