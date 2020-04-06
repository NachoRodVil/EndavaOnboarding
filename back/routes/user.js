const passport = require('../passport/passport');
const express = require('express');
const { User, Discipline, Recruit } = require("../models/index")
const router = express.Router();
const nodemailer = require("nodemailer");
require('dotenv').config();
const hbs = require('nodemailer-express-handlebars');
const Sequelize = require("sequelize")




//-------------------> Config. Mail
const sendMail = function (name, lastName, email) {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "endavaOnBoard@gmail.com",
            pass: "onboard123"
        }
    });

    // transporter.use("compile", hbs({
    //     viewEngine: {
    //         extName: '.hbs',
    //         partialsDir: '../views/',
    //         defaultLayout: false
    //     },
    //     viewPath: '../views/',
    //     extName: ".hbs"
    // }))


    const mailOptions = {
        from: "endavaOnBoard@gmail.com",
        to: `${email}`,
        subject: `Wellcome On Board ${name} ${lastName}!!!`,
        text:
            ` Wellcome On Board ${name} ${lastName}!!!

         Your user has been successfully created with the email: ${email}, from
         now on you'll be able to manage all the tasks assigned to you regarding to new hires

         We hope you find this tool useful. Thank you very much for giving
         it a try!!! :)

        `
        // template: "wellcome",
        // context: {
        //     name: `${name}`,
        //     lastName: `${lastName}`,
        //     email: `${email}`
        // }
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log("Se ha enviando el mail");
        }
    });
}
//------------------------->




const loggedUser = function (req, res, next) {
    if (req.isAuthenticated()) {
        res.json(req.user)
    } else {
        res.json("")
    }
}

router.post("/register", function (req, res) {
    User.create({
        name: req.body.name,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password
    })
        .then(nuevoUser => {
            nuevoUser.setDiscipline(req.body.disciplineId)
        })
        .then((data) => {
            sendMail(req.body.name, req.body.lastName, req.body.email)
            res.status(200).json("the user was created and the email was sent")
        })
        .catch(err => console.log(err)
        )
})

router.post('/login', passport.authenticate('local'), (req, res) => {
    res.send(req.user)
})

router.get("/logout", function (req, res) {
    req.logout()
    res.send('deslogueado!')
})

router.get("/check", loggedUser)

/*
<<<<<<< Este es el midelware de passport que vamos a usar mas adelante >>>>>>>

function isLogedIn(req, res, next) {
    if (req.session.passport.user) {
        next();
    } else {
        console.log("no se logueo")
    }
}

*/

router.get("/allUsers", (req, res) => {
    const Op = Sequelize.Op
    if (req.query.s) {
        User.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.iLike]: `%${req.query.s}%` } },
                    { lastName: { [Op.iLike]: `%${req.query.s}%` } }
                ]
            },
            include: [
                { model: Discipline }
            ]
        })
            .then(users => res.status(200).json(users))
    } else {
        User.findAll({
            include: [
                { model: Discipline }
            ]
        })
            .then(users => res.status(200).json(users))
    }
})

router.get("/findUser", (req, res) => {
    User.findAll({
        include: [
            { model: Discipline }
        ]
    })
        .then(users => res.status(200).json(users))
})

router.put("/changeProfile/:id", (req, res, next) => {
    const id = req.params.id
    const newProfile = !req.body.profile
    User.update({ isAdmin: newProfile }, { where: { id } })
        .then(() => User.findAll({
            include: [
                { model: Discipline }
            ]
        }))
        .then(users => res.status(200).json(users))
        .catch(next)
})

router.put("/:id", (req, res, next) => {
    const id = req.params.id
    const newUserId = req.body.newUserId
    Recruit.update({ userId: newUserId }, { where: { userId: id } })
        .then(recruitUp => res.status(200).json(recruitUp))
        .catch(next)
})

router.delete("/:id", (req, res, next) => {
    User.findByPk(req.params.id)
        .then(user => {
            if (user) {
                user.destroy()
                    .then(() => res.sendStatus(204))
            } else {
                res.sendStatus(404)
            }
        })
        .catch(err => res.sendStatus(500))
})




module.exports = router;
