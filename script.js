
import express from "express";
const app=express();
const port=3000;

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));

app.get("/",(req,res)=>{
    res.render("index.ejs");
});

app.listen(port,()=>{
    console.log("Running at port "+port);
});