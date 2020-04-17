#!/usr/bin/env node
const cli_qsrv = require('./cjs/cli_qsrv.cjs')
cli_qsrv
  .qsrv_main(process.argv.slice(2), process.env)
  .then(cli_qsrv.show_banner)
