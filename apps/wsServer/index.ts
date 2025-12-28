import "dotenv/config";
import {WebSocketServer, WebSocket, RawData} from "ws";
import prisma from "@repo/db/client";



const wss = new WebSocketServer({port: 3002});

wss.on("error", console.error);

wss.on("listening", ()=>{
    console.log(`listening at port ${wss.options.port}`);
});

wss.on("connection", (ws)=>{
    ws.on("message", async (message)=>{
        const data = validateData(message);
        if(!data || !data.action){
            mSend(ws, {message: "Invalid payload"}); 
            return;
        }

        const validate = validateData(data);

        if(data.action == "update"){
            const id = data.id;
            const msg = data.message;

            const p = await prisma.prisma.todo.update({
                where: {
                    id
                },
                data:{
                    name: msg
                }
            });

            if(!p){
                mSend(ws, {message: "server side error"});
            }
            else{
                mSend(ws, {action: "update", message: "Todo updated succesfully", todo: p});
            }
        }
        else if(data.action == "toggle"){
            const id = data.id;
            const updatedTodo = await prisma.prisma.$executeRaw`
                                UPDATE "todo"
                                SET "done" = NOT "done"
                                WHERE "id" = ${id}
                                RETURNING *;
`;

            console.log("updatedTodo: "+ updatedTodo);
            if(!updatedTodo){
                mSend(ws, {message: "server side error"});
            }
            else{
                mSend(ws, {action: "togglem", message: "Todo updated succesfully", id: id });
            }
        }
        else if(data.action == "delete"){
            const id = data.id;
            const p = await prisma.prisma.todo.delete({
                where:{
                    id
                }
            });
            if(!p){
                mSend(ws, {message: "server side error"});
            }
            else{
                mSend(ws, {action: "delete", message: "Todo updated succesfully", id: p.id});
            }
        }
    })
})



function validateData(message:RawData){
    try{
        const data = JSON.parse(String(message));
        return data;
    }
    catch{
        return false;
    }
}

function mSend(client:WebSocket, message: Object){
        const data = JSON.stringify(message);
        client.send(data);
}


interface messageInterface{
    id: string,
    action:string
}

function checkPayload(data:any) {
    if(!(typeof data === 'object' && 
           data !== null && 
           typeof data.id === 'string' && 
           typeof data.action === 'string')){
            return false;
           }

    if(data.action == "update"){
        if(!data.action || typeof data.message != "string")return false;
    }
    return true;
}



