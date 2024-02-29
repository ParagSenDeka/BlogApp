
import express from "express";
const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const data = [
    {
        title: "Why sleeping is important",
        time: "28-02-2024",
        description: "Sleeping 8 hours everyday is important for men of age 18 or above, it's always recommended to maintain at least 8 hours of sleep everyday",
        author: "Parag"
    },
    {
        title: "Why eating is important",
        time: "27-02-2024",
        description: "eating 8 hours everyday is important for men of age 18 or above, it's always recommended to maintain at least 8 hours of food everyday",
        author: "Parag"
    }
]

let length=2;
let i=0;

app.get("/", (req, res) => {
    res.render("index.ejs", { data: data });
});

app.get("/edit/:index",(req,res)=>{
    const index=req.params.index;
    console.log(index);
    res.render("modify.ejs");
});

app.get("/new",(req,res)=>{

});

app.post("/submit",(req,res)=>{
    // Here will be some code
    res.render("index.ejs",{data:data});
});


app.listen(port, () => {
    console.log("Running at port " + port);
});