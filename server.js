//importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js'
import Pusher from 'pusher';
import cors from 'cors';
import { key } from './secrets.js'
import { secret } from './secrets.js';

//app config
const app = express();
const port = process.env.PORT || 9000;
const pusher = new Pusher({
    appId: "1310385",
    key: key,
    secret: secret,
    cluster: "eu",
    useTLS: true
});
const db = mongoose.connection;

db.once('open', () => {
    console.log('DB connected');

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change)

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });

        } else {
            console.log('Error triggering pusher...')
        }
    })
})
//middlewares
app.use(express.json())
app.use(cors());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
})

//DB config
const CONNECTION__URL = 'mongodb+srv://admin:kogRub-qemdex-5qamqo@cluster0.suy9p.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(CONNECTION__URL, {
    //useCreateIndex: true,
    //useNewUrlParse: true,
    //useUnifiedTopology: true
});


//??



//API routes
app.get('/', (req, res) => res.status(200).send('hello world'))
app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
});
app.post('/messages/new', (req, res) => {

    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })

})


//listen
app.listen(port, () => console.log(`Server running at port ${port}`));