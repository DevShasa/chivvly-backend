import { captureException } from "@sentry/node";
import { createAPIKey, createMTNUser } from "./create";

(async () => {
  try {
    const collections_user = await createMTNUser("collection");
    const disbursement_user = await createMTNUser("disbursement");

    const collections_api_key = await createAPIKey(collections_user);
    const disbursement_api_key = await createAPIKey(disbursement_user);
    

    console.log(`

        Here are your MTN User IDs:
            Collection: ${collections_user.reference_id}
            Disbursement: ${disbursement_user.reference_id}

        Here are your MTN API keys:
            Collection: ${collections_api_key}
            Disbursement: ${disbursement_api_key}

        when making requests that include callbacks,
        use https://webhook.site/ as the callback host
        
        `);
  } catch (e) {
    captureException(e)
    console.log(e);
  }
})();
