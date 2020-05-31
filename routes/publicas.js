const express = require('express')
const router = express.Router()
const mysql = require('mysql')
var path = require('path')
var nodemailer=require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user:'',
    pass:''
  }
})

/*
var pool = mysql.createPool({
  connectionLimit: 20,
  host: 'localhost',
  user: 'root',
  password: 'root23',
  database: 'publix'
})
*/
var pool = mysql.createPool({
  connectionLimit: 20,
  host: 'us-cdbr-east-05.cleardb.net',
  user: 'b93f39ee4b98a9',
  password: 'ffc09d0f',
  database: 'heroku_646df071c775756'
})

function enviarCorreoBienvenida(email, nombre){
  const opciones = {
    from: 'fredysolars@gmail.com',
    to: email,
    subject: 'Bienvenido al blog de viajes',
    text: `Hola ${nombre}`
  }
  transporter.sendMail(opciones, (error, info) => {
  });
}


router.get('/', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
      /*
    const consulta = `
      SELECT
      titulo, resumen, fecha_hora, pseudonimo, voto
      FROM publicaciones
      INNER JOIN autor
      ON publicaciones.autor_id = autor.id
      ORDER BY fecha_hora DESC
      LIMIT 5
    `
    connection.query(consulta, (error, filas, campos) => {
      respuesta.render('index', { publicaciones: filas })
    })
    connection.release()
  */
   let consulta
    let modificadorConsulta = ""
    let modificadorPagina = ""
    let pagina = 0
    let cantidaDeRegistros = 0
    const busqueda = ( peticion.query.busqueda ) ? peticion.query.busqueda : ""
    if (busqueda != ""){
      modificadorConsulta = `
        WHERE
        categoria LIKE '%${busqueda}%' OR
        nombre LIKE '%${busqueda}%' OR
        descripcion LIKE '%${busqueda}%'
      `
      modificadorPagina = ""
    }
    else{
      pagina = ( peticion.query.pagina ) ? parseInt(peticion.query.pagina) : 0
    
      if (pagina < 0){
        pagina = 0
      }
      modificadorPagina = `
        LIMIT 2 OFFSET ${pagina*2}
      `
    }
    consulta = `
      SELECT *
      FROM negocios
      ${modificadorConsulta}
      ${modificadorPagina}
    `
    connection.query(consulta, (error, filas, campos) => {
      respuesta.render('index', { negocios: filas , busqueda: busqueda,pagina: pagina})
    })
    connection.release()
    
  })
})

router.get('/registro', (peticion, respuesta) => {
  respuesta.render('registro', { mensaje: peticion.flash('mensaje') })
})

router.post('/procesar_registro', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const email = peticion.body.email.toLowerCase().trim()
    const pseudonimo = peticion.body.pseudonimo.trim()
    const contrasena = peticion.body.contrasena
    const consultaEmail = `
      SELECT *
      FROM autor
      WHERE email = ${connection.escape(email)}
    `
    connection.query(consultaEmail, (error, filas, campos) => {
      if (filas.length > 0) {
        peticion.flash('mensaje', 'Email duplicado')
        respuesta.redirect('/registro')
      }
      else {
        const consultaPseudonimo = `
          SELECT *
          FROM autor
          WHERE pseudonimo = ${connection.escape(pseudonimo)}
        `
        connection.query(consultaPseudonimo, (error, filas, campos) => {
          if (filas.length > 0) {
            peticion.flash('mensaje', 'Pseudonimo duplicado')
            respuesta.redirect('/registro')
          }
          else {
            const consulta = `
                                INSERT INTO
                                autor
                                (email, contrasena, pseudonimo)
                                VALUES (
                                  ${connection.escape(email)},
                                  ${connection.escape(contrasena)},
                                  ${connection.escape(pseudonimo)}
                                )
                              `
            connection.query(consulta, (error, filas, campos) => {
              if (peticion.files && peticion.files.avatar){
                const archivoAvatar = peticion.files.avatar
                const id = filas.insertId
                const nombreArchivo = `${id}${path.extname(archivoAvatar.name)}`
                archivoAvatar.mv(`./public/avatars/${nombreArchivo}`, (error) => {
                  const consultaAvatar = `
                                UPDATE
                                autor
                                SET avatar = ${connection.escape(nombreArchivo)}
                                WHERE id = ${connection.escape(id)}
                              `
                  connection.query(consultaAvatar, (error, filas, campos) => {
                    enviarCorreoBienvenida(email,pseudonimo)
                    peticion.flash('mensaje', 'Usuario registrado con avatar')
                    respuesta.redirect('/registro')
                  })
                })
              }
              else{
                enviarCorreoBienvenida(email,pseudonimo)
                peticion.flash('mensaje', 'Usuario registrado')
                respuesta.redirect('/registro')
              }
            })
          }
        })
      }
    })
    connection.release()
  })
})

router.get('/inicio', (peticion, respuesta) => {
  respuesta.render('inicio', { mensaje: peticion.flash('mensaje') })
})

router.post('/procesar_inicio', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT *
      FROM autor
      WHERE
      email = ${connection.escape(peticion.body.email)} AND
      contrasena = ${connection.escape(peticion.body.contrasena)}
    `
    connection.query(consulta, (error, filas, campos) => {
      if (filas.length > 0) {
        peticion.session.usuario = filas[0]
        respuesta.redirect('/admin/index')
      }
      else {
        peticion.flash('mensaje', 'Datos inválidos')
        respuesta.redirect('/inicio')
      }
    })
    connection.release()
  })
})


router.get('/negocios/:id', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT *
      FROM negocios
      WHERE id = ${connection.escape(peticion.params.id)}
    `
    connection.query(consulta, (error, filas, campos) => {
      if (filas.length > 0) {
        respuesta.render('publicacion', { publicacion: filas[0] })
      }
      else {
        respuesta.redirect('/')
      }
    })
    connection.release()
  })
})
/*
router.get('/autores', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT *
      FROM autor
      ORDER BY id DESC
    `
    connection.query(consulta, (error, filas, campos) => {
      respuesta.render('autores', { autores1: filas })
    })


    connection.release()
  })
})

*/
router.get('/autores', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT autor.id id, pseudonimo, avatar, publicaciones.id publicacion_id, titulo
      FROM autor
      INNER JOIN
      publicaciones
      ON
      autor.id = publicaciones.autor_id
      ORDER BY autor.id DESC, publicaciones.fecha_hora DESC
    `
    connection.query(consulta, (error, filas, campos) => {
      autores = []
      ultimoAutorId = undefined
      filas.forEach(registro => {
        if (registro.id != ultimoAutorId){
          ultimoAutorId = registro.id
          autores.push({
            id: registro.id,
            pseudonimo: registro.pseudonimo,
            avatar: registro.avatar,
            publicaciones: []
          })
        }
        autores[autores.length-1].publicaciones.push({
          id: registro.publicacion_id,
          titulo: registro.titulo
        })
      });
      respuesta.render('autores', { autores: autores })
    })


    connection.release()
  })
})


router.get('/publicacion/:id/votar', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT *
      FROM publicaciones
      WHERE id = ${connection.escape(peticion.params.id)}
    `
    connection.query(consulta, (error, filas, campos) => {
      if (filas.length > 0) {
        const consultaVotos = `
        UPDATE
        publicaciones
        SET voto = voto + 1
        WHERE id = ${connection.escape(peticion.params.id)}
      `
          connection.query(consultaVotos, (error, filas, campos) => {
          respuesta.redirect(`/publicacion/${peticion.params.id}`)
          //respuesta.redirect('/')
          })
      }
      else {
        peticion.flash('mensaje', 'Publicacion invalida')
        respuesta.redirect('/')
      }
    })
    connection.release()
  })
})


module.exports = router
