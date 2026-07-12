const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            required: true,
            unique: true,
        },

        category: {
            type: String,
            enum: [
                'Food',
                'Utilities',
                'Medical',
                'Education',
                'Staff',
                'Maintenance',
                'Supplies',
                'Activities',
                'Transport',
                'Administration',
                'Emergency',
            ],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        description: {
            type: String,
            default: '',
        },

        date: {
            type: Date,
            required: true,
        },

        status: {
            type: String,
            enum: ['paid', 'pending'],
            default: 'pending',
        },

        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warden',
            required: true,
        },

        hostelName: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hostel',
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
