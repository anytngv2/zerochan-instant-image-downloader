// ==UserScript==
// @name Zerochan instant image downloader
// @namespace https://github.com/anytngv2/
// @supportURL https://github.com/anytngv2/zerochan-instant-image-downloader
// @version 2.1
// @description Allow to instant download images from Zerochan
// @author AnytngV2
// @match https://www.zerochan.net/*
// @match https://zerochan.net/*
// @icon https://static.zerochan.net/favicon.png
// @license MIT
// @grant none
// ==/UserScript==

(function () {
	'use strict';

	// get the #thumbs2 element
	let thumbsContainer = document.getElementById('thumbs2');
		let phoneMode = false;
	// if thumbs2 not found, search for thumbs1, thumbs3, thumbs4
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

	// foreach li div add a download button
	// in the button add position absolute top right
	const thumbItems = thumbsContainer.querySelectorAll('li');

	thumbItems.forEach(item => {
		const button = document.createElement('button');
		button.className = 'anytngv2-instant-download-button';
		// add style for the button
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
			button.addEventListener('mouseover', () => {
				button.style.transform = 'scale(1.1) rotate(15deg)';
			});
			button.addEventListener('mouseout', () => {
				button.style.transform = 'scale(1) rotate(15deg)';
			});
		button.innerText = 'Download';


		// get image url for the API
		let link = item.querySelector('a.thumb').href;
		let id = link.split('/').pop(); // get the id from the url

			// hide p if found
			let p = item.querySelector('div > p');
			if(p) p.style.display = 'none';

		if(!id){
			console.log("[ANTNG2] Could not get id from link:", link);
			return;
		} else item.appendChild(button);

		// on click of the button download the image
		button.addEventListener('click', async (e) => {

		// try fetch from the API
			let buildURLJSON = `https://www.zerochan.net/${id}?json`; // URL to get the JSON data without other get params
		let buildUrl = buildURLJSON;

			if (phoneMode){
			// add &screen=1 to the url if user is in phone mode because phone mode don't load the json
            buildUrl += '&screen=1';
        }

		try{
			const response = await fetch(buildUrl);
			const data = await response.json();

			// get the image URL (full size)
			const imageUrl = data.full

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
				// fetch again but with mobile = 1 because it's switch user to pc version if you request the json with screen=1
                await fetch(buildURLJSON + '&mobile=1');
            }

			}
			catch(error){
				console.error('[ANTNG2] Error fetching image (url: ' + buildUrl + ') data:', error);
				button.innerText = 'Error: Fetch JSON Fail';
				button.style.border = '1px solid #f00';
			}

		});

	});

	/**
		* Download an item from a given URL and save it to disk.
		* @param {string} url The URL of the item to download.
		* @param {string} name The name of the item to save to disk.
		* @returns {Promise<boolean>} True if the download was successful, false otherwise.
		* 
		* @author AnytngV2
		* 
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
})();
