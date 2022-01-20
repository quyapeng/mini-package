function foo() {
  console.log("foo");
}

foo();

// 1.如何把 esm 转换为 cjs 的形式。==> babel-core中有一个方法：transformFromAst
// 2.需要自己去写自己的require方法

// 自执行函数
(function (modules) {
  function require(filename) {
    let module = {
      exports: {},
    };
    //   1.需要通过filename找到对应的模块函数  如何？==》映射
    // filename => fn()
    const fn = modules[filename];
    fn(require, modules, module.exports);
    return modules.exports;
  }

  require("./main.js");

  // function mainModule(require, module, exports) {
  //   const { foo } = require("./foo.js");

  //   console.log("main");
  //   foo();
  // }
})({
  "./foo.js": function (require, module, exports) {
    exports.foo = function () {
      console.log("foo");
    };
  },
  "./main.js": function (require, module, exports) {
    const { foo } = require("./foo.js");

    console.log("main");
    foo();
  },
});
