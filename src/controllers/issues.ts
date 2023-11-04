import { RequestHandler } from "express";
import prismaClient from "@prismaclient/client";
import generateDataTransferObject from "@utils/generateDto";
import { parseQueryString } from "@utils/pagination";
import { tIssueSchema } from "@validators/issues";
import {captureException} from '@sentry/node'

export const createNewIssue: RequestHandler = async (req, res) => {
  const user_id = req.headers.user_id as string;
  await tIssueSchema.required({
    complaint: true,
  }).parseAsync(req.body).then(async (complaint)=>{
    await prismaClient.issue
    .create({
      data: {
        ...complaint,
        user_id
      },
    })
    .then(() => {
      res
        .status(201)
        .send(
          generateDataTransferObject(null, "Successfully Created", "success")
        );
    })
    .catch((e) => {
      res
        .status(400)
        .send(generateDataTransferObject(e, "An error occured", "error"));
    });
  }).catch((e)=>{
    res.status(500).send(generateDataTransferObject(e, "Invalid request body", "error"))
    captureException(e)
  })
  
};

export const fetchIssues: RequestHandler = async (req, res) => {
  const { id } = parseQueryString(req.query);
  prismaClient.issue
    .findMany({
      where: id ? { id } : undefined
    })
    .then((data) => {
      res
        .status(200)
        .send(
          generateDataTransferObject(
            data,
            "Successfully retrieved data",
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
};
