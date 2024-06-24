const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const { ObjectId } = require('mongodb');


//middleware
app.use(cors());
app.use(express.json());





const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ernuycp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const usersCollection = client.db('visaDB').collection('users');
        const jobsCollection = client.db('visaDB').collection('jobs');
        const countriesCollection = client.db('visaDB').collection('countries');

        // jwt realted api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' });
            res.send({ token });
        })

        // middlewares
        const verifyToken = (req, res, next) => {
            console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'forbidden access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            // if (!token) {
            //     return res.status(401).send({ message: 'forbidden access' });
            // }

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'forbidden access' });
                }
                req.decoded = decoded;
                next();
            })

            // next();
        }


        // verify admin middleware
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            // const isAdmin = user?.role === 'admin';
            // if (!isAdmin) {
            //     return res.send(403).send({ message: 'forbidden access' });
            // }

            if (!user || user.role !== 'admin') {
                return res.send(403).send({ message: 'forbidden access' });
            }

            next();
        }






        app.post('/users', async (req, res) => {
            const user = req.body;
            // insert email if user does not exists
            // 1.email unique, 2. upsert ,3.simple check in and many ore ways

            const query = { email: user.email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null });
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        })


        // show all users data
        // app.get('/allusers', verifyToken, verifyAdmin, async (req, res) => {
        //     // console.log(req.headers);
        //     const cursor = usersCollection.find();
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })

        app.get('/allusers', verifyToken, verifyAdmin, async (req, res) => {
            try {
                const result = await usersCollection.find().toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send('Internal Server Error');
            }
        });

        // admin check api
        // app.get('/user/admin/:email', verifyToken, async (req, res) => {
        //     const email = req.params.email;
        //     if (email !== req.decoded.email) {
        //         return res.send(403).send({ message: 'unauthorized access' })
        //     }
        //     const query = { email: email };
        //     const user = await usersCollection.findOne(query);
        //     let admin = false;
        //     if (user) {
        //         admin = user?.role === 'admin';
        //     }
        //     res.send({ admin });
        // })

        app.get('/user/admin/:email', verifyToken, async (req, res) => {
            try {
                const email = req.params.email;
                if (email !== req.decoded.email) {
                    return res.status(403).send({ message: 'unauthorized access' });
                }
                const query = { email: email };
                const user = await usersCollection.findOne(query);
                const admin = user?.role === 'admin';
                res.send({ admin });
            } catch (error) {
                res.status(500).send('Internal Server Error');
            }
        });


        // get users of specific user's email

        app.get('/allusers/:email',  async (req, res) => {
            const email = req.params.email; // Access the email from route parameters
            const query = { email: email };
            try {
                const result = await usersCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching user data:', error);
                res.status(500).send('Internal Server Error');
            }
        });


        // get user by passport number
        app.get('/searchPassport/:passport', async (req, res) => {
            const passport = req.params.passport; // Access the passport from route parameters
            const query = { passport: passport };
            try {
                const result = await usersCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching user data:', error);
                res.status(500).send('Internal Server Error');
            }
        });





        // find a user---- this api problem

        app.get('/userDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            // console.log(query);
            const result = await usersCollection.findOne(query);
            res.send(result);
        })







        // update user details after eca application-todo

        app.patch('/allEcaUsers/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateUserInfo = req.body;
            const user = {
                $set: {

                    bscGrade: updateUserInfo.bscGrade,
                    bscSubject: updateUserInfo.bscSubject,
                    bscYear: updateUserInfo.bscYear,
                    hscGrade: updateUserInfo.hscGrade,
                    hscRoll: updateUserInfo.hscRoll,
                    hscYear: updateUserInfo.hscYear,
                    jscGrade: updateUserInfo.jscGrade,
                    jscRoll: updateUserInfo.jscRoll,
                    jscYear: updateUserInfo.jscYear,
                    pscGrade: updateUserInfo.pscGrade,
                    pscRoll: updateUserInfo.pscRoll,
                    pscYear: updateUserInfo.pscYear,
                    sscGrade: updateUserInfo.sscGrade,
                    sscRoll: updateUserInfo.sscRoll,
                    sscYear: updateUserInfo.sscYear,

                    nidUrl: updateUserInfo.nidUrl,
                    passportUrl: updateUserInfo.passportUrl,
                    certificatUrl: updateUserInfo.certificatUrl,
                    ieltsUrl: updateUserInfo.ieltsUrl,
                    paymentMethod: updateUserInfo.paymentMethod,
                    trxID: updateUserInfo.trxID,

                    userStatus: updateUserInfo.userStatus

                }
            }

            const result = await usersCollection.updateOne(filter, user, options);
            res.send(result);

        })
        // ---------------------------------------------------------------------------------------



        // update user details after lmia application-todo

        app.patch('/alllmiaUsers/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateUserInfo = req.body;
            const user = {
                $set: {

                    birthDay: updateUserInfo.birthDay,
                    bloodGroup: updateUserInfo.bloodGroup,
                    companyName: updateUserInfo.companyName,
                    jobExperience: updateUserInfo.jobExperience,
                    jobTitle: updateUserInfo.jobTitle,
                    lmiaPaymentMethod: updateUserInfo.lmiaPaymentMethod,
                    lmiaTrxID: updateUserInfo.lmiaTrxID,
                    maritalStatus: updateUserInfo.maritalStatus,
                    motherName: updateUserInfo.motherName,
                    parmanentAddre: updateUserInfo.parmanentAddre,
                    parmanentCity: updateUserInfo.parmanentCity,
                    permanentCountry: updateUserInfo.permanentCountry,
                    presentAddre: updateUserInfo.presentAddre,
                    presentCity: updateUserInfo.presentCity,
                    presentCountry: updateUserInfo.presentCountry,

                    coverPhoto: updateUserInfo.coverPhoto,
                    cvPhoto: updateUserInfo.cvPhoto,

                    userStatus: updateUserInfo.userStatus

                }
            }

            const result = await usersCollection.updateOne(filter, user, options);
            res.send(result);

        })
        // ---------------------------------------------------------------------------------------

        // update user details after visa application-todo

        app.patch('/allVisaUsers/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateUserInfo = req.body;
            const user = {
                $set: {

                    visaPaymentMethod: updateUserInfo.visaPaymentMethod,
                    visaTrxID: updateUserInfo.visaTrxID,
                    visaFormEca: updateUserInfo.visaFormEca,
                    visaFormLmia: updateUserInfo.visaFormLmia,

                    userStatus: updateUserInfo.userStatus

                }
            }

            const result = await usersCollection.updateOne(filter, user, options);
            res.send(result);

        })

        // -------------------------------------------------------------------------------------
        // -----------------------------------admin control start-------------------------------

        // update user eca status and eca photo by admin-

        app.patch('/updateEca/:id',  async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateUserInfo = req.body;
            const user = {
                $set: {
                    adminEcaPhoto: updateUserInfo.adminEcaPhoto,
                    // userStatus: updateUserInfo.userStatus
                    userStatus: 'ecaComplete'
                }
            }
            const result = await usersCollection.updateOne(filter, user, options);
            res.send(result);
        })


        // update user LMIA status and lmia photo by admin-

        app.patch('/updateLmia/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateUserInfo = req.body;
            const user = {
                $set: {
                    adminLmiaPhoto: updateUserInfo.adminLmiaPhoto,
                    // userStatus: updateUserInfo.userStatus
                    userStatus: 'lmiaComplete'
                }
            }
            const result = await usersCollection.updateOne(filter, user, options);
            res.send(result);
        })



        // update user LMIA status and lmia photo by admin-

        app.patch('/updateVisa/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateUserInfo = req.body;
            const user = {
                $set: {
                    adminVisaPhoto: updateUserInfo.adminVisaPhoto,
                    biometric: updateUserInfo.biometric,
                    userStatus: 'visaComplete'
                }
            }
            const result = await usersCollection.updateOne(filter, user, options);
            res.send(result);
        })


        // get all jobs data
        app.get('/jobs', async (req, res) => {
            const result = await jobsCollection.find().toArray();
            res.send(result);
        })


        // get all countries date
        app.get('/countries', async (req, res) => {
            const result = await countriesCollection.find().toArray();
            res.send(result);
        })



        // ----------------------------------------------------------------------------
        // ----------------------------------------------------------------------------
        // ----------------------------------------------------------------------------


        // ----------------------------------------------------------------------------------------

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
    res.send('system is running')
})

app.listen(port, () => {
    console.log(`Visa system is running on port ${port}`);
})