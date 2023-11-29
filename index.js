
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Json2csvParser = require("json2csv").Parser;
const fs = require("fs");

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

global.Name = "";
global.log = "Sign in to your Account";
global.qty = {};

// mongoose.connect('mongodb://127.0.0.1:27017/ProcessDB');

mongoose.connect('mongodb+srv://Hariharan_A:AVNH1268@cluster0.awnduiy.mongodb.net/ProcessDB');

const loginsSchema = new mongoose.Schema({
    Name: String,
    Email: String,
    Password: String
});

const processesSchema = new mongoose.Schema({
    ID: Number,
    Description: String,
    Process: String,
    date: String,
    Quantity: Number,
    Unit: String,
    SourceUnit: Number,
    DestinationUnit: Number,
    OB: Number,
    Issue : [{
        issueDate: String,
        Qty: Number
    }],
    Receipt : [{
        receiptDate: String,
        Qty: Number
    }]
});

const process = mongoose.model("Process", processesSchema);

const login = mongoose.model("Login", loginsSchema);

app.get("/", async (req, res) => {
    res.render("login", {log: log});
    log = "Sign in to your Account";
});

app.get("/signup", async (req, res) => {
    res.render("signup");
});

app.get("/home", async (req, res) => {
    res.render("home",{Name: Name});
});

app.get("/new", async (req, res) => {
    res.render("new");
});

app.get("/edit", async (req, res) => {
    const foundItems = await process.find({});
    res.render("edit", {items: foundItems});
});

app.get("/report", async (req, res) => {
    const foundItems = await process.find({});
    res.render("report", {items: foundItems});
});

app.get("/detail", async (req, res) => {
    res.render("detail");
});

app.get("/export", async (req, res) => {

    const data = [];
    const Data = await process.find({});

    Data.forEach((row) => {
        const { ID, Description, Process, date, Quantity, Unit, SourceUnit, DestinationUnit } = row;
        data.push({ ID, Description, Process, date, Quantity, Unit, SourceUnit, DestinationUnit });
    });

    const json2csvParser = new Json2csvParser({ header: true });
    const csvData = json2csvParser.parse(data);

    fs.writeFile("product.csv", csvData, function(error) {
        if (error) throw error;
    });

    res.redirect("/home");
});

app.get("/view", async (req, res) => {
    const Items = await process.find({});
    res.render("view", {Items: Items});
});

app.post("/login", async (req, res) => {

    const account = await login.findOne({ Email: req.body.Email })

    if (account === null) {
        log = "Account does not exist.. Try Sign up"
        res.redirect("/");
    }
    else{
        if(account.Password === req.body.Password){
            Name = account.Name;
            res.redirect("/home");
        }
        else{
            log = "Password is incorrect.."
            res.redirect("/");
        }  
    }
});

app.post("/signup", async (req, res) => {

    const login1 = new login({
        Name: req.body.Name,
        Email: req.body.Email,
        Password: req.body.Password,
    });

    Name = login1.Name;
    login1.save();
    res.redirect("/home");
});

app.post("/new", async (req, res) => {

    const foundItems = await process.find({});

    const process1 = new process({
        ID: foundItems.length + 1,
        Description: req.body.Description,
        Process: req.body.Process,
        date: req.body.date.substring(0,10),
        Quantity: req.body.Quantity,
        Unit: req.body.Unit,
        SourceUnit: req.body.Source,
        DestinationUnit: req.body.Destination,
        OB: req.body.Quantity
    });

    process1.save();
    res.redirect("/export");
});

app.post("/edit", async (req, res) => {

    const filter = { Description : req.body.Description };
    qty = await process.findOne({ Description: req.body.Description })
    var new_qty = "";
    var update ={};
    
    if( req.body.Stock  == "Issue"){
        new_qty = Number(qty.Quantity) - Number(req.body.Quantity);
        qty.Issue.push({issueDate: req.body.date.substring(0,10), Qty: req.body.Quantity});
        update = { Quantity : new_qty, Issue : qty.Issue };
    }
    if( req.body.Stock  == "Receipt"){
        new_qty = Number(qty.Quantity) + Number(req.body.Quantity);
        qty.Receipt.push({receiptDate : req.body.date.substring(0,10), Qty : req.body.Quantity});
        update = { Quantity : new_qty, Receipt : qty.Receipt };
    }

    await process.findOneAndUpdate( filter, update, {
        new: true
    });

    res.redirect("/export");
});

app.post("/report", async (req, res) => {
    
    qty = await process.findOne({ Description: req.body.Description })
    var receipt = 0;
    var issue = 0;
    qty.Receipt.forEach(function(Item){
        receipt = receipt + Item.Qty;
    });
    qty.Issue.forEach(function(Item){
        issue = issue + Item.Qty;
    });
    res.render("table", {qty: qty, receipt: receipt, issue: issue});
});


app.listen(3000, function (){
    console.log("App is listening on port 3000!");
});