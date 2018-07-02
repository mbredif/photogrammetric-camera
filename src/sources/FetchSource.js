const fetch = window.fetch.bind(window);
const URL = window.URL || window.webkitURL;

function decode(response, type) {
    if (!response.ok) {
        const error = new Error(`Error loading ${response.url}: status ${response.status}`);
        error.reponse = reponse;
        throw error;
    }
    switch(type) {
        case 'text': return response.text();
        case 'arrayBuffer': return response.arrayBuffer();
        case 'dataURL': return response.blob().then(URL.createObjectURL);
        default: console.error('unknown decode type', type);
    }
}

/** @module FetchSource */
class FetchSource {
  /** create a source with a read function that fetches and decodes a file
   * @constructor
   * @param {Object} options.fetchOptions - fetching options (see standard js fetch function)
   * @param {string} options.path - path prefix for relative intrinsic files (default: '')
   * @param {function} options.fetch - function (url, fetchOptions) to fetch relative intrinsic files (default: fetch)
   * @param {function} options.decode - function that decodes a response from fetch to a string (default function decodes the result of a standard fetch)
   * @return {function} - the fetching function (url => decoded).
   */
    constructor(path, options = {}) {
        this.path = path || '';
        this.fetchOptions = options.fetchOptions || { crossOrigin: 'anonymous' };
        this.fetch = options.fetch || fetch;
        this.decode = options.decode || decode;
    }

    open(url, type) {
        return this.fetch(this.path + url, this.fetchOptions)
            .then(response => this.decode(response, type));
    }

    close(url, type) {
        if (type === 'dataURL') URL.revokeObjectURL(url);
    }
}

export default FetchSource;
