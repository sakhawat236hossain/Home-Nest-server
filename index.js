const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.port || 8000;
require("dotenv").config();
// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://home-nest-a10-b12.netlify.app" 
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
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
        const bookingCollection = db.collection("bookings");



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

app.get("/users-role/:email/role", async (req, res) => {
  try {
    const email = req.params.email;
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).send({ role: "user" });
    }

    res.send({ role: user.role || "user" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error" });
  }
});

    // ----------------------------------------------buyer routes-----------------
 

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


    // my bookings

    app.get("/myBookings/:email", async (req, res) => {
  const email = req.params.email;
  const query = { buyerEmail: email };
  const result = await bookingCollection.find(query).toArray();
  res.send(result);
});


// cancel booking
app.delete("/cancelBooking/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await bookingCollection.deleteOne(query);
  res.send(result);
});

    // booking property
app.post("/bookProperty", async (req, res) => {
  const bookingData = req.body;
  
  

  const result = await bookingCollection.insertOne(bookingData);
  res.send(result);
});

    // --------------------------------SELLER ROUTES-------------------

    // add property
    app.post("/addProperty", async (req, res) => {
      const property = req.body;
      const result = await propertyCollection.insertOne(property);
      res.send(result);
    });

// My Added Properties 
app.get("/myProperties", async (req, res) => {
  const email = req.query.email; // ফ্রন্টএন্ড থেকে আসা কুয়েরি প্যারামিটার

  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }

  // আপনার ডেটাবেস অনুযায়ী agentEmail ব্যবহার করা হলো
  const query = { agentEmail: email }; 
  
  const result = await propertyCollection
    .find(query)
    .toArray();
    
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

    app.patch("/updateProperty/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      propertyName: req.body.propertyName,
      location: req.body.location,
      price: parseFloat(req.body.price),
      category: req.body.category,
      description: req.body.description,
    },
  };
  const result = await propertyCollection.updateOne(filter, updatedDoc);
  res.send(result);
});

   
   // ====================================================ADMIN APIS============================================================

   // =================== ADMIN APIS (FIXED) ===================

   // get all users
app.get("/users", async (req, res) => {
  try {
    const result = await usersCollection.find().sort({ createdAt: -1 }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Error fetching users" });
  }
});

// update user role
app.patch("/users/role/:id", async (req, res) => {
  const id = req.params.id;
  const role = req.body.role; 
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: { role: role },
  };
  const result = await usersCollection.updateOne(filter, updatedDoc);
  res.send(result);
});



// get all properties for admin
app.get("/all-properties", verifyFBToken, async (req, res) => {
  const result = await propertyCollection.find().toArray();
  res.send(result);
});

// verify property
app.patch("/property/verify/:id", verifyFBToken, async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    
    const updatedDoc = {
      $set: {
        status: "verified", 
      },
    };

    const result = await propertyCollection.updateOne(filter, updatedDoc);
    res.send(result);
  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


// reject property

app.patch("/property/reject/:id", verifyFBToken, async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };

    const updatedDoc = {
      $set: {
        status: "rejected",
      },
    };

    const result = await propertyCollection.updateOne(filter, updatedDoc);
    res.send(result);
  } catch (error) {
    console.error("Reject Error:", error.message);
    res.status(500).send({ error: true, message: error.message });
  }
});

// delete property by admin

app.delete("/property/:id", verifyFBToken, async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await propertyCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// get all reviews
app.get('/all-reviews', verifyFBToken, async (req, res) => {
    const result = await ratingsCollection.find().toArray();
    res.send(result);
});

// delete review
app.delete('/reviews/:id', verifyFBToken, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await ratingsCollection.deleteOne(query);
    res.send(result);
});

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


    // Admin Overview Stats======================================================== overview Stats API==============================================

    //  overview stats for admin
    app.get('/admin/overview-stats', async (req, res) => {
    try {
        // Users
        const totalUsers = await usersCollection.countDocuments();
        const admins = await usersCollection.countDocuments({ role: 'admin' });
        const sellers = await usersCollection.countDocuments({ role: 'seller' });

        // Properties
        const totalProperties = await propertyCollection.countDocuments();
        const pendingProperties = await propertyCollection.countDocuments({ status: 'pending' });
        const verifiedProperties = await propertyCollection.countDocuments({ status: 'verified' });

        const totalBookings = await bookingCollection.countDocuments();
        
        const totalRatings = await ratingsCollection.countDocuments();

        res.send({
            users: { total: totalUsers, admins, sellers },
            properties: { total: totalProperties, pending: pendingProperties, verified: verifiedProperties },
            bookings: { total: totalBookings },
            ratings: { total: totalRatings }
        });
    } catch (error) {
        res.status(500).send({ message: "Error fetching stats" });
    }
});

// overview stats for seller
app.get('/seller/overview-stats/:email', async (req, res) => {
    try {
        const email = req.params.email;

        const totalProperties = await propertyCollection.countDocuments({ agentEmail: email });
        
        const verifiedProperties = await propertyCollection.countDocuments({ agentEmail: email, status: 'verified' });
        const pendingProperties = await propertyCollection.countDocuments({ agentEmail: email, status: 'pending' });

        const totalBookings = await bookingCollection.countDocuments({ agentEmail: email });
        res.send({
            totalProperties,
            verifiedProperties,
            pendingProperties,
            totalBookings
        });
    } catch (error) {
        res.status(500).send({ message: "Error fetching seller stats" });
    }
});

// overview stats for buyer
app.get('/buyer/overview-stats/:email', async (req, res) => {
    try {
        const email = req.params.email;

        // ১. ইউজার কয়টি প্রপার্টি বুক করেছে
        const totalBookings = await bookingCollection.countDocuments({ buyerEmail: email });
        
        // ২. ইউজার কয়টি রিভিউ দিয়েছে (ratingsCollection এ ইউজারের ইমেইল থাকতে হবে)
        const totalReviews = await ratingsCollection.countDocuments({ reviewerEmail: email });

        res.send({
            totalBookings,
            totalReviews
        });
    } catch (error) {
        res.status(500).send({ message: "Error fetching buyer stats" });
    }
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
