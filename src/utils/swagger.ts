import { Express} from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { version } from "../../package.json";

const options: swaggerJsdoc.Options = {
    definition:{
        openapi:"3.0.0",
        info:{
            title:"DIVLY API Docs",
            version
        },
        components:{
            securitySchemas:{
                bearerAuth:{
                    type:"http",
                    scheme:"bearer",
                    bearerFormat:"JWT"
                },
            },
        },
        security:[
            {bearerAuth:[],}
        ]
    },
    apis:["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options)

function swaggerDocs(app:Express, port:number){
    // swagger page 
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`📒: Swagger documents available at-> http://localhost:${port}/docs`)
}

export default swaggerDocs