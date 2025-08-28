/**
 * Extracts URL from transaction ID input
 * @param {string} transactionId - The transaction ID input from user
 * @returns {string} - The extracted URL or original transactionId if no URL found
 */
const extractUrlFromTransactionId = (transactionId) => {
  if (!transactionId || typeof transactionId !== 'string') {
    return transactionId;
  }

  // Trim whitespace
  const trimmedId = transactionId.trim();
  
  // Look for URLs starting with http:// or https://
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = trimmedId.match(urlRegex);
  
  if (matches && matches.length > 0) {
    // Return the first URL found
    return matches[0];
  }
  
  // If no URL found, return the original transactionId
  return trimmedId;
};

/**
 * Example usage:
 * Input: "Dear Leul your Account 1*****8248 has been debited with ETB1,800.00 .Service charge of ETB0 and VAT(15%) of ETB0.00 with a total of ETB1800. Your Current Balance is ETB 12,236.90. Thank you for Banking with CBE! https://apps.cbe.com.et:100/?id=FT252259VX7W95448248"
 * Output: "https://apps.cbe.com.et:100/?id=FT252259VX7W95448248"
 */
module.exports = {
  extractUrlFromTransactionId
};
