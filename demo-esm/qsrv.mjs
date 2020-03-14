#!/usr/bin/env node
import qsrv_sevrer from 'qsrv'

const opt = { port: 8080, lsdir: ['./docs'] }
qsrv_sevrer(opt).then(qsrv => {
  qsrv.log_changed()
  console.log( qsrv.banner() )
})
