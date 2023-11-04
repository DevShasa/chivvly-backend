import app from "./app";
import env from "./utils/validateEnvFile";

const port = env.PORT;

app.listen(port, ()=>{
    console.log(`📘: Server listening on port ${port}`)
})