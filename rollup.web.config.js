import del from 'rollup-plugin-delete';
import tslint from 'rollup-plugin-tslint';
import builtins from 'rollup-plugin-node-builtins';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import sourceMaps from 'rollup-plugin-sourcemaps'
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

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
        tslint({
            throwOnError: true
        }),
        builtins(),
        typescript({
            useTsconfigDeclarationDir: true
        }),
        terser(),
        sourceMaps(),
        watch && serve({
            contentBase: '.',
            open: true,
            openPage: '/examples/daplink-flash/web.html',
        }),
        watch && livereload()
    ]
};
