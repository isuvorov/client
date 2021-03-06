let { badge, badgeRu, badgeEn } = require('./badge')
let { CrossTabClient } = require('./cross-tab-client')
let { IndexedStore } = require('./indexed-store')
let { attention } = require('./attention')
let { confirm } = require('./confirm')
let { favicon } = require('./favicon')
let { Client } = require('./client')
let { status } = require('./status')
let { log } = require('./log')

module.exports = {
  CrossTabClient,
  IndexedStore,
  attention,
  confirm,
  badgeRu,
  badgeEn,
  favicon,
  Client,
  status,
  badge,
  log
}
