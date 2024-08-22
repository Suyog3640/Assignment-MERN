import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    sold: {
        type: Boolean,
    },
    dateOfSale: {
        type: Date,
        required: true
    }
});

const product_transaction = mongoose.model('product_transaction', transactionSchema);
export default product_transaction;

