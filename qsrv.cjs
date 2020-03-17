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

  '-w' (opt, tip, argv) { _concat(opt, 'reload', argv.splice(0,1)) },
  '--watch' (opt, tip, argv) { _concat(opt, 'reload', argv.splice(0,1)) },
  '--no-reload' (opt, tip, argv) { opt.reload = false },

  '--' (opt, tip, argv) { _concat(opt, 'lsdir', argv.splice(0, argv.length)) },

  '--tls' (opt, tip, argv) { assign_creds(opt, argv.shift()) },
  '--cert' (opt, tip, argv) { assign_creds(opt, argv.shift(), 'cert') },
  '--key' (opt, tip, argv) { assign_creds(opt, argv.shift(), 'key') },

  next_arg(opt, tip) { _concat(opt, 'lsdir', argv.splice(0,1)) },
}

function _concat(opt, key, rest) { return opt[key] = [... (opt[key] || []), ... rest] }


async function qsrv_main(argv = process.argv.slice(2), env = process.env) {
  const { QSRV_PORT, QSRV_TLS, QSRV_TLS_CERT, QSRV_TLS_KEY } = await env

  const opt = {
    lsdir: ['./docs'],
    port: QSRV_PORT ? +QSRV_PORT : 8080,
    ... qsrv_argv.parse(argv) }

  if (QSRV_TLS) assign_creds(opt, QSRV_TLS)
  if (QSRV_TLS_CERT) assign_creds(opt, QSRV_TLS_KEY, 'cert')
  if (QSRV_TLS_KEY) assign_creds(opt, QSRV_TLS_KEY, 'key')

  return await qsrv_sevrer(opt)
}


function _readFileOrNull(...args) { try { return readFileSync(...args) } catch (err) { return null } }
function assign_creds(opt, base, attrs) {
  const creds = opt.credentials = opt.credentials || {}

  base = path_resolve(base || '.')
  if ('string' === typeof attrs) {
    creds[attrs] = readFileSync(path_resolve(base))
    return creds
  }

  if (!attrs && '.' !== base) {
    // attempt using mkcert.dev format
    const key_fname = base.replace(/\.pem$/, '') + '-key.pem'
    const key = _readFileOrNull(key_fname)
    const cert = key ? _readFileOrNull(base) || _readFileOrNull(base+'.pem') : null
    if (cert) {
      creds.key = key
      creds.cert = cert
      return creds
    }
  }

  // if unset, attempt using cert.pem and key.pem naming convention
  if (!attrs) attrs = {cert:'cert.pem', key:'key.pem'}
  for (const key in attrs) {
    creds[key] = readFileSync(path_resolve(base, attrs[key]))
  }
  return opt.credentials = creds
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

