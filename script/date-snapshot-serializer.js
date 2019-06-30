/**
 * This module will serialize function as [typeof: <Function Name>] instead of [Function]
 */
module.exports = {
    test(val) {
        return val instanceof Date;
    },
    print(d) {
        return [
            d.getFullYear(),
            ('0' + (d.getMonth() + 1)).slice(-2),
            ('0' + d.getDate()).slice(-2)
        ].join('-');
    },
}