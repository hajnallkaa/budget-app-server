// const express = require('express');
import express from "express";
const app = express();
// const bodyParser = require("body-parser");
import bodyParser from "body-parser";
// const cors = require('cors');
import cors from "cors";
// const mongodb = require('mongodb');
import mongodb from "mongodb";
const MongoClient = mongodb.MongoClient;
const url = "mongodb://localhost:27017/";

// const database = require("./database/index.js")

import { listExpensesOrIncomes } from "./database/index.js"


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000'
}));


const listTransactionsValueAndDay = (categoryType,res) => {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    const dbo = db.db("budget-app-db");
    const query = { category: categoryType };
    dbo.collection("transactions").find(query).toArray(function(err, result) {
      if (err) throw err;

       const days = result.map(item => {
       const dateList = item.date.split('-');
       const day = Number(dateList[dateList.length-1]);
       const quantity = item.value;
       return {x: day, y: quantity};
      })
      
       days.sort((a, b) => parseFloat(a.x) - parseFloat(b.x));

       const map = days.reduce(function (map, e) {
         map[e.x] = +e.y + (map[e.x] || 0) 
         return map
       }, {})
       
       const dates = Object.keys(map).map(function (k) {
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
    const dbo = db.db("budget-app-db");
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
      const dbo = db.db("budget-app-db");
      dbo.collection("transactions").find({}).toArray(function(err, result) {
        if (err) throw err;
        db.close();
        res.end(JSON.stringify(result));
      });
    });   
})


app.post('/addTransaction', function (req, res) {
   MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      const dbo = db.db("budget-app-db");
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
      const dbo = db.db("budget-app-db");
      const query = {id: id};
      dbo.collection("transactions").deleteOne(query, function(err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        db.close();
      });
    });

    listTransactions(res)
 });

 app.get('/listExpenses', (req, res) => {
  const expenses = listExpensesOrIncomes("Expense")
  expenses.then(arr => {
    res.send(JSON.stringify(arr));
  }).catch(err => {
    console.log(err)
  })
});

app.get('/listIncomes', (req, res) => {
  const expenses = listExpensesOrIncomes("Income")
  expenses.then(arr => {
    res.send(JSON.stringify(arr));
  }).catch(err => {
    console.log(err)
  })
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
     const dbo = db.db("budget-app-db");
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