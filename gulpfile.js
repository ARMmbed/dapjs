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

// Source
let srcDir = "src";
let srcFiles = srcDir + "/**/*.ts";

// Docs
let name = "DAPjs API Documentation";
let docsDir = "docs";

// Node
let nodeDir = "lib";
let typesDir = "types";

// Browser bundles
let bundleDir = "bundles";
let bundleFile =  "dap.bundle.js";
let bundleGlobal = "DAPjs";

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
    .pipe(gulpTslint({
        program: tslint.Linter.createProgram("./tsconfig.json"),
        formatter: "stylish"
    }))
    .pipe(gulpTslint.report({
        emitError: !watching
    }))
});

// Create documentation
gulp.task("doc", () => {
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
});

// Build TypeScript source into CommonJS Node modules
gulp.task("compile", ["clean"], () => {
    let tsResult = gulp.src(srcFiles)
    .pipe(gulpSourcemaps.init())
    .pipe(gulpTypescript.createProject("tsconfig.json")())
    .on("error", handleError);

    return merge([
        tsResult.js.pipe(gulpSourcemaps.write(".", {
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
});

gulp.task("watch", ["setWatch", "default"], () => {
    gulp.watch(srcFiles, ["default"]);
});

gulp.task("default", ["lint", "doc", "bundle"]);
