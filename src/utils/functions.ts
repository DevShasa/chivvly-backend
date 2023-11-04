import { Prisma, User, UserType } from "@prisma/client";
import { captureException } from "@sentry/node";
import crypto from "crypto";
import { sign, verify } from "jsonwebtoken";
import { isEmpty, isNumber, isUndefined } from "lodash";
import { z } from "zod";

/**
 * @name generateAuthCode
 * @description Generate a 6 alphanumeric character auth code
 */
export const generateAuthCode = (): string => {
  const code = crypto
    .getRandomValues(new Uint32Array(1))[0]
    .toString(36)
    .toUpperCase();
  
  return code.padStart(6, "X")?.slice(0, 6);  
};

/**
 * @name isValidLatitude
 * @description Check if a latitude is valid
 */

export const isValidLatitude = (lat: unknown): boolean => {
  if (!isNumber(lat)) return false;
  return lat >= -90 && lat <= 90;
};

/**
 * @name isValidLongitude
 * @description Check if a longitude is valid
 */

export const isValidLongitude = (lon: unknown): boolean => {
  if (!isNumber(lon)) return false;
  return lon >= -180 && lon <= 180;
};

/**
 * @name isValidEpochInFuture
 * @description Check if a time is valid
 */
export const isValidEpochInFuture = (time: unknown): boolean => {
  if (!isNumber(time)) return false;
  return time > new Date().getTime();
};

/**
 * @name theStartOfTodayEpoch
 * @description Get the start of today's utc epoch
 * @returns number
 */
export const theStartOfTodayEpoch = (): number => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today.getTime();
};

/**
 * @name theEndOfTodayEpoch
 * @description Get the end of today's utc epoch
 * @returns number
 */
export const theEndOfTodayEpoch = (): number => {
  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);
  return today.getTime();
};

/**
 * @name constructFullName
 * @description Construct a full name from first and last name
 * @param {User} user
 */

export const constructFullName = (user: User): string => {
  if (!user.fname && !user.lname) return user.email;
  if (!user.fname) return user?.lname as string;
  if (!user.lname) return user?.fname as string;
  return `${user.fname} ${user.lname}`;
};

/**
 * @name generateAppJWT
 * @description Generate a JWT using the app secret
 * @param {object} payload
 * @returns {string}
 */

export const generateAppJWT = (payload: object): string => {
  return sign(payload, process.env.APP_SECRET as string);
};

/**
 * @name verifyAPPJWT
 * @description Verify a JWT using the app secret
 */
export const verifyAppJWT = (token: string): boolean => {
  try {
    const payload = verify(token, process.env.APP_SECRET as string);
    return !isEmpty(payload);
  } catch (error) {
    captureException(error)
    return false;
  }
};

/**
 * @name genUTCEpoch
 * @description Generate a UTC epoch
 * @param {Date} date
 */

export const genUTCEpoch = (date: Date): number => {
  return new Date(date.toUTCString()).getTime();
};

/**
 * @name getDistance
 * @description Get the distance between two locations
 */

export const getDistance = (
  userLocation: { lat: number; lng: number },
  vehicleLocation: { lat: number; lng: number }
): number => {
  const R = 6371e3; // metres
  const user_lat_in_radians = (userLocation.lat * Math.PI) / 180;
  const vehicle_lat_in_radians = (vehicleLocation.lat * Math.PI) / 180;
  const change_in_lat_in_radians =
    ((vehicleLocation.lat - userLocation.lat) * Math.PI) / 180;
  const change_in_lon_in_radians =
    ((vehicleLocation.lng - userLocation.lng) * Math.PI) / 180;

  const a =
    Math.sin(change_in_lat_in_radians / 2) *
      Math.sin(change_in_lat_in_radians / 2) +
    Math.cos(user_lat_in_radians) *
      Math.cos(vehicle_lat_in_radians) *
      Math.sin(change_in_lon_in_radians / 2) *
      Math.sin(change_in_lon_in_radians / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // this is in metrs
  return d / 1000; // this is in km
};

/**
 * @name generateRandomCoordinates
 * @description Generate random coordinates within a specified radius of a center point
 */
export const generateRandomCoordinates = (
  center: {
    lat: number;
    lng: number;
  },
  radius: number
) => {
  // Convert radius from meters to degrees
  const radiusInDegrees = radius / 111000;
  
  // Generate random distance and angle using non-uniform distribution
  const randomDistance = Math.sqrt(Math.random()) * radiusInDegrees;
  const randomAngle = Math.random() * 2 * Math.PI;
  
  // Calculate new latitude and longitude coordinates
  const latitude = center.lat + randomDistance * Math.cos(randomAngle);
  const longitude = center.lng + randomDistance * Math.sin(randomAngle);
  
  return { lat: latitude, lng: longitude };
};

/**
 * @name customIsNumber
 * @description Custom is number function
 *      since lodash's isNumber function won't work with numeric strings
 * @param {string} val
 */
export const customIsNumber = (val: string) => {
  if (val === "") return false;
  const a = parseInt(val);
  if (isNaN(a)) return false;
  return isNumber(a);
};

/**
 * @name numeric_string_to_number
 * @description Zod schema for converting a numeric string to a number
 */
export const numeric_string_to_number = z
  .string()
  .refine(customIsNumber, {
    message: "invalid number passed",
  })
  .transform(parseFloat);

/**
 * @name pagination_query_schema
 * @description Zod schema for pagination
 */
export const pagination_query_schema = {
  page: z
    .string()
    .default("1")
    .refine(customIsNumber, {
      message: "invalid page number",
    })
    .transform(parseFloat),
  size: z
    .string()
    .default("10")
    .refine(customIsNumber, {
      message: "invalid page size",
    })
    .transform(parseFloat),
};


/**
 * @name generateInviteCode
 * @description Generate an invite code
 */

export const generateInviteCode = () => {
  const code = crypto.randomBytes(16).toString("hex");
  return code;
}

/**
 * @name generateRandomPlaceholderHandler
 * @description Generate a random placeholder handler, for admin user creation
 */

export const generateRandomPlaceholderHandle = (): string => {
  const random = Math.floor(Math.random() * 1000000);
  return `placeholder${random}`;
}

/**
 * @name generateRandomDefaultPassword
 * @description Generate a random default password, for admin user creation
 */

export const generateRandomDefaultPassword = (): string => {
  const pass = crypto.randomBytes(16).toString("hex")
  return pass;
}

// mpesa will only accept the date in this format
export const formatMpesaDate = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  let string_month = month.toString();
  if (string_month.length === 1) {
    string_month = `0${string_month}`;
  }
  const day = date.getDate();
  let string_day = day.toString();
  if (string_day.length === 1) {
    string_day = `0${string_day}`;
  }
  const hours = date.getHours();
  let string_hours = hours.toString();
  if (string_hours.length === 1) {
    string_hours = `0${string_hours}`;
  }
  const minutes = date.getMinutes();
  let string_minutes = minutes.toString();
  if (string_minutes.length === 1) {
    string_minutes = `0${string_minutes}`;
  }
  const seconds = date.getSeconds();
  let string_seconds = seconds.toString();
  if (string_seconds.length === 1) {
    string_seconds = `0${string_seconds}`;
  }
  return `${year}${string_month}${string_day}${string_hours}${string_minutes}${string_seconds}`;
}

/**
 * @name generatePaymentAuthorizationToken
 * @description - all payment related transactions are async, this means we can't handle everything on a single request and response cycle
 *                and have to wait for a callback from the payment provider. This means we need to generate a token that we can use to identify
 *                a transaction when doing tasks like creating a reservation. 
 *              - this helper function will generate a signed(with the APP_SECRET) jwt token that will get sent down to the client, when the client makes a payment
 *                request, and the client can send back up when creating a reservation
 *             - the token will contain the following information:
 *              - the user id       
 *              - the amount to be paid
 *              - a timestamp for when the token was generated
 */

export const generatePaymentAuthorizationToken = (user_id: string, amount: number) =>{
  const token = sign({
    user_id: user_id,
    amount: amount,
    timestamp: Date.now()
  }, process.env.APP_SECRET as string)
  return token
}

export const isPaymentAuthorizationTokenValid = (token: string) => {
  try {
    verify(token, process.env.APP_SECRET as string)
    return true
  } catch (error) {
    captureException(error)
    return false
  }
}

/**
 * @name timeSleep 
 * @description - sleep for a specified amount of time
 */

export const timeSleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @name formatPhoneNumber
 * @param number 
 * @returns phone number in the format 2547XXXXXXXX
 */
export function formatPhoneNumber(number: string | bigint) {
  let formattedNumber: string;

  // Convert bigint to string if necessary
  if (typeof number === 'bigint' || typeof number === 'number') {
      formattedNumber = number.toString();
  } else {
      formattedNumber = number;
  }

  // Remove any leading '0'
  if (formattedNumber.startsWith('0')) {
      formattedNumber = formattedNumber.slice(1);
  }

  if(formattedNumber.startsWith('+')){
    formattedNumber = formattedNumber.slice(1);
  }

  // Add country code '254' if not present
  if (!formattedNumber.startsWith('254')) {
      formattedNumber = '254' + formattedNumber;
  }

  if (formattedNumber.length !== 12) {
      return Promise.reject('Invalid phone number');
  }

  return Promise.resolve(BigInt(formattedNumber));
}

/**
 * @name getMonthName
 * @param month 
 * @returns 
 */
export function getMonthName(month: number) {
  const monthNames = ["January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"];
  return monthNames[month];
}


/**
 * @name vehicle_time_filter_query
 * @description generates a query to filter vehicles by time
 * 
 * @param start_date_time 
 * @param end_date_time 
 * @returns 
 */
export const vehicle_time_filter_query = (start_date_time?: string, end_date_time?: string, user_type: UserType = "HOST", id?: string): Prisma.VehicleWhereInput|null => {
 
  if (user_type === "HOST") return null
  if (!isEmpty(id)) return null

  if(isUndefined(start_date_time) || isUndefined(end_date_time)) return {
      reservation: {
              none: {
                  status: {
                      in: ["ACTIVE", "UPCOMING", "PENDING_CONFIRMATION"]
                  }
              }
          }
  }
  return {
      OR: [
          {
              reservation: {
                  none: {
                      start_date_time: {
                          lt: new Date(end_date_time).toISOString()
                      },
                      end_date_time: {
                          gt: new Date(start_date_time).toISOString()
                      }
                  }
              }
          },
          {
              reservation: {
                  every: {
                      OR: [
                        {
                            start_date_time: {
                                gt: new Date(end_date_time).toISOString()
                            }
                        },
                        {
                            end_date_time: {
                                lt: new Date(start_date_time).toISOString()
                            }
                        },
                        {
                            status: {
                                in: ["COMPLETE", "CANCELLED"]
                            }
                        }
                      ]
                  }
              }
          }
      ]
     
  }
}