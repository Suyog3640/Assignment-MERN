import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import axios from 'axios';
import transaction from '../model/transactionSchema.js';
import transactionRouter from '../router/transactionRouter.js';

const app = express();
const PORT = 4000;

mongoose.connect('mongodb://localhost:27017/product', {
    dbName: 'product'
})
.then(async (req, res) => {
    console.log('Connected to database!');
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    
    await transaction.deleteMany({});
    console.log('Existing data cleared.');

    const data = response.data;
    await transaction.insertMany(data);
    console.log('Data inserted successfully.');
})
.catch(err => {
    console.log(`Some error occured while connecting to database: ${err}`);
});

app.use(express.json());
app.use(cors());
app.use('/api', transactionRouter);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

