const path        = require("path");
const browserify  = require("browserify");
const del         = require("del");
const merge       = require("merge2");
const buffer      = require("vinyl-buffer");
const source      = require("vinyl-source-stream");
const gulp        = require("gulp");
const sourcemaps  = require("gulp-sourcemaps");
const typedoc     = require("gulp-typedoc");
const typescript  = require("gulp-typescript");
const tslint      = require("gulp-tslint");

// Source
let srcDir = "src";
let srcDocs = srcDir + "/documentation";
let srcFiles = srcDir + "/**/*.ts";

// Docs
let name = "DAPjs";
let docsDir = "docs";

// Node
let nodeDir = "lib";
let typesDir = "types";

// Browser bundles
let bundleDir = "bundles";
let bundleFile =  "dap.bundle.js";
let bundleGlobal = "DAPjs";
let bundleIgnore = "webusb";

let watching = false;

// Error handler suppresses exists during watch
function handleError(error) {
    console.log(error.message);
    if (watching) this.emit("end");
    else process.exit(1);
}

// Set watching
gulp.task("setWatch", () => {
    watching = true;
});

// Clear built directories
gulp.task("clean", () => {
    return del([nodeDir, typesDir, bundleDir]);
});

// Lint the source
gulp.task("lint", () => {
    return gulp.src(srcFiles)
    .pipe(tslint({
        formatter: "stylish"
    }))
    .pipe(tslint.report({
        emitError: !watching
    }))
});

// Create documentation
gulp.task("doc", () => {
    return gulp.src(srcFiles)
    .pipe(typedoc({
        name: name,
        readme: srcDocs + "/index.md",
        theme: srcDocs + "/theme",
        module: "commonjs",
        target: "es6",
        mode: "file",
        out: docsDir,
        excludeExternals: true,
        excludePrivate: true,
        hideGenerator: true
    }))
    .on("error", handleError);
});

// Build TypeScript source into CommonJS Node modules
gulp.task("compile", ["clean"], () => {
    let tsResult = gulp.src(srcFiles)
    .pipe(sourcemaps.init())
    .pipe(typescript.createProject("tsconfig.json")())
    .on("error", handleError);

    return merge([
        tsResult.js.pipe(sourcemaps.write(".", {
            sourceRoot: path.relative(nodeDir, srcDir)
        })).pipe(gulp.dest(nodeDir)),
        tsResult.dts.pipe(gulp.dest(typesDir))
    ]);
});

// Build CommonJS modules into browser bundles
gulp.task("bundle", ["compile"], () => {
    return browserify(nodeDir, {
        standalone: bundleGlobal
    })
    .ignore(bundleIgnore)
    .bundle()
    .on("error", handleError)
    .pipe(source(bundleFile))
    .pipe(buffer())
    .pipe(sourcemaps.init({
        loadMaps: true
    }))
    .pipe(sourcemaps.write(".", {
        sourceRoot: path.relative(bundleDir, nodeDir)
    }))
    .pipe(gulp.dest(bundleDir));
});

gulp.task("watch", ["setWatch", "default"], () => {
    gulp.watch(srcFiles, ["default"]);
});

gulp.task("default", ["lint", "doc", "bundle"]);
