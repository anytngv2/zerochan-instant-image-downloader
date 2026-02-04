// ==UserScript==
// @name         Zerochan instant image downloader
// @namespace    https://github.com/anytngv2/
// @supportURL   https://github.com/anytngv2/zerochan-instant-image-downloader
// @version      1.1
// @description  Allow to instant download images from Zerochan
// @author       AnytngV2
// @match        https://www.zerochan.net/*
// @match        https://zerochan.net/*
// @icon         https://static.zerochan.net/favicon.png
// @license      MIT
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // get the #thumbs2 element
    const thumbsContainer = document.getElementById('thumbs2');
    if (!thumbsContainer) console.log("#thumbs2 not found");

    // foreach li div add a download button
    // in the button add position absolute top right
    const thumbItems = thumbsContainer.querySelectorAll('li');

    thumbItems.forEach(item => {
        const button = document.createElement('button');
        button.className = 'anytngv2-instant-download-button';
        // add style for the button
        button.style.cssText = `
            position: absolute;
            top: 5px;
            right: -5px;
            background-color:#222;
            color:#fff;
            padding:5px 10px;
            border:none;
            border-radius:5px;
            cursor:pointer;
            z-index:1000;
            transform:rotate(15deg);
        `;
        button.innerText = 'Download';


        // get image url (full size) from the path p > a:nth-child(2) href
        let link = item.querySelector('p > a:nth-child(2)');
        if (!link) {
            link = item.querySelector('p > a');
        }

        // check if url point to static.zerochan.net
        if (!link.href.includes('static.zerochan.net')) {
            console.log("[ANTNG2] Link is not a direct image link:", link.href);
            return;
        }

        // add data-url attribute to the button
        button.setAttribute('data-url', link.href);

        item.appendChild(button);

        button.addEventListener('click', (e) => {
            const imageUrl = button.getAttribute('data-url');
            if (!imageUrl) alert("[ANTNG2] UserScript error: Image URL not found");
            else {
                e.preventDefault();
                // Create a temporary anchor element to trigger the download
                const a = document.createElement('a');
                a.href = imageUrl;

                // name the file from the url
                const urlParts = imageUrl.split('/');
                a.download = urlParts[urlParts.length - 1];

                console.log(`[ANTNG2] Trying to download ${imageUrl}`);
                const r = downloadItem(imageUrl, a.download);

                if (r) {
                    console.log(`[ANTNG2] Download initiated for ${a.download}`);
                } else {
                    console.error("[ANTNG2] Download failed for " + a.download);
                }

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