const express = require("express");
const app = express();

app.use("/", require("./router"))

app.use(express.urlencoded({extended:false}));
app.use(express(express.json))

app.listen(5000, () => {
  console.log("Servidor Corriendo en http://localhost:5000");
});
