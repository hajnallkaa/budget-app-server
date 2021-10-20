var express = require('express');
var app = express();
var fs = require("fs");
const bodyParser = require("body-parser");
const cors = require('cors');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const pathToFile = __dirname + "/" + "transactions.json"

app.use(cors({
    origin: 'http://localhost:3000'
}));

app.get('/listTransactions', function (req, res) {
   let transactions = JSON.parse(fs.readFileSync(pathToFile));
      res.end(JSON.stringify(transactions));
})


app.post('/addTransaction', function (req, res) {
   // First read existing users.
    let transactions = JSON.parse(fs.readFileSync(pathToFile));
    transactions.push(req.body);

    fs.writeFileSync(pathToFile, JSON.stringify(transactions, null, 2), (err) => {
    if (err) throw err;
    console.log('Data written to file');
    });

    res.end(JSON.stringify(transactions)); 
})

app.delete('/deleteTransaction', (req, res) => {
   let transactions = JSON.parse(fs.readFileSync(pathToFile));
   let newTransactions = []
   const { id } = req.body;
   transactions.filter((transaction) => {
      if (transaction.id !== id) {
         newTransactions.push(transaction)
     }
   })

   fs.writeFileSync(pathToFile, JSON.stringify(newTransactions, null, 2), (err) => {
      if (err) throw err;
      console.log('Data written to file');
      });

   res.end(JSON.stringify(newTransactions));
 });


var server = app.listen(3001, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})