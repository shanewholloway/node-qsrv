#!/usr/bin/env node
const {resolve: path_resolve} = require('path')
const {readFileSync} = require('fs')
const qsrv_sevrer = require('qsrv')

const qsrv_argv = {
  parse(argv) {
    const opt = {}
    argv = Array.from(argv)
    while (argv.length) {
      const tip = argv.shift()
      if (tip.startsWith('-'))
        this[tip](opt, tip, argv)
      else this.next_arg(opt, tip)
    }
    return opt
  },

  '--root' (opt, tip, argv) { opt.root = argv.shift() },
  '-f' (opt, tip, argv) { opt.fallback = argv.shift() },
  '--fallback' (opt, tip, argv) { opt.fallback = argv.shift() },
  '--port' (opt, tip) { opt.port = + argv.shift() },
  '--listen' (opt, tip) { opt.listen_addr = argv.shift() },

  '--' (opt, tip, argv) {
    opt.lsdir = [ ... (opt.lsdir || []), ... argv.splice(0, argv.length) ]
  },

  '--tls' (opt, tip, argv) { assign_creds(opt, argv.shift()) },
  '--cert' (opt, tip, argv) { assign_creds(opt, argv.shift(), 'cert') },
  '--key' (opt, tip, argv) { assign_creds(opt, argv.shift(), 'key') },

  next_arg(opt, tip) {
    opt.lsdir = [ ... (opt.lsdir || []), tip ]
  },
}


async function qsrv_main(argv = process.argv.slice(2), env = process.env) {
  const { QSRV_PORT, QSRV_TLS, QSRV_TLS_CERT, QSRV_TLS_KEY } = await env

  const opt = {
    lsdir: ['./docs'],
    port: QSRV_PORT ? +QSRV_PORT : 8080,
    ... qsrv_argv.parse(argv) }

  if (QSRV_TLS) assign_creds(opt, QSRV_TLS)
  if (QSRV_TLS_CERT) assign_creds(opt, '.', QSRV_TLS_KEY, 'cert')
  if (QSRV_TLS_KEY) assign_creds(opt, QSRV_TLS_KEY, 'key')

  console.log(process.argv, opt)
  return await qsrv_sevrer(opt)
}


function assign_creds(opt, base, attrs={cert:'cert.pem', key:'key.pem'}) {
  base = path_resolve(base || '.')
  attrs = {... attrs}
  for (const key in attrs)
    attrs[key] = readFileSync(path_resolve(base, attrs[key]))

  return opt.credentials = Object.assign(
    {}, opt.credentials, attrs)
}


function show_banner(qsrv) {
  qsrv.log_changed()
  console.log( qsrv.banner() )
}


module.exports = exports = qsrv_main
Object.assign(exports, {
  main: qsrv_main, qsrv_main, qsrv_argv,
  show_banner, assign_creds, 
})

if (module === require.main) {
  qsrv_main().then(show_banner)
}

