#!/usr/bin/env node
const qsrv_sevrer = require('qsrv')

qsrv_sevrer({
  port: 8080,
  lsdir: ['./docs'],
}).then(spa => {
  spa.log_changed()
  console.log( spa.qsrv_banner() )
})

