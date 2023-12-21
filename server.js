const stripe = require("stripe")(
  "sk_test_51Nmp0aDBoEL4nVgEyYWg4Hf1QPzcm4EmME8hO10R1UV5q7Hycc67W1VkbTppXTDJ5EMLDPI1K08IMxWVfPpVgM4L00e5Ra0Iuk"
);

// Test mode
// const stripe = require('stripe')('sk_test_51NlUc8H8UpWaisRsh6LOhRnXRykn8FNZO0CLYoLRlOWWBTViBq0buaxCpyB5iR3WHSO7uWUGcmxOEg6c303sIA4G00qVkx4wRP');

// Real Use
// const stripe = require('stripe')('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');

const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
// const config = require('config');

const Block = require("./models/Blocks");

const app = express();
const YOUR_DOMAIN = "http://localhost:3000/buy";
// const YOUR_DOMAIN = 'http://talysis15.co.uk/buy';

const priceID = "price_1Nmp4hDBoEL4nVgEsJyZtbEk";

//Test Mode
// const priceID = 'price_1Nmi9FH8UpWaisRscayjkLmi';

// Real Use
// const priceID = 'price_1NnQz7H8UpWaisRsFFvk6vdj';

connectDB();

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

// app.use('/api/block', require('./routes/api/block'));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
app.use(bodyParser.json({ limit: "50mb" }));

// var blockIDs;

const handleDownload = async (historyData) => {
  let persons = [];
  let k = 0;
  for (let i = historyData?.length - 1; i >= 0; i--) {
    let person = "";
    k++;
    const id = k;
    const email = historyData[i]["email"];
    const blocks = historyData[i]["blocks"];
    const date = historyData[i]["date"];
    person =
      '{"id":"' +
      id +
      '", "email":"' +
      email +
      '", "blocks":"' +
      blocks +
      '", "date":"' +
      date +
      '"}';
    persons.push(JSON.parse(person));
  }
  // console.log('person', persons);
  const worksheet = XLSX.utils.json_to_sheet(
    JSON.parse(JSON.stringify(persons))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  //let buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  //XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
  XLSX.writeFile(workbook, "../../output" + k + ".xlsx");
};

app.get("/create-checkout-session", async (req, res) => {
  try {
    const blocks = await Block.find({}, "email blocks date").sort({ date: -1 });

    // console.log("gsName-------", blocks);
    res.json(blocks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post("/create-checkout-session", async (req, res) => {
  const blocks = req.body.blocks;
  const blockNum = blocks.length;

  const blockIDs = req.body.blocks;
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: priceID,
        quantity: blockNum,
      },
    ],
    mode: "payment",
    success_url: `${YOUR_DOMAIN}?success=true`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
    metadata: {
      blockIDs: JSON.stringify(blockIDs),
    },
  });

  const sessionId = session.id;
  if (sessionId) {
    //     const customers = await stripe.customers.list({});
    //     console.log('cs', customers);
    //     customers.data.forEach(customer => {
    //         console.log(customer.email);
    //     });
    //     // retrieveSession(session.id);
    const email = session.customer_email;
    const blocks = req.body.blocks;
    //     // console.log('blocks', blocks);
    //     // console.log('res', blocks[2]);

    //     // Add email and blocks to Database
    try {
      const newBlocks = new Block({
        email: email,
        blocks: blocks,
      });

      await newBlocks.save();

      // res.json(newBlocks);
    } catch (err) {
      console.error(err.message);
      // res.status(500).send("Server Error");
    }
    res.send({ id: session.id });
  }

  // res.redirect(303, session.url);
  // res.send({
  //     sessionId: session.id,
  // });
});

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const payload = request.body;
    console.log(payload);
    if (payload.type === "checkout.session.completed") {
      const session = payload.data.object;
      // Check if the checkout session is successful
      if (session.payment_status === "paid") {
        // Handle successful checkout session
        console.log("Checkout session successful");
        // let newBlockIDs = [];
        // try {
        //     const persons = await Block.find({}, 'email blocks date').sort({ date: -1 });
        //     // console.log('blocks', persons);
        //     let soldBlockIDs = []
        //     for(let i = 0; i<data.length; i++){
        //         soldBlockIDs =[...soldBlockIDs, ...data[i]?.blocks];
        //     }

        //     for(let b = 0; b<blockIDs.length; b++){
        //         let temp = blockIDs[b];
        //         while (soldBlockIDs.includes(temp)){
        //             const rest = soldBlockIDs.length;
        //             // const randomID = Math.floor(Math.random() * (max - min + 1)) + min;
        //             const randomID = Math.floor(Math.random() * rest);
        //         }
        //     }
        //     // res.json(blocks);

        // } catch (err) {
        //     console.error(err.message);
        //     // res.status(500).send("Server Error");
        // }

        const email = session.customer_details.email;
        const blockIDs = JSON.parse(session.metadata.blockIDs);
        console.log("bb", blockIDs);
        try {
          const newBlocks = new Block({
            email: email,
            blocks: blockIDs,
          });

          await newBlocks.save();

          // res.json(newBlocks);
        } catch (err) {
          console.error(err.message);
          // res.status(500).send("Server Error");
        }

        try {
          const persons = await Block.find({}, "email blocks date").sort({
            date: -1,
          });
          // console.log('blocks', persons);
          handleDownload(persons);
          // res.json(blocks);
        } catch (err) {
          console.error(err.message);
          // res.status(500).send("Server Error");
        }
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    return response.status(200).json({ msg: "handle webhook success" });
  }
);

app.listen(4242, () => console.log("Running on port 4242"));
