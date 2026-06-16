import sequelize from '../config/db.js';
import Expense from './expense.model.js';
import User from './user.model.js';
import Order from "./order.model.js";

// 1: The User owns many expenses
User.hasMany(Expense, {
    foreignKey: 'userId',
    as: 'expenses' 
});

Expense.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

//2" The User can have many OrderId
User.hasMany(Order, {
    foreignKey: 'userId',
    as: 'orders'
});

Order.belongsTo(User, {
    foreignKey: 'userId', 
    as: 'user'
})

export {
    sequelize,
    Expense,
    User,
    Order
}