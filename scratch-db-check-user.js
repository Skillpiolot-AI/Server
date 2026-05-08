const mongoose = require('mongoose');
const MONGO_URL =
  'mongodb+srv://ujjwal:123@cluster0.w3h2a.mongodb.net/SIH?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB');
  const db = mongoose.connection.db;

  // Find the user
  const user = await db.collection('users').findOne({ email: 'ujjwaljha744@gmail.com' });
  if (!user) {
    console.log('User not found!');
    process.exit(0);
  }
  console.log(`Found user: ${user._id}, name: ${user.name}`);

  // Find their bookings as a student
  const studentBookings = await db
    .collection('mentorbookings')
    .find({ userId: user._id })
    .toArray();
  console.log(`\n--- Bookings as Student (${studentBookings.length}) ---`);
  studentBookings.forEach(b => {
    console.log(`Booking ID: ${b.bookingId}, Status: ${b.status}, ScheduledAt: ${b.scheduledAt}`);
  });

  // Find their bookings as a mentor
  const mentorBookings = await db
    .collection('mentorbookings')
    .find({ mentorId: user._id })
    .toArray();
  console.log(`\n--- Bookings as Mentor (${mentorBookings.length}) ---`);
  mentorBookings.forEach(b => {
    console.log(`Booking ID: ${b.bookingId}, Status: ${b.status}, ScheduledAt: ${b.scheduledAt}`);
  });

  process.exit(0);
}
check().catch(console.error);
