### define-type-dll-webpack-plugin

对 webpack.dll 打包的文件进行二次编辑，并更新在 index.html 的引用

使用方法
```
npm i define-type-dll-webpack-plugin
```

```js
const DefineType = require('define-type-dll-webpack-plugin')

new DefineType({
  path: path.resolve(__dirname, './public/index.html'),
  assetPath: '<%= BASE_URL %>dllVendor'
})
```

#### replacer
- 类型：(content: string, filename: string) => void
- 说明：自定义对 dll 编译后的文件进行二次处理，如果主动设置为非函数类型，则不处理 dll 的编译文件

参数：
- content: 
  - 类型：string | Buffer
  - 说明：dll 编译后的文件内容
- filename: 
  - 类型：string
  - 说明：当前的文件名

默认：
```js
replacer(content, filename) {
  // 在 qiankunjs 子应用中，需要将 var 变为指定挂载到 window
  return content.toString().replace(/^(\/\*.*?\*\/)?[ \n\t]*(var )/, (a, b) => {
    return `${b ? b + '\n' : ''}window.`
  })
}
```

#### path
- 类型：string
- 说明：index.html 文件的路径，如果不写则不更新 index.html 的内部引用

默认：''

#### assetPath
- 类型：string
- 说明：index.html 内部 dll 打包文件资源的存放路径

默认：''

#### preload
- 类型：boolean
- 说明：dll 打包资源是否预加载

默认：true

#### setParam
- 类型：(() => string) | null
- 说明：可以设置 index.html 内部 dll 打包文件路径后面的参数

默认：null

#### getRegExp
- 类型：(filename: string) => ({ linkReg: RegExp, scriptReg: RegExp })
- 说明：index.html 内部 dll 打包文件的标签替换的正则表达式，如果没写，则不更新

默认：
```js
getRegExp() {
  const key = filename.split('.')[0]
  return {
    linkReg: new RegExp(`<link .*?${key}.*?>`),
    scriptReg: new RegExp(`<script .*?${key}.*?><\/script>`),
  }
}
```

#### updateHtml
- 类型：((fileContent: string, {
  filenames: string[],
  param: string
}) => string) | null
- 说明：index.html 内部 dll 打包文件的标签替换

默认：null
