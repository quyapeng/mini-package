const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("babel-traverse").default;
const path = require("path");
const ejs = require("ejs");

const { transformFromAst } = require("babel-core");
const { template } = require("lodash");
// 1.获取到文件的内容和关系
function createAsset(filename) {
  // a.获取文件的内容
  const source = fs.readFileSync(filename, "utf-8");
  //   console.log(source);
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
    filename,
    code,
    deps,
  };
}
function createGraph(filename) {
  //
  const dirname = path.dirname(filename);
  let mainAsset = createAsset(filename);

  let queue = [mainAsset];
  for (const asset of queue) {
    //
    // console.log("asset", asset);
    asset.deps.forEach((relativePath) => {
      // console.log("path", relativePath);

      let child = createAsset(path.resolve(dirname, relativePath));
      // console.log("child", child);
      queue.push(child);
    });
  }
  // console.log("queue", queue);
  return queue;
}
// let mainjs = createAsset();

// console.log("mainjs", mainjs);
// 2. 创建图
const graph = createGraph("./example/main.js");
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
      modlues[asset.filename] = asset.code;
    });
    return modlues;
  }
  const modlues = createModules();
  const bundleTemplate = fs.readFileSync("./bundle.ejs", "utf-8");
  const context = ejs.render(bundleTemplate.toString(), {
    modlues,
  });

  function emitFile(context) {
    fs.writeFileSync("./example/dist/bundle.js", context);
  }

  emitFile(context);
}

bundle(graph);
