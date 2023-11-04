
/**
 * @name parsePagination
 * @description Parse pagination from query string
 * @param {string} page
 * @param {string} size
 * @returns {
 *  skip: number,
 *  take: number
 * }
 */

export const parsePagination = ( page?: string, size?: string ) => {
    let _p = parseInt(page || '1')
    let _s = parseInt(size || '10')
    _p =  Number.isNaN(_p) ? 1 : _p
    _s =  Number.isNaN(_s) ? 10 : _s

    return {
        skip: (_p - 1) * _s,
        take: _s
    }
}


/**
 * @name parseQueryString
 * @description Parse query string
 * @param {any} query
 * @returns {
 *  id: string,
 *  page: string,
 *  size: string
 * }
 */

export const parseQueryString = ( query: {
    id?: string,
    page?: string,
    size?: string
}) => {
    return {
        id: query.id,
        page: query.page,
        size: query.size
    }
}