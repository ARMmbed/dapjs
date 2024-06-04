import del from 'rollup-plugin-delete';
import eslint from '@rollup/plugin-eslint';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';
import fs from 'fs/promises';

const name = 'DAPjs';
const pkg = JSON.parse(await fs.readFile('./package.json'));
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
        nodePolyfills(),
        typescript({
            useTsconfigDeclarationDir: true
        }),
        terser()
    ]
};
