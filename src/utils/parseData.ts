import { isEmpty } from 'lodash';


/**
 * @name removeUnwanted
 * @description removes parts of the passed objects that are unwanted
 */

export const removeUnwanted = ( data: any, toBeRemoved: string[] ) : object  => {
        if (isEmpty(data)) return {}
        toBeRemoved.forEach((key)=>{
            delete data?.[key]
        })
        return data
    }