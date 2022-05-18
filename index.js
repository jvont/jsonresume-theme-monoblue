const fs = require('fs');
const path = require('path');

const handlebars = require('handlebars');
const sass = require('sass');

const SRC = `${__dirname}/src`;

function render(resume) {
  const css = sass.compile(`${SRC}/styles/main.scss`).css;
  const template = fs.readFileSync(`${SRC}/templates/index.hbs`, 'utf-8');

  const partialsDir = `${SRC}/templates/partials`;
  const filenames = fs.readdirSync(partialsDir);

  filenames.forEach(filename => {
    const parsedPath = path.parse(filename);
    if (parsedPath.ext === '.hbs') {
      const filepath = path.join(partialsDir, filename);
      const partial = fs.readFileSync(filepath, 'utf-8');
      handlebars.registerPartial(parsedPath.name, partial);
    }
    handlebars.registerPartial(name, template);
  }, {});

  return handlebars.compile(template)({
    css,
    resume
  });
}

module.exports = { render };