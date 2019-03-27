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
    .map((f) => {
        const html = fs.readFileSync(f, 'utf-8');
        const match = html.match(/order:\s?(\d+)/)
        const order = match ? match[1] : 0;
        return {[getHtmlName(f)]: order};
    }));

const pages = () => glob.sync(htmlGlob)
    .map(f => [getHtmlName(f), getHtmlName(f) === 'index' ? '' : getHtmlName(f)])
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

const images = () => {
    return gulp.src('src/img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'))
};

const scripts = () => {
    return gulp.src('src/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist'))
};


const optimize = gulp.series(optimizeCSS, scripts, inline, minifyHTML, deleteCSS, images);

const clean = () => del(['dist']);

const watch = () => gulp.watch('./src/**/*.*', gulp.series(sass, html, reload));


exports.default = gulp.series(clean, sass, html, serve, watch);
exports.build = gulp.series(clean, sass, html, optimize);
