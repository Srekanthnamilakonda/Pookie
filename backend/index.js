const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const battleRoutes = require('./routes/battleRoutes');


const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/user', userRoutes);
app.use('/api/battle', battleRoutes); 

mongoose.connect('mongodb://localhost:27017/pookie_click', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB connected on port 27017'))
  .catch(err => console.error('MongoDB error:', err));
  

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
