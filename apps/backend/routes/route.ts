import express from "express"
import {prisma} from "@repo/db/client"
const router = express.Router();

const client = prisma;

router.get("/", (req,res)=>{
    res.status(200).json({
        message: "serevr running fine"
    })
})



router.post("/create", async(req,res)=>{
    const name = req.body.name;
    if(!name)res.status(400).json({message: "invalid payload"});

    const p = await prisma.todo.create({
        data:{
            name
        }
    });

    if(p){
        res.status(200).json({
            message: "Todo created succesfully",
            todo: p
        });
    }
    else {
        res.status(500).json({
            message: "Server side error"
        });
    }
})


export {router}