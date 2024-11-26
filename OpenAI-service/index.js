// index.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const storyPointsRouter = require('./routes/storyPoints');
const {listenForMessages} = require('./SQSConsumer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const connectToDatabase = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      process.exit(1); 
    }
  };


app.use('/api', storyPointsRouter);

const startServer = async () => {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
    listenForMessages();
};
  
startServer();
