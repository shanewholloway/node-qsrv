import rpi_resolve from '@rollup/plugin-node-resolve'
import rpi_jsy from 'rollup-plugin-jsy-lite'

const configs = []
export default configs

const sourcemap = true
const external = ['path', 'fs', 'os', 'https', 'http']
const plugins = [
  rpi_resolve({preferBuiltins: true}),
  rpi_jsy(),
]


configs.push({
  input: `code/index.jsy`,
  output: [
    { file: `esm/index.mjs`, format: 'es', sourcemap },
    { file: `cjs/index.cjs`, format: 'cjs', exports:'default', sourcemap },
  ],
  plugins, external })


add_jsy('all')


function add_jsy(src_name, module_name) {
  if (!module_name) module_name = src_name

  configs.push({
    input: `code/${src_name}.jsy`,
    output: [
      { file: `esm/${src_name}.mjs`, format: 'es', sourcemap },
      { file: `cjs/${src_name}.cjs`, format: 'cjs', exports:'named', sourcemap },
    ],
    plugins, external })
}
