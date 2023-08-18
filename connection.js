const mongoose=require('mongoose')



  const DB = "mongodb+srv://prashantsisodia08:prashant@cluster0.tz8imch.mongodb.net/ps"
   mongoose.connect(DB, {
    useNewUrlParser: true,
   useUnifiedTopology: true,
   }).then(() => {
 console.log('Connected to MongoDB Atlas');
  }).catch((error) => {
 console.log('Error connecting to MongoDB Atlas:', error);
  });


