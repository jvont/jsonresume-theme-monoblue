const fs = require('fs/promises');
const path = require('path');

const handlebars = require('handlebars');
const jsonc = require('jsonc-parser');
const puppeteer = require('puppeteer');
const sass = require('sass');

const SRC = `${__dirname}/src`;
const BUILD = `${__dirname}/build`;

// parse json content
async function parseContent(dir) {
  const content = await fs.readdir(dir);
  return await content.reduce(async (acc, file) => {
    const name = path.parse(file).name;
    const data = await fs.readFile(path.join(dir, file), 'utf-8');

    return {...(await acc), [name]: jsonc.parse(data)};
  }, {});
}

// convert html source to pdf using puppeteer
async function html2pdf(html) {
  const browser = await puppeteer.launch({headless: true});

  const page = await browser.newPage();
  await page.setContent(html, {waitUntil: 'domcontentloaded'});
  // await page.emulateMedia('screen');
  const pdf = await page.pdf({
    format: 'Letter',
    printBackground: true
  });

  await browser.close();
  return pdf;
}

// generate (output) html and pdf versions of resume
async function generate() {
  fs.mkdir(BUILD).catch(_ => {});

  // render html
  const context = await parseContent(`${SRC}/content`);
  context.css = sass.compile(`${SRC}/styles.scss`).css;

  const input = await fs.readFile(`${SRC}/index.hbs`, 'utf-8');
  const html = handlebars.compile(input)(context);
  
  // save to file
  await fs.writeFile(`${BUILD}/resume.html`, html);

  // generate pdf
  const pdf = await html2pdf(html);
  await fs.writeFile(`${BUILD}/resume.pdf`, pdf);
}

generate();
