const express = require('express');
const app = express()
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken');


//middleware
app.use(cors());
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.mongoDB_USER}:${process.env.mongoDB_PASS}@cluster0.gphdl2n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const userCollection = client.db('mediZone').collection('users');
        const sliderCollection = client.db('mediZone').collection('slider');
        const categoryCollection = client.db('mediZone').collection('categorys');
        const medicinesCollection = client.db('mediZone').collection('medicines');
        const discountProductsCollection = client.db('mediZone').collection('discountProducts')
        const cartsCollection = client.db('mediZone').collection('carts')


        //middleware 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token })
        })
        
        const verifyToken = (req, res, next) => {
            console.log(req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' });
                }
                req.decoded = decoded;
                next();
            })
        };

        //user api
        app.post('/users', async (req, res) => {
            const userData = req.body;
            console.log(userData.email);
            const quary = { email: userData.email }
            const existingUser = await userCollection.findOne(quary);
            if (existingUser) {
                return res.status(409).send({ message: 'Account already exists.' })
            }
            const result = await userCollection.insertOne(userData);
            res.send(result);
        })
        app.get('/users', verifyToken, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })
        app.get('/users/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const quary = { email: email };
            const result = await userCollection.findOne(quary);
            res.send(result);
        })
        app.patch('/users/:email', verifyToken,  async (req, res) => {
            const email = req.params.email;
            const updatedData = req.body;
            const filter = { email: email };
            const updateDoc = {
                $set: {
                    displayName: updatedData.displayName,
                    email: email,
                    userRole: updatedData.userRole,
                    image: updatedData.image
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        //slider related api
        app.get('/sliders', async (req, res) => {
            const result = await sliderCollection.find().toArray();
            res.send(result);
        })

        //category related api
        app.get('/categorys', async (req, res) => {
            const result = await categoryCollection.find().toArray();
            res.send(result);
        })

        //medicines related api
        app.get('/medicines', async (req, res) => {
            const category = req.query.category;
            console.log(category);
            medicinesCollection.aggregate([
                {
                    $match: { category: category }
                }
            ]).toArray()
                .then(result => {
                    res.send(result);
                })
                .catch(error => {
                    res.status(500).send("Internal Server Error");
                });
        })

        app.get('/all-medicines', async (req, res) => {
            const result = await medicinesCollection.find().toArray();
            res.send(result);
        })

        //discountProductsAPI
        app.get('/discountProducts', async (req, res) => {
            const result = await discountProductsCollection.find().toArray();
            res.send(result);
        })

        // carts api make
        app.post('/carts', verifyToken, async (req, res) => {
            const data = req.body;
            const result = await cartsCollection.insertOne(data);
            res.send(result);
        })

        app.get('/carts', verifyToken, async (req, res) => {
            const email = req.query.email;
            const quary = { email: email };
            const result = await cartsCollection.find(quary).toArray();
            res.send(result);
        })

        app.delete('/carts/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const quary = { _id: new ObjectId(id) }
            const result = await cartsCollection.deleteOne(quary);
            res.send(result);
        })

        app.delete('/cart/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const quary = { email: email }
            const result = await cartsCollection.deleteMany(quary);
            res.send(result);
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('MediZone Server Is Running.')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})