
const express = require('express')
const aplicacion = express()
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('express-flash')
const fileUpload = require('express-fileupload')
const path = require('path')
const PORT = process.env.PORT || 80
const rutasMiddleware = require('./routes/middleware')
const rutasPublicas = require('./routes/publicas')
const rutasPrivadas = require('./routes/privadas')

aplicacion.use(bodyParser.json())
aplicacion.use(bodyParser.urlencoded({ extended: true }))
aplicacion.use(session({ secret: 'token-muy-secreto', resave: true, saveUninitialized: true }));
aplicacion.use(flash())
aplicacion.set('view engine', 'ejs')
aplicacion.use(express.static('public'))
aplicacion.use(fileUpload())


aplicacion.use(rutasMiddleware)
aplicacion.use(rutasPublicas)
aplicacion.use(rutasPrivadas)
/*
express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .listen(PORT, () => console.log(`Servidor iniciado on ${ PORT }`))
*/
  aplicacion.listen(PORT, function(){
    console.log(`Servidor iniciado on ${ PORT }`)
  })
  