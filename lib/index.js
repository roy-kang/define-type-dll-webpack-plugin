const fs = require('fs')
const { RawSource } = require('webpack-sources')

class DefinitionTypeDLLBuild {
  options = {
    replacer(content, filename) {
      return content.toString().replace(/^var /, 'window.')
    },
    path: '',
    assetPath: '',
    preload: true,
    setParam() {
      return `t=${Date.now()}`
    }
  }
  constructor(options = {}) {
    Object.assign(this.options, options)
  }
  apply(compiler) {
    const filenames = []
    compiler.hooks.afterCompile.tap('change definition', compilation => {
      compilation.getAssets()?.forEach(v => {
        filenames.push(v.name)
        const content = v.source.source()
        compilation.updateAsset(v.name, new RawSource(this.options.replacer(content, v.name)))
      })
    })

    const indexPath = this.options.path
    indexPath && compiler.hooks.done.tap('update index.html', () => {
      const file = fs.readFileSync(indexPath)
      if (file) {
        let fileContent = file.toString()
        if (fileContent) {
          let param = this.options.setParam?.() || ''
          if (param) {
            param = '?' + param
          }

          filenames.reverse().forEach(name => {
            const assetPath = `${this.options.assetPath}/${name}${param}`

            const linkReg = new RegExp(`<link .*?${name}.*?>`)
            const matchLink = linkReg.exec(fileContent)
            if (matchLink) {
              if (this.options.preload) {
                fileContent = fileContent.replace(matchLink[0], `<link href="${assetPath}" rel="preload" as="script">`)
              } else {
                fileContent = fileContent.replace(matchLink[0], '')
              }
            } else if (this.options.preload) {
              fileContent = fileContent.replace('</head>', `\t<link href="${assetPath}" rel="preload" as="script">\n</head>`)
            }

            const scriptReg = new RegExp(`<script .*?${name}.*?><\/script>`)
            const matchScript = scriptReg.exec(fileContent)
            if (matchScript) {
              fileContent = fileContent.replace(matchScript[0], `<script type="text/javascript" src="${assetPath}"></script>`)
            } else {
              fileContent = fileContent.replace('</body>', `\t<script type="text/javascript" src="${assetPath}"></script>\n</body>`)
            }

          })
          fs.writeFileSync(indexPath, fileContent)
        }
      }
    })
  }
}

module.exports = DefinitionTypeDLLBuild
