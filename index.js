const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); 
const app = express();
const port = 8000;
require('dotenv').config();
// Middleware
app.use(cors());
app.use(express.json()); 




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kwvqtmc.mongodb.net/?appName=Cluster0`;

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


const db =client.db("homeNestDB")
const propertyCollection=db.collection("properties")


// get all data in data base
app.get("/allProperties",async(req,res)=>{
    const result = await propertyCollection.find().sort({price:-1}).toArray()
    res.send(result)
})

// gat single data in data base
app.get("/singleProperty/:id",async(req,res)=>{
    const {id} = req.params
    const result =await propertyCollection.findOne({_id:new ObjectId(id)})
    res.send(result)
})



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
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
