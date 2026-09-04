const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const root = path.resolve(__dirname, '..')
const config = getDefaultConfig(__dirname)

// Watch the package source so editing a component reloads here with no publish
// step in between.
config.watchFolders = [root]

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(root, 'node_modules'),
]

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The package keeps react and react-native as dev dependencies for its own
// typecheck, and builds into lib/. Two copies of react in one bundle break
// hooks, so those directories are hidden here and everything resolves to the
// example's own installs and to src/.
config.resolver.blockList = new RegExp(
  [
    escape(path.join(root, 'node_modules', 'react')) + '[/\\\\].*',
    escape(path.join(root, 'node_modules', 'react-native')) + '[/\\\\].*',
    escape(path.join(root, 'lib')) + '[/\\\\].*',
  ].join('|'),
)

module.exports = config
