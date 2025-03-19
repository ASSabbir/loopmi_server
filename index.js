require('dotenv').config()
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORt || 5000;


app.use(cors())
app.use(express.json())

// mongodb connection 


// const verifyToken=(req,res,next)=>{
//   const token=req?.cookies?.token
//   if(!token){
//     return res.send({massage:'unothoris'})
//   }
//   jwt.verify(token,'AD42AEEC73759E8F49FD2B96FF936B0C1D920B5B3D3E6E769281928EB538D1C2',(err,decode)=>{
//     if(err){
//       return res.send({massage:'again login'})
//     }
//     req.user=decode
//     next()
//   }) LearnBridge

// }


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hyv8hzg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db("loopmi");
    const usersCollections = database.collection("users");
    const itemsCollections = database.collection("items");
    const ordersCollections = database.collection("orders");
    const completedOrdersCollection = database.collection("completedOrders");




    // app.post('/jwt',async(req,res)=>{
    //   const user =req.body

    //   const token =jwt.sign(user,'AD42AEEC73759E8F49FD2B96FF936B0C1D920B5B3D3E6E769281928EB538D1C2',{expiresIn:'1h'})
    //   res
    //   .cookie('token',token,{
    //     httpOnly:true,
    //     secure:false
    //   })
    //   .send({success:true})
    // })

    app.get('/users', async (req, res) => {
      const result = await usersCollections.find().toArray()
      res.send(result)
    })
    app.post('/users', async (req, res) => {
      const user = req.body
      const query = { email: user.email }
      const exgestingUser = await usersCollections.findOne(query)
      if (exgestingUser) {
        return res.send({ message: 'user already here' })
      }
      const result = await usersCollections.insertOne(user)
      res.send(result)
    })
    app.post('/carts', async (req, res) => {
      const data = req.body
      // console.log(data)
      const result = await itemsCollections.insertOne(data)
      res.send(result)
    })
    app.get('/carts', async (req, res) => {
      const result = await itemsCollections.find().toArray()
      res.send(result)
    })
    app.get('/new_arrivel_cards', async (req, res) => {
      const result = await itemsCollections.find().limit(8).toArray();
      res.send(result);
    });

    app.get('/item/:id', async (req, res) => {
      const id = req.params
      const query = { _id: new ObjectId(id) }
      const result = await itemsCollections.findOne(query)
      res.send(result)

    })

    app.get('/users_role', async (req, res) => {
      const email = req.query.email
      var trimmedEmail = '';
      if ((email.startsWith('"') && email.endsWith('"'))
        || (email.startsWith("'") && email.endsWith("'"))) {
        trimmedEmail = email.slice(1, -1); // Remove the surrounding quotes
      }
      const query = { email: trimmedEmail }
      const result = await usersCollections.findOne(query)

      res.send(result)
    })
    app.get('/cart_count', async (req, res) => {
      const result = await itemsCollections.estimatedDocumentCount()
      res.send({ count: result })
    })
    app.get('/cart_pagination', async (req, res) => {
      const skip = parseInt(req.query.skip) || 0;
      const search = req.query.search || "";
  
      let query = {};
      if (search) {
          query = {
              $or: [
                  { title: { $regex: search, $options: "i" } },
                  { category: { $regex: search, $options: "i" } }
              ]
          };
      }
  
      const result = await itemsCollections.find(query).skip(skip * 8).limit(8).toArray();
      res.send(result);
  });
  app.get("/related-products", async (req, res) => {
    try {
        const result = await itemsCollections.aggregate([
            { $sample: { size: 4 } } // Get 3 random items
        ]).toArray();
        res.send(result);
    } catch (error) {
        res.status(500).json({ message: "Error fetching related products" });
    }
});
    app.get('/orders_count', async (req, res) => {
      const result = await ordersCollections.estimatedDocumentCount()
      res.send({ count: result })
    })
    app.get('/orders', async (req, res) => {
      const skip = parseInt(req.query.skip)
      const result = await ordersCollections.find().skip(skip * 8).limit(8).toArray()
      res.send(result)
    })
    app.post('/orders', async (req, res) => {
      const data = req.body
      const result = await ordersCollections.insertMany(data)
      res.send(result)
    })

    //  vendor 

    app.get('/vendor_items', async (req, res) => {
      const email = req.query.email
      const query = { vendorEmail: email }
      const result = await itemsCollections.find(query).toArray()
      res.send(result)

    })
    app.get('/vendor_orders', async (req, res) => {
      const skip = parseInt(req.query.skip)
      const email = req.query.email
      const query = { vendorEmail: email }
      // console.log(query)
      const result = await ordersCollections.find(query).skip(skip * 8).limit(8).toArray()
      res.send(result)
    })
    app.get('/vendor_confirm_orders', async (req, res) => {
      const skip = parseInt(req.query.skip)
      const email = req.query.email
      const query = { vendorEmail: email,status:"confirmed" }
      
      const result = await ordersCollections.find(query).skip(skip * 8).limit(8).toArray()
      
      res.send(result)
    })
    app.put('/confirm_order/:id', async (req, res) => {
      const id = req.params
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "confirmed",
        },
      };
      const result = await ordersCollections.updateOne(filter, updateDoc, options)
      res.send(result)
    })
    app.delete('/cancel_order/:id', async (req, res) => {
      const id = req.params
      console.log(id)
      const filter = { _id: new ObjectId(id) }
      const item=await ordersCollections.findOne(filter)
      const result2=await completedOrdersCollection.insertOne(item)
      const result = await ordersCollections.deleteOne(filter)
      res.send(result)
    })
    app.get('/confirmorders_count', async (req, res) => {
      const query = { status: "confirmed" }; // Adjust based on your order structure
      const count = await ordersCollections.countDocuments(query);
      // console.log(count)
      res.send({ count });
    })





    // admin 
    app.put('/admin_made/:id', async (req, res) => {
      const id = req.params
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: "Admin",
        },
      };
      const result = await usersCollections.updateOne(filter, updateDoc, options)
      res.send(result)
    })
    app.delete('/admin_item_delete/:id', async (req, res) => {
      const id = req.params
      // console.log(id)
      const filter = { _id: new ObjectId(id) }
      const result = await itemsCollections.deleteOne(filter)
      res.send(result)
    })

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send("This is Loopmi Server")
})

app.listen(port, () => {
  console.log(`surver is running ${port}`)
})
