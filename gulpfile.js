const gulp =  require('gulp');
const fs =  require('fs');
const glob =  require('fast-glob');
const del =  require('del');
const data =  require('gulp-data');
const browserSync =  require('browser-sync');
const gulpSass =  require('gulp-sass');
const nunjucks =  require('gulp-nunjucks-render');
const postcss = require('gulp-postcss');
const uncss = require('postcss-uncss');
const useref = require('gulp-useref');
const inlinesource = require('gulp-inline-source');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const uglify = require('gulp-uglify');
const pipeline = require('readable-stream').pipeline;
const embedSvg = require('gulp-embed-svg');
const babel = require('gulp-babel');
const webpack = require('webpack-stream');

const server = browserSync.create();


const sass = () => {
    return gulp.src(['src/scss/*.scss', '!src/scss/_*.scss'])
        .pipe(gulpSass())
        .pipe(gulp.dest('dist/css'))
};

const reload = (done) => {
    server.reload();
    done();
}

const serve = (done) => {
    server.init({
        server: {
            baseDir: './dist',
            serveStaticOptions: {
                extensions: ['html']
            },
        }
    });
    done();
}

const htmlGlob = ['src/html/**/*.html', '!src/html/**/_*.html'];

const getHtmlName = (f) => f.split('/html/').pop().slice(0, -5);


const pageOrder = () => Object.assign({}, ...glob.sync(htmlGlob)
    .map((f, i) => {
        const html = fs.readFileSync(f, 'utf-8');
        const match = html.match(/<!--\sorder:\s?(\d+)/)
        const order = match ? parseInt(match[1].trim()) : glob.sync(htmlGlob).length + i;
        return {[getHtmlName(f)]: order};
    }));

const pages = () => glob.sync(htmlGlob)
    .map((f) => {
        const name = getHtmlName(f);
        const url = name === 'index' ? '' : name;

        const html = fs.readFileSync(f, 'utf-8');
        const match = html.match(/<!--\stitle:\s?([^-]*)/)
        const title = match ? match[1].trim() : name;
        return [name, url, title]
    })
    .sort(function(a, b) {
        const order = pageOrder();
        return order[a[0]] - order[b[0]];
    });

const html = () => {
    return gulp.src(htmlGlob)
        .pipe(data((file) => {
            const path = getHtmlName(file.relative);
            return {
                path: path,
                hasCSS: fs.existsSync('./dist/css/' + path + '.css'),
                pages: pages(),
            };
        }))
        .pipe(nunjucks({
            path: './src/html/',
        }))
        .pipe(gulp.dest('dist'))
}


const minifyCSS = () =>  {
    const plugins = [
        uncss({
            html: ['dist/**/*.html']
        }),
        require('cssnano')({
            preset: 'advanced',
        }),
    ];
    return gulp.src('./dist/**/*.css')
        .pipe(postcss(plugins))
        .pipe(gulp.dest('./dist'));
}

const combineCSS = () => {
    return gulp.src('./dist/**/*.html')
        .pipe(useref())
        .pipe(gulp.dest('./dist'));
}


const deleteCSS = () => del(['dist/css']);

const optimizeCSS = gulp.series(combineCSS, minifyCSS)

const inline = () => {
    return gulp.src('./dist/**/*.html')
        .pipe(inlinesource())
        .pipe(embedSvg({
            root: 'dist',
        }))
        .pipe(gulp.dest('./dist'));
}

const inlineSVG = () => {
    return gulp.src('./dist/**/*.html')
        .pipe(embedSvg({
            root: 'dist',
        }))
        .pipe(gulp.dest('./dist'));
}

const minifyHTML = () => {
    return gulp.src('dist/**/*.html')
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
        }))
        .pipe(gulp.dest('dist'));
};

const optimizeImages = () => {
    return gulp.src([
      'src/img/*',
      'src/img/*/*',
      ])
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'))
};

const images = () => {
    return gulp.src([
      'src/img/*',
      'src/img/*/*',
      ])
      .pipe(gulp.dest('dist/img'))
};

const scripts = () => {
    return gulp.src('src/js/*.js')
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
};


const optimize = gulp.series(optimizeImages, inlineSVG, optimizeCSS, inline, minifyHTML, deleteCSS);

const clean = () => del(['dist']);

const watch = () => gulp.watch('./src/**/*.*', gulp.series(images, scripts, sass, html, reload));


exports.default = gulp.series(clean, sass, scripts, images, html, serve, watch);
exports.build = gulp.series(clean, sass, scripts, html, optimize);
