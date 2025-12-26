const { exitProcess } = require('yargs');

const { src, dest, series, watch } = require('gulp'),
  concat = require('gulp-concat'),
  htmlMin = require('gulp-htmlmin'),
  fileinclude = require('gulp-file-include'),
  plumber = require('gulp-plumber'),
  autoprefixes = require('gulp-autoprefixer'),
  sass = require('gulp-sass')(require('sass')),
  cleanCSS = require('gulp-clean-css'),
  browserSync = require('browser-sync').create(),
  argv = require('yargs').argv,
  notify = require("gulp-notify"),
  replace = require('gulp-replace'),
  svgSprite = require('gulp-svg-sprite'),
  cheerio = require('gulp-cheerio'),
  svgmin = require('gulp-svgmin'),
  rimraf = require('rimraf'),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  uglify = require('gulp-uglify-es').default,
  babel = require('gulp-babel'),
  rigger = require('gulp-rigger'),
  _if = require('gulp-if'),
  sourcemaps = require('gulp-sourcemaps')


let project_folder = "dist"
let source_folder = "src"

let path = {
    build: { //Тут мы укажем куда складывать готовые после сборки файлы
        html: project_folder + '/',
        js: project_folder + '/js/',
        css: project_folder + '/css/',
        img: project_folder + '/images/',
        fonts: project_folder + '/fonts/',
        sprite:  project_folder + '/sprite/'
    },
    src: { //Пути откуда брать исходники
        html: source_folder + '/*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
        js: source_folder + '/js/**/*.js',//В стилях и скриптах нам понадобятся только main файлы
        style: source_folder + '/styles/**/*.scss',
        img: source_folder + '/images/**/*.{jpg,png,svg,gif,ico,webp}', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        fonts: source_folder + '/fonts/**/*.*',
        sprite: source_folder + '/images/svg/*.svg'
    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
      style: source_folder + '/**/*.scss'
    }
};

const config = {
  server: {
    baseDir: project_folder
  },
  host: 'localhost',
  port: 9000,
  notify: false,
  logPrefix: "Frontend_Devil",
  open: false
};
const production = (argv.production === undefined) ? false : true;
const usePolling = (argv.usePolling === undefined) ? false : true;

const styles = () => {
  return src(path.src.style)
    .pipe(plumber({
      errorHandler: notify.onError((err) => {
        return {
          title: 'Style',
          message: err.message
        };
      })
    }))
    .pipe(_if(!production, sourcemaps.init())) // для сорсмепов в дев-режиме
    .pipe(sass()) //Скомпилируем
    .pipe(autoprefixes({
      cascade: false
    }))
    .pipe(_if(!production, sourcemaps.write())) // пишем сормепы в дев-режиме
    .pipe(_if(production, cleanCSS({level: 2})))
    .pipe(dest(path.build.css)) //И в build
    .pipe(browserSync.stream())
}

const html = () => {
  let date = new Date();

  return src(path.src.html)
    .pipe(plumber({
      errorHandler: notify.onError((err) => {
        return {
          title: 'HTML',
          message: err.message
        };
      })
    }))
    .pipe(fileinclude())
    .pipe( replace( '%NO_CACHE%', date.getTime() ) )
    .pipe(_if(production, htmlMin({
      collapseWhitespace: true,
    })))
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream())
}

const svgSprites = () => {
  return src(path.src.sprite)
    // minify svg
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    // remove all fill, style and stroke declarations in out shapes
    .pipe(cheerio({
      run: function ($) {

        $('[stroke]').removeAttr('stroke');
        $('[fill]').removeAttr('fill');
        $('[style]').removeAttr('style');
      },
      parserOptions: {xmlMode: true}
    }))
    // cheerio plugin create unnecessary string '&gt;', so replace it.
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: "../sprite.svg",
          render: {
            scss: {
              dest:'../../styles/_sprite.scss',
              template: "src/sass-templates/_sprite_template.scss"
            }
          }
        }
      }
    }))
    .pipe(dest(path.build.sprite));
}

const watchFiles = () => {
  browserSync.init(config)
}

const image = () => {
  return src(path.src.img) //Выберем наши картинки
    .pipe(imagemin({ //Сожмем их
      progressive: true,
      quality: 75,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()],
      interlaced: true
    }))
    .pipe(dest(path.build.img)) //И бросим в build
    .pipe(browserSync.stream())
}

const clean = () => {
  rimraf(path.clean, () => console.log('deleted'))
}

const js = () => {
  return src(path.src.js)
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(concat('app.js'))
    .pipe(uglify().on('error', notify.onError()))
    .pipe(plumber({
      errorHandler: notify.onError((err) => {
        return {
          title: 'JS',
          message: err.message
        };
      })
    }))
    .pipe(rigger()) //Прогоним через rigger
    .pipe(_if(!production, sourcemaps.init())) // для сорсмепов в дев-режиме
    .pipe(_if(!production, sourcemaps.write())) // пишем сормепы в дев-режиме
    .pipe(dest(path.build.js)) //Выплюнем готовый файл в build
    .pipe(browserSync.stream())
}

const resources = () => {
  return src(source_folder + '/resources/**')
  .pipe(dest(project_folder))
}

watch(source_folder+'/**/*.html', html)
watch(path.watch.style, styles)
watch(path.src.sprite, svgSprites)
watch(path.src.js, js)
watch(source_folder + '/resources', resources)

exports.styles = styles
exports.html = html
exports.svgSprites = svgSprites
exports.clean = clean
exports.image = image;
exports.js = js;

exports.default = series( html, styles, image, js, resources, svgSprites, watchFiles)
