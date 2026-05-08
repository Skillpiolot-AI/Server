const mongoose = require('mongoose');
const MONGO_URL =
  'mongodb+srv://ujjwal:123@cluster0.w3h2a.mongodb.net/SIH?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB');
  const db = mongoose.connection.db;

  const user = await db.collection('users').findOne({ email: 'ujjwaljha744@gmail.com' });
  const limit100 = await db
    .collection('mentorbookings')
    .find({ userId: user._id })
    .sort({ scheduledAt: -1 })
    .limit(100)
    .toArray();

  console.log('Top 100 bookings by scheduledAt DESC:');
  let confirmedCount = 0;
  limit100.forEach((b, i) => {
    if (i < 5 || i > 95) console.log(`${i}: Status: ${b.status}, ScheduledAt: ${b.scheduledAt}`);
    if (b.status === 'confirmed') confirmedCount++;
  });
  console.log(`Total confirmed in top 100: ${confirmedCount}`);

  process.exit(0);
}
check().catch(console.error);
