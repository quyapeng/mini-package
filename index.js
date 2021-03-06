const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("babel-traverse").default;
const path = require("path");
const ejs = require("ejs");
const prettier = require("prettier");

const { transformFromAst } = require("babel-core");
const { versions } = require("process");

let id = 1;
let globalConfig = {};
// 1.获取到文件的内容和关系
function createAsset(filename) {
  // a.获取文件的内容
  let source = fs.readFileSync(filename, "utf-8");
  // console.log("source", source);
  // 此处处理文件不同类型
  const loaders = globalConfig.module.rules;
  // console.log("loaders", loaders);
  loaders.forEach((loadersConfig) => {
    const { test, use } = loadersConfig;
    if (test.test(filename)) {
      source = use(source);
    }
  });
  // b.如何获取文件依赖关系
  // 借助 ast 来解析，获取到依赖
  // yarn add babylon babel-traverse babel-core
  const ast = parser.parse(source, {
    sourceType: "module",
  });
  //   console.log(ast);
  //   console.log(traverse);

  // 依赖
  let deps = [];
  traverse(ast, {
    ImportDeclaration({ node }) {
      //   console.log("node", node.source.value);
      deps.push(node.source.value);
    },
  });

  // es6+ --> es5
  let { code } = transformFromAst(ast, null, {
    presets: ["env"],
  });

  return {
    id: id++,
    filename,
    code,
    deps,
    mapping: {},
  };
}
function createGraph() {
  // 获取文件内容的时候处理
  const filename = globalConfig.entry;
  const dirname = path.dirname(filename);
  let mainAsset = createAsset(filename);

  let queue = [mainAsset];
  for (const asset of queue) {
    //
    // console.log("asset", asset);
    asset.deps.forEach((relativePath) => {
      // console.log("path", relativePath);

      let child = createAsset(path.resolve(dirname, relativePath));
      asset.mapping[relativePath] = child.id;
      // console.log("asset", asset);
      queue.push(child);
    });
  }
  // console.log("queue", queue);
  return queue;
}
// let mainjs = createAsset();

// console.log("mainjs", mainjs);
// 2. 创建图
// const graph = createGraph("./example/main.js");
// console.log("graph", graph);
// 3. 拼成最终的js

function bundle(graph) {
  // const context = "124";
  // console.log(graph);
  // 先去构建 modlues
  function createModules() {
    //
    let modlues = {};
    graph.forEach((asset) => {
      // console.log(asset);
      modlues[asset.id] = [asset.code, asset.mapping];
    });
    return modlues;
  }

  const modules = createModules();
  const bundleTemplate = fs.readFileSync("./bundle.ejs", "utf-8");
  const context = ejs.render(bundleTemplate, {
    modules,
  });

  function emitFile(context) {
    fs.writeFileSync("./example/dist/bundle.js", context);
  }
  let code = prettier.format(context, { parser: "babel" });
  console.log("code", code);
  emitFile(code);
}

const mdLoader = function (source) {
  // mdLoader 把 非js的代码 转换成  js 的代码
  console.log("source", source);

  return `export default 'this is doc'`;
};
const webpackConfig = {
  entry: "./example/main.js",
  module: {
    rules: [{ test: /\.md$/, use: mdLoader }],
  },
};

function webpack(config) {
  globalConfig = config;
  const graph = createGraph();
  bundle(graph);
}

webpack(webpackConfig);
