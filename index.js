var express = require('express');
var app = express();
var fs = require("fs");
const bodyParser = require("body-parser");
const cors = require('cors');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = "mongodb://localhost:27017/";

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000'
}));


app.get('/listTransactions', function (req, res) {
   MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("budget-app-db");
      dbo.collection("transactions").find({}).toArray(function(err, result) {
        if (err) throw err;
        console.log(result)
        db.close();
        res.end(JSON.stringify(result));
      });
    });   
})


app.post('/addTransaction', function (req, res) {
   MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("budget-app-db");
      dbo.collection("transactions").insertOne(req.body, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        db.close();
      });
    });

    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("budget-app-db");
      dbo.collection("transactions").find({}).toArray(function(err, result) {
        if (err) throw err;
        db.close();
        res.end(JSON.stringify(result));
      });
    });    
})

app.delete('/deleteTransaction', (req, res) => {
   const { id } = req.body;

   MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("budget-app-db");
      var myquery = {id: id};
      dbo.collection("transactions").deleteOne(myquery, function(err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        db.close();
      });
    });

    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("budget-app-db");
      dbo.collection("transactions").find({}).toArray(function(err, result) {
        if (err) throw err;
        db.close();
        res.end(JSON.stringify(result));
      });
    });    
 });

 app.get('/listExpenses', (req, res) => {
   MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("budget-app-db");
      var query = { category: "Expense"};
      const projection = { _id: 0, type: 1, value: 1 };
      dbo.collection("transactions").find(query).project(projection).toArray(function(err, result) {
        if (err) throw err;
        const sumResult = Array.from(result.reduce(
         (m, {type, value}) => m.set(type, (m.get(type) || 0) + value), new Map), ([type, value]) => ({type, value}));
        db.close();
        res.end(JSON.stringify(sumResult));
      });
    });
});

app.get('/listIncomes', (req, res) => {
   MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("budget-app-db");
      var query = { category: "Income" };
      const projection = { _id: 0, type: 1, value: 1 };
      dbo.collection("transactions").find(query).project(projection).toArray(function(err, result) {
        if (err) throw err;
        const sumResult = Array.from(result.reduce(
         (m, {type, value}) => m.set(type, (m.get(type) || 0) + value), new Map), ([type, value]) => ({type, value}));
        
        db.close();
        res.end(JSON.stringify(sumResult));
      });
    });
});

app.get('/listDays', function (req, res) {
  MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("budget-app-db");
     var query = { category: "Expense" };
     dbo.collection("transactions").find(query).toArray(function(err, result) {
       if (err) throw err;
       
       let days = []
        for (let i=0; i< result.length;i++){
            let dateList = result[i].date.split('-');
            let day = Number(dateList[dateList.length-1]);
            let quantity = result[i].value;
            days.push({x: day, y: quantity});
        }

        days.sort((a, b) => parseFloat(a.x) - parseFloat(b.x));

        var map = days.reduce(function (map, e) {
          map[e.x] = +e.y + (map[e.x] || 0) 
          return map
        }, {})
        
        var result = Object.keys(map).map(function (k) {
          return { x: k, y: map[k] }
        })

        console.log(result);
      
       db.close();
       res.end(JSON.stringify(days));
     });
   });   
})


var server = app.listen(3001, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})