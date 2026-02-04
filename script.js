// ==UserScript==
// @name Zerochan instant image downloader
// @namespace https://github.com/anytngv2/zerochan-instant-image-downloader
// @supportURL https://github.com/anytngv2/zerochan-instant-image-downloader
// @version 2.2
// @description Allow to instant download images from Zerochan
// @author AnytngV2
// @match https://*.zerochan.net/*
// @icon https://static.zerochan.net/favicon.png
// @license MIT
// @compatible chrome
// @compatible edge
// @compatible firefox
// @compatible waterfox
// @compatible librewolf
// @compatible safari
// @compatible brave
// @grant none
// ==/UserScript==

(function () {
	'use strict';


	/**
	* Add download buttons to all thumb elements in the thumbs container.
	* This function first searches for the #thumbs2 element, and if not found,
	* searches for other thumb containers. Then, it adds a download button
	* to each thumb element, which when clicked, downloads the full size
	* image from Zerochan using their API.
	* @returns {void}
	*/
	function addDownloadButtons() {
		// Get the #thumbs2 element
		let thumbsContainer = document.getElementById('thumbs2');
		let phoneMode = false;

		// If thumbs2 not found, search for other thumb containers
		if (!thumbsContainer) {
			console.log('[ANTNG2] thumbs2 not found, searching for other thumbs containers...');
			const alternativeIds = ['thumbs', 'thumbs1', 'thumbs3', 'thumbs4'];
			for (const id of alternativeIds) {
				const altContainer = document.getElementById(id);
				if (altContainer) {
					console.log(`[ANTNG2] Found alternative container: ${id}`);
					thumbsContainer = altContainer;
					if (id === "thumbs"){
						phoneMode = true;
					}
					break;
				}
			}
		}

		if (!thumbsContainer) {
			console.log('[ANTNG2] No thumb container found');
			return;
		}

		// Get all li elements that don't already have a download button
		const thumbItems = thumbsContainer.querySelectorAll('li:not(.has-download-btn)');

		thumbItems.forEach(item => {
			// Mark item as processed
			item.classList.add('has-download-btn');
			
			const button = document.createElement('button');
			button.className = 'anytngv2-instant-download-button';
			
			// Add style for the button
			if(!phoneMode){
				button.style.cssText = `
					position: absolute;
					top: 5px;
					right: -5px;
					background-color: #ffffff88;
					backdrop-filter: blur(20px);
					color: #000;
					padding:6px 12px;
					font-size:15px;
					border:none;
					border-radius:5px;
					cursor:pointer;
					z-index:2;
					transform:rotate(15deg);
					border: 2px solid #555;
				`;
			} else{
				button.style.cssText = `
					position: absolute;
					top: 5px;
					right: -5px;
					background-color: #ffffff88;
					backdrop-filter: blur(20px);
					color: #000;
					padding:6px 12px;
					font-size:15px;
					border:none;
					border-radius:5px;
					cursor:pointer;
					z-index:2;
					transform:rotate(15deg);
					border: 2px solid #555;
					width: unset !important;
				`;
			}
			
			// Add hover effects
			button.addEventListener('mouseover', () => {
				button.style.transform = 'scale(1.1) rotate(15deg)';
			});
			button.addEventListener('mouseout', () => {
				button.style.transform = 'scale(1) rotate(15deg)';
			});
			
			button.innerText = 'Download';

			// Get image URL for the API
			const linkElement = item.querySelector('a.thumb');
			if (!linkElement) return;
			
			let link = linkElement.href;
			let id = link.split('/').pop(); // Get the id from the URL

			// Hide p if found
			let p = item.querySelector('div > p');
			if(p) p.style.display = 'none';

			if(!id){
				console.log("[ANTNG2] Could not get id from link:", link);
				return;
			}
			
			item.appendChild(button);

			// Add click event to download image
			button.addEventListener('click', async (e) => {
				// Prevent multiple clicks
				if (button.getAttribute('data-downloading') === 'true') return;
				button.setAttribute('data-downloading', 'true');

				// Build API URL
				let buildURLJSON = `https://www.zerochan.net/${id}?json`;
				let buildUrl = buildURLJSON;

				if (phoneMode){
					buildUrl += '&screen=1';
				}

				try{
					const response = await fetch(buildUrl);
					const data = await response.json();

					// Get the full size image URL
					const imageUrl = data.full;

					button.innerText = 'Downloading...';
					button.style.border = '2px solid #ff0';

					let r = await downloadItem(imageUrl, `zerochan_${id}.jpg`);
					if(r){
						button.innerText = 'Downloaded';
						button.style.border = '2px solid #0f0';
					} else {
						button.innerText = 'Failed';
						button.style.border = '2px solid #f00';
					}
				
					if(phoneMode){
						await fetch(buildURLJSON + '&mobile=1');
					}

				}
				catch(error){
					console.error('[ANTNG2] Error fetching image (url: ' + buildUrl + ') data:', error);
					button.innerText = 'Error: Fetch JSON Fail';
					button.style.border = '2px solid #f00';
				}

				// Reset downloading state after 2 seconds
				setTimeout(() => {
					button.removeAttribute('data-downloading');
					button.innerText = 'Download';
					button.style.border = '2px solid #555';
				}, 2000);
			});
		});
	}

	/**
	* Download an item from a given URL and save it to disk.
	* @param {string} url The URL of the item to download.
	* @param {string} name The name of the item to save to disk.
	* @returns {Promise<boolean>} True if the download was successful, false otherwise.
	*/
	async function downloadItem(url, name) {
		try {
			const response = await fetch(url);
			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = blobUrl;
			link.download = name;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(blobUrl);
			return true;
		} catch (error) {
			console.error('[ANTNG2] Download failed:', error);
			return false;
		}
	}

	// Initial execution
	addDownloadButtons();

	// Set up MutationObserver to detect new elements added dynamically
	const observer = new MutationObserver((mutations) => {
		let shouldProcess = false;

		// Check if new nodes were added
		for (const mutation of mutations) {
			if (mutation.addedNodes.length > 0) {
				shouldProcess = true;
				break;
			}
		}

		if (shouldProcess) {
			// Small delay to ensure DOM is fully updated
			setTimeout(addDownloadButtons, 100);
		}
	});

	// Start observing the document body for changes
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});

	// Also handle scroll events for lazy loading
	let scrollTimeout;
	window.addEventListener('scroll', () => {
		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(addDownloadButtons, 300);
	});

	// Add buttons when page becomes visible again
	document.addEventListener('visibilitychange', () => {
		if (!document.hidden) {
			addDownloadButtons();
		}
	});
})();