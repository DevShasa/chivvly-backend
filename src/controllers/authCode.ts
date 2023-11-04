import { RequestHandler } from "express";
import crypto from "crypto";
import { tAuthCodeQuerySchema, tAuthCodeSchema } from "@validators/authcode";
import generateDataTransferObject from "@utils/generateDto";
import prismaClient from "@prismaclient/client";
import { authCodeExpiresIn, appUserTypes } from "@utils/constants";
import { isEmpty, isNull } from "lodash";
import { generateAuthCode } from "@utils/functions";
import notifications from "src/notifications";
import { expo_app_scheme } from "@utils/expo";
import { captureException } from "@sentry/node";


export const activateAuthCode: RequestHandler = async (req, res) => {
  const user_type = req.headers.user_type as string;
  const auth_code_id = req.query.auth_code_id as string;
  
  if (user_type !== appUserTypes.host) return res.status(400).send(generateDataTransferObject(null, "Not allowed", "error"));
  if (isEmpty(auth_code_id)) return res.status(400).send(generateDataTransferObject(null, "Invalid request", "error"));
  
  try {
    const data = await prismaClient.authCode.update({
      where: { id: auth_code_id },
      data: { status: "ACTIVE", code: generateAuthCode() },
      include: { host: true }
    })
   
    res.status(200).send(generateDataTransferObject(data, "Successfully Activated", "success"));
    notifications.sendAuthCodeRequestGrantedNotification({
      data: {
        message: `Your auth code has been activated, your new code is ${data.code}`,
        link: `${expo_app_scheme}search?searchType=host&hostCode=${data.host.handle}`,
        extra: { vehicle_id: data.vehicle_id, host_id: data.host_id, code: data.code, type: "auth_code_activated" }
      },
      user_id: data.user_id,
    });
  } catch (e) {
    res.status(500).send(generateDataTransferObject(e, "An error occured", "error"));
    captureException(e)
  }
  
  
};


/**
 * @todo add cron job, or some postgress functionality to automatically change status to expired
 */
export const changeAuthCodeStatus: RequestHandler = async (req, res) => {
  const auth_code_id = req.query.auth_code_id as string;
  await tAuthCodeSchema
    .required({
      status: true,
    })
    .parseAsync(req.body)
    .then(async (data) => {
      await prismaClient.authCode
        .update({
          where: {
            id: auth_code_id,
          },
          data: {
            status: data.status,
          },
        })
        .then((code) => {
          res
            .status(200)
            .send(
              generateDataTransferObject(
                code,
                "Successfully Created",
                "success"
              )
            );

            if (data.status === "REVOKED") return notifications.sendAuthCodeRevokedNotification({
              data: {
                message: `Your request for an authcode auth code has been revoked`,
              },
              user_id: code.user_id
            })


        })
        .catch((e) => {
          res
            .status(500)
            .send(generateDataTransferObject(e, "An error occured", "error"));
          captureException(e)
        });
    })
    .catch((e) => {
      res
        .status(400)
        .send(generateDataTransferObject(e, "Invalid request body", "error"));
    });
};

// create authcode
export const requestAuthcode: RequestHandler = async (req, res) => {
  const user_uid = req.headers.uid as string;
  const user_type = req.headers.user_type as string;

  if (user_type !== appUserTypes.customer)
    return res
      .status(400)
      .send(generateDataTransferObject(null, "Not allowed", "error"));
  await tAuthCodeSchema
    .required({
      vehicle_id: true,
      host_id: true
    })
    .parseAsync(req.body)
    .then(async (data) => {
      await prismaClient.authCode
        .create({
          data: {
            code: crypto.randomUUID(),
            expiry_date_time: new Date(Date.now() + authCodeExpiresIn),
            host: {
              connect: {
                id: data.host_id,
              },
            },
            user: {
              connect: {
                uid: user_uid,
              },
            },
            vehicle: {
              connect: {
                id: data.vehicle_id,
              },
            },
          },
          include: {
            host: true,
            user: true,
            vehicle: true
          }
        })
        .then((data) => {
          notifications.sendToHostNewAuthCodeRequestNotification({
            subject: "New Auth Code Request",
            to: data?.host?.email,
            template: 'auth-code-request',
            data: {
              host_name:data?.host?.handle,
              vehicle_name:  data?.vehicle?.make || '',
              vehicle_model: data?.vehicle?.model || '', 
              requester_name: data?.user?.email
            }
          })

          res
            .status(201)
            .send(
              generateDataTransferObject(
                data,
                "Successfully Sent request",
                "success"
              )
            );
        })
        .catch((e) => {
          res
            .status(500)
            .send(generateDataTransferObject(e, "An error occured", "error"));
          captureException(e)
        });
    })
    .catch((e) => {
      res
        .status(400)
        .send(generateDataTransferObject(e, "Invalid request body", "error"));
    });
};


export const fetchAuthCodes: RequestHandler = async (req, res) => {
  const { user_id, user_type } = req.headers as {user_id: string, user_type: string}
  await tAuthCodeQuerySchema.parseAsync(req.query).then(async (query)=>{
    const { page, size, auth_code_id, code, status, sort_by, sort, search } = query
    if (!isEmpty(auth_code_id) || !isEmpty(code)) {
      await prismaClient.authCode.findFirst({
        where: {
          code,
          id: auth_code_id,
          status: "ACTIVE",
          user_id: user_type === appUserTypes.customer ? user_id : undefined, // though it's only the customer who would need authcode validation, will leave it here for now, incase additional functionality needs to be added on in the future
        }
      }).then((data)=>{
        if(!isNull(data)) {
          res.status(200).send(generateDataTransferObject(data, "Valid Auth Code", "success"))
        } else {
          res.status(404).send(generateDataTransferObject(null, "Invalid auth code", "error"))
        }
      })
    } else {
      await prismaClient.authCode.findMany({
        where: {
          host_id: user_type === appUserTypes.host ? user_id : undefined,
          user_id: user_type === appUserTypes.customer ? user_id : undefined,
          status: status,
          OR: isEmpty(search) ? undefined : [
            {
              user: {
                fname: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            },
            {
              user: {
                lname: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            },
            {
              user: {
                email: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            },
            {
              vehicle: {
                make: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            },
            {
              vehicle: {
                model: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            },
            {
              vehicle: {
                plate: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          ]
        },
        take: size,
        skip: ( page - 1 ) * size,
        include: {
          user: true,
          vehicle: true,
        },
        orderBy: {
          [sort_by]: sort
        }
      }).then((data)=>{
        res.status(200).send(generateDataTransferObject(data, "Successfully fetched", "success"))
      }).catch((e)=>{
        res.status(500).send(generateDataTransferObject(e, "An error occured", "error"))
        captureException(e)
      })
    }
    
  }).catch((e)=>{
    res.status(400).send(generateDataTransferObject(e, "Invalid query provided", "error"))
  })
}
