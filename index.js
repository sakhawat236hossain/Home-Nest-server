const express = require('express');
const cors = require('cors'); // ⚠️ cors import করতে হবে
const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('Server is running fine');
});
app.get('/', (req, res) => {
  res.send('Server is running fine');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
