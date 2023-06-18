const express = require('express')
const app = express()
const cors = require("cors");
const mongoose = require('mongoose')
const path = require('path')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crud-app'
mongoose.connect(MONGO_URI).then(response => console.log('MongoDB has been connected..')).catch(err => console.log('MongoDB Error : ', err))
const PORT = process.env.PORT || 5000

const userSchema = mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    jobTitle: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true })

let userHandler = mongoose.model('Users', userSchema)

app.use(cors());

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.post('/api/verifylogin', (req, res) => {
    userHandler.findOne({ email: req.body.email }).exec().then(user => {
        user = user.toObject()
        req.body.password == user.password ? res.json({ isValidUser: 'true' }) : res.json({ isValidUser: 'false', message: 'Wrong Password' })
    }).catch(err => res.json({ isValidUser: 'false', message: 'Invalid Email' }))
})

app.route('/api/users')
    .get(async (req, res) => {
        userHandler.find({}).exec().then(users => {
            users = users.map(x => x.toObject())
            res.json(users)
        }).catch(err => res.json({ message: err }))
        // let response = await userHandler.find({}).exec()
        // res.json(response.map(document => document.toObject()))
    })
    .post(async (req, res) => {
        const newUserEmail = req.body.email
        //checking whether any user with this id already exists or not
        userHandler.findOne({ email: newUserEmail }).exec().then(response => {
            if (response) {
                res.json({ message: 'User with this Email-Id already exists', success: 'no' })
            } else {
                userHandler.create({ ...req.body }).then(() => res.json({ message: 'User added to DB successfully', success: 'yes' })).catch(err => res.json({ message: err }))
            }
        }).catch(err => res.json({ message: err }))

        // userHandler.create({...req.body}).then(()=>res.json({ message: 'User added to DB successfully' })).catch(err=>res.json({ message: err }))
    })

app.route('/api/users/:id')
    .get((req, res) => {
        userHandler.findOne({ _id: req.params.id }).exec().then(response => res.json(response.toObject())).catch(err => res.status(400).json({ ErrorMessage: 'User doesn\'t exist' }))
    })
    .patch((req, res) => {
        let user2update = {}

        userHandler.findOne({ _id: req.params.id }).exec().then(user => {
            user2update = user.toObject()
            userHandler.findByIdAndUpdate({ _id: req.params.id }, { ...user2update, ...req.body }, { new: true }).exec().then(updatedUser => res.json({ message: `User named ${user2update.userName} updated successfully with ${JSON.stringify(req.body)}` }))
        }).catch(err => res.status(400).json({ message: `Since User doesn't exist, updation wasn't possible` }))

    })
    .delete(async (req, res) => {
        userHandler.findByIdAndDelete({ _id: req.params.id }).exec().then(deletedUser => res.json({ message: `User named ${deletedUser.userName} deleted successfully..` })).catch(err => res.status(400).json({ message: `Since User doesn't exist, deletion wasn't possible` }))
    })

app.use(express.static(path.join(__dirname, './frontend/build/')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, './frontend/build/index.html')))
app.listen(PORT, () => console.log('Server started!'))
