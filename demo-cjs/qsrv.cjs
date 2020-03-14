#!/usr/bin/env node
const qsrv_sevrer = require('qsrv')

const opt = { port: 8080, lsdir: ['./docs'] }
qsrv_sevrer(opt).then(qsrv => {
  qsrv.log_changed()
  console.log( qsrv.banner() )
})

