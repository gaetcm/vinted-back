const express = require("express");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

const fileUpload = require("express-fileupload");

const isAuthenticated = require("../middlewares/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");

const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // console.log("je passe");
      console.log(req.user);
      //   console.log(req.body);
      //   console.log(req.files);
      //   const title = req.body.title;
      //   const description = req.body.description;

      const { description, price, condition, city, brand, size, color, title } =
        req.body;
      const picture = req.files.picture;

      const cloudinaryResponse = await cloudinary.uploader.upload(
        convertToBase64(picture)
      );
      //   console.log(cloudinaryResponse);

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        product_image: cloudinaryResponse,
        owner: req.user,
      });

      await newOffer.save();

      //   await newOffer.populate("owner", "account");

      res.status(201).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    console.log(req.query);
    // const title = req.query.title;
    const { title, priceMin, priceMax, sort, page } = req.query;
    // console.log(priceMin);

    const filters = {
      // product_name: new RegExp(title, "i"),
      // product_price: { $gte: priceMin },
    };

    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMin) {
      filters.product_price = { $gte: priceMin };
      // console.log(filters);
    }

    if (priceMax) {
      if (priceMin) {
        filters.product_price.$lte = priceMax;
      } else {
        filters.product_price = { $lte: priceMax };
      }

      // console.log(filters);
    }

    const sorter = {};

    if (sort === "price-asc") {
      sorter.product_price = "asc";
    } else if (sort === "price-desc") {
      sorter.product_price = "desc";
    }

    let skip = 0;

    // 5 résultats par page. Page 1 => skip = 0 ;;;;;; Page 2 => skip = 5 ;;;;;;; Page 3 => skip = 10
    // 3 résultats par page. Page 1 => skip = 0 ;;;;;; Page 2 => skip = 3 ;;;;;;; Page 3 => skip = 6

    if (page) {
      skip = (page - 1) * 5;
    }
    // console.log(skip);

    console.log(filters);
    // console.log(sorter);
    const offers = await Offer.find(filters)
      .sort(sorter)
      .skip(skip)
      .limit(5)
      .populate("owner", "account");
    // .select("product_name product_price");

    const count = await Offer.countDocuments(filters);
    // const count = result.length;

    res.json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const offer = await Offer.findById(id).populate("owner", "account");
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// router.get("/offers", async (req, res) => {
//   try {
// REGEXP FIND
// const regExp = /pantalon/i; // Permet de créer une RegExp

// const regExp = new RegExp("pantalon", "i"); // Permet de créer une RegExp
// console.log(regExp);

// Je vais chercher dans la collection Offer, toutes les offres dont la clef product_name contient "pantalon"
// const offers = await Offer.find({ product_name: regExp }).select(
//   "product_name product_price"
// );

// FIND AVEC FOURCHETTE DE PRIX
// Je veux toutes les offres dont la clef price est comprise entre 50 et 100
// const offers = await Offer.find({
//   //   product_name: regExp,
//   product_price: {
//     $lte: 100,
//     $gte: 50,
//   },
// }).select("product_name product_price");

// $gte   >= greater than or equal
// $lte   <= lower than or equal
// $gt    > greater than
// $lt    < lower than

// SORT
// Je vais chercher dans la collection Offer, toutes les offres et je les veux triées par clef product_price décroissante

// const offers = await Offer.find()
//   .sort({
//     product_price: -1,
//   })
//   .select("product_name product_price");

//   Croissant : asc, ascending ou 1
// Décroissant : desc, descending ou -1

// SKIP ET LIMIT
// Je vais chercher dans la collection Offer, ignorer 15 offres et renvoyer 5 offres
// const offers = await Offer.find()
//   .select("product_name product_price")
//   .skip(15)
//   .limit(5);

// ON PEUT TOUT CHAINER
//     const offers = await Offer.find({
//       product_name: new RegExp("pantalon", "i"),
//       product_price: { $gte: 500, $lte: 1000 },
//     })
//       .sort({ product_price: "asc" })
//       .skip(0)
//       .limit(10)
//       .select("product_price product_name");

//     res.json(offers);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

module.exports = router;
