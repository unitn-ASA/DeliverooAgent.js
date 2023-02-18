
/**
 * Resolves after timeout
 * @type {function(Number):Promise} timer
 */
function timer (ms) {
    return new Promise( res => setTimeout(res, ms) )
}

module.exports = timer