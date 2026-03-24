import mongoose from "mongoose";

// Utility to block the thread natively for X milliseconds
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const withTransactionRetry = async (operations, maxRetries = 5) => {
  let attempt = 0;

  while (attempt < maxRetries) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Execute caller operations natively
      const result = await operations(session);
      
      // Implement Commit Idempotency Guard (Traps Transient Commits natively)
      while (true) {
        try {
          await session.commitTransaction();
          console.info(JSON.stringify({ level: "INFO", event: "TRANSACTION_SUCCESS", attempt }));
          return result;
        } catch (commitError) {
          // If the network dropped strictly during commit, it might have succeeded remotely. Loop forcefully.
          if (commitError.hasErrorLabel && commitError.hasErrorLabel("UnknownTransactionCommitResult")) {
            console.warn(JSON.stringify({ level: "WARN", event: "UNKNOWN_COMMIT_RESULT", message: "Network isolated during commit. Re-submitting explicitly." }));
            continue;
          }
          throw commitError; // Passes back down to the outer catch wrapper
        }
      }

    } catch (error) {
      await session.abortTransaction();
      
      // Target MongoDB Transient / WriteConflict Errors exclusively 
      if (error.hasErrorLabel && error.hasErrorLabel("TransientTransactionError")) {
        attempt++;
        if (attempt >= maxRetries) throw new Error("Transaction permanently failed after maximum concurrency retries.");
        
        // Exponential Backoff algorithm: 25 * 2^1 (50ms), 2^2 (100ms), etc.
        const backoff = 25 * Math.pow(2, attempt);
        console.warn(JSON.stringify({ level: "WARN", event: "WRITE_CONFLICT_RETRY", attempt, maxRetries, backoffMs: backoff }));
        
        await pause(backoff);
      } else {
        throw error; // Let Validation or Unique Constraint errors flow normally natively
      }
    } finally {
      session.endSession(); // Prevent persistent RAM locking absolutely 
    }
  }
};
