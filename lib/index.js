const fs = require('fs')
const { RawSource } = require('webpack-sources')

class DefinitionTypeDLLBuild {
  options = {
    replacer(content, filename) {
      return content.toString().replace(/^(\/\*.*?\*\/)?[ \n\t]*(var )/, (a, b) => {
        return `${b ? b + '\n' : ''}window.`
      })
    },
    path: '',
    assetPath: '',
    preload: true,
    getRegExp(filename) {
      const key = filename.split('.')[0]
      return {
        linkReg: new RegExp(`<link .*?${key}.*?>`),
        scriptReg: new RegExp(`<script .*?${key}.*?><\/script>`),
      }
    },
    setParam: null,
    updateHtml: null
  }
  constructor(options = {}) {
    Object.assign(this.options, options)
  }
  apply(compiler) {
    const filenames = []
    compiler.hooks.afterCompile.tap('change definition', compilation => {
      compilation.getAssets()?.forEach(v => {
        if (v.name.endsWith('.js')) {
          filenames.push(v.name)
          if (this.getType(this.options.replacer) === 'Function') {
            const content = v.source.source()
            compilation.updateAsset(v.name, new RawSource(this.options.replacer(content, v.name)))
          }
        }
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

          const updatedHtml = this.options.updateHtml?.(fileContent, {
            filenames,
            param
          })

          if (updatedHtml) {
            this.rewriteHtml(updatedHtml)
            return
          }

          filenames.reverse().forEach(name => {
            const assetPath = `${this.options.assetPath}/${name}${param}`
            const { linkReg, scriptReg } = this.options.getRegExp?.(name) || {}

            if (linkReg && this.getType(linkReg) === 'RegExp') {
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
            }

            if (scriptReg && this.getType(scriptReg) === 'RegExp') {
              const matchScript = scriptReg.exec(fileContent)
              if (matchScript) {
                fileContent = fileContent.replace(matchScript[0], `<script type="text/javascript" src="${assetPath}"></script>`)
              } else {
                fileContent = fileContent.replace('</body>', `\t<script type="text/javascript" src="${assetPath}"></script>\n</body>`)
              }
            }
          })
          this.rewriteHtml(fileContent)
        }
      }
    })
  }

  getType(data) {
    return Object.prototype.toString.call(data).slice(8, -1)
  }

  rewriteHtml(fileContent) {
    fs.writeFileSync(this.options.path, fileContent)
  }
}

module.exports = DefinitionTypeDLLBuild
