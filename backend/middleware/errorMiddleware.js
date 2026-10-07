/**
 * Centralized Error Handling Middleware
 * Converts technical and database errors into structured JSON responses.
 */
function errorHandler(err, req, res, next) {
    console.error(`[API ERROR ${req.method} ${req.url}]:`, err);

    let statusCode = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = err.message || 'An unexpected operational error occurred.';

    // Check for Oracle Custom Application Errors (RAISE_APPLICATION_ERROR -20001 to -20040)
    if (err.message && err.message.includes('ORA-20')) {
        statusCode = 400;
        code = 'BUSINESS_RULE_VIOLATION';
        // Extract clean text from ORA-20xxx: <text>
        const match = err.message.match(/ORA-20\d{3}:\s*([^\n\r]+)/);
        if (match && match[1]) {
            message = match[1];
        }
    } else if (err.message && err.message.includes('ORA-00001')) {
        statusCode = 409;
        code = 'UNIQUE_CONSTRAINT_VIOLATION';
        message = 'A record with duplicate identifier or unique key already exists.';
    } else if (err.message && err.message.includes('ORA-02292')) {
        statusCode = 400;
        code = 'INTEGRITY_CONSTRAINT_VIOLATION';
        message = 'Cannot delete or alter entity because dependent records exist.';
    } else if (err.message && err.message.includes('ORA-02291')) {
        statusCode = 400;
        code = 'FOREIGN_KEY_NOT_FOUND';
        message = 'Referenced entity (foreign key) does not exist in the database.';
    }

    res.status(statusCode).json({
        success: false,
        code,
        message
    });
}

module.exports = errorHandler;
