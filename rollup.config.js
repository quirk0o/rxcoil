import typescriptPlugin from 'rollup-plugin-typescript2'
import pkg from './package.json'

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]
const input = 'src/index.ts'

const plugins = [
  typescriptPlugin({
    typescript: require('typescript'),
  }),
]

export default [
  {
    input,
    output: {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    plugins,
    external,
  },
]
