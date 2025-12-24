// Script to update all mentor profile images in MongoDB
// Run with: node updateProfileImages.js

const mongoose = require('mongoose');
require('dotenv').config();

const NEW_IMAGE_URL = 'https://img.freepik.com/free-vector/graident-ai-robot-vectorart_78370-4114.jpg?semt=ais_hybrid&w=740&q=80';

async function updateProfileImages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        // Update all mentor profiles with the new image
        const result = await mongoose.connection.db.collection('mentorprofiles').updateMany(
            {}, // Match all documents
            { $set: { profileImage: NEW_IMAGE_URL } }
        );

        console.log(`✅ Updated ${result.modifiedCount} mentor profiles with new image URL`);
        console.log(`   New image: ${NEW_IMAGE_URL}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateProfileImages();
