import del from 'rollup-plugin-delete';
import eslint from '@rollup/plugin-eslint';
import builtins from 'rollup-plugin-node-builtins';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import sourceMaps from 'rollup-plugin-sourcemaps'

const name = 'DAPjs';
const pkg = require('./package.json')
const watch = process.env.ROLLUP_WATCH;

export default {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'umd',
            sourcemap: true,
            name
        },
        {
            file: pkg.module,
            format: 'esm',
            sourcemap: true
        }
    ],
    plugins: [
        !watch && del({
            targets: [
                'dist/*',
                'types/*'
            ]
        }),
        eslint({
            throwOnError: true
        }),
        builtins(),
        typescript({
            useTsconfigDeclarationDir: true
        }),
        terser(),
        sourceMaps()
    ]
};
