import qsrv_sevrer from 'qsrv'

qsrv_sevrer({
    root: '.',
    fallback: 'index.html',
    port: 0,
    listen_addr: '0.0.0.0',
    reload: true || [/*paths to watch*/],
    lsdir: lsdir_examples(),

    //credentials: { key: TLS_KEY, cert: TLS_CERT },
  })
.then(qsrv => {
  qsrv.log_changed()
  console.log()
  console.log(`QSRV API Example Server`)
  console.log( qsrv.banner() )
})


function lsdir_examples() {
  return [
    // simple path watch
    './docs',

    // or detailed
    {
      // root: directory to watch for changes
      root: './other-docs',

      // file: output json file path to write to
      file: './list-other.json',

      // accept: filter function based on file name
      accept: fname => fname.endsWith('.md'),

      // on_refresh: change refresh; results are written as JSON to 'file'
      on_refresh(ls_entries) {
        console.log('Other Docs Update:', ls_entries)
        return ls_entries
      },
    },
  ]
}
