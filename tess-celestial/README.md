# Tess-celestial
> Immersive Scholar Local Resident Radmila Sazdanović

Quick start:
---
Install node modules after initial clone or download:
  ```
  npm install
  ```

Run in development mode:
  ```
  npm start
  ```
  _Start a local development server at port 3000. Navigate to http://localhost:3000/ in your browser_

Build for production:
  ```
  npm run build
  ```
  _Build an optimized version for production_


*For initial testing/sharing*
Commit dist folder to gh-pages:
`git subtree push --prefix dist origin gh-pages`

Initial source
---

This application was initialized with the base Webpack template https://github.ncsu.edu/jwgurley/no-framework-webpack-starter

Features:
* Hot reloading in development (no more `⌘ + R`)
* ES6 support (Using eslint with standard JS style guide)
* Babel transpiler
* SASS support
* Autoprefixer for css
* Image and font loaders
* csv file loader
