const express = require('express');
const db = require("../data/dbConfig");

const router = express.Router();

router.get('/', (req, res) => {
    var sortby;
    var sortdir;
    var queryLimit;

    !req.query.sortby? sortby = "id" : sortby = req.query.sortby;
    !req.query.sortdir? sortdir= "desc" : sortdir = req.query.sortdir;
    !req.query.limit? queryLimit = "5" : queryLimit = req.query.limit;

    db.select("*")
        .from("accounts")
        .orderBy(sortby, sortdir)
        .limit(queryLimit)
        .then(accounts => {
            res.status(200).json({ data: accounts });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: "Error retrieving list of accounts." })
        })
})

router.get('/:id', (req, res) => {
    db("accounts")
        .where({ id: req.params.id })
        .first()
        .then(account => {
            if (account) {
                res.status(200).json({ data: account });
            } else {
                res.status(404).json({ message: "No account by that ID." })
            }
        })
        .catch(error => {
            console.log(error)
            res.status(500).json({ message: "Error retrieving account with specified ID." })
        })
})

router.post('/', validateAccountId, (req, res) => {
    const { name, budget } = req.body;

    db("accounts")
        .insert({ name, budget }, "id")
        .then(([id]) => {
            db("accounts")
                .where({ id: id })
                .first()
                .then(newAccount => {
                    if (newAccount) {
                        res.status(200).json({ data: newAccount })
                    } else {
                        res.status(404).json({ message: "Newly created account was not found." })
                    }
                })
                .catch(error => {
                    console.log({ error })
                    res.status(500).json({ message: "Error finding newly created account." })
                })
        })
        .catch(error => {
            console.log({ error })
            res.status(500).json({ message: "Error creating new account." })
        })
})

router.put('/:id', validateAccountId, (req, res) => {
    const { name, budget } = req.body;
    const { id: accountId } = req.params;

    db("accounts")
        .where({ id: accountId })
        .update({ name, budget })
        .then(count => {
            if (count) {
                db("accounts")
                    .where({ id: accountId })
                    .first()
                    .then(updatedAccount => {
                        if (updatedAccount) {
                            res.status(200).json({ data: updatedAccount })
                        } else {
                            res.status(404).json({ message: "Updated account was not found." })
                        }
                    })
                    .catch(error => {
                        console.log({ error })
                        res.status(500).json({ message: "Error finding updated account." })
                    })
            }
        })
        .catch(error => {
            console.log({ error })
            res.status(500).json({ message: "Error updating account with specified ID." })
        })
})

router.delete('/:id', (req, res) => {
    db("accounts")
        .where({ id: req.params.id })
        .del()
        .then(count => {
            if(count){
                res.status(204).end()
            } else {
                res.status(404).json({ message: "Account with specified ID was not found." })
            }
        })
        .catch(error => {
            console.log({ error })
            res.status(500).json({ message: "Error deleting account." })
        })
})

//Custom Middleware

function validateAccountId(req, res, next) {
    const { name, budget } = req.body;

    if (Object.entries(req.body).length === 0) {
        res.status(400).json({ message: "No Account Data." })
    } else if (!name || !budget) {
        res.status(400).json({ message: "Name and Budget are both required." })
    } else if (typeof budget !== "number" || budget <= 0) {
        res.status(400).json({ message: "Budget must be a number greater than zero." })
    } else {
        next();
    }
}

module.exports = router;