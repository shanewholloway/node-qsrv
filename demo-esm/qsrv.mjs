#!/usr/bin/env node
import qsrv_sevrer from 'qsrv'

qsrv_sevrer({
  port: 8080,
  lsdir: ['./docs'],
}).then(spa => {
  spa.log_changed()
  console.log( spa.qsrv_banner() )
})

