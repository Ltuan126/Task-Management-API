/**
 * Escapes special regex characters in a string so it can be safely
 * used inside a RegExp or MongoDB $regex query without injection risk.
 *
 * @param {string} str — raw user input
 * @returns {string} — escaped string safe for $regex
 */
const escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports = { escapeRegex };
