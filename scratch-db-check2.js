const mongoose = require('mongoose');
const MONGO_URL =
  'mongodb+srv://ujjwal:123@cluster0.w3h2a.mongodb.net/SIH?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB');
  const db = mongoose.connection.db;
  const bookings = await db
    .collection('mentorbookings')
    .find({ status: { $ne: 'cancelled' } })
    .sort({ scheduledAt: -1 })
    .limit(10)
    .toArray();
  bookings.forEach(b => {
    console.log(
      `Booking ${b.bookingId}: Status=${b.status}, ScheduledAt=${b.scheduledAt}, Now=${new Date()}`
    );
  });
  process.exit(0);
}
check().catch(console.error);
