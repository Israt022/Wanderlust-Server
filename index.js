const express = require('express');
const cors = require('cors');
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const app = express();
dotenv.config()

const uri = process.env.MONGODB_URI;
const PORT = process.env.PORT;

app.use(cors())
app.use(express.json())

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URI}/api/auth/jwks`)
)
const verifyToken = async (req,res,next) =>{
    const header = req?.headers.authorization
    if(!header){
      res.status(401).json({message : 'unauthorized'})
    }
    const token = header.split(" ")[1]
    if(!token){
      res.status(401).json({message : 'unauthorized'})
    }

    try{
      const {payload} =  await jwtVerify(token,JWKS)
      console.log(payload);
      next();
    }catch(error){
      return res.status(403).json({message : 'Forbidden'})
    }
    
    // else{
    //   res.status(401).json({message : 'unauthorized'})
    // }
  }
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // Create Database & Connection
    const db = client.db('wanderlust');
    const destinationCollection = db.collection('destination');
    const bookingCollection = db.collection('bookings');

    // Get data 
    app.get('/destination',async(req,res)=>{
        const result = await destinationCollection.find().toArray(); 
        res.json(result);
    })

    // Get destinations id 
    app.get('/destination/:id',verifyToken
    ,async(req,res)=>{
      const {id} = req.params;
      const result = await destinationCollection.findOne({_id : new ObjectId(id)})

      res.json(result)
    })

    // Add post function CRUD-> C 
    app.post('/destination',async(req,res) => {
        // Body te create kore data rkhbo 
        const destinationData = req.body;
        console.log("destination frm server",destinationData);
        // Data insert in Body 
        const result = await destinationCollection.insertOne(destinationData);

        res.json(result);
    })

    app.patch('/destination/:id',async(req, res) => {
      const {id} = req.params;
      const updateData = req.body;
      console.log(updateData);
      const result = await destinationCollection.updateOne(
        {_id : new ObjectId(id)},
        {$set : updateData}
      )

      res.json(result)
    })

    // Destination delete 
    app.delete('/destination/:id',async(req,res) => {
      const {id} = req.params;
      const result = await destinationCollection.deleteOne({_id : new ObjectId(id)});

      res.send(result);
    })

    // booking post 
    app.post('/booking',verifyToken,async(req,res) =>{
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData);

      res.json(result);
    })
    // get booking id 
    app.get('/booking/:userId',verifyToken,async(req,res) =>{
      const {userId} = req.params;
      const result = await bookingCollection.find({userId: userId}).toArray();

      res.json(result);
    })

    // delete booking 
    app.delete('/booking/:bookingId',verifyToken,async(req,res) =>{
      const {bookingId} = req.params;
      const result = await bookingCollection.deleteOne({_id : new ObjectId(bookingId)});

      res.json(result)
    })

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send('Server running is fine!');
})

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
})