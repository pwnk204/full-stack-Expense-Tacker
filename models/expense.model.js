import {DataTypes} from 'sequelize'
import sequelize from '../config/db.js'

const Expense = sequelize.define('Expense', {
    
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    
   
    transactionType: {
        type: DataTypes.ENUM('credit', 'debit'),
        allowNull: false,
    },
    
   
    date: {
        type: DataTypes.DATEONLY, 
        allowNull: true,
        defaultValue: DataTypes.NOW, 
    },
    
    
    description: {
        type: DataTypes.TEXT,
        allowNull: false, 
    },
    
    
    category: {
        type: DataTypes.ENUM(
            'Food', 
            'Housing', 
            'Transportation', 
            'Utilities', 
            'Entertainment', 
            'Health', 
            'Personal', 
            'Education', 
            'Debt', 
            'Salary',
            'Other'
        ),
        allowNull: false,
        defaultValue: 'other',
    },

    
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', 
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' 
    }
});

export default Expense;

