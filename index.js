const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb'); 
const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(express.json()); 



const uri = "mongodb+srv://home-nest:aIwwBkRBO5x7M1Is@cluster0.kwvqtmc.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running fine');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
