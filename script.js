// ==UserScript==
// @name 			Zerochan instant image downloader
// @namespace 		https://github.com/anytngv2/zerochan-instant-image-downloader
// @supportURL 		https://github.com/anytngv2/zerochan-instant-image-downloader
// @version 		2.4.1
// @description 	Allow to instant download images from Zerochan
// @author 			AnytngV2
// @match 			https://*.zerochan.net/*
// @icon 			https://static.zerochan.net/favicon.png
// @license 		MIT
// @compatible 		chrome
// @compatible 		edge
// @compatible 		firefox
// @compatible 		waterfox
// @compatible 		librewolf
// @compatible 		safari
// @compatible 		brave
// @grant 			none
// @run-at 			document-end
// @updateURL 		https://greasyfork.org/fr/scripts/565142-zerochan-instant-image-downloader
// @downloadURL 	https://greasyfork.org/fr/scripts/565142-zerochan-instant-image-downloader
// ==/UserScript==

(function () {
	'use strict';


	// ! information added in the footer of zerochan for information about the script
	const INFOTAG = {
		"version": "2.4.1",
	}


	/**
	 * Download an image from Zerochan using its API.
	 * @param {string} id The image ID to download.
	 * @param {boolean} [phoneMode=false] If true, the script will fetch the json with &screen=1 to get json data because phone mode doesn't load the json by default.
	 * @returns {Promise<boolean>} True if the download was successful, false otherwise.
	 */
	async function downloadImageById(id, phoneMode = false) {

		let buildURLJSON = `https://www.zerochan.net/${id}?json`;
		let buildUrl = buildURLJSON;

		if (phoneMode) {
			buildUrl += '&screen=1';
		}

		const response = await fetch(buildUrl);
		const data = await response.json();

		const imageUrl = data.full;

		return await downloadItem(imageUrl, `zerochan_${id}.jpg`);
	}



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
					if (id === "thumbs") {
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
			if (!phoneMode) {
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
			} else {
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
			if (p) p.style.display = 'none';

			if (!id) {
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

				if (phoneMode) {
					buildUrl += '&screen=1';
				}

				try {

					button.innerText = 'Downloading...';
					button.style.border = '2px solid #ff0';

					let r = await downloadImageById(id, phoneMode);

					if (r) {
						button.innerText = 'Downloaded';
						button.style.border = '2px solid #0f0';
					} else {
						button.innerText = 'Failed';
						button.style.border = '2px solid #f00';
					}

				}
				catch (err) {
					console.error(err);
					button.innerText = 'Error';
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










	// ? =================================
	// ? bulk download system
	// ? =================================
	const menu = document.querySelector('div#menu');
	let menuHTML = `
	<style>
		#antg2-progressBar {
			background-color: #e6e6e6;
			border: 1px solid #0088ff;
			height: 10px;
			width: 100%;
			border-radius: 5px;
		}
		#antg2-progressBar::-webkit-progress-bar {
			background-color: #e6e6e6;
			border: 1px solid #0088ff;
			height: 10px;
			width: 100%;
			border-radius: 5px;
		}
		#antg2-progressBar::-webkit-progress-value {
			background-color: #fe8001;
			border-radius: 5px;
		}
		#antg2-progressBar::-moz-progress-bar {
			background-color: #fe8001;
			border-radius: 5px;
		}
	</style>
	<div style="margin:10px 0 0 0;background-color:#e6e6e6;color:#000;padding:5px; display: flex; flex-direction: column; gap:9px;">
	<p style="margin:0;padding:0;text-align:center;"><b>Zerochan Instant Image Downloader Tool</b></p>
		<div style="display:flex; justify-content: space-between; gap:5px;">
			<p style="margin:0;padding:0;text-align:left;" id="antg2-title">[Waiting for actions]</p>
			<p style="text-align:right; margin:0;padding:0">Download status: <span id="antg2-countBulk">0</span> / <b style="color: #fe8001;" id="antg2-totalBulk">0</b></p>
		</div>
		<progress id="antg2-progressBar" value="0" max="100"></progress>
		<button onclick="bulkDownload()">Start bulk download</button>
	</div>
	`;

	if (menu) {
		let menuDiv = document.createElement('div');
		menuDiv.innerHTML = menuHTML;
		menu.appendChild(menuDiv);
	} else {
		// if no menu we put it as a floating area
		let menuDiv = document.createElement('div');
		menuDiv.innerHTML = menuHTML;
		menuDiv.style.cssText = `
			position:fixed;
			bottom:5px;
			right:5px;
			z-index: 9999;
		`;
		document.body.appendChild(menuDiv);
	}

	window.bulkDownload = async function () {

		const titleStatus = document.querySelector("#antg2-title");
		const countStatus = document.querySelector("#antg2-countBulk");
		const progressBar = document.querySelector("#antg2-progressBar");

		const buttons = document.querySelectorAll('.anytngv2-instant-download-button');

		const total = buttons.length;
		let count = 0;

		if (total === 0) {
			titleStatus.innerText = "[Nothing found]";
			return;
		}

		progressBar.max = total;
		progressBar.value = 0;
		countStatus.innerText = 0;
		document.querySelector("#antg2-totalBulk").innerText = total;

		for (const button of buttons) {

			const id = button.parentElement
				.querySelector('a.thumb')
				.href.split('/')
				.pop();

			await downloadImageById(id);

			titleStatus.innerText = `[Processing for ${id}]`;

			count++;
			countStatus.innerText = count;
			progressBar.value = count;

			// pause après download
			await new Promise(r => setTimeout(r, 1350));

			// every 11 downloads add 
			if (count % 11 === 0) {
				titleStatus.innerText = `[Spam protection. Please wait...]`;
				await new Promise(r => setTimeout(r, 5000));
			}
		}

		titleStatus.innerText = "[Finished]";
	};











	// ? =================================
	// ? Add download buttons on view image page
	// ? =================================
	let previewEl = document.querySelector('a.preview');
	let imageLinkViewImage = previewEl ? previewEl.href : null;
	if (imageLinkViewImage) {
		console.log("[ANTNG2] Add download button on view image page");
		// add div in div#large
		let largeDiv = document.querySelector('div#large');
		let largeHTML = `
		<button style="margin 0 auto; max-width: 600px; margin:0 auto;  background-color: #fe8001; color: #fff; border: none; padding: 10px; cursor: pointer" id="antg2-downloadViewImage" onclick="DownloadViewImage('${imageLinkViewImage}')"">
			Download image full size
		</button>
		`;

		let largeDivDownload = document.createElement('div');
		largeDivDownload.innerHTML = largeHTML;
		largeDiv.appendChild(largeDivDownload);
	}

	window.DownloadViewImage = async function (imageLinkViewImage) {
		document.querySelector("#antg2-downloadViewImage").innerText = "Downloading...";
		let r = await downloadItem(imageLinkViewImage, imageLinkViewImage.split('/').pop());

		if (r) {
			document.querySelector("#antg2-downloadViewImage").innerText = "Downloaded";
		} else {
			document.querySelector("#antg2-downloadViewImage").innerText = "Download failed";
		}
	}













	// ? =================================
	// ? Add information tag in the footer
	// ? =================================
	let footer = document.querySelector('footer');
	let footerPhone = document.querySelector('div#footer');

	let infoDiv = document.createElement('div');
	let infoHTML = `
	<div style="text-align:center; font-size: 14px; border:1px solid #000; padding:10px; border-radius:10px; max-width: 400px; margin: 10px auto; display: flex; flex-direction: column; gap: 10px; align-items: center; justify-content: center">
		<div style="margin:0;padding:0;line-height: unset !important;"><b>Zerochan Instant Image Downloader</b></div>
		<div style="margin:0;padding:0;line-height: unset !important;">Created by <a href="https://github.com/anytngv2" target="_blank">AnytngV2</a> | <a href="https://github.com/anytngv2/zerochan-instant-image-downloader" target="_blank">GitHub</a> | <a href="https://greasyfork.org/fr/scripts/565142-zerochan-instant-image-downloader" target="_blank">Greasy Fork</a></div>
        <div style="margin:0; padding:0; display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 10px">
			<span>
                <img src="https://img.shields.io/badge/Your%20version-${INFOTAG.version}-97c800" alt="Static Badge">
			</span>
			<span>
				<a href="https://greasyfork.org/fr/scripts/565142-zerochan-instant-image-downloader" target="_blank">
					<img alt="Greasy Fork Version" src="https://img.shields.io/greasyfork/v/565142?logo=greasyfork&color=%23670000">
				</a>
			</span>
            <span>
                <a href="https://github.com/anytngv2/zerochan-instant-image-downloader" target="_blank">
                    <img alt="Github Version" src="https://img.shields.io/github/v/release/AnytngV2/Zerochan-Instant-Image-Downloader?logo=github">
                </a>
            </span>
		</div>
	</div>
	`;

	if (footer) {
		infoDiv.innerHTML = infoHTML;
		footer.appendChild(infoDiv);

		document.querySelector("footer > p").innerHTML += ` | <a href="https://github.com/anytngv2/zerochan-instant-image-downloader" target="_blank">Zerochan Instant Image Downloader</a>`
	}

	if (footerPhone) {
		infoDiv.innerHTML = infoHTML;
		footerPhone.appendChild(infoDiv);

		document.querySelector("div#footer > p").innerHTML += ` | <a href="https://github.com/anytngv2/zerochan-instant-image-downloader" target="_blank">Zerochan Instant Image Downloader</a>`

	}
})();