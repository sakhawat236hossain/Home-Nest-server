const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.port || 8000;
require("dotenv").config();
// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kwvqtmc.mongodb.net/?appName=Cluster0`;

const serviceAccount = require("./homenest-firebase-adminsdk.json");

const admin = require('firebase-admin')
admin.initializeApp({
  credential:admin.credential.cert(serviceAccount)
})

// firebase token
const verifyFBToken = async (req, res, next) => {
    const token = req.headers.authorization;
    console.log(token,req.headers);
    // console.log(token);

    if (!token) {
        return res.status(401).send({ message: "unauthorized access" });
    }

    try {
        const idToken = token.split(" ")[1];
        const decoded = await admin.auth().verifyIdToken(idToken);

        req.decoded_email = decoded.email;
        next();
    } catch (error) {
      console.log(error);
        return res.status(401).send({ message: "unauthorized access" });
    }
};


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const db = client.db("homeNestDB");
    const propertyCollection = db.collection("properties");
    const ratingsCollection = db.collection("ratings");
        const usersCollection = db.collection("users");



        // user upsert
            // POST User
        app.post("/users", async (req, res) => {
            const userData = req.body;
            userData.role = "user";
            userData.createdAt = new Date();
            const email = userData.email;
            const existingUser = await usersCollection.findOne({ email: email });
            if (existingUser) {
                return res
                    .status(409)
                    .send({ message: "User with this email already exists." });
            }
            const result = await usersCollection.insertOne(userData);
            res.send(result);
        });

            // GET All Users
        app.get("/users",verifyFBToken, async (req, res) => {
            const cursor = usersCollection.find();
            const users = await cursor.toArray();
            res.send(users);
        });

    // ----------------------------------------------buyer routes-----------------
    // my Properties
    app.get("/myProperties", async (req, res) => {
      const email = req.query.email;
      const result = await propertyCollection
        .find({ userEmail: email })
        .toArray();
      res.send(result);
    });

    // delete property rating
    app.delete("/deletePropertyRating/:id", async (req, res) => {
      const { id } = req.params;
      const result = await ratingsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

       //add rating in data base
    app.post("/addPropertyRating", async (req, res) => {
      const review = req.body;
      const result = await ratingsCollection.insertOne(review);
      res.send(result);
    });

    // --------------------------------SELLER ROUTES-------------------

    // add property
    app.post("/addProperty", async (req, res) => {
      const property = req.body;
      const result = await propertyCollection.insertOne(property);
      res.send(result);
    });

    // delete property
    app.delete("/deleteProperty/:id", async (req, res) => {
      const { id } = req.params;
      const result = await propertyCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // update property
    app.put("/updateProperty/:id", async (req, res) => {
      const { id } = req.params;
      const property = req.body;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const updateProperty = {
        $set: property,
      };
      const result = propertyCollection.updateOne(filter, updateProperty);
      res.send(result);
    });

    //-------------------------------------admin routes-----------------

    // ----------------------------------public routes-----------------
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

    // search property
    app.get("/searchProperty", async (req, res) => {
      const search_text = req.query.search;
      const result = await propertyCollection
        .find({ propertyName: { $regex: search_text, $options: "i" } })
        .toArray();
      res.send(result);
    })

 

    // get all Property Rating
    app.get("/allPropertyRatings", async (req, res) => {
      const result = await ratingsCollection
        .find()
        .sort({ created_at: -1 })
        .toArray();
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
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
