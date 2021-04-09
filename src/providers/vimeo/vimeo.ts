import { playerParameters, configEvent } from 'shared/assets/interfaces/interfaces'

declare global {
	interface Window {
		Vlitejs: {
			Player: any
		}
		Vimeo: {
			Player: any
		}
	}
}

/**
 * The provider function returns the provider Class which is extended from vLitejs Player
 * @param {Class} Player
 * @returns {Class} Provider class extended from vLitejs Player
 */
export default function (Player: any) {
	const providerObjectName = 'Vimeo'
	let vimeoQueue: Array<any> = []

	// Load the player API if it is not available
	if (typeof window[providerObjectName] === 'undefined') {
		const script = document.createElement('script')
		script.async = true
		script.type = 'text/javascript'
		script.src = 'https://player.vimeo.com/api/player.js'
		script.onload = () => {
			// Run the queue when the provider API is ready
			vimeoQueue.forEach((itemClass: any) => {
				itemClass.initVimeoPlayer().then(() => {
					itemClass.addSpecificEvents()
					itemClass.onPlayerReady()
				})
			})
			vimeoQueue = []
		}
		document.getElementsByTagName('body')[0].appendChild(script)
	}

	/**
	 * vlitejs Player Vimeo
	 * @module vlitejs/Player/PlayerVimeo
	 */
	return class PlayerVimeo extends Player {
		params: Object
		events: Array<configEvent>
		instance: any

		constructor(props: playerParameters) {
			super(props)

			const DEFAULT_PARAMS = {
				id: this.media.getAttribute('data-vimeo-id'),
				playsinline: this.options.playsinline ? 1 : 0,
				loop: this.options.loop ? 1 : 0,
				controls: false
			}
			this.params = { ...DEFAULT_PARAMS, ...this.options.providerParams }
			this.events = [
				{ type: 'timeupdate', listener: super.onTimeUpdate },
				{ type: 'ended', listener: super.onVideoEnded },
				{ type: 'playing', listener: this.onPlaying },
				{ type: 'waiting', listener: this.onWaiting },
				{ type: 'seeking', listener: this.onSeeking },
				{ type: 'seeked', listener: this.onSeeked }
			]
		}

		/**
		 * Initialize the player when the API is ready
		 */
		init() {
			this.waitUntilVideoIsReady().then(() => {
				this.addSpecificEvents()
				super.onPlayerReady()
			})
		}

		/**
		 * Wait until the API is ready
		 * @returns {Promise} The player is ready
		 */
		waitUntilVideoIsReady(): Promise<void> {
			return new window.Promise((resolve, reject) => {
				// Initialize the player if the API is already available or reject
				if (typeof window[providerObjectName] !== 'undefined') {
					this.initVimeoPlayer().then(resolve)
				} else {
					vimeoQueue.push(this)
				}
			})
		}

		/**
		 * Initialize the player
		 */
		initVimeoPlayer(): Promise<void> {
			return new window.Promise((resolve, reject) => {
				this.instance = new window.Vimeo.Player(this.media.getAttribute('id'), this.params)
				this.media = this.instance.element
				this.instance.ready().then(resolve)
			})
		}

		/**
		 * Create event listeners
		 * All listeners are created on class properties to facilitate the deletion of events
		 */
		addSpecificEvents() {
			this.events.forEach((event) => {
				this.instance.on(event.type, event.listener.bind(this))
			})
		}

		/**
		 * Get the player instance
		 * @returns {Object} Vimeo API instance
		 */
		getInstance(): any {
			return this.instance
		}

		/**
		 * Get the player current time
		 * @returns {Promise<Number>} Current time of the video
		 */
		getCurrentTime(): Promise<number> {
			return new window.Promise((resolve) => {
				this.instance.getCurrentTime().then((seconds: number) => resolve(seconds))
			})
		}

		/**
		 * Get the player duration
		 * @returns {Promise<Number>} Duration of the video
		 */
		getDuration(): Promise<number> {
			return new window.Promise((resolve) => {
				this.instance.getDuration().then((duration: number) => resolve(duration))
			})
		}

		/**
		 * Play method of the player
		 */
		methodPlay() {
			this.instance.play()
		}

		/**
		 * Pause method of the player
		 */
		methodPause() {
			this.instance.pause()
		}

		/**
		 * Set volume method of the player
		 * @param {Number} volume New volume
		 */
		methodSetVolume(volume: number) {
			this.instance.setVolume(volume)
		}

		/**
		 * Get volume method of the player
		 * @returns {Promise<Number>} Player volume
		 */
		methodGetVolume(): Promise<number> {
			return new window.Promise((resolve) => {
				this.instance.getVolume().then((volume: number) => {
					resolve(volume)
				})
			})
		}

		/**
		 * Mute method of the player
		 */
		methodMute() {
			this.instance.setVolume(0)
		}

		/**
		 * Unmute method of the player
		 */
		methodUnMute() {
			this.instance.setVolume(1)
		}

		/**
		 * Set the new current time for the player
		 * @param {Number} Current time video
		 */
		methodSeekTo(newTime: number) {
			this.instance.setCurrentTime(newTime)
		}

		/**
		 * Function executed when the video is waiting
		 */
		onWaiting() {
			this.loading(true)
		}

		/**
		 * Function executed when the video is playing
		 */
		onPlaying() {
			this.loading(false)
		}

		/**
		 * Function executed when the video is seeking
		 */
		onSeeking() {
			this.loading(true)
		}

		/**
		 * Function executed when the video seek is done
		 */
		onSeeked() {
			this.loading(false)
		}

		/**
		 * Remove event listeners
		 */
		removeSpecificEvents() {
			this.events.forEach((event) => {
				this.instance.off(event.type, event.listener)
			})
		}

		/**
		 * Remove the Vimeo player (instance, events)
		 */
		destroy() {
			this.removeSpecificEvents()
			this.instance.destroy()
			super.destroy()
		}
	}
}
