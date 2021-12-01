import mongodb from "mongodb";
const MongoClient = mongodb.MongoClient;
const url = "mongodb://localhost:27017/";

const listExpensesOrIncomes = async (catergoryType) => {
    const client = await MongoClient.connect(url, {
            useNewUrlParser: true
        })
        .catch(err => {
            console.log(err);
    });

    if (!client) {
        return;
    }

    try {
        const db = client.db("budget-app-db");
        let collection = db.collection("transactions");
        const query = { category: catergoryType};
        const projection = { _id: 0, type: 1, value: 1 };

        let res = await collection.find(query).project(projection).toArray();
        return Array.from(res.reduce(
                    (m, {type, value}) =>
                    m.set(type, (m.get(type) || 0) + value), new Map), ([type, value]) =>
                    ({type, value}));     
    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }
}
 

export { listExpensesOrIncomes }