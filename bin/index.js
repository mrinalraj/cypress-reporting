#! /usr/bin/env node

const yargs = require("yargs/yargs");
const argv = yargs(process.argv).argv;
const commandDir = process.cwd();
const { promises: fs, existsSync } = require("fs");
const path = require("path");
const ConfigValidation = require("../src/ConfigValidation");
const PopulateReportFile = require("../src/PopulateReportFile");

if (!argv.config) {
  console.error("Error: Please provide a config");
  process.exit(1);
}

const configuration = require(`${commandDir}/${argv.config}`);

if (!ConfigValidation(configuration)) {
  console.error("Error: Invalid config");
  process.exit(1);
}

const { inputBase, outputBase, base, seperator, keys, title } = configuration;

const getCount = (list, type) =>
  list.reduce(
    (total, suite) =>
      total +
      suite.tests.reduce((total, test) => (test[type] ? total + 1 : total), 0),
    0
  );

const getData = async () => {
  try {
    const filesPath = path.resolve(commandDir, inputBase);

    const jsonList = await fs.readdir(filesPath).catch(() => {
      throw new Error("Bad input path");
    });

    if (!jsonList.length) throw new Error("No data in reports folder");

    const data = jsonList
      .flatMap((filename) => require(`${filesPath}/${filename}`).results)
      .map((row) => {
        const [dir, file] = row.file.replace(base, "").split(seperator);
        const suites = row.suites.length;

        const tests = row.suites.reduce(
          (total, suite) => suite.tests.length + total,
          0
        );

        const count = Object.assign(
          {},
          ...keys.map((key) => ({ [key]: getCount(row.suites, key) }))
        );

        return {
          dir,
          file,
          suites,
          tests,
          ...count,
        };
      });

    const dirs = [...new Set(data.map((row) => row.dir))];

    return { data, dirs };
  } catch (e) {
    console.error(e);
  }
};

(async function () {
  const { data, dirs } = await getData();
  const reportFile = await PopulateReportFile(data, dirs, title, keys);

  if (!existsSync(path.resolve(commandDir, outputBase, "generated"))) {
    await fs.mkdir(path.resolve(commandDir, outputBase, "generated"), {
      recursive: true,
    });
  }

  await fs.writeFile(
    path.resolve(commandDir, outputBase, "generated/index.html"),
    reportFile,
    "utf-8"
  );
})();
