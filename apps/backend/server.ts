import express from "express"
import {router} from "./routes/route"
import cors from "cors";



const app = express();


app.use(cors({
    origin : "*"
}));

app.use(express.json());
app.use(router);

app.listen(3001, ()=>{
    console.log("running at port ", 3001);
})

