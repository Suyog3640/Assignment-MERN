import express from 'express';
import axios from 'axios';
import ProductTransaction from '../model/transactionSchema.js';

const router = express.Router();

router.get('/transactions', async (req, res) => {
    const { search = '', month, page, perPage } = req.query;

    const monthNumber = new Date(`${month} 1, 2020`).getMonth() + 1;

    const matchDate = { $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] } };

    const searchConditions = {
        $or: [
            { title: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
            { price: parseFloat(search) || -1 }
        ]
    };

    const query = month ? { $and: [matchDate, searchConditions] } : searchConditions;

    try {
        const transactions = await ProductTransaction.find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));
        
        const totalTransactions = await ProductTransaction.countDocuments(query);

        res.json({
            page: parseInt(page),
            perPage: parseInt(perPage),
            total: totalTransactions,
            totalPages: Math.ceil(totalTransactions / perPage),
            transactions,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});

router.get('/statistics', async (req, res) => {
    const { month } = req.query;

    const monthNumber = new Date(`${month} 1, 2020`).getMonth() + 1;

    try {
        const stats = await ProductTransaction.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $month: "$dateOfSale" }, monthNumber],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSaleAmount: { $sum: "$price" },
                    totalSoldItems: { $sum: 1 },
                    totalNotSoldItems: {
                        $sum: {
                            $cond: [{ $eq: ["$sold", false] }, 1, 0],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalSaleAmount: 1,
                    totalSoldItems: 1,
                    totalNotSoldItems: 1,
                },
            },
        ]);

        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});

router.get('/price-range-stats', async (req, res) => {
    const { month } = req.query;

    let monthNumber;
    if (month) {
        const date = new Date(`${month} 1, 2000`);
        if (!isNaN(date)) {
            monthNumber = date.getMonth() + 1;
        } else {
            return res.status(400).json({ message: 'Invalid month provided' });
        }
    }

    try {
        const stats = await ProductTransaction.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $month: "$dateOfSale" }, monthNumber],
                    },
                },
            },
            {
                $bucket: {
                    groupBy: "$price",
                    boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901, Infinity],
                    default: "901-above",
                    output: {
                        count: { $sum: 1 },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    priceRange: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id", 0] }, then: "0-100" },
                                { case: { $eq: ["$_id", 101] }, then: "101-200" },
                                { case: { $eq: ["$_id", 201] }, then: "201-300" },
                                { case: { $eq: ["$_id", 301] }, then: "301-400" },
                                { case: { $eq: ["$_id", 401] }, then: "401-500" },
                                { case: { $eq: ["$_id", 501] }, then: "501-600" },
                                { case: { $eq: ["$_id", 601] }, then: "601-700" },
                                { case: { $eq: ["$_id", 701] }, then: "701-800" },
                                { case: { $eq: ["$_id", 801] }, then: "801-900" },
                                { case: { $eq: ["$_id", "901-above"] }, then: "901-above" },
                            ],
                            default: "Other",
                        },
                    },
                    count: 1,
                },
            },
            {
                $sort: { priceRange: 1 }
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});

router.get('/category-stats', async (req, res) => {
    const { month } = req.query;

    let monthNumber;
    if (month) {
        const date = new Date(`${month} 1, 2000`);
        if (!isNaN(date)) {
            monthNumber = date.getMonth() + 1;
        } else {
            return res.status(400).json({ message: 'Invalid month provided' });
        }
    } else {
        return res.status(400).json({ message: 'Month is required' });
    }

    try {
        const stats = await ProductTransaction.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $month: "$dateOfSale" }, monthNumber],
                    },
                },
            },
            {
                $group: {
                    _id: "$category", // Group by category
                    count: { $sum: 1 }, // Count the number of items in each category
                },
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id", // Rename _id to category
                    count: 1, // Keep the count field
                },
            },
            {
                $sort: { category: 1 } // Sort categories alphabetically (optional)
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});

router.get('/combined-stats', async (req, res) => {
    const { month } = req.query;

    if (!month) {
        return res.status(400).json({ message: 'Month is required' });
    }

    try {
        // Fetch data from all three APIs
        const [statisticsResponse, priceRangeStatsResponse, categoryStatsResponse] = await Promise.all([
            axios.get(`http://localhost:4000/api/statistics?month=${month}`),
            axios.get(`http://localhost:4000/api/price-range-stats?month=${month}`),
            axios.get(`http://localhost:4000/api/category-stats?month=${month}`)
        ]);

        // Combine the responses
        const combinedResponse = {
            statistics: statisticsResponse.data,
            priceRangeStats: priceRangeStatsResponse.data,
            categoryStats: categoryStatsResponse.data
        };

        res.json(combinedResponse);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
});

export default router;
