const mongoose = require("mongoose");


// const uri = "mongodb+srv://bhashkar:bhashkar@cluster0.ohq4nr8.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(
  "mongodb+srv://prashantsisodia08:prashant@cluster0.tz8imch.mongodb.net/ps",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
console.log("DB connected");
