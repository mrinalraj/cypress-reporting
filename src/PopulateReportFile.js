const Handlebars = require("handlebars");
const { promises: fs } = require("fs");
const path = require("path");

module.exports = async (data, dirs, title, keys) => {
  const chartTemplate = await fs.readFile(
    path.resolve(__dirname, "templates/chart.txt"),
    "utf-8"
  );

  const reportData = dirs.map((dir) => {
    const list = data
      .filter((row) => row.dir === dir)
      .map(({ dir, ...rest }) => ({ ...rest }));

    const chartData = Object.assign({}, ...keys.map((keys) => ({ [keys]: 0 })));

    list.forEach((row) => {
      keys.forEach((key) => {
        chartData[key] = chartData[key] + row[key];
      });
    });

    const chart = `${chartTemplate}`
      .replace(
        "#data-placeholder#",
        `const ${dir}_data = ${JSON.stringify(chartData)}`
      )
      .replace(/my_chart/g, `${dir}_chart`)
      .replace(/chart_data/g, `${dir}_data`);

    return { dir, list, chart };
  });

  const template = await fs.readFile(
    path.resolve(__dirname, "templates/index.hbs"),
    "utf-8"
  );

  Handlebars.registerHelper(
    "capitalize",
    (string) => string.charAt(0).toUpperCase() + string.slice(1)
  );

  const d3 = await fs.readFile(
    path.resolve(__dirname, "templates/d3.txt"),
    "utf-8"
  );

  const content = Handlebars.compile(template);
  return content({ title, reportData, d3 });
};
