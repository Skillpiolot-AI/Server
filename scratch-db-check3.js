const mongoose = require('mongoose');
const MONGO_URL =
  'mongodb+srv://ujjwal:123@cluster0.w3h2a.mongodb.net/SIH?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB');
  const db = mongoose.connection.db;
  const bookings = await db
    .collection('mentorbookings')
    .find({ status: { $ne: 'cancelled' }, scheduledAt: { $gt: new Date() } })
    .toArray();
  console.log(`Found ${bookings.length} upcoming bookings`);
  if (bookings.length > 0) {
    console.log('User IDs: ', [...new Set(bookings.map(b => b.userId.toString()))]);
  }
  process.exit(0);
}
check().catch(console.error);
