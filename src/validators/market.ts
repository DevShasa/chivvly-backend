import { CustomValidator } from "express-validator";
import prismaClient from "@prismaclient/client";
import { isEmpty } from "lodash";

export const isValidMarket:CustomValidator = async (value) =>{
    prismaClient.market.findUnique({
        where: {
            id: value
        }
    }).then((market)=>{
        if (isEmpty(market)) return Promise.reject("Market not found")
        return Promise.resolve()
    }).catch(()=>{
        return Promise.reject("An error occured while validating the market ")
    })
}

export const isValidSubMarket: CustomValidator = async (value) => {
    prismaClient.subMarket.findUnique({
        where: {
            id: value
        }
    }).then((sub_market)=>{
        if (isEmpty(sub_market)) return Promise.reject("Submarket not found")
        return Promise.resolve()
    }).catch(()=>{
        return Promise.reject("An error occured while validating the submarket ")
    })
}