/* eslint-disable @typescript-eslint/no-var-requires */
const postmark = require('postmark');
import { app_env } from "@utils/constants";

// when config for env variable files is setup won't need to work with dev key 
const postMarkClient = new postmark.ServerClient(["testing"]?.includes(app_env) ?process.env.DEV_POSTMARKAPI_KEY : process.env.PROD_POSTMARKAPI_KEY as string);

export default postMarkClient;