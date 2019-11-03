// USED ES6 JS: https://www.w3schools.com/js/js_es6.asp
import {src, dest, watch, series, parallel} from 'gulp';
// project info
import info from "./package.json";
// helps us to build interactive command line tools like using "prod" flag when to compile production files (minified css etc...)
import yargs from 'yargs';
const PRODUCTION = yargs.argv.prod;
// to compile sass/scss files
import sass from 'gulp-sass';
// to minify css files
import cleanCss from 'gulp-clean-css';
// gulp if!
import gulpif from 'gulp-if';
//showing scss files instead of css files in development mode in browsers devtools (inspect elements)
import sourcemaps from 'gulp-sourcemaps';
// adds older browsers prefixes
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
// compressing images
import imagemin from 'gulp-imagemin';
// delete
import del from 'del';
// refresh browser on file change
import browserSync from "browser-sync";
const server = browserSync.create();

// we're using Webpack for "scripts" task
import webpack from 'webpack-stream';

// what if we would create multiple js bundles like we did in styles?
import named from 'vinyl-named';

// zip project files
import zip from "gulp-zip";

// string replace plugin, we can use this to change our theme name
import replace from "gulp-replace";

// export pot file for translation
import wpPot from "gulp-wp-pot";


// "styles" task compiles sass files in src/scss folder to css in dist/css folder
export const styles = () => {
    return src('src/scss/bundle.scss')
        .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulpif(PRODUCTION, postcss([autoprefixer])))
        .pipe(gulpif(PRODUCTION, cleanCss({compatibility: 'ie7'})))
        .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
        .pipe(dest('dist/css'))
        .pipe(server.stream()); // Browsersync inject CSS directly without reloading
};

// "watchChanges" is for watching sass file changes in src/scss folder
// Can't use "watch" name because we already have a variable using it.
export const watchChanges = () => {
    watch('src/scss/**/*.scss', styles); //css files don't need reload because of server.stream()
    watch('src/images/**/*.{jpg,jpeg,png,svg,gif}', series(images,reload));
    watch(['src/**/*','!src/{images,js,scss}','!src/{images,js,scss}/**/*'], series(copy,reload));
    watch('src/js/**/*.js', series(scripts,reload));
    watch("**/*.php", reload);
};

// move (and compress with gulp images --prod flag) images from src folder to dist using imagemin
export const images = () => {
    return src('src/images/**/*.{jpg,jpeg,png,svg,gif}')
        .pipe(gulpif(PRODUCTION, imagemin()))
        .pipe(dest('dist/images'));
};

// COPY src files to dist!
export const copy = () => {
    return src(['src/**/*','!src/{images,js,scss}','!src/{images,js,scss}/**/*'])
        .pipe(dest('dist'));
};


export const scripts = () => {
    return src('src/js/bundle.js')
        .pipe(webpack({
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: []
                            }
                        }
                    }
                ]
            },
            mode: PRODUCTION ? 'production' : 'development',
            // we used inline-source-map, it's most accurate but maybe a little slow,
            // other options: https://webpack.js.org/configuration/devtool/
            devtool: !PRODUCTION ? 'inline-source-map' : false,
            output: {
                //vinyl does this [name]:
                filename: '[name].js'
            },
        }))
        .pipe(dest('dist/js'));
};


// remove dist folder
export const clean = () => del(['dist']);


// Browsersync refresh
export const serve = done => {
    server.init({
        proxy: "http://localhost/" // put your local website link here
    });
    done();
};
export const reload = done => {
    server.reload();
    done();
};

// export theme project zip file to bundled folder
export const compress = () => {
    return src([
        "**/*",
        "!node_modules{,/**}",
        "!bundled{,/**}",
        "!src{,/**}",
        "!.babelrc",
        "!.gitignore",
        "!gulpfile.babel.js",
        "!package.json",
        "!package-lock.json",
    ])
        .pipe(replace("_sbftheme", info.name))
        .pipe(zip(`${info.name}.zip`))
        .pipe(dest('bundled'));
};


export const pot = () => {
    return src("**/*.php")
        .pipe(
            wpPot({
                domain: "_sbftheme",
                package: info.name
            })
        )
        .pipe(dest(`languages/${info.name}.pot`));
};

// series: one after another
// parallel: all at once
export const dev = series(clean, parallel(styles, images, copy, scripts), serve, watchChanges);
// we need to add --prod flag to minify styles, that can be easily forgotten. so we go to packages.json
// in scripts field we add --prod flag for build task
// "npm run start" command will run default gulp task that is "dev" and watches for changes
// "npm run build" command will run build task with --prod flag
export const build = series(clean, parallel(styles, images, copy, scripts), pot, compress);



// default mode is dev
export default dev;
