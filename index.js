const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 8000;
require("dotenv").config();
// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kwvqtmc.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("homeNestDB");
    const propertyCollection = db.collection("properties");
    const ratingsCollection = db.collection("ratings");

    // get all data in data base
    app.get("/allProperties", async (req, res) => {
      const result = await propertyCollection
        .find()
        .sort({ price: -1 })
        .toArray();
      res.send(result);
    });

    // gat single data in data base
    app.get("/singleProperty/:id", async (req, res) => {
      const { id } = req.params;
      const result = await propertyCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    //latest property
    app.get("/latestProperty", async (req, res) => {
      const result = await propertyCollection
        .find()
        .sort({ price: "desc" })
        .limit(8)
        .toArray();
      res.send(result);
    });

    // add property
    app.post("/addProperty", async (req, res) => {
      const property = req.body;
      const result = await propertyCollection.insertOne(property);
      res.send(result);
    });

// my Properties
    app.get("/myProperties",async (req,res)=>{
      const email =req.query.email
      const result =await propertyCollection.find({userEmail: email}).toArray()
      res.send(result)
    })

    // delete property
    app.delete("/deleteProperty/:id",async(req,res)=>{
      const {id}=req.params
      const result =await propertyCollection.deleteOne({_id:new ObjectId(id)})
      res.send(result)

    })

    // update property
    app.put("/updateProperty/:id",async(req,res)=>{
      const {id}=req.params
      const property =req.body
      const objectId =new ObjectId(id)
      const filter ={_id:objectId}
      const updateProperty ={
           $set:property
      }
      const result= propertyCollection.updateOne(filter,updateProperty)
      res.send(result)
    })
    
    // search property
    app.get("/searchProperty",async(req,res)=>{
      const search_text=req.query.search
      const result=await propertyCollection.find({propertyName:{$regex:search_text,$options:"i"}}).toArray()
      res.send(result)
    })

//add rating in data base
 app.post("/addPropertyRating", async (req, res) => {
const review = req.body;
const result = await ratingsCollection.insertOne(review);
 res.send(result);
});



    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running fine");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
