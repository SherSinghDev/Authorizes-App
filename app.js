const { name } = require("ejs")
const express = require("express")
const app = express()
const session = require("express-session")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
// db connection 
mongoose.connect("mongodb://localhost:27017/access")

let userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    address: String,
    role: String
})

let userModel = new mongoose.model("user", userSchema)


// view engine
app.set("view engine", "ejs")

// Middleware
app.use(express.static("./assets"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: "ha ha"
}))

app.get("/", async (req, res) => {
    console.log(req.session)
    if (req.session.userId) {
        let user = await userModel.findOne({ _id: req.session.userId })
        // console.log(user)
        let role = user.role
        let message;
        let color;
        let name = user.name
        if (role == "admin") {
            name = "Admin Sir"
            message = "What You Want To Do Today?"
            role = "admin"
            color = "green"
        }
        else if (role == "reader") {
            message = "As a reader"
            role = "reader"
            color = "lightseagreen"
        }
        else if (role == "deep") {
            message = "You Are My Life And You Are Always In My Heart"
            role = "deep"
            color = "hotpink"
        }
        res.render("index", { role, message, color, name })
    }
    else {
        res.redirect("/login")
    }
})
app.post("/newuser", async (req, res) => {
    console.log(req.body)
    let hashPassword = await bcrypt.hash(req.body.password, 10);
    console.log(hashPassword)
    const { name, email, address, role } = req.body
    const user = await userModel.create({
        name,
        email,
        address,
        password: hashPassword,
        role
    })
    console.log(user)
    res.redirect("/")
})
app.get("/login", (req, res) => {
    console.log(req.session.userId)
    if (!req.session.userId) {
        res.render("login", { message: '' })
    }
    else {
        res.redirect("/")
    }
})
app.post("/login", async (req, res) => {
    const user = await userModel.findOne({ email: req.body.email })
    if (user) {
        let role;
        console.log(user)
        let matched = await bcrypt.compare(req.body.password, user.password)

        if (matched) {
            req.session.role = user.role
            req.session.userId = user._id
            res.redirect("/")
        }
    }
    else {
        res.render("login", { message: "Something went wrong" })
    }
})
app.get("/logout", (req, res) => {
    console.log(req.session.userId, "yes")
    req.session.userId = ''
    console.log(req.session.userId)
    res.redirect("/login")
})

app.get("/users", async (req, res) => {
    if (req.session.userId) {
        let user = await userModel.findOne({ _id: req.session.userId })
        // console.log(user)
        if (user.role == "admin" || user.role == "deep") {
            let role = user.role
            let message;
            let color;
            let name = user.name
            if (role == "admin") {
                name = "Admin Sir"
                message = "What You Want To Do Today?"
                role = "admin"
                color = "green"
            }
            else if (role == "deep") {
                message = "You Are My Life And You Are Always In My Heart"
                role = "deep"
                color = "hotpink"
            }
            let allUsers = await userModel.find();
            console.log(allUsers)
            res.render("users", { role, message, color, name, allUsers })
        }
        else{
            res.redirect("/")
        }
    }
    else {
        res.redirect("/login")
    }
    // res.render("users")
})

app.listen(3000, () => {
    console.log("Listening to the port 3000....")
})

