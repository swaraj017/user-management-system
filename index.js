const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const port = 3000;
const path = require("path");

let index = 0;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "pages"));
app.use(express.static(path.join(__dirname, "public")));

const methodOverride = require("method-override");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const uri = "mongodb://localhost:27017"; // MongoDB connection string
const client = new MongoClient(uri);
let db, usersCollection;

// Connect to MongoDB and initialize the collection
async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db('delta'); // Replace 'delta' with your database name
        usersCollection = db.collection('user'); // Replace 'user' with your collection name
        console.log('Connected to MongoDB');

        // Start the server only after a successful connection
        app.listen(port, () => {
            console.log("Server running on port", port);
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }
}

// Call the function to connect to the database
connectToDatabase();

const { faker } = require('@faker-js/faker');

// Get all users
app.get("/home", async (req, res) => {
    try {
        const result = await usersCollection.find({}).toArray();
        console.log(result);
        index++;
        res.render("home", { result, index });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Get a user to edit
app.get("/home/:id/edit", async (req, res) => {
    const id = req.params.id;
    try {
        const result = await usersCollection.findOne({ id });
        console.log(result);
        res.render("edit", { result }); // result should be a single user object
    } catch (err) {
        console.error('Error fetching user for edit:', err);
        res.status(500).send('Internal Server Error');
    }
});


// Update a user
app.patch("/home/:id", async (req, res) => {
    const { id } = req.params;
    const { pass: formPass, username: newUsername } = req.body;

    console.log('Request Body:', req.body);

    try {
        const user = await usersCollection.findOne({ id });
        console.log("user is ", user);

        // Compare the passwords
        if (formPass !== user.pass) {
            return res.send('Wrong pass');
        }

        await usersCollection.updateOne({ id }, { $set: { username: newUsername } });
        res.redirect("/home");
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Render new user page
app.get("/home/new", (req, res) => {
    const newid = () => ({ Id: faker.string.uuid() });
    const newuser = newid();
    res.render("new", { newuserid: newuser.Id });
});

// Create a new user
app.post("/home/new/:id", async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    console.log(id, data);
    const newUser = { id, username: data.username, email: data.email, pass: data.password };

    try {
        await usersCollection.insertOne(newUser);
        console.log('Executed successfully');
        res.redirect("/home");
    } catch (err) {
        console.error('Error creating new user:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Render delete confirmation page
app.get("/home/:id/delete", async (req, res) => {
    const id = req.params.id;

    try {
        const user = await usersCollection.findOne({ id: id }); // Fetch a single user by ID
        if (user) {
            res.render("delete", { results: [user] }); // Pass an array with the user
        } else {
            res.status(404).send("User not found");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


// Delete a user
app.post("/home/delete/:id", async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    console.log(data);

    try {
        const user = await usersCollection.findOne({ id });
        console.log("Delete user is -> ", user);

        if (data.email === user.email && data.password === user.pass) {
            await usersCollection.deleteOne({ id });
            console.log("Deleted user =", id);
            index--;
            res.redirect("/home");
        } else {
            res.send("not match");
        }
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Internal Server Error');
    }
});

console.log("ok");
