#!/usr/bin/env node
const {version} = require('./package.json')
const {resolve: path_resolve} = require('path')
const {readFileSync} = require('fs')
const qsrv_sevrer = require('qsrv')

const help = {
  '--root': ['[PATH]', 'set the root path for file serving', '.'],
  '-f': 'alias for --fallback',
  '--fallback': ['[index.html]', 'set the fallback html file', 'index.html'],
  '--no-fallback': 'disable fallback html file',

  ' 0 ': true,

  '--no-reload': 'disable reload watching',
  '-w': 'alias for --watch',
  '--watch': ['[PATH]', 'watch the path for changes', '{root}'],
  '--': ['[... PATHS]', 'watch each path in the remaining arguments'],

  ' 1 ': true,

  '-p': 'alias for --port',
  '--port': ['[PORT]', 'set the listening port', 8080],
  '--listen': ['[IP4-ADDR]', 'set the default listing address', '0.0.0.0'],

  ' 2 ': true,

  '--tls': ['[PATH]', 'set the TLS path per convention. (See https://mkcert.dev)'],
  '--cert': ['[PEM-FILE]', 'set the TLS public certificate path'],
  '--key': ['[PEM-FILE]', 'set the TLS private key path'],
}

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

  '--help' (otp, tip, argv) {
    const topic_list = 0 !== argv.length ? argv : Object.keys(help)

    let output = [], max_dfn=0
    for (let topic of topic_list) {
      if (' ' === topic[0]) {
        output.push({})
        continue
      }

      if ('-' !== topic[0])
        topic = help['-'+topic] ? '-'+topic
          : '--'+topic

      const info = help[topic]
      let dfn=`${topic}`, msg

      if (!info) {
        msg = `No help for unknown option "${topic}"`
      } else if (Array.isArray(info)) {
        dfn += ` ${info[0]}`
        msg = info[1]
        if (undefined !== info[2])
          msg += ` (default ${info[2]})`

      } else if ('string' === typeof info) {
        msg = info
      }

      max_dfn = Math.max(max_dfn, dfn.length)
      output.push({dfn, msg})
    }

    console.log()
    console.log(`Quick Dev Server (qsrv v${version}) options:`)
    console.log()
    for (const {dfn, msg} of output) {
      if (dfn)
        console.log(`  ${dfn.padEnd(1+max_dfn,' ')} ${msg}`)
      else console.log()
    }
    console.log()
    console.log()
    process.exit(0)
  },

  '--root' (opt, tip, argv) { opt.root = argv.shift() },
  '-f' (opt, tip, argv) { opt.fallback = argv.shift() },
  '--fallback' (opt, tip, argv) { opt.fallback = argv.shift() },
  '--no-fallback' (opt, tip, argv) { opt.fallback = null },
  '-p' (opt, tip, argv) { opt.port = + argv.shift() },
  '--port' (opt, tip, argv) { opt.port = + argv.shift() },
  '--listen' (opt, tip, argv) { opt.listen_addr = argv.shift() },

  '-w' (opt, tip, argv) { _concat(opt, 'reload', argv.splice(0,1)) },
  '--watch' (opt, tip, argv) { _concat(opt, 'reload', argv.splice(0,1)) },
  '--' (opt, tip, argv) { _concat(opt, 'reload', argv.splice(0, argv.length)) },
  '--no-reload' (opt, tip, argv) { opt.reload = false },

  '--tls' (opt, tip, argv) { assign_creds(opt, argv.shift()) },
  '--cert' (opt, tip, argv) { assign_creds(opt, argv.shift(), 'cert') },
  '--key' (opt, tip, argv) { assign_creds(opt, argv.shift(), 'key') },

  '--debug' (opt, tip, argv) { opt.debug = true },

  next_arg(opt, tip) { _concat(opt, 'lsdir', [tip]) },
}

function _concat(opt, key, rest) {
  let prev = opt[key]
  if (undefined === prev) prev = []
  else if (!Array.isArray(prev)) {
    console.error(`\nInvalid list argument for "${key}".\n  previous: %o\n  concat: %o\n\n`, prev, rest)
    throw new Error(`Invalid list argument`)
  }
  return opt[key] = prev.concat(rest) }


async function qsrv_main(argv = process.argv.slice(2), env = process.env) {
  try {
    const { QSRV_PORT, QSRV_TLS, QSRV_TLS_CERT, QSRV_TLS_KEY } = await env

    const opt = {
      lsdir: ['./docs'],
      port: QSRV_PORT ? +QSRV_PORT : 8080,
      ... qsrv_argv.parse(argv) }

    if (QSRV_TLS) assign_creds(opt, QSRV_TLS)
    if (QSRV_TLS_CERT) assign_creds(opt, QSRV_TLS_KEY, 'cert')
    if (QSRV_TLS_KEY) assign_creds(opt, QSRV_TLS_KEY, 'key')

    if (opt.debug) console.dir(opt)
    return await qsrv_sevrer(opt)

  } catch (err) {
    console.error('')
    console.error(err)
    console.error('')
    process.exit(1)
  }
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
  console.log()
  console.log(`Quick Dev Server (qsrv v${version})`)
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

