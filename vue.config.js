const path = require('path');

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
       '@components': path.resolve(__dirname, 'src/components'),
       '@utils': path.resolve(__dirname, 'src/utils'),
       '@services': path.resolve(__dirname, 'src/services'),
       '@views': path.resolve(__dirname, 'src/views')
      }
    }
  }
}
