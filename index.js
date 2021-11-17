const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cors = require('cors');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const url = "mongodb://localhost:27017/";


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000'
}));

const listExpensesOrIncomes = (catergoryType,res) => {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    let dbo = db.db("budget-app-db");
    let query = { category: catergoryType};
    const projection = { _id: 0, type: 1, value: 1 };
    dbo.collection("transactions").find(query).project(projection).toArray(function(err, result) {
      if (err) throw err;
      const sumResult = Array.from(result.reduce(
       (m, {type, value}) => m.set(type, (m.get(type) || 0) + value), new Map), ([type, value]) => ({type, value}));
      db.close();
      res.end(JSON.stringify(sumResult));
    });
  });
}

const listTransactionsValueAndDay = (categoryType,res) => {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    let dbo = db.db("budget-app-db");
    let query = { category: categoryType };
    dbo.collection("transactions").find(query).toArray(function(err, result) {
      if (err) throw err;

      let days = result.map(item => {
       let dateList = item.date.split('-');
       let day = Number(dateList[dateList.length-1]);
       let quantity = item.value;
       return {x: day, y: quantity};
      })
      
       days.sort((a, b) => parseFloat(a.x) - parseFloat(b.x));

       let map = days.reduce(function (map, e) {
         map[e.x] = +e.y + (map[e.x] || 0) 
         return map
       }, {})
       
       let dates = Object.keys(map).map(function (k) {
         return { x: k, y: map[k] }
       })
  
      db.close();
      res.end(JSON.stringify(dates));
    });
  });   
}

const listTransactions = (res) => {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    let dbo = db.db("budget-app-db");
    dbo.collection("transactions").find({}).toArray(function(err, result) {
      if (err) throw err;
      db.close();
      res.end(JSON.stringify(result));
    });
  });  
}


app.get('/listTransactions', function (req, res) {
   MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      let dbo = db.db("budget-app-db");
      dbo.collection("transactions").find({}).toArray(function(err, result) {
        if (err) throw err;
        // console.log(result)
        db.close();
        res.end(JSON.stringify(result));
      });
    });   
})


app.post('/addTransaction', function (req, res) {
   MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      let dbo = db.db("budget-app-db");
      dbo.collection("transactions").insertOne(req.body, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        db.close();
      });
    });

    listTransactions(res)  
})

app.delete('/deleteTransaction', (req, res) => {
   const { id } = req.body;

   MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      let dbo = db.db("budget-app-db");
      let query = {id: id};
      dbo.collection("transactions").deleteOne(query, function(err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        db.close();
      });
    });

    listTransactions(res)
 });

 app.get('/listExpenses', (req, res) => {
  listExpensesOrIncomes("Expense",res)
});

app.get('/listIncomes', (req, res) => {
  listExpensesOrIncomes("Income",res)
});

app.get('/listDays', function (req, res) {
  listTransactionsValueAndDay("Expense",res)  
})

app.get('/listDaysOfIncome', function (req, res) {
  listTransactionsValueAndDay("Income",res)   
})

app.get('/getSum', function (req, res) {
  MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     let dbo = db.db("budget-app-db");
     dbo.collection("transactions").find({}).toArray(function(err, result) {
       if (err) throw err;
       let sum = 0;
        result.map(i => { i.category === 'Income' ? sum += i.value : sum -= i.value})
       db.close();
       res.end(JSON.stringify(sum));
     });
   });   
})


const server = app.listen(3001, function () {
   const host = server.address().address
   const port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})