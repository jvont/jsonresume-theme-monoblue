const fs = require('fs/promises');
const path = require('path');

const handlebars = require('handlebars');
const jsonc = require('jsonc-parser');
const puppeteer = require('puppeteer');
const sass = require('sass');

const SRC = `${__dirname}/src`;
const BUILD = `${__dirname}/build`;

// register partial templates
async function registerPartials(dir) {
  const partials = await fs.readdir(dir);
  return await partials.forEach(async file => {
    const name = path.parse(file).name;
    const template = await fs.readFile(path.join(dir, file), 'utf-8');

    handlebars.registerPartial(name, template);
  }, {});
}

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
  const pdf = await page.pdf({
    // format: 'Letter',
    preferCSSPageSize: true,
    printBackground: true
  });

  await browser.close();
  return pdf;
}

// build html and pdf versions of resume
(async function() {
  fs.mkdir(BUILD).catch(_ => {});

  // parse content/css
  const context = await parseContent(`${SRC}/content`);
  const styles = await sass.compileAsync(`${SRC}/styles/main.scss`);
  context.css = styles.css;

  // render html
  await registerPartials(`${SRC}/templates/partials`);
  const input = await fs.readFile(`${SRC}/templates/index.hbs`, 'utf-8');
  const html = handlebars.compile(input)(context);
  
  // save to file
  await fs.writeFile(`${BUILD}/resume.html`, html);

  // generate pdf
  const pdf = await html2pdf(html);
  await fs.writeFile(`${BUILD}/resume.pdf`, pdf);
})();
