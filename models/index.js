import sequelize from '../config/db.js';
import Expense from './expense.model.js';
import User from './user.model.js';

// Side 1: The User owns many expenses
User.hasMany(Expense, {
    foreignKey: 'userId',
    as: 'expenses' 
});


Expense.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

export {
    sequelize,
    Expense,
    User

}