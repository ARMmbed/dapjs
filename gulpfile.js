const path              = require("path");
const browserify        = require("browserify");
const del               = require("del");
const merge             = require("merge2");
const buffer            = require("vinyl-buffer");
const source            = require("vinyl-source-stream");
const tslint            = require("tslint");
const gulp              = require("gulp");
const gulpSourcemaps    = require("gulp-sourcemaps");
const gulpTypedoc       = require("gulp-typedoc");
const gulpTypescript    = require("gulp-typescript");
const gulpTslint        = require("gulp-tslint");

// Docs
const name = "DAPjs API Documentation";
const docsDir = "docs";

// Source
const srcDir = "src";
const srcFiles = srcDir + "/**/*.ts";

// Node
const nodeDir = "lib";
const typesDir = "types";

// Browser bundles
const bundleDir = "bundles";
const bundleFile =  "dap.bundle.js";
const bundleGlobal = "DAPjs";

let watching = false;

// Error handler suppresses exists during watch
function handleError(cb) {
    if (watching) this.emit("end");
    else process.exit(1);
    cb();
}

// Set watching
function setWatch(cb) {
    watching = true;
    cb();
}

// Clear built directories
function clean(cb) {
    if (!watching) del([nodeDir, typesDir]);
    cb();
}

// Lint the source
function lint() {
    return gulp.src(srcFiles)
    .pipe(gulpTslint({
        program: tslint.Linter.createProgram("./tsconfig.json"),
        formatter: "stylish"
    }))
    .pipe(gulpTslint.report({
        emitError: !watching
    }))
}

// Create documentation
function doc() {
    return gulp.src(srcFiles)
    .pipe(gulpTypedoc({
        name: name,
        readme: "./README.md",
        theme: "./docs-theme",
        module: "commonjs",
        target: "es6",
        mode: "file",
        out: docsDir,
        excludeExternals: true,
        excludePrivate: true,
        hideGenerator: true
    }))
    .on("error", handleError);
}

// Build TypeScript source into CommonJS Node modules
function compile() {
    var tsResult = gulp.src(srcFiles)
    .pipe(gulpSourcemaps.init())
    .pipe(gulpTypescript.createProject("tsconfig.json")())
    .on("error", handleError);

    return merge([
        tsResult.js.pipe(gulpSourcemaps.write(".", {
            sourceRoot: path.relative(nodeDir, srcDir)
        })).pipe(gulp.dest(nodeDir)),
        tsResult.dts.pipe(gulp.dest(typesDir))
    ]);
}

// Build CommonJS modules into browser bundles
function bundle() {
    return browserify(nodeDir, {
        standalone: bundleGlobal
    })
    .ignore("webusb")
    .ignore("usb")
    .ignore("node-hid")
    .bundle()
    .on("error", handleError)
    .pipe(source(bundleFile))
    .pipe(buffer())
    .pipe(gulpSourcemaps.init({
        loadMaps: true
    }))
    .pipe(gulpSourcemaps.write(".", {
        sourceRoot: path.relative(bundleDir, nodeDir)
    }))
    .pipe(gulp.dest(bundleDir));
}

exports.default = gulp.series(lint, doc, clean, compile, bundle);
exports.watch = gulp.series(setWatch, exports.default, function(cb) {
    gulp.watch(srcFiles, gulp.series(lint, clean, compile, bundle));
    cb();
});
