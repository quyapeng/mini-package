const fs = require("fs");
const babylon = require("babylon");
// const traverse = require('@babel/traverse').default;

const traverse = require("babel-traverse").default;

// 1.获取到文件的内容和关系
function createAsset() {
  // a.获取文件的内容
  const source = fs.readFileSync("../main.js", "utf-8");
  console.log(source);
  // b.如何获取文件依赖关系
  // 借助 ast 来解析，获取到依赖
  // yarn add babylon babel-traverse babel-core
  const ast = babylon.parse(source, {
    sourceType: "module",
  });
    //   console.log(ast);
    //   console.log(traverse);
    traverse(ast, {
        ImportDeclaration()
    })

  return {};
}

createAsset();
// 2.
