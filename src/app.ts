import "dotenv/config";
//initialize event listeners
import "./notifications/listeners";
import "./utils/mpesa/listeners";
import "./utils/mtn/listeners";
import  express, { Request, Response} from "express";
import vehicleRoutes from "./routes/vehicles";
import reservationRoutes from "./routes/reservation";
import userRoutes from "./routes/users";
import issueRoutes from "./routes/issues";
import settingsRoutes from "./routes/settings";
import paymentTypeRoutes from "./routes/paymentType";
import authcodeRoutes from "./routes/authCode";
import locationRoutes from "./routes/location";
import paymentRoutes from "./routes/payments";
import payoutMethodRouter from "./routes/payout";
import notificationRouter from "./routes/notifications";
import adminRouter from './routes/admin'
import Webhooks from "@hooks/index";
import morgan from "morgan";
import createHttpError, {isHttpError} from "http-errors";
import { withAuth } from "./middleware/firebaseAuthMiddleware";
import env from "./utils/validateEnvFile";
import swaggerDocs from "./utils/swagger";
import cors from "cors";
import { withUser } from "@middleware/withUser";
import { withBotAuth } from "@middleware/withBotAuth";
import { acceptInvite } from "./controllers/users";
import CookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";

const app = express();

// Initialized Sentry in the application
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV,
    integrations: [
        new Sentry.Integrations.Http({tracing: true}),
        new Sentry.Integrations.Express({app}),
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
    tracesSampleRate: 1.0,
})

// Sentry request handler middleware. Should be the first before all middlewares
app.use(Sentry.Handlers.requestHandler() as express.RequestHandler)
app.use(Sentry.Handlers.tracingHandler())
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
        'x-user',
        'Authorization',
        'Content-Type',
        'Accept',
        'Origin',
        'User-Agent',
        'ngrok-skip-browser-warning'
    ],
    optionsSuccessStatus: 200
}))
app.use(CookieParser())
app.use(morgan("dev"));
app.use(express.json());
app.use("*", (req, res, next)=>{
    // strip all previously set user related headers 
    req.headers.user_id = undefined
    req.headers.user_type = undefined
    req.headers.role = undefined
    req.headers.email = undefined
    req.headers.market_id = undefined
    req.headers.sub_market_id = undefined
    next()
})
swaggerDocs(app, env.PORT)


const publicRouter = express.Router();

publicRouter.get("/api/users/admin/accept", acceptInvite) // new //public route (this is for getting signin tokens for new hosts)

app.use(publicRouter)
app.use("/api/vehicles", withAuth ,vehicleRoutes); // refactored //tested
app.use("/api/reservations", withAuth ,reservationRoutes);  // refactored //tested
app.use("/api/users",withAuth, userRoutes); // refactored //tested
app.use("/api/issues", withAuth ,issueRoutes); //needs clarification
app.use("/api/settings", withAuth ,settingsRoutes); //refactored //tested'
app.use("/api/user/settings", withAuth, settingsRoutes) // for mobile app support 
app.use("/api/paymenttypes", withAuth ,paymentTypeRoutes); 
app.use("/api/payments", withAuth, paymentRoutes); // new 
app.use("/api/authcodes",withAuth, withUser, authcodeRoutes); // refactored //tested
app.use("/api/payouts" ,withAuth,payoutMethodRouter); // refactored p
app.use("/api/location", locationRoutes); // refactored //tested
app.use("/api/admin", withAuth, adminRouter) 
// app.use("/api/integration", integrationRoutes); 
// app.use("/api/tracking", trackingRoutes) // possible gonna move to a separate service
app.use("/api/webhooks", express.raw({type: 'application/json'}) ,Webhooks) // new 
// app.use("/api/postmark", Mail) // changed to notifications, which are handled as events, so no need for this route
app.use("/api/notifications",withBotAuth, notificationRouter) // new [this is meant to be called by a cron jon or something]
app.get("/ping", (req, res)=>{
    res.json({message:"pong"}) // for api health checks
})

app.all("/",(req, res)=>{
    res.status(403).send("<h2 style='text-align: center'>Error 403 | Forbidden Access</h2>")
}) 

// Sentry error handler middlware. Must appear first before all other error handler middlwares and after all controllers
app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler)

app.use((req, res)=>{
    res.status(404).send("<h2 style='text-align: center'>Error 404 | Not Found</h2>")
})

app.use((error:unknown, req:Request, res:Response)=>{
    console.log("📕: An error has occurred",error)
    let errorMessage = error || "An unknown error occurred";
    let statusCode = 500;
    if(isHttpError(error)){
        statusCode = error.status
        errorMessage = error
    }
    res.status(statusCode).json({error:errorMessage})
})

export default app
