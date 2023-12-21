const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BlockSchema = new Schema({
  email: {
    type: String,
  },
  blocks: {
    type: Object,
  },
  cardID: {
    type: String,
  },
  country: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Block = mongoose.model("block", BlockSchema);
