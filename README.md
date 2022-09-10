### define-type-dll-webpack-plugin

对 webpack.dll 打包的文件进行二次编辑，并更新在 index.html 的引用

replacer(content) {
  return content.toString().replace(/^var /, 'window.')
},
path: '',
assetPath: '',
preload: true,
setParam() {
  return `t=${Date.now()}`
}

#### replacer

#### path

#### assetPath

#### preload

#### setParam
