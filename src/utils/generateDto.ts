

/**
 * @name generateDataTransferObject
 * @description - inorder to pass a uniform response body to the client so that it's easier to parse the request, as well as include any other info
 * @todo - still working on the generic type definition for this 
 * @todo - add functionality to remove unwanted fields using zod
 */

function generateDataTransferObject<T>( data: object | null | T, message: string, status: "success" | "error" | "warning" = "success" ): {
    data: T | null | object,
    status: "success" | "error" | "warning",
    message: string
} {
    return ({
        data,
        status,
        message
    })
} 

export default generateDataTransferObject