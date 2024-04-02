const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");
const isAuthenticated = require("../middlewares/isAuthenticated");

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    console.log("Je suis dans la route !");
    // const { username, email, password, newsletter } = req.body;

    // le username n'est pas renseigné
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).json("Missing parameters");
    }

    // l'email renseigné lors de l'inscription existe déjà dans la base de données
    const existingUser = await User.findOne({ email: req.body.email });
    if (!existingUser) {
      // générer un salt :
      const salt = uid2(16);
      // générer un hash
      const hash = SHA256(req.body.password + salt).toString(encBase64);
      const token = uid2(32);

      const newUser = new User({
        email: req.body.email,
        account: {
          username: req.body.username,
        },
        newsletter: req.body.newsletter,
        token: token,
        hash: hash,
        salt: salt,
      });

      await newUser.save();

      const responseObject = {
        _id: newUser._id,
        token: newUser.token,
        account: {
          username: newUser.account.username,
        },
      };

      return res.status(201).json(responseObject);
    } else {
      return res.status(409).json("Cet email est déjà utilisé");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    console.log(req.body);
    // on doit récupérer le salt et la hash du user correspondant au mail :
    const userFound = await User.findOne({ email: req.body.email });
    console.log(">>>>", userFound);

    if (!userFound) {
      return res.status(401).json("Email ou password incorrect");
    }
    // on va rajouter le salt récupéré dans la BDD, et hash le tout, puis comparer le nouveau hash généré avec celui enregistré en BDD

    const newHash = SHA256(req.body.password + userFound.salt).toString(
      encBase64
    );
    if (newHash === userFound.hash) {
      // alors le password était bon
      const responseObject = {
        _id: userFound._id,
        token: userFound.token,
        account: {
          username: userFound.account.username,
        },
      };
      return res.status(200).json(responseObject);
    } else {
      return res.status(401).json("Email ou password incorrect");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
