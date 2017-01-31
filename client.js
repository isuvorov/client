var BrowserConnection = require('logux-sync/browser-connection')
var MemoryStore = require('logux-core/memory-store')
var ClientSync = require('logux-sync/client-sync')
var Reconnect = require('logux-sync/reconnect')
var shortid = require('shortid')
var Log = require('logux-core/log')

var isDevelopment = require('./is-development')
var IndexedStore = require('./indexed-store')

/**
 * Low-level browser API for Logux.
 *
 * @param {object} options Client options.
 * @param {string} options.url Server URL.
 * @param {string} options.subprotocol Client subprotocol version
 *                                     in SemVer format.
 * @param {any} [options.credentials] Client credentials for authentication.
 * @param {string} [options.prefix="logux"] Prefix for `IndexedDB` database
 *                                          to run multiple Logux instances
 *                                          on same web page.
 * @param {string|number} [options.nodeId] Unique client ID.
 *                                         Compacted UUID, by default.
 * @param {number} [options.timeout=20000] Timeout in milliseconds
 *                                         to break connection.
 * @param {number} [options.ping=10000] Milliseconds since last message to test
 *                                      connection by sending ping.
 * @param {Store} [options.store] Store to save log. Will be `IndexedStore`,
 *                                by default.
 * @param {number} [options.minDelay=1000] Minimum delay between reconnections.
 * @param {number} [options.maxDelay=5000] Maximum delay between reconnections.
 * @param {number} [options.attempts=Infinity] Maximum reconnection attempts.
 * @param {bool} [options.allowDangerousProtocol=false] Hide warning in case
 *                                                      using ws: in production.
 *
 * @example
 * token = document.querySelector('meta[name=token]')
 *
 * import Client from 'logux-client/client'
 * const app = new Client({
 *   credentials: token.content,
 *   subprotocol: '1.0.0',
 *   url: 'wss://example.com:1337'
 * })
 * app.sync.connection.connect()
 *
 * @class
 */
function Client (options) {
  /**
   * Client options.
   * @type {object}
   *
   * @example
   * console.log('Logux node ID is ' + app.options.nodeId)
   */
  this.options = options || { }

  if (typeof this.options.url === 'undefined') {
    throw new Error('Missed url option in Logux client')
  }
  if (typeof this.options.subprotocol === 'undefined') {
    throw new Error('Missed subprotocol option in Logux client')
  }

  if (typeof this.options.prefix === 'undefined') {
    this.options.prefix = 'logux'
  }
  if (typeof this.options.nodeId === 'undefined') {
    this.options.nodeId = shortid.generate()
  }

  if (/^ws:\/\//.test(this.options.url) && !isDevelopment(this.options.url)) {
    if (!options.allowDangerousProtocol) {
      console.warn(
        'Without SSL, old proxies can block WebSockets. ' +
        'Use WSS connection for Logux or set allowDangerousProtocol option.'
      )
    }
  }

  var store = this.options.store
  if (!store) {
    if (global.indexedDB) {
      store = new IndexedStore(this.options.prefix)
    } else {
      store = new MemoryStore()
    }
  }

  /**
   * Client events log.
   * @type {Log}
   *
   * @example
   * app.log.keep(customKeeper)
   */
  this.log = new Log({ store: store, nodeId: this.options.nodeId })

  var ws = new BrowserConnection(this.options.url)
  var connection = new Reconnect(ws, {
    minDelay: this.options.minDelay,
    maxDelay: this.options.maxDelay,
    attempts: this.options.attempts
  })

  /**
   * Sync instance from `logux-sync` to synchronize logs.
   * @type {ClientSync}
   *
   * @example
   * if (client.sync.state === 'synchronized')
   */
  this.sync = new ClientSync(this.options.nodeId, this.log, connection, {
    credentials: this.options.credentials,
    subprotocol: this.options.subprotocol,
    timeout: this.options.timeout,
    ping: this.options.ping
  })
}

module.exports = Client
