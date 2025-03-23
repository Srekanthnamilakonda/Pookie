const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const battleRoutes = require('./routes/battleRoutes');

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/battle', battleRoutes);

// MongoDB connection using environment variable
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log(' MongoDB connected'))
.catch(err => console.error(' MongoDB connection error:', err));

// Let Render assign the port dynamically
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(` Backend running on port ${PORT}`);
});
