// Fix for TS2339: Property 'close' does not exist on type 'IDBOpenDBRequest'
// We need to modify how we're handling the close operation

// For this fix, I would need to see the full pdfStorage.ts file to properly update it.
// The error is on line 19, but without seeing the full context, I'll provide a generic fix
// that you may need to adjust based on your exact implementation:

// If you're trying to close the database connection:
// Instead of request.close(), you should use:
// db.close();
// where db is the IDBDatabase instance

// If you're trying to abort the request:
// You might need to use:
// request.transaction?.abort();
// Or simply remove the close() call if it's not necessary

// Please adjust this based on the actual code in your pdfStorage.ts file
