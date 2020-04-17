import rpi_resolve from '@rollup/plugin-node-resolve'
import rpi_json from '@rollup/plugin-json'
import rpi_dgnotify from 'rollup-plugin-dgnotify'
import rpi_jsy from 'rollup-plugin-jsy'

const configs = []
export default configs

const sourcemap = true
const external = [
  'path', 'fs', 'os', 'dgram', 'https', 'http',
  'qsrv',
]

const plugins = [
  rpi_resolve({preferBuiltins: true}),
  rpi_json(),
  rpi_jsy(),
  rpi_dgnotify(),
]


add_jsy('index', {exports: 'default'})
add_jsy('cli_qsrv', {exports: 'default'})
add_jsy('all')


function add_jsy(src_name, opt={}) {
  configs.push({
    input: `code/${src_name}.jsy`,
    output: [
      { file: `esm/${src_name}.mjs`, format: 'es', sourcemap },
      { file: `cjs/${src_name}.cjs`, format: 'cjs', exports:opt.exports || 'named', sourcemap },
    ],
    plugins, external })
}
