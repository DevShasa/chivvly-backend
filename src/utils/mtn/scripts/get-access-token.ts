import { captureException } from "@sentry/node";
import readline from "readline/promises";
import { createUserToken } from "./create";

const rl = readline.createInterface(process.stdin, process.stdout);

(async () => {
  try {
    const collections_user_id = await rl.question("Enter your collection user id: ");
    const disbursement_user_id = await rl.question("Enter your disbursement user id: ");
    const collections_api_key = await rl.question("Enter your collection api key: ");
    const disbursement_api_key = await rl.question("Enter your disbursement api key: ");
    rl.close();
    console.log(`
            Generating tokens for your MTN users...
        `);

    const collections_token = await createUserToken({
      apiKey: collections_api_key,
      reference_id: collections_user_id,
      type: "collection",
    });

    console.log("Generated collection token", collections_token);

    const disbursement_token = await createUserToken({
      apiKey: disbursement_api_key,
      reference_id: disbursement_user_id,
      type: "disbursement",
    });

    console.log("Generated disbursement token", disbursement_token);

    console.log(`
    
            Here are your MTN User tokens:
                Collection: ${collections_token}
                Disbursement: ${disbursement_token}
    
        `);

    process.exit(0);
  } catch (e) {
    captureException(e)
    console.log(e);
    process.exit(1);
  }
})();
