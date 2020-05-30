const express = require('express')
const router = express.Router()
const mysql = require('mysql')

var pool = mysql.createPool({
  connectionLimit: 20,
  host: '185.201.11.108',
  user: 'u769424938_fredy',
  password: 'fredy23',
  database: 'u769424938_publiso'
})

router.use('/admin/', (peticion, respuesta, siguiente) => {
  if (!peticion.session.usuario) {
    peticion.flash('mensaje', 'Debe iniciar sesión')
    respuesta.redirect("/inicio")
  }
  else {
    siguiente()
  }
})


module.exports = router
