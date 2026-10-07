const db = require('../config/database');

class UserRepo {
    static async findByEmail(email) {
        const sql = `
            SELECT u.UserID, u.RoleID, r.RoleName, u.FullName, u.Email, 
                   u.Phone, u.PasswordHash, u.AccountStatus, u.CreatedAt
            FROM USERS u
            JOIN ROLES r ON u.RoleID = r.RoleID
            WHERE LOWER(u.Email) = LOWER(:email)
        `;
        const result = await db.execute(sql, { email });
        return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    }

    static async findById(userId) {
        const sql = `
            SELECT u.UserID, u.RoleID, r.RoleName, u.FullName, u.Email, 
                   u.Phone, u.AccountStatus, u.CreatedAt, u.LastLogin
            FROM USERS u
            JOIN ROLES r ON u.RoleID = r.RoleID
            WHERE u.UserID = :userId
        `;
        const result = await db.execute(sql, { userId });
        return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    }

    static async updateLastLogin(userId) {
        const sql = `
            UPDATE USERS
            SET LastLogin = CURRENT_TIMESTAMP
            WHERE UserID = :userId
        `;
        await db.execute(sql, { userId });
    }

    static async getAllUsers() {
        const sql = `
            SELECT u.UserID, u.FullName, u.Email, u.Phone, r.RoleName, u.AccountStatus, u.CreatedAt, u.LastLogin
            FROM USERS u
            JOIN ROLES r ON u.RoleID = r.RoleID
            ORDER BY u.UserID ASC
        `;
        const result = await db.execute(sql);
        return result.rows || [];
    }
}

module.exports = UserRepo;
